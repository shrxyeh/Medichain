/**
 * AccessControlPanel Component
 * Displays ABAC policies and access management UI
 */

import React, { useState, useEffect } from 'react';
import { useSecurityContext } from '../context/SecurityContext';

const AccessControlPanel = ({ onClose }) => {
  const {
    currentUser,
    accessLog,
    getAccessLog,
    ROLES,
    RESOURCES,
    ACTIONS,
  } = useSecurityContext();

  const [activeTab, setActiveTab] = useState('overview');
  const [filteredLog, setFilteredLog] = useState([]);

  useEffect(() => {
    setFilteredLog(getAccessLog().slice(-20).reverse());
  }, [accessLog, getAccessLog]);

  const getRoleBadgeColor = (role) => {
    const colors = {
      [ROLES.PATIENT]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      [ROLES.DOCTOR]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      [ROLES.DIAGNOSTIC]: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      [ROLES.ADMIN]: 'bg-red-500/20 text-red-400 border-red-500/30',
      [ROLES.EMERGENCY]: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return colors[role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getDecisionColor = (allowed) => {
    return allowed
      ? 'text-green-400 bg-green-500/10'
      : 'text-red-400 bg-red-500/10';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Access Control Center</h2>
              <p className="text-sm text-gray-400">ABAC Policy Management & Audit</p>
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

        {/* Tabs */}
        <div className="flex gap-1 p-2 mx-4 mt-4 bg-white/5 rounded-xl">
          {['overview', 'policies', 'audit'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Current User Card */}
              <div className="glass-card-inner p-5 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Current Session</h3>
                {currentUser ? (
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                      {currentUser.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{currentUser.name}</p>
                      <p className="text-gray-400 text-sm">ID: {currentUser.hhNumber}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getRoleBadgeColor(currentUser.role)}`}>
                      {currentUser.role?.toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-500">No active session</p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card-inner p-4 rounded-xl text-center">
                  <p className="text-3xl font-bold text-teal-400">{accessLog.filter(l => l.decision).length}</p>
                  <p className="text-xs text-gray-400 mt-1">Allowed Access</p>
                </div>
                <div className="glass-card-inner p-4 rounded-xl text-center">
                  <p className="text-3xl font-bold text-red-400">{accessLog.filter(l => !l.decision).length}</p>
                  <p className="text-xs text-gray-400 mt-1">Denied Access</p>
                </div>
                <div className="glass-card-inner p-4 rounded-xl text-center">
                  <p className="text-3xl font-bold text-purple-400">{accessLog.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Total Requests</p>
                </div>
              </div>

              {/* Security Features */}
              <div className="glass-card-inner p-5 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Active Security Features</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Zero Knowledge Proofs', status: 'Active', icon: '🔐' },
                    { name: 'ABAC Policy Engine', status: 'Active', icon: '🛡️' },
                    { name: 'Attribute Commitments', status: 'Active', icon: '✓' },
                    { name: 'Audit Logging', status: 'Active', icon: '📋' },
                  ].map((feature) => (
                    <div key={feature.name} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <span className="text-xl">{feature.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm text-white">{feature.name}</p>
                        <p className="text-xs text-green-400">{feature.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-4">
              <div className="glass-card-inner p-5 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Active ABAC Policies</h3>
                <div className="space-y-3">
                  {[
                    {
                      id: 'patient-own-records',
                      name: 'Patient Self-Access',
                      description: 'Patients can read and download their own medical records',
                      roles: ['PATIENT'],
                      effect: 'ALLOW',
                    },
                    {
                      id: 'doctor-with-permission',
                      name: 'Doctor Authorized Access',
                      description: 'Doctors can access patient records with explicit permission',
                      roles: ['DOCTOR'],
                      effect: 'ALLOW',
                    },
                    {
                      id: 'diagnostic-upload',
                      name: 'Diagnostic Report Upload',
                      description: 'Diagnostic centers can upload reports for authorized patients',
                      roles: ['DIAGNOSTIC'],
                      effect: 'ALLOW',
                    },
                    {
                      id: 'emergency-override',
                      name: 'Emergency Access',
                      description: 'Emergency personnel can access critical records in emergencies',
                      roles: ['EMERGENCY'],
                      effect: 'ALLOW',
                    },
                    {
                      id: 'restricted-deny',
                      name: 'Restricted Data Protection',
                      description: 'Highly sensitive data requires admin privileges',
                      roles: ['ALL'],
                      effect: 'DENY',
                    },
                  ].map((policy) => (
                    <div key={policy.id} className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{policy.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          policy.effect === 'ALLOW'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {policy.effect}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{policy.description}</p>
                      <div className="flex gap-2">
                        {policy.roles.map((role) => (
                          <span key={role} className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-300">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="glass-card-inner p-5 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">Recent Access Log</h3>
                {filteredLog.length > 0 ? (
                  <div className="space-y-2">
                    {filteredLog.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          entry.decision
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-red-500/5 border-red-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${
                              entry.decision ? 'bg-green-400' : 'bg-red-400'
                            }`} />
                            <span className="text-white text-sm">{entry.user}</span>
                            <span className="text-gray-500 text-xs">→</span>
                            <span className="text-gray-300 text-sm">{entry.resource}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${getDecisionColor(entry.decision)}`}>
                            {entry.decision ? 'ALLOWED' : 'DENIED'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-5">
                          {entry.action} • {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No access attempts logged yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessControlPanel;
