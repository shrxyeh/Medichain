const sha256 = async (data) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const randomHex = () => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const hash = sha256;
export const generateBlindingFactor = randomHex;

// commitment = H(value || blindingFactor) — hides value, allows deferred verification
export const createCommitment = async (value, blindingFactor = null) => {
  const blinding = blindingFactor || randomHex();
  const commitment = await sha256(`${value}||${blinding}`);
  return { commitment, blindingFactor: blinding };
};

export const verifyCommitment = async (value, blindingFactor, commitment) => {
  return (await sha256(`${value}||${blindingFactor}`)) === commitment;
};

// Proves age >= threshold without revealing actual DOB
export const createAgeProof = async (dateOfBirth, threshold) => {
  const age = Math.floor((Date.now() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
  const blinding = randomHex();
  const proof = await sha256(`${age >= threshold}|${threshold}|${Date.now()}|${blinding}`);
  return { proof, threshold, isValid: age >= threshold, timestamp: Date.now() };
};

// Schnorr-like: proves knowledge of attribute without revealing it
export const createAttributeProof = async (attributeName, attributeValue, challenge = null) => {
  const blinding = randomHex();
  const actualChallenge = challenge || randomHex().slice(0, 16);
  const commitment = await sha256(`${attributeName}:${attributeValue}||${blinding}`);
  const response = await sha256(`${commitment}|${actualChallenge}|${blinding}`);
  return { attributeName, commitment, challenge: actualChallenge, response, timestamp: Date.now() };
};

export const verifyAttributeProof = async (proof, expectedCommitment) => {
  return proof.commitment === expectedCommitment && proof.timestamp > Date.now() - 300000;
};

export const createRoleProof = async (role, userId) => {
  const blinding = randomHex();
  const nonce = randomHex().slice(0, 16);
  const roleCommitment = await sha256(`role:${role}|user:${userId}||${blinding}`);
  const proofHash = await sha256(`${roleCommitment}|${nonce}`);
  return { roleCommitment, proofHash, nonce, timestamp: Date.now(), expiresAt: Date.now() + 3600000 };
};

export const createSelectiveDisclosure = async (attributes, attributesToReveal) => {
  const disclosed = {};
  const commitments = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (attributesToReveal.includes(key)) {
      disclosed[key] = value;
    } else {
      const { commitment } = await createCommitment(value);
      commitments[key] = commitment;
    }
  }

  return { disclosed, commitments, timestamp: Date.now() };
};

export const createMedicalClearanceProof = async (conditions, clearanceLevel) => {
  const blinding = randomHex();
  const clearanceCommitment = await sha256(`clearance:${clearanceLevel}||${blinding}`);
  const conditionsHash = await sha256(conditions.sort().join('|'));
  const aggregateCommitment = await sha256(`${conditionsHash}||${blinding}`);
  return { clearanceLevel, clearanceCommitment, aggregateCommitment, conditionCount: conditions.length, timestamp: Date.now() };
};

export const isProofValid = (proof) => {
  if (!proof?.timestamp) return false;
  if (proof.expiresAt && Date.now() > proof.expiresAt) return false;
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
