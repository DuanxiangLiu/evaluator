import React from 'react';

const EdaBannerLogo = ({ className = '' }) => {
  return (
    <div className={`relative w-full h-8 overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 800 32"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
            <stop offset="20%" stopColor="#60a5fa" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="1" />
            <stop offset="80%" stopColor="#f472b6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <line x1="0" y1="16" x2="800" y2="16" stroke="url(#lineGrad)" strokeWidth="1.5" />

        <g opacity="0.6">
          <path d="M30 16 L55 16 L60 10 L70 22 L80 10 L90 22 L95 16 L120 16" 
                stroke="url(#chipGrad)" strokeWidth="1" fill="none" filter="url(#glow)" />
          <path d="M680 16 L705 16 L710 10 L720 22 L730 10 L740 22 L745 16 L770 16" 
                stroke="url(#chipGrad)" strokeWidth="1" fill="none" filter="url(#glow)" />
        </g>

        <g transform="translate(388, 4)">
          <rect x="0" y="0" width="24" height="24" rx="2" fill="url(#chipGrad)" filter="url(#glow)" />
          <rect x="2" y="2" width="20" height="20" rx="1" fill="url(#coreGrad)" />
          
          <g stroke="url(#chipGrad)" strokeWidth="1.2" strokeLinecap="round">
            <line x1="5" y1="0" x2="5" y2="-2" />
            <line x1="12" y1="0" x2="12" y2="-2" />
            <line x1="19" y1="0" x2="19" y2="-2" />
            <line x1="5" y1="24" x2="5" y2="26" />
            <line x1="12" y1="24" x2="12" y2="26" />
            <line x1="19" y1="24" x2="19" y2="26" />
            <line x1="0" y1="5" x2="-2" y2="5" />
            <line x1="0" y1="12" x2="-2" y2="12" />
            <line x1="0" y1="19" x2="-2" y2="19" />
            <line x1="24" y1="5" x2="26" y2="5" />
            <line x1="24" y1="12" x2="26" y2="12" />
            <line x1="24" y1="19" x2="26" y2="19" />
          </g>

          <g stroke="#60a5fa" strokeWidth="0.6" opacity="0.8">
            <path d="M6 7 L10 7 L10 11 L14 11" />
            <path d="M14 7 L18 7 L18 13" />
            <path d="M6 13 L9 13 L9 18 L14 18" />
            <circle cx="6" cy="7" r="0.8" fill="#60a5fa" />
            <circle cx="10" cy="11" r="0.8" fill="#60a5fa" />
            <circle cx="14" cy="11" r="0.8" fill="#60a5fa" />
            <circle cx="18" cy="13" r="0.8" fill="#60a5fa" />
            <circle cx="14" cy="18" r="0.8" fill="#60a5fa" />
          </g>
        </g>

        <g opacity="0.5">
          <circle cx="200" cy="16" r="2" fill="#60a5fa">
            <animate attributeName="r" values="1.5;2.5;1.5" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="600" cy="16" r="2" fill="#f472b6">
            <animate attributeName="r" values="1.5;2.5;1.5" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="280" cy="16" r="1.5" fill="#a78bfa">
            <animate attributeName="r" values="1;2;1" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="520" cy="16" r="1.5" fill="#34d399">
            <animate attributeName="r" values="1;2;1" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.2s" repeatCount="indefinite" />
          </circle>
        </g>

        <g opacity="0.3">
          <rect x="160" y="12" width="8" height="8" rx="1" fill="none" stroke="#60a5fa" strokeWidth="0.5" />
          <rect x="632" y="12" width="8" height="8" rx="1" fill="none" stroke="#f472b6" strokeWidth="0.5" />
          <rect x="240" y="13" width="6" height="6" rx="0.5" fill="none" stroke="#a78bfa" strokeWidth="0.5" />
          <rect x="554" y="13" width="6" height="6" rx="0.5" fill="none" stroke="#34d399" strokeWidth="0.5" />
        </g>
      </svg>
    </div>
  );
};

export default EdaBannerLogo;
