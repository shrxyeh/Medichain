/**
 * ZKVerificationModal Component
 * Displays Zero Knowledge proof verification UI
 */

import React, { useState, useEffect } from 'react';
import { useSecurityContext } from '../context/SecurityContext';

const ZKVerificationModal = ({ onClose, onVerify }) => {
  const { currentUser, userProofs, zkProofs, createSelectiveProof } = useSecurityContext();

  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, verifying, success, failed
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [proofResult, setProofResult] = useState(null);
  const [activeDemo, setActiveDemo] = useState(null);

  const availableAttributes = [
    { key: 'name', label: 'Full Name', icon: '👤' },
    { key: 'role', label: 'User Role', icon: '🏥' },
    { key: 'bloodGroup', label: 'Blood Group', icon: '🩸' },
    { key: 'gender', label: 'Gender', icon: '⚧' },
  ];

  const handleSelectAttribute = (key) => {
    setSelectedAttributes(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleGenerateProof = async () => {
    setVerificationStatus('verifying');

    try {
      // Simulate ZK proof generation with a small delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const proof = await createSelectiveProof(selectedAttributes);
      setProofResult(proof);
      setVerificationStatus('success');

      if (onVerify) {
        onVerify(proof);
      }
    } catch (error) {
      console.error('Proof generation failed:', error);
      setVerificationStatus('failed');
    }
  };

  const runAgeVerificationDemo = async () => {
    setActiveDemo('age');
    setVerificationStatus('verifying');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Demo: Prove user is over 18 without revealing actual age
      const ageProof = await zkProofs.createAgeProof('1990-01-15', 18);

      setProofResult({
        type: 'age_verification',
        threshold: 18,
        result: ageProof.isValid ? 'User is 18 or older' : 'User is under 18',
        proof: ageProof.proof.slice(0, 16) + '...',
        note: 'Actual date of birth was NOT revealed',
      });
      setVerificationStatus('success');
    } catch (error) {
      setVerificationStatus('failed');
    }
  };

  const runAttributeCommitmentDemo = async () => {
    setActiveDemo('commitment');
    setVerificationStatus('verifying');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Demo: Create commitment to blood group
      const { commitment } = await zkProofs.createCommitment('O+');

      setProofResult({
        type: 'attribute_commitment',
        attribute: 'Blood Group',
        commitment: commitment.slice(0, 32) + '...',
        note: 'Commitment hides actual value. Can be verified later without revealing blood group.',
      });
      setVerificationStatus('success');
    } catch (error) {
      setVerificationStatus('failed');
    }
  };

  const runRoleProofDemo = async () => {
    setActiveDemo('role');
    setVerificationStatus('verifying');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Demo: Prove role without revealing identity
      const roleProof = await zkProofs.createRoleProof('doctor', 'hidden-id');

      setProofResult({
        type: 'role_proof',
        proofHash: roleProof.proofHash.slice(0, 32) + '...',
        validUntil: new Date(roleProof.expiresAt).toLocaleString(),
        note: 'Proves user is a doctor without revealing their ID.',
      });
      setVerificationStatus('success');
    } catch (error) {
      setVerificationStatus('failed');
    }
  };

  const resetDemo = () => {
    setActiveDemo(null);
    setVerificationStatus('idle');
    setProofResult(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Zero Knowledge Proofs</h2>
              <p className="text-sm text-gray-400">Privacy-preserving verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
          {/* Explanation */}
          <div className="glass-card-inner p-4 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <h3 className="text-white font-medium mb-1">What is Zero Knowledge?</h3>
                <p className="text-sm text-gray-400">
                  Zero Knowledge proofs allow you to prove something is true without revealing the underlying data.
                  For example, prove you're over 18 without revealing your birthdate.
                </p>
              </div>
            </div>
          </div>

          {/* Demo Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Interactive Demos</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={runAgeVerificationDemo}
                disabled={verificationStatus === 'verifying'}
                className="glass-card-inner p-4 rounded-xl text-left hover:bg-white/10 transition-all group"
              >
                <span className="text-2xl mb-2 block">🎂</span>
                <h4 className="text-white font-medium text-sm">Age Proof</h4>
                <p className="text-xs text-gray-400 mt-1">Prove age without revealing birthdate</p>
              </button>

              <button
                onClick={runAttributeCommitmentDemo}
                disabled={verificationStatus === 'verifying'}
                className="glass-card-inner p-4 rounded-xl text-left hover:bg-white/10 transition-all group"
              >
                <span className="text-2xl mb-2 block">🩸</span>
                <h4 className="text-white font-medium text-sm">Commitment</h4>
                <p className="text-xs text-gray-400 mt-1">Hide attribute in commitment</p>
              </button>

              <button
                onClick={runRoleProofDemo}
                disabled={verificationStatus === 'verifying'}
                className="glass-card-inner p-4 rounded-xl text-left hover:bg-white/10 transition-all group"
              >
                <span className="text-2xl mb-2 block">🏥</span>
                <h4 className="text-white font-medium text-sm">Role Proof</h4>
                <p className="text-xs text-gray-400 mt-1">Prove role without ID</p>
              </button>
            </div>
          </div>

          {/* Verification Status */}
          {verificationStatus === 'verifying' && (
            <div className="glass-card-inner p-6 rounded-xl mb-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 mb-4">
                <svg className="w-6 h-6 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-white font-medium">Generating Zero Knowledge Proof...</p>
              <p className="text-sm text-gray-400 mt-1">Creating cryptographic proof without revealing data</p>
            </div>
          )}

          {/* Success Result */}
          {verificationStatus === 'success' && proofResult && (
            <div className="glass-card-inner p-6 rounded-xl mb-6 border border-green-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-white font-medium">Proof Generated Successfully</h4>
                  <p className="text-xs text-green-400">Verification complete</p>
                </div>
              </div>

              <div className="space-y-3 bg-black/30 p-4 rounded-lg font-mono text-sm">
                {Object.entries(proofResult).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400">{key}:</span>
                    <span className="text-white">{String(value)}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={resetDemo}
                className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-all"
              >
                Try Another Demo
              </button>
            </div>
          )}

          {/* Selective Disclosure Section */}
          <div className="glass-card-inner p-5 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Selective Disclosure</h3>
            <p className="text-xs text-gray-500 mb-4">
              Choose which attributes to reveal. Others will be hidden with ZK commitments.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {availableAttributes.map((attr) => (
                <button
                  key={attr.key}
                  onClick={() => handleSelectAttribute(attr.key)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedAttributes.includes(attr.key)
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{attr.icon}</span>
                    <span className="text-sm text-white">{attr.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedAttributes.includes(attr.key) ? 'Will be revealed' : 'Will be hidden'}
                  </p>
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateProof}
              disabled={verificationStatus === 'verifying'}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-medium transition-all disabled:opacity-50"
            >
              Generate Selective Disclosure Proof
            </button>
          </div>

          {/* Current Proofs */}
          {userProofs && Object.keys(userProofs).length > 0 && (
            <div className="mt-6 glass-card-inner p-5 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Your Active Proofs</h3>
              <div className="space-y-2">
                {Object.entries(userProofs).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-gray-300">{key}</span>
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZKVerificationModal;
