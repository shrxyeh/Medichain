// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SecureAccessControl
 * @dev Implements Zero Knowledge commitments and Attribute-Based Access Control
 * for healthcare data privacy
 */
contract SecureAccessControl {

    // Roles for ABAC
    enum Role { NONE, PATIENT, DOCTOR, DIAGNOSTIC, ADMIN, EMERGENCY }

    // Sensitivity levels for resources
    enum Sensitivity { PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED }

    // ZK Commitment structure
    struct ZKCommitment {
        bytes32 commitment;      // Hash commitment H(value || blinding)
        uint256 timestamp;       // When commitment was created
        bool verified;           // Whether commitment has been verified
    }

    // User attributes for ABAC
    struct UserAttributes {
        Role role;
        bytes32 departmentHash;     // Hashed department (privacy)
        uint8 clearanceLevel;       // 0-4 clearance
        bool isActive;
        uint256 registeredAt;
        bytes32 ageCommitment;      // ZK: proves age without revealing DOB
        bytes32 credentialCommitment; // ZK: proves credentials
    }

    // Access policy structure
    struct AccessPolicy {
        Role requiredRole;
        uint8 minClearance;
        Sensitivity maxSensitivity;
        bool requiresPermission;
        bool active;
    }

    // Permission with ZK proof
    struct Permission {
        bool granted;
        uint256 grantedAt;
        uint256 expiresAt;          // 0 means no expiry
        bytes32 proofCommitment;    // ZK proof of valid permission grant
    }

    // State variables
    mapping(string => UserAttributes) public userAttributes;
    mapping(string => mapping(string => Permission)) public permissions;
    mapping(bytes32 => ZKCommitment) public zkCommitments;
    mapping(bytes32 => AccessPolicy) public accessPolicies;

    // Audit log for access attempts
    struct AuditEntry {
        string userId;
        bytes32 resourceId;
        uint8 action;       // 0=read, 1=write, 2=delete, 3=share
        bool allowed;
        uint256 timestamp;
    }

    AuditEntry[] public auditLog;

    // Events
    event UserRegistered(string indexed hhNumber, Role role);
    event AttributeUpdated(string indexed hhNumber, string attributeName);
    event CommitmentCreated(bytes32 indexed commitmentHash, string indexed hhNumber);
    event PermissionGranted(string indexed patient, string indexed doctor, uint256 expiresAt);
    event PermissionRevoked(string indexed patient, string indexed doctor);
    event AccessAttempt(string indexed userId, bytes32 resourceId, bool allowed);
    event EmergencyAccessUsed(string indexed userId, string indexed patientId);

    // Modifiers
    modifier onlyRole(string memory _hhNumber, Role _role) {
        require(userAttributes[_hhNumber].role == _role, "Insufficient role");
        _;
    }

    modifier isActive(string memory _hhNumber) {
        require(userAttributes[_hhNumber].isActive, "User not active");
        _;
    }

    /**
     * @dev Register user with ABAC attributes
     */
    function registerUserAttributes(
        string memory _hhNumber,
        Role _role,
        bytes32 _departmentHash,
        uint8 _clearanceLevel,
        bytes32 _ageCommitment,
        bytes32 _credentialCommitment
    ) external {
        require(userAttributes[_hhNumber].role == Role.NONE, "User already registered");
        require(_role != Role.NONE, "Invalid role");
        require(_clearanceLevel <= 4, "Invalid clearance level");

        userAttributes[_hhNumber] = UserAttributes({
            role: _role,
            departmentHash: _departmentHash,
            clearanceLevel: _clearanceLevel,
            isActive: true,
            registeredAt: block.timestamp,
            ageCommitment: _ageCommitment,
            credentialCommitment: _credentialCommitment
        });

        emit UserRegistered(_hhNumber, _role);
    }

    /**
     * @dev Create a ZK commitment for an attribute
     */
    function createCommitment(
        string memory _hhNumber,
        bytes32 _commitment
    ) external returns (bytes32) {
        require(userAttributes[_hhNumber].isActive, "User not active");

        zkCommitments[_commitment] = ZKCommitment({
            commitment: _commitment,
            timestamp: block.timestamp,
            verified: false
        });

        emit CommitmentCreated(_commitment, _hhNumber);
        return _commitment;
    }

    /**
     * @dev Verify a ZK commitment matches expected value
     * In production, this would use a ZK verifier circuit
     */
    function verifyCommitment(
        bytes32 _commitment,
        bytes32 _expectedHash
    ) external view returns (bool) {
        ZKCommitment memory comm = zkCommitments[_commitment];
        if (comm.timestamp == 0) return false;
        return comm.commitment == _expectedHash;
    }

    /**
     * @dev Grant permission with ZK proof
     */
    function grantPermissionZK(
        string memory _patientNumber,
        string memory _doctorNumber,
        uint256 _duration,  // Duration in seconds, 0 for no expiry
        bytes32 _proofCommitment
    ) external isActive(_patientNumber) {
        require(
            userAttributes[_patientNumber].role == Role.PATIENT,
            "Only patients can grant permissions"
        );
        require(
            userAttributes[_doctorNumber].role == Role.DOCTOR ||
            userAttributes[_doctorNumber].role == Role.DIAGNOSTIC,
            "Can only grant to healthcare providers"
        );

        uint256 expiresAt = _duration > 0 ? block.timestamp + _duration : 0;

        permissions[_patientNumber][_doctorNumber] = Permission({
            granted: true,
            grantedAt: block.timestamp,
            expiresAt: expiresAt,
            proofCommitment: _proofCommitment
        });

        emit PermissionGranted(_patientNumber, _doctorNumber, expiresAt);
    }

    /**
     * @dev Revoke permission
     */
    function revokePermission(
        string memory _patientNumber,
        string memory _doctorNumber
    ) external isActive(_patientNumber) {
        require(
            permissions[_patientNumber][_doctorNumber].granted,
            "Permission not found"
        );

        permissions[_patientNumber][_doctorNumber].granted = false;

        emit PermissionRevoked(_patientNumber, _doctorNumber);
    }

    /**
     * @dev Check if permission is valid (not expired)
     */
    function isPermissionValid(
        string memory _patientNumber,
        string memory _doctorNumber
    ) public view returns (bool) {
        Permission memory perm = permissions[_patientNumber][_doctorNumber];

        if (!perm.granted) return false;
        if (perm.expiresAt > 0 && block.timestamp > perm.expiresAt) return false;

        return true;
    }

    /**
     * @dev ABAC access decision
     */
    function evaluateAccess(
        string memory _userId,
        string memory _resourceOwnerId,
        bytes32 _resourceType,
        Sensitivity _resourceSensitivity,
        uint8 _action  // 0=read, 1=write, 2=delete, 3=share
    ) external returns (bool allowed) {
        UserAttributes memory user = userAttributes[_userId];

        // Check user is active
        if (!user.isActive) {
            _logAccess(_userId, _resourceType, _action, false);
            return false;
        }

        // Patients can always access their own data
        if (keccak256(bytes(_userId)) == keccak256(bytes(_resourceOwnerId))) {
            _logAccess(_userId, _resourceType, _action, true);
            return true;
        }

        // Healthcare providers need permission
        if (user.role == Role.DOCTOR || user.role == Role.DIAGNOSTIC) {
            bool hasValidPermission = isPermissionValid(_resourceOwnerId, _userId);

            if (!hasValidPermission) {
                _logAccess(_userId, _resourceType, _action, false);
                return false;
            }

            // Check clearance vs sensitivity
            if (uint8(_resourceSensitivity) > user.clearanceLevel) {
                _logAccess(_userId, _resourceType, _action, false);
                return false;
            }

            _logAccess(_userId, _resourceType, _action, true);
            return true;
        }

        // Admin has full access
        if (user.role == Role.ADMIN) {
            _logAccess(_userId, _resourceType, _action, true);
            return true;
        }

        _logAccess(_userId, _resourceType, _action, false);
        return false;
    }

    /**
     * @dev Emergency access override (logged separately)
     */
    function emergencyAccess(
        string memory _emergencyUserId,
        string memory _patientId,
        string memory _reason
    ) external returns (bool) {
        UserAttributes memory user = userAttributes[_emergencyUserId];

        require(
            user.role == Role.EMERGENCY || user.role == Role.ADMIN,
            "Not authorized for emergency access"
        );
        require(user.isActive, "User not active");

        emit EmergencyAccessUsed(_emergencyUserId, _patientId);

        // Grant temporary 24-hour access
        permissions[_patientId][_emergencyUserId] = Permission({
            granted: true,
            grantedAt: block.timestamp,
            expiresAt: block.timestamp + 24 hours,
            proofCommitment: keccak256(abi.encodePacked(_reason, block.timestamp))
        });

        return true;
    }

    /**
     * @dev Internal function to log access attempts
     */
    function _logAccess(
        string memory _userId,
        bytes32 _resourceId,
        uint8 _action,
        bool _allowed
    ) internal {
        auditLog.push(AuditEntry({
            userId: _userId,
            resourceId: _resourceId,
            action: _action,
            allowed: _allowed,
            timestamp: block.timestamp
        }));

        emit AccessAttempt(_userId, _resourceId, _allowed);
    }

    /**
     * @dev Get user attributes
     */
    function getUserAttributes(string memory _hhNumber)
        external
        view
        returns (
            Role role,
            uint8 clearanceLevel,
            bool isActive,
            uint256 registeredAt
        )
    {
        UserAttributes memory attrs = userAttributes[_hhNumber];
        return (attrs.role, attrs.clearanceLevel, attrs.isActive, attrs.registeredAt);
    }

    /**
     * @dev Get audit log length
     */
    function getAuditLogLength() external view returns (uint256) {
        return auditLog.length;
    }

    /**
     * @dev Get audit entry by index
     */
    function getAuditEntry(uint256 _index)
        external
        view
        returns (
            string memory userId,
            bytes32 resourceId,
            uint8 action,
            bool allowed,
            uint256 timestamp
        )
    {
        require(_index < auditLog.length, "Index out of bounds");
        AuditEntry memory entry = auditLog[_index];
        return (entry.userId, entry.resourceId, entry.action, entry.allowed, entry.timestamp);
    }

    /**
     * @dev Update user clearance level (admin only)
     */
    function updateClearanceLevel(
        string memory _adminId,
        string memory _userId,
        uint8 _newLevel
    ) external onlyRole(_adminId, Role.ADMIN) {
        require(_newLevel <= 4, "Invalid clearance level");
        userAttributes[_userId].clearanceLevel = _newLevel;
        emit AttributeUpdated(_userId, "clearanceLevel");
    }

    /**
     * @dev Deactivate user (admin only)
     */
    function deactivateUser(
        string memory _adminId,
        string memory _userId
    ) external onlyRole(_adminId, Role.ADMIN) {
        userAttributes[_userId].isActive = false;
        emit AttributeUpdated(_userId, "isActive");
    }
}
