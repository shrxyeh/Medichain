import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import zkProofs from '../utils/zkProofs';
import abacEngine, { ROLES, RESOURCES, ACTIONS, SENSITIVITY } from '../utils/abacEngine';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const SecurityContext = createContext(null);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) throw new Error('useSecurityContext must be used within SecurityProvider');
  return context;
};

export const SecurityProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProofs, setUserProofs] = useState({});
  const [permissions, setPermissions] = useState({});
  const [accessLog, setAccessLog] = useState([]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setUserProofs({});
    setPermissions({});
    localStorage.removeItem('sehr_current_user');
  }, []);

  // Restore session from localStorage on mount (skip if expired)
  useEffect(() => {
    const saved = localStorage.getItem('sehr_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.authenticatedAt && Date.now() - parsed.authenticatedAt < SESSION_TIMEOUT_MS) {
          setCurrentUser(parsed);
        } else {
          localStorage.removeItem('sehr_current_user');
        }
      } catch (e) {}
    }
  }, []);

  // Auto-logout after 30-minute session age
  useEffect(() => {
    if (!currentUser?.authenticatedAt) return;
    const remaining = SESSION_TIMEOUT_MS - (Date.now() - currentUser.authenticatedAt);
    if (remaining <= 0) {
      logout();
      return;
    }
    const timer = setTimeout(() => logout(), remaining);
    return () => clearTimeout(timer);
  }, [currentUser, logout]);

  // Generates ZK role proof + attribute commitments on login
  const authenticateUser = useCallback(async (userData, role) => {
    const user = { ...userData, role, authenticatedAt: Date.now() };
    const roleProof = await zkProofs.createRoleProof(role, userData.hhNumber);
    const attributeCommitments = {};

    if (userData.dateOfBirth) {
      attributeCommitments.ageVerified = await zkProofs.createAgeProof(userData.dateOfBirth, 18);
    }
    if (userData.bloodGroup) {
      const { commitment } = await zkProofs.createCommitment(userData.bloodGroup);
      attributeCommitments.bloodGroupCommitment = commitment;
    }

    setCurrentUser(user);
    setUserProofs({ roleProof, ...attributeCommitments });
    localStorage.setItem('sehr_current_user', JSON.stringify(user));

    return { user, proofs: { roleProof, ...attributeCommitments } };
  }, []);

  const canAccess = useCallback((resourceType, resourceOwnerId, action, options = {}) => {
    if (!currentUser) return { allowed: false, reason: 'User not authenticated' };

    const decision = abacEngine.evaluateAccess({
      subject: { role: currentUser.role, id: currentUser.hhNumber, ...currentUser },
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

  const grantPermission = useCallback((targetUserId) => {
    if (!currentUser) return false;
    setPermissions(prev => ({ ...prev, [`${currentUser.hhNumber}:${targetUserId}`]: true }));
    return true;
  }, [currentUser]);

  const revokePermission = useCallback((targetUserId) => {
    if (!currentUser) return false;
    setPermissions(prev => {
      const next = { ...prev };
      delete next[`${currentUser.hhNumber}:${targetUserId}`];
      return next;
    });
    return true;
  }, [currentUser]);

  const hasPermission = useCallback((patientId, doctorId) => {
    return permissions[`${patientId}:${doctorId}`] || false;
  }, [permissions]);

  const createSelectiveProof = useCallback(async (attributesToReveal) => {
    if (!currentUser) return null;
    const attributes = {
      name: currentUser.name,
      role: currentUser.role,
      bloodGroup: currentUser.bloodGroup,
      gender: currentUser.gender,
    };
    return zkProofs.createSelectiveDisclosure(attributes, attributesToReveal);
  }, [currentUser]);

  const verifyProof = useCallback(async (proof) => zkProofs.isProofValid(proof), []);

  const getAccessLog = useCallback((filter = {}) => {
    let log = [...accessLog];
    if (filter.user) log = log.filter(e => e.user === filter.user);
    if (filter.decision !== undefined) log = log.filter(e => e.decision === filter.decision);
    return log;
  }, [accessLog]);

  const value = {
    currentUser,
    userProofs,
    permissions,
    isAuthenticated: !!currentUser,
    authenticateUser,
    logout,
    canAccess,
    grantPermission,
    revokePermission,
    hasPermission,
    createSelectiveProof,
    verifyProof,
    zkProofs,
    getAccessLog,
    accessLog,
    ROLES,
    RESOURCES,
    ACTIONS,
    SENSITIVITY,
  };

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
};

export default SecurityContext;
