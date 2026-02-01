/**
 * Attribute-Based Access Control (ABAC) Engine
 * Minimal implementation for healthcare access control
 */

// Standard healthcare roles
export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  DIAGNOSTIC: 'diagnostic',
  ADMIN: 'admin',
  EMERGENCY: 'emergency',
};

// Resource types in the system
export const RESOURCES = {
  PATIENT_RECORD: 'patient_record',
  MEDICAL_HISTORY: 'medical_history',
  DIAGNOSTIC_REPORT: 'diagnostic_report',
  PRESCRIPTION: 'prescription',
  LAB_RESULTS: 'lab_results',
  PERSONAL_INFO: 'personal_info',
  BILLING: 'billing',
};

// Actions that can be performed
export const ACTIONS = {
  READ: 'read',
  WRITE: 'write',
  UPDATE: 'update',
  DELETE: 'delete',
  SHARE: 'share',
  DOWNLOAD: 'download',
};

// Sensitivity levels for data
export const SENSITIVITY = {
  PUBLIC: 0,
  INTERNAL: 1,
  CONFIDENTIAL: 2,
  RESTRICTED: 3,
  TOP_SECRET: 4,
};

/**
 * Default ABAC Policies
 * Each policy defines conditions under which access is granted
 */
const defaultPolicies = [
  // Patients can read and download their own records
  {
    id: 'patient-own-records',
    description: 'Patients can access their own records',
    effect: 'allow',
    subjects: { role: ROLES.PATIENT },
    resources: { type: [RESOURCES.PATIENT_RECORD, RESOURCES.MEDICAL_HISTORY, RESOURCES.LAB_RESULTS] },
    actions: [ACTIONS.READ, ACTIONS.DOWNLOAD],
    conditions: {
      ownerMatch: true, // Subject must be the owner
    },
  },

  // Patients can share their records
  {
    id: 'patient-share-records',
    description: 'Patients can share their records with others',
    effect: 'allow',
    subjects: { role: ROLES.PATIENT },
    resources: { type: [RESOURCES.PATIENT_RECORD, RESOURCES.MEDICAL_HISTORY] },
    actions: [ACTIONS.SHARE],
    conditions: {
      ownerMatch: true,
    },
  },

  // Doctors can read patient records with permission
  {
    id: 'doctor-read-with-permission',
    description: 'Doctors can read patient records when permission granted',
    effect: 'allow',
    subjects: { role: ROLES.DOCTOR },
    resources: { type: [RESOURCES.PATIENT_RECORD, RESOURCES.MEDICAL_HISTORY, RESOURCES.LAB_RESULTS] },
    actions: [ACTIONS.READ],
    conditions: {
      hasPermission: true,
    },
  },

  // Doctors can write prescriptions
  {
    id: 'doctor-write-prescription',
    description: 'Doctors can create prescriptions for permitted patients',
    effect: 'allow',
    subjects: { role: ROLES.DOCTOR },
    resources: { type: [RESOURCES.PRESCRIPTION] },
    actions: [ACTIONS.WRITE, ACTIONS.UPDATE],
    conditions: {
      hasPermission: true,
    },
  },

  // Diagnostic centers can upload reports
  {
    id: 'diagnostic-upload',
    description: 'Diagnostic centers can upload diagnostic reports',
    effect: 'allow',
    subjects: { role: ROLES.DIAGNOSTIC },
    resources: { type: [RESOURCES.DIAGNOSTIC_REPORT, RESOURCES.LAB_RESULTS] },
    actions: [ACTIONS.WRITE],
    conditions: {
      hasPermission: true,
    },
  },

  // Emergency access override
  {
    id: 'emergency-access',
    description: 'Emergency personnel can access critical records',
    effect: 'allow',
    subjects: { role: ROLES.EMERGENCY },
    resources: { type: [RESOURCES.PATIENT_RECORD, RESOURCES.MEDICAL_HISTORY] },
    actions: [ACTIONS.READ],
    conditions: {
      emergencyDeclared: true,
      sensitivityMax: SENSITIVITY.CONFIDENTIAL,
    },
  },

  // Deny access to highly sensitive data by default
  {
    id: 'deny-restricted-default',
    description: 'Deny access to restricted data by default',
    effect: 'deny',
    subjects: { role: '*' },
    resources: { sensitivity: SENSITIVITY.RESTRICTED },
    actions: '*',
    conditions: {
      unless: { role: ROLES.ADMIN },
    },
  },
];

/**
 * ABAC Policy Engine Class
 */
class ABACEngine {
  constructor() {
    this.policies = [...defaultPolicies];
    this.auditLog = [];
  }

  /**
   * Add a custom policy
   */
  addPolicy(policy) {
    if (!policy.id || !policy.effect) {
      throw new Error('Policy must have id and effect');
    }
    this.policies.push(policy);
  }

  /**
   * Remove a policy by ID
   */
  removePolicy(policyId) {
    this.policies = this.policies.filter(p => p.id !== policyId);
  }

  /**
   * Evaluate if a subject matches policy subject criteria
   */
  matchSubject(policySubjects, subjectAttrs) {
    if (!policySubjects) return true;

    for (const [key, value] of Object.entries(policySubjects)) {
      if (value === '*') continue;
      if (Array.isArray(value)) {
        if (!value.includes(subjectAttrs[key])) return false;
      } else {
        if (subjectAttrs[key] !== value) return false;
      }
    }
    return true;
  }

  /**
   * Evaluate if a resource matches policy resource criteria
   */
  matchResource(policyResources, resourceAttrs) {
    if (!policyResources) return true;

    for (const [key, value] of Object.entries(policyResources)) {
      if (value === '*') continue;
      if (Array.isArray(value)) {
        if (!value.includes(resourceAttrs[key])) return false;
      } else {
        if (resourceAttrs[key] !== value) return false;
      }
    }
    return true;
  }

  /**
   * Evaluate if action matches policy actions
   */
  matchAction(policyActions, requestedAction) {
    if (policyActions === '*') return true;
    if (Array.isArray(policyActions)) {
      return policyActions.includes(requestedAction);
    }
    return policyActions === requestedAction;
  }

  /**
   * Evaluate policy conditions
   */
  evaluateConditions(conditions, context) {
    if (!conditions) return true;

    // Owner match condition
    if (conditions.ownerMatch !== undefined) {
      if (conditions.ownerMatch && context.subjectId !== context.resourceOwnerId) {
        return false;
      }
    }

    // Permission check condition
    if (conditions.hasPermission !== undefined) {
      if (conditions.hasPermission && !context.permissionGranted) {
        return false;
      }
    }

    // Emergency condition
    if (conditions.emergencyDeclared !== undefined) {
      if (conditions.emergencyDeclared && !context.isEmergency) {
        return false;
      }
    }

    // Sensitivity level condition
    if (conditions.sensitivityMax !== undefined) {
      if (context.resourceSensitivity > conditions.sensitivityMax) {
        return false;
      }
    }

    // Time-based conditions
    if (conditions.timeRange) {
      const now = new Date();
      const hour = now.getHours();
      if (hour < conditions.timeRange.start || hour > conditions.timeRange.end) {
        return false;
      }
    }

    // Unless clause (negation)
    if (conditions.unless) {
      for (const [key, value] of Object.entries(conditions.unless)) {
        if (context.subject && context.subject[key] === value) {
          return true; // Unless condition met, skip other checks
        }
      }
    }

    return true;
  }

  /**
   * Main access decision function
   * Returns { allowed: boolean, reason: string, policy: string }
   */
  evaluateAccess(request) {
    const { subject, resource, action, context = {} } = request;

    const fullContext = {
      ...context,
      subject,
      subjectId: subject.id || subject.hhNumber,
      resourceOwnerId: resource.ownerId || resource.patientId,
      resourceSensitivity: resource.sensitivity || SENSITIVITY.INTERNAL,
    };

    let decision = { allowed: false, reason: 'No matching policy found', policy: null };
    const matchedPolicies = [];

    // Evaluate all policies
    for (const policy of this.policies) {
      const subjectMatch = this.matchSubject(policy.subjects, subject);
      const resourceMatch = this.matchResource(policy.resources, resource);
      const actionMatch = this.matchAction(policy.actions, action);
      const conditionsMatch = this.evaluateConditions(policy.conditions, fullContext);

      if (subjectMatch && resourceMatch && actionMatch && conditionsMatch) {
        matchedPolicies.push(policy);
      }
    }

    // Apply policy combination (deny overrides)
    const denyPolicy = matchedPolicies.find(p => p.effect === 'deny');
    if (denyPolicy) {
      decision = {
        allowed: false,
        reason: denyPolicy.description,
        policy: denyPolicy.id,
      };
    } else {
      const allowPolicy = matchedPolicies.find(p => p.effect === 'allow');
      if (allowPolicy) {
        decision = {
          allowed: true,
          reason: allowPolicy.description,
          policy: allowPolicy.id,
        };
      }
    }

    // Audit logging
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      subject: subject.id || subject.hhNumber,
      resource: resource.type,
      action,
      decision: decision.allowed ? 'ALLOW' : 'DENY',
      policy: decision.policy,
      reason: decision.reason,
    });

    return decision;
  }

  /**
   * Get audit log
   */
  getAuditLog(filter = {}) {
    let log = [...this.auditLog];

    if (filter.subject) {
      log = log.filter(entry => entry.subject === filter.subject);
    }
    if (filter.decision) {
      log = log.filter(entry => entry.decision === filter.decision);
    }
    if (filter.since) {
      const since = new Date(filter.since);
      log = log.filter(entry => new Date(entry.timestamp) >= since);
    }

    return log;
  }

  /**
   * Clear audit log
   */
  clearAuditLog() {
    this.auditLog = [];
  }

  /**
   * Get all policies
   */
  getPolicies() {
    return [...this.policies];
  }

  /**
   * Check if user can perform action (simplified API)
   */
  canAccess(userRole, userId, resourceType, resourceOwnerId, action, options = {}) {
    return this.evaluateAccess({
      subject: { role: userRole, id: userId },
      resource: { type: resourceType, ownerId: resourceOwnerId },
      action,
      context: {
        permissionGranted: options.hasPermission || false,
        isEmergency: options.isEmergency || false,
      },
    });
  }
}

// Singleton instance
const abacEngine = new ABACEngine();

export { ABACEngine };
export default abacEngine;
