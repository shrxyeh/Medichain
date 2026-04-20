export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  DIAGNOSTIC: 'diagnostic',
  ADMIN: 'admin',
  EMERGENCY: 'emergency',
};

export const RESOURCES = {
  PATIENT_RECORD: 'patient_record',
  MEDICAL_HISTORY: 'medical_history',
  DIAGNOSTIC_REPORT: 'diagnostic_report',
  PRESCRIPTION: 'prescription',
  LAB_RESULTS: 'lab_results',
  PERSONAL_INFO: 'personal_info',
  BILLING: 'billing',
};

export const ACTIONS = {
  READ: 'read',
  WRITE: 'write',
  UPDATE: 'update',
  DELETE: 'delete',
  SHARE: 'share',
  DOWNLOAD: 'download',
};

export const SENSITIVITY = {
  PUBLIC: 0,
  INTERNAL: 1,
  CONFIDENTIAL: 2,
  RESTRICTED: 3,
  TOP_SECRET: 4,
};

const defaultPolicies = [
  {
    id: 'patient-own-records',
    description: 'Patients can access their own records',
    effect: 'allow',
    subjects: { role: ROLES.PATIENT },
    resources: { type: [RESOURCES.PATIENT_RECORD, RESOURCES.MEDICAL_HISTORY, RESOURCES.LAB_RESULTS] },
    actions: [ACTIONS.READ, ACTIONS.DOWNLOAD],
    conditions: { ownerMatch: true },
  },
  {
    id: 'patient-share-records',
    description: 'Patients can share their records with others',
    effect: 'allow',
    subjects: { role: ROLES.PATIENT },
    resources: { type: [RESOURCES.PATIENT_RECORD, RESOURCES.MEDICAL_HISTORY] },
    actions: [ACTIONS.SHARE],
    conditions: { ownerMatch: true },
  },
  {
    id: 'doctor-read-with-permission',
    description: 'Doctors can read patient records when permission granted',
    effect: 'allow',
    subjects: { role: ROLES.DOCTOR },
    resources: { type: [RESOURCES.PATIENT_RECORD, RESOURCES.MEDICAL_HISTORY, RESOURCES.LAB_RESULTS] },
    actions: [ACTIONS.READ],
    conditions: { hasPermission: true },
  },
  {
    id: 'doctor-write-prescription',
    description: 'Doctors can create prescriptions for permitted patients',
    effect: 'allow',
    subjects: { role: ROLES.DOCTOR },
    resources: { type: [RESOURCES.PRESCRIPTION] },
    actions: [ACTIONS.WRITE, ACTIONS.UPDATE],
    conditions: { hasPermission: true },
  },
  {
    id: 'diagnostic-upload',
    description: 'Diagnostic centers can upload diagnostic reports',
    effect: 'allow',
    subjects: { role: ROLES.DIAGNOSTIC },
    resources: { type: [RESOURCES.DIAGNOSTIC_REPORT, RESOURCES.LAB_RESULTS] },
    actions: [ACTIONS.WRITE],
    conditions: { hasPermission: true },
  },
  {
    id: 'emergency-access',
    description: 'Emergency personnel can access critical records',
    effect: 'allow',
    subjects: { role: ROLES.EMERGENCY },
    resources: { type: [RESOURCES.PATIENT_RECORD, RESOURCES.MEDICAL_HISTORY] },
    actions: [ACTIONS.READ],
    conditions: { emergencyDeclared: true, sensitivityMax: SENSITIVITY.CONFIDENTIAL },
  },
  {
    id: 'deny-restricted-default',
    description: 'Deny access to restricted data by default',
    effect: 'deny',
    subjects: { role: '*' },
    resources: { sensitivity: SENSITIVITY.RESTRICTED },
    actions: '*',
    conditions: { unless: { role: ROLES.ADMIN } },
  },
];

class ABACEngine {
  constructor() {
    this.policies = [...defaultPolicies];
    this.auditLog = [];
  }

  addPolicy(policy) {
    if (!policy.id || !policy.effect) throw new Error('Policy must have id and effect');
    this.policies.push(policy);
  }

  removePolicy(policyId) {
    this.policies = this.policies.filter(p => p.id !== policyId);
  }

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

  matchAction(policyActions, requestedAction) {
    if (policyActions === '*') return true;
    if (Array.isArray(policyActions)) return policyActions.includes(requestedAction);
    return policyActions === requestedAction;
  }

  evaluateConditions(conditions, context) {
    if (!conditions) return true;

    if (conditions.ownerMatch && context.subjectId !== context.resourceOwnerId) return false;
    if (conditions.hasPermission && !context.permissionGranted) return false;
    if (conditions.emergencyDeclared && !context.isEmergency) return false;
    if (conditions.sensitivityMax !== undefined && context.resourceSensitivity > conditions.sensitivityMax) return false;

    if (conditions.timeRange) {
      const hour = new Date().getHours();
      if (hour < conditions.timeRange.start || hour > conditions.timeRange.end) return false;
    }

    if (conditions.unless) {
      for (const [key, value] of Object.entries(conditions.unless)) {
        if (context.subject && context.subject[key] === value) return true;
      }
    }

    return true;
  }

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

    for (const policy of this.policies) {
      if (
        this.matchSubject(policy.subjects, subject) &&
        this.matchResource(policy.resources, resource) &&
        this.matchAction(policy.actions, action) &&
        this.evaluateConditions(policy.conditions, fullContext)
      ) {
        matchedPolicies.push(policy);
      }
    }

    // Deny overrides allow
    const denyPolicy = matchedPolicies.find(p => p.effect === 'deny');
    if (denyPolicy) {
      decision = { allowed: false, reason: denyPolicy.description, policy: denyPolicy.id };
    } else {
      const allowPolicy = matchedPolicies.find(p => p.effect === 'allow');
      if (allowPolicy) {
        decision = { allowed: true, reason: allowPolicy.description, policy: allowPolicy.id };
      }
    }

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

  getAuditLog(filter = {}) {
    let log = [...this.auditLog];
    if (filter.subject) log = log.filter(e => e.subject === filter.subject);
    if (filter.decision) log = log.filter(e => e.decision === filter.decision);
    if (filter.since) log = log.filter(e => new Date(e.timestamp) >= new Date(filter.since));
    return log;
  }

  clearAuditLog() { this.auditLog = []; }
  getPolicies() { return [...this.policies]; }

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

const abacEngine = new ABACEngine();

export { ABACEngine };
export default abacEngine;
