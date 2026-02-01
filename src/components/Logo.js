/**
 * MediChain Logo Component
 * SVG-based logo with blockchain + medical theme
 */

import React from 'react';

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const sizes = {
    sm: { icon: 32, text: 'text-lg' },
    md: { icon: 40, text: 'text-xl' },
    lg: { icon: 56, text: 'text-2xl' },
    xl: { icon: 72, text: 'text-3xl' },
  };

  const { icon, text } = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon - Medical Cross + Chain Links */}
      <div className="relative">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Background Circle with Gradient */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="50%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>
            <linearGradient id="chainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Main Circle */}
          <circle cx="32" cy="32" r="30" fill="url(#logoGradient)" />

          {/* Inner glow */}
          <circle cx="32" cy="32" r="26" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="1" />

          {/* Medical Cross */}
          <rect x="28" y="16" width="8" height="32" rx="2" fill="white" />
          <rect x="16" y="28" width="32" height="8" rx="2" fill="white" />

          {/* Chain Links (corners) */}
          <g fill="url(#chainGradient)">
            {/* Top-left chain link */}
            <rect x="8" y="8" width="10" height="6" rx="3" />
            <rect x="8" y="8" width="6" height="10" rx="3" />

            {/* Top-right chain link */}
            <rect x="46" y="8" width="10" height="6" rx="3" />
            <rect x="50" y="8" width="6" height="10" rx="3" />

            {/* Bottom-left chain link */}
            <rect x="8" y="50" width="10" height="6" rx="3" />
            <rect x="8" y="46" width="6" height="10" rx="3" />

            {/* Bottom-right chain link */}
            <rect x="46" y="50" width="10" height="6" rx="3" />
            <rect x="50" y="46" width="6" height="10" rx="3" />
          </g>

          {/* Small dots for blockchain effect */}
          <circle cx="14" cy="32" r="2" fill="white" fillOpacity="0.6" />
          <circle cx="50" cy="32" r="2" fill="white" fillOpacity="0.6" />
          <circle cx="32" cy="14" r="2" fill="white" fillOpacity="0.6" />
          <circle cx="32" cy="50" r="2" fill="white" fillOpacity="0.6" />
        </svg>

        {/* Status indicator */}
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-900 animate-pulse" />
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${text} font-bold text-white tracking-tight`}>
            Medi<span className="text-primary-400">Chain</span>
          </span>
          <span className="text-xs text-gray-400 -mt-1">Secure Health Records</span>
        </div>
      )}
    </div>
  );
};

// Compact version for smaller spaces
export const LogoCompact = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`drop-shadow-lg ${className}`}
  >
    <defs>
      <linearGradient id="logoGradientCompact" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#14b8a6" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#logoGradientCompact)" />
    <rect x="28" y="16" width="8" height="32" rx="2" fill="white" />
    <rect x="16" y="28" width="32" height="8" rx="2" fill="white" />
    <circle cx="14" cy="14" r="4" fill="#6366f1" />
    <circle cx="50" cy="14" r="4" fill="#6366f1" />
    <circle cx="14" cy="50" r="4" fill="#6366f1" />
    <circle cx="50" cy="50" r="4" fill="#6366f1" />
  </svg>
);

export default Logo;
