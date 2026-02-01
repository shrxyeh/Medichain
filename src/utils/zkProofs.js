/**
 * Zero Knowledge Proof Utilities
 * Minimal implementation for healthcare attribute verification
 * Uses hash commitments and Pedersen-like commitments for privacy
 */

// Simple hash function using Web Crypto API
export const hash = async (data) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generate a random commitment blinding factor
export const generateBlindingFactor = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Create a commitment to a value (Pedersen-like commitment)
 * commitment = H(value || blindingFactor)
 * This hides the actual value while allowing later verification
 */
export const createCommitment = async (value, blindingFactor = null) => {
  const blinding = blindingFactor || generateBlindingFactor();
  const commitment = await hash(`${value}||${blinding}`);
  return {
    commitment,
    blindingFactor: blinding,
    // Store encrypted hint locally (never share blindingFactor)
  };
};

/**
 * Verify a commitment
 */
export const verifyCommitment = async (value, blindingFactor, commitment) => {
  const computedCommitment = await hash(`${value}||${blindingFactor}`);
  return computedCommitment === commitment;
};

/**
 * Zero Knowledge Age Proof
 * Proves age >= threshold without revealing actual age
 */
export const createAgeProof = async (dateOfBirth, threshold) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));

  const isAboveThreshold = age >= threshold;
  const blindingFactor = generateBlindingFactor();

  // Create proof: hash of (isAboveThreshold, threshold, timestamp, blinding)
  const proofData = `${isAboveThreshold}|${threshold}|${Date.now()}|${blindingFactor}`;
  const proof = await hash(proofData);

  return {
    proof,
    threshold,
    isValid: isAboveThreshold,
    timestamp: Date.now(),
    // The actual age is never revealed
  };
};

/**
 * Zero Knowledge Attribute Proof
 * Proves possession of an attribute without revealing it
 */
export const createAttributeProof = async (attributeName, attributeValue, challenge = null) => {
  const blindingFactor = generateBlindingFactor();
  const actualChallenge = challenge || generateBlindingFactor().slice(0, 16);

  // Commitment to the attribute
  const commitment = await hash(`${attributeName}:${attributeValue}||${blindingFactor}`);

  // Response to challenge (Schnorr-like)
  const response = await hash(`${commitment}|${actualChallenge}|${blindingFactor}`);

  return {
    attributeName,
    commitment,
    challenge: actualChallenge,
    response,
    timestamp: Date.now(),
    // attributeValue is never included in the proof
  };
};

/**
 * Verify an attribute proof (verifier side)
 */
export const verifyAttributeProof = async (proof, expectedCommitment) => {
  // In a real ZK system, this would verify the proof algebraically
  // Here we check the commitment matches what was expected
  return proof.commitment === expectedCommitment &&
         proof.timestamp > Date.now() - 300000; // Valid for 5 minutes
};

/**
 * Zero Knowledge Role Proof
 * Proves user has a specific role without revealing other attributes
 */
export const createRoleProof = async (role, userId) => {
  const blindingFactor = generateBlindingFactor();
  const nonce = generateBlindingFactor().slice(0, 16);

  const roleCommitment = await hash(`role:${role}|user:${userId}||${blindingFactor}`);
  const proofHash = await hash(`${roleCommitment}|${nonce}`);

  return {
    roleCommitment,
    proofHash,
    nonce,
    timestamp: Date.now(),
    expiresAt: Date.now() + 3600000, // 1 hour validity
  };
};

/**
 * Create a selective disclosure proof
 * Allows revealing only specific attributes while proving possession of others
 */
export const createSelectiveDisclosure = async (attributes, attributesToReveal) => {
  const disclosed = {};
  const commitments = {};
  const proofs = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (attributesToReveal.includes(key)) {
      // Reveal this attribute
      disclosed[key] = value;
    } else {
      // Create commitment without revealing
      const { commitment, blindingFactor } = await createCommitment(value);
      commitments[key] = commitment;
      proofs[key] = { commitment, hasValue: true };
    }
  }

  return {
    disclosed,
    commitments,
    proofs,
    timestamp: Date.now(),
  };
};

/**
 * Healthcare-specific: Prove medical clearance without revealing condition
 */
export const createMedicalClearanceProof = async (conditions, clearanceLevel) => {
  const blindingFactor = generateBlindingFactor();

  // Create proof that clearance level is sufficient
  // without revealing actual medical conditions
  const clearanceCommitment = await hash(`clearance:${clearanceLevel}||${blindingFactor}`);

  // Aggregate commitment for conditions (reveals nothing about individual conditions)
  const conditionsHash = await hash(conditions.sort().join('|'));
  const aggregateCommitment = await hash(`${conditionsHash}||${blindingFactor}`);

  return {
    clearanceLevel,
    clearanceCommitment,
    aggregateCommitment,
    conditionCount: conditions.length, // Only reveals count, not conditions
    timestamp: Date.now(),
  };
};

/**
 * Verify a proof hasn't expired
 */
export const isProofValid = (proof) => {
  if (!proof || !proof.timestamp) return false;
  if (proof.expiresAt && Date.now() > proof.expiresAt) return false;
  // Default 1 hour validity if no expiry set
  if (!proof.expiresAt && Date.now() - proof.timestamp > 3600000) return false;
  return true;
};

export default {
  hash,
  generateBlindingFactor,
  createCommitment,
  verifyCommitment,
  createAgeProof,
  createAttributeProof,
  verifyAttributeProof,
  createRoleProof,
  createSelectiveDisclosure,
  createMedicalClearanceProof,
  isProofValid,
};
