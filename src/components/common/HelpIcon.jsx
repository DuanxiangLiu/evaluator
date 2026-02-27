import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';

const HelpIcon = ({ 
  text, 
  content, 
  className = "w-3.5 h-3.5 text-gray-400 hover:text-indigo-500 transition-colors", 
  tooltipWidth = "w-80", 
  position = "bottom-right"
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const iconRef = useRef(null);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowTooltip(!showTooltip);
  };

  const calculatePosition = useCallback(() => {
    if (!iconRef.current) return;

    const iconRect = iconRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const widthMap = {
      'w-80': 320,
      'w-72': 288,
      'w-96': 384,
      'w-[32rem]': 512,
      'w-[36rem]': 576,
      'w-[40rem]': 640,
    };
    const tooltipWidthPx = widthMap[tooltipWidth] || 320;
    const tooltipHeight = 200;

    let left, top;
    let actualPosition = position;

    if (iconRect.left + tooltipWidthPx > viewportWidth - 20) {
      left = iconRect.right - tooltipWidthPx;
      actualPosition = actualPosition.replace('right', 'left');
    } else {
      left = iconRect.left;
    }

    if (iconRect.bottom + tooltipHeight + 10 > viewportHeight) {
      top = iconRect.top - tooltipHeight - 8;
      actualPosition = actualPosition.replace('bottom', 'top');
    } else {
      top = iconRect.bottom + 8;
    }

    left = Math.max(10, Math.min(left, viewportWidth - tooltipWidthPx - 10));
    top = Math.max(10, Math.min(top, viewportHeight - tooltipHeight - 10));

    setTooltipStyle({
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 9999,
    });
  }, [tooltipWidth, position]);

  useEffect(() => {
    if (showTooltip) {
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
    }

    return () => {
      window.removeEventListener('resize', calculatePosition);
    };
  }, [showTooltip, calculatePosition]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (iconRef.current && !iconRef.current.contains(e.target)) {
        setShowTooltip(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowTooltip(false);
      }
    };

    const handleScroll = () => {
      if (showTooltip) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showTooltip]);

  return (
    <>
      <div 
        ref={iconRef}
        className="ml-1 cursor-help group inline-flex"
        onClick={handleClick}
      >
        <HelpCircle 
          className={`${className} transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12`} 
          strokeWidth={2}
        />
      </div>

      {showTooltip && createPortal(
        <div 
          className={`${tooltipWidth} max-w-[90vw]`}
          style={tooltipStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            
            <div className="relative flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-800/50">
              <span className="text-sm font-bold text-white">说明</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
                className="p-1 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-white" strokeWidth={2} />
              </button>
            </div>
            
            <div className="relative p-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="text-sm leading-relaxed text-gray-200">
                {content || text}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default HelpIcon;
