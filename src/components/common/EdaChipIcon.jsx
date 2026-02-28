import React from 'react';

const EdaChipIcon = ({ className = 'w-4 h-4' }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="chipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
        <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect
        x="6"
        y="6"
        width="20"
        height="20"
        rx="2"
        fill="url(#chipGradient)"
        filter="url(#glow)"
      />

      <rect
        x="8"
        y="8"
        width="16"
        height="16"
        rx="1"
        fill="url(#coreGradient)"
      />

      <g stroke="url(#chipGradient)" strokeWidth="1.2" strokeLinecap="round">
        <line x1="10" y1="4" x2="10" y2="6" />
        <line x1="14" y1="4" x2="14" y2="6" />
        <line x1="18" y1="4" x2="18" y2="6" />
        <line x1="22" y1="4" x2="22" y2="6" />

        <line x1="10" y1="26" x2="10" y2="28" />
        <line x1="14" y1="26" x2="14" y2="28" />
        <line x1="18" y1="26" x2="18" y2="28" />
        <line x1="22" y1="26" x2="22" y2="28" />

        <line x1="4" y1="10" x2="6" y2="10" />
        <line x1="4" y1="14" x2="6" y2="14" />
        <line x1="4" y1="18" x2="6" y2="18" />
        <line x1="4" y1="22" x2="6" y2="22" />

        <line x1="26" y1="10" x2="28" y2="10" />
        <line x1="26" y1="14" x2="28" y2="14" />
        <line x1="26" y1="18" x2="28" y2="18" />
        <line x1="26" y1="22" x2="28" y2="22" />
      </g>

      <g stroke="#60a5fa" strokeWidth="0.8" opacity="0.8">
        <path d="M11 12 L14 12 L14 15 L17 15" />
        <path d="M17 12 L20 12 L20 16" />
        <path d="M11 17 L13 17 L13 20 L16 20" />
        <path d="M18 18 L21 18 L21 20" />
        <circle cx="11" cy="12" r="0.8" fill="#60a5fa" />
        <circle cx="14" cy="15" r="0.8" fill="#60a5fa" />
        <circle cx="17" cy="15" r="0.8" fill="#60a5fa" />
        <circle cx="20" cy="16" r="0.8" fill="#60a5fa" />
        <circle cx="16" cy="20" r="0.8" fill="#60a5fa" />
        <circle cx="21" cy="20" r="0.8" fill="#60a5fa" />
      </g>

      <g opacity="0.6">
        <rect x="11" y="22" width="2" height="1" fill="#34d399" rx="0.2" />
        <rect x="14" y="22" width="3" height="1" fill="#fbbf24" rx="0.2" />
        <rect x="18" y="22" width="2" height="1" fill="#f87171" rx="0.2" />
      </g>
    </svg>
  );
};

export default EdaChipIcon;
