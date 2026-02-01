/**
 * Security Context Provider
 * Provides ZK Proofs and ABAC functionality throughout the app
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import zkProofs from '../utils/zkProofs';
import abacEngine, { ROLES, RESOURCES, ACTIONS, SENSITIVITY } from '../utils/abacEngine';

const SecurityContext = createContext(null);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within SecurityProvider');
  }
  return context;
};

export const SecurityProvider = ({ children }) => {
  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [userProofs, setUserProofs] = useState({});
  const [permissions, setPermissions] = useState({});
  const [accessLog, setAccessLog] = useState([]);

  // Load persisted state
  useEffect(() => {
    const savedUser = localStorage.getItem('sehr_current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user');
      }
    }
  }, []);

  /**
   * Authenticate user and create ZK proofs
   */
  const authenticateUser = useCallback(async (userData, role) => {
    const user = {
      ...userData,
      role,
      authenticatedAt: Date.now(),
    };

    // Create ZK role proof
    const roleProof = await zkProofs.createRoleProof(role, userData.hhNumber);

    // Create attribute commitments for privacy-preserving verification
    const attributeCommitments = {};

    if (userData.dateOfBirth) {
      const ageProof = await zkProofs.createAgeProof(userData.dateOfBirth, 18);
      attributeCommitments.ageVerified = ageProof;
    }

    if (userData.bloodGroup) {
      const { commitment } = await zkProofs.createCommitment(userData.bloodGroup);
      attributeCommitments.bloodGroupCommitment = commitment;
    }

    setCurrentUser(user);
    setUserProofs({
      roleProof,
      ...attributeCommitments,
    });

    localStorage.setItem('sehr_current_user', JSON.stringify(user));

    return { user, proofs: { roleProof, ...attributeCommitments } };
  }, []);

  /**
   * Logout and clear proofs
   */
  const logout = useCallback(() => {
    setCurrentUser(null);
    setUserProofs({});
    setPermissions({});
    localStorage.removeItem('sehr_current_user');
  }, []);

  /**
   * Check if user can access a resource using ABAC
   */
  const canAccess = useCallback((resourceType, resourceOwnerId, action, options = {}) => {
    if (!currentUser) {
      return { allowed: false, reason: 'User not authenticated' };
    }

    const decision = abacEngine.evaluateAccess({
      subject: {
        role: currentUser.role,
        id: currentUser.hhNumber,
        ...currentUser,
      },
      resource: {
        type: resourceType,
        ownerId: resourceOwnerId,
        sensitivity: options.sensitivity || SENSITIVITY.INTERNAL,
      },
      action,
      context: {
        permissionGranted: permissions[resourceOwnerId] || options.hasPermission || false,
        isEmergency: options.isEmergency || false,
      },
    });

    // Log access attempt
    setAccessLog(prev => [...prev.slice(-99), {
      timestamp: new Date().toISOString(),
      user: currentUser.hhNumber,
      resource: resourceType,
      owner: resourceOwnerId,
      action,
      decision: decision.allowed,
      reason: decision.reason,
    }]);

    return decision;
  }, [currentUser, permissions]);

  /**
   * Grant permission to another user
   */
  const grantPermission = useCallback((targetUserId) => {
    if (!currentUser) return false;

    setPermissions(prev => ({
      ...prev,
      [`${currentUser.hhNumber}:${targetUserId}`]: true,
    }));

    return true;
  }, [currentUser]);

  /**
   * Revoke permission from another user
   */
  const revokePermission = useCallback((targetUserId) => {
    if (!currentUser) return false;

    setPermissions(prev => {
      const newPerms = { ...prev };
      delete newPerms[`${currentUser.hhNumber}:${targetUserId}`];
      return newPerms;
    });

    return true;
  }, [currentUser]);

  /**
   * Check if permission is granted
   */
  const hasPermission = useCallback((patientId, doctorId) => {
    return permissions[`${patientId}:${doctorId}`] || false;
  }, [permissions]);

  /**
   * Create a ZK proof for selective disclosure
   */
  const createSelectiveProof = useCallback(async (attributesToReveal) => {
    if (!currentUser) return null;

    const attributes = {
      name: currentUser.name,
      role: currentUser.role,
      bloodGroup: currentUser.bloodGroup,
      gender: currentUser.gender,
    };

    return await zkProofs.createSelectiveDisclosure(attributes, attributesToReveal);
  }, [currentUser]);

  /**
   * Verify a ZK proof
   */
  const verifyProof = useCallback(async (proof) => {
    return zkProofs.isProofValid(proof);
  }, []);

  /**
   * Get access audit log
   */
  const getAccessLog = useCallback((filter = {}) => {
    let log = [...accessLog];

    if (filter.user) {
      log = log.filter(entry => entry.user === filter.user);
    }
    if (filter.decision !== undefined) {
      log = log.filter(entry => entry.decision === filter.decision);
    }

    return log;
  }, [accessLog]);

  const value = {
    // State
    currentUser,
    userProofs,
    permissions,
    isAuthenticated: !!currentUser,

    // Auth actions
    authenticateUser,
    logout,

    // Access control
    canAccess,
    grantPermission,
    revokePermission,
    hasPermission,

    // ZK proofs
    createSelectiveProof,
    verifyProof,
    zkProofs, // Expose raw utilities

    // Audit
    getAccessLog,
    accessLog,

    // Constants
    ROLES,
    RESOURCES,
    ACTIONS,
    SENSITIVITY,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export default SecurityContext;
