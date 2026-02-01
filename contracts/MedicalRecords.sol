// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MedicalRecords {
    // ============ Enums ============
    enum RecordType {
        PAST_RECORD,      // Patient-uploaded historical records
        LAB_REPORT,       // Diagnostic center reports
        PRESCRIPTION,     // Doctor prescriptions
        IMAGING,          // X-rays, MRIs, etc.
        CONSULTATION      // Consultation notes
    }

    // ============ Structs ============
    struct MedicalRecord {
        uint256 recordId;
        string ipfsCID;           // IPFS Content Identifier
        RecordType recordType;
        uint256 uploadedAt;
        address uploadedBy;
        string metadata;          // JSON string: filename, description, etc.
        bool isActive;
    }

    struct LabReport {
        uint256 recordId;
        string doctorName;
        string patientName;
        string age;
        string gender;
        string bloodGroup;
        address patientWallet;
        address diagnosticWallet;
        string ipfsCID;
        uint256 createdAt;
    }

    // ============ State Variables ============
    uint256 private recordIdCounter;

    // patientHhNumber => array of record IDs
    mapping(string => uint256[]) private patientRecordIds;

    // recordId => MedicalRecord
    mapping(uint256 => MedicalRecord) public records;

    // recordId => LabReport (for lab report specific data)
    mapping(uint256 => LabReport) public labReports;

    // Reference to PatientRegistration contract
    address public patientRegistrationContract;

    // ============ Events ============
    event RecordUploaded(
        uint256 indexed recordId,
        string patientHhNumber,
        string ipfsCID,
        RecordType recordType,
        address uploadedBy
    );

    event LabReportCreated(
        uint256 indexed recordId,
        string patientHhNumber,
        address diagnosticWallet,
        string ipfsCID
    );

    event RecordDeactivated(
        uint256 indexed recordId,
        string patientHhNumber
    );

    // ============ Constructor ============
    constructor(address _patientRegistrationContract) {
        patientRegistrationContract = _patientRegistrationContract;
        recordIdCounter = 1;
    }

    // ============ Patient Functions ============

    /**
     * @dev Upload a past medical record (patient-initiated)
     * @param _patientHhNumber Patient's HH number
     * @param _ipfsCID IPFS Content Identifier
     * @param _metadata JSON metadata (filename, description, etc.)
     */
    function uploadPastRecord(
        string memory _patientHhNumber,
        string memory _ipfsCID,
        string memory _metadata
    ) external returns (uint256) {
        require(bytes(_ipfsCID).length > 0, "IPFS CID required");
        require(bytes(_patientHhNumber).length > 0, "Patient HH number required");

        uint256 newRecordId = recordIdCounter++;

        records[newRecordId] = MedicalRecord({
            recordId: newRecordId,
            ipfsCID: _ipfsCID,
            recordType: RecordType.PAST_RECORD,
            uploadedAt: block.timestamp,
            uploadedBy: msg.sender,
            metadata: _metadata,
            isActive: true
        });

        patientRecordIds[_patientHhNumber].push(newRecordId);

        emit RecordUploaded(
            newRecordId,
            _patientHhNumber,
            _ipfsCID,
            RecordType.PAST_RECORD,
            msg.sender
        );

        return newRecordId;
    }

    /**
     * @dev Upload a record with specific type
     */
    function uploadRecord(
        string memory _patientHhNumber,
        string memory _ipfsCID,
        RecordType _recordType,
        string memory _metadata
    ) external returns (uint256) {
        require(bytes(_ipfsCID).length > 0, "IPFS CID required");
        require(bytes(_patientHhNumber).length > 0, "Patient HH number required");

        uint256 newRecordId = recordIdCounter++;

        records[newRecordId] = MedicalRecord({
            recordId: newRecordId,
            ipfsCID: _ipfsCID,
            recordType: _recordType,
            uploadedAt: block.timestamp,
            uploadedBy: msg.sender,
            metadata: _metadata,
            isActive: true
        });

        patientRecordIds[_patientHhNumber].push(newRecordId);

        emit RecordUploaded(
            newRecordId,
            _patientHhNumber,
            _ipfsCID,
            _recordType,
            msg.sender
        );

        return newRecordId;
    }

    // ============ Diagnostic Functions ============

    /**
     * @dev Create a lab report (diagnostic center-initiated)
     */
    function createLabReport(
        string memory _patientHhNumber,
        string memory _doctorName,
        string memory _patientName,
        string memory _age,
        string memory _gender,
        string memory _bloodGroup,
        address _patientWallet,
        string memory _ipfsCID,
        string memory _metadata
    ) external returns (uint256) {
        require(bytes(_ipfsCID).length > 0, "IPFS CID required");
        require(bytes(_patientHhNumber).length > 0, "Patient HH number required");

        uint256 newRecordId = recordIdCounter++;

        records[newRecordId] = MedicalRecord({
            recordId: newRecordId,
            ipfsCID: _ipfsCID,
            recordType: RecordType.LAB_REPORT,
            uploadedAt: block.timestamp,
            uploadedBy: msg.sender,
            metadata: _metadata,
            isActive: true
        });

        labReports[newRecordId] = LabReport({
            recordId: newRecordId,
            doctorName: _doctorName,
            patientName: _patientName,
            age: _age,
            gender: _gender,
            bloodGroup: _bloodGroup,
            patientWallet: _patientWallet,
            diagnosticWallet: msg.sender,
            ipfsCID: _ipfsCID,
            createdAt: block.timestamp
        });

        patientRecordIds[_patientHhNumber].push(newRecordId);

        emit LabReportCreated(
            newRecordId,
            _patientHhNumber,
            msg.sender,
            _ipfsCID
        );

        return newRecordId;
    }

    // ============ View Functions ============

    /**
     * @dev Get all record IDs for a patient
     */
    function getPatientRecordIds(string memory _patientHhNumber)
        external view returns (uint256[] memory)
    {
        return patientRecordIds[_patientHhNumber];
    }

    /**
     * @dev Get record details by ID
     */
    function getRecord(uint256 _recordId) external view returns (
        uint256 recordId,
        string memory ipfsCID,
        RecordType recordType,
        uint256 uploadedAt,
        address uploadedBy,
        string memory metadata,
        bool isActive
    ) {
        MedicalRecord memory record = records[_recordId];
        return (
            record.recordId,
            record.ipfsCID,
            record.recordType,
            record.uploadedAt,
            record.uploadedBy,
            record.metadata,
            record.isActive
        );
    }

    /**
     * @dev Get lab report details
     */
    function getLabReport(uint256 _recordId) external view returns (
        string memory doctorName,
        string memory patientName,
        string memory age,
        string memory gender,
        string memory bloodGroup,
        address patientWallet,
        address diagnosticWallet,
        string memory ipfsCID,
        uint256 createdAt
    ) {
        LabReport memory report = labReports[_recordId];
        return (
            report.doctorName,
            report.patientName,
            report.age,
            report.gender,
            report.bloodGroup,
            report.patientWallet,
            report.diagnosticWallet,
            report.ipfsCID,
            report.createdAt
        );
    }

    /**
     * @dev Get total record count for a patient
     */
    function getPatientRecordCount(string memory _patientHhNumber)
        external view returns (uint256)
    {
        return patientRecordIds[_patientHhNumber].length;
    }

    /**
     * @dev Check if a record exists
     */
    function recordExists(uint256 _recordId) external view returns (bool) {
        return records[_recordId].recordId != 0;
    }

    // ============ Management Functions ============

    /**
     * @dev Deactivate a record (soft delete)
     */
    function deactivateRecord(
        string memory _patientHhNumber,
        uint256 _recordId
    ) external {
        require(records[_recordId].recordId != 0, "Record does not exist");
        require(
            records[_recordId].uploadedBy == msg.sender,
            "Only uploader can deactivate"
        );

        records[_recordId].isActive = false;

        emit RecordDeactivated(_recordId, _patientHhNumber);
    }
}
