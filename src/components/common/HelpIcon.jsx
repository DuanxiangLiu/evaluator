import React, { useRef, useState, useEffect } from 'react';
import { HelpCircle, X, BookOpen } from 'lucide-react';

const HelpIcon = ({ 
  text, 
  content, 
  className = "w-3.5 h-3.5 text-gray-400 hover:text-indigo-500 transition-colors", 
  tooltipWidth = "w-80", 
  position = "bottom-right" 
}) => {
  const iconRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsAnimating(true);
    setShowModal(true);
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowModal(false);
    }, 200);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [showModal]);

  return (
    <>
      <div 
        className="relative inline-flex items-center ml-1 cursor-help group"
        ref={iconRef}
        onClick={handleClick}
      >
        <HelpCircle 
          className={`${className} transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12`} 
          strokeWidth={2}
        />
        <span className="absolute inset-0 rounded-full bg-indigo-400/20 scale-0 group-hover:scale-150 transition-transform duration-300" />
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div 
            className={`
              absolute inset-0 bg-black/40 backdrop-blur-sm
              transition-opacity duration-200
              ${isAnimating ? 'opacity-100' : 'opacity-0'}
            `}
          />
          <div 
            className={`
              relative ${tooltipWidth} max-w-[95vw] max-h-[90vh]
              bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
              text-gray-100 rounded-2xl shadow-2xl
              border border-gray-700/50
              overflow-hidden
              transition-all duration-300 ease-out
              ${isAnimating 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 translate-y-4'
              }
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            
            <div className="relative flex items-center justify-between px-6 py-4 border-b border-gray-700/50 bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <BookOpen className="w-5 h-5 text-indigo-400" strokeWidth={2} />
                </div>
                <span className="text-lg font-bold text-white">说明</span>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 rounded-xl bg-gray-700/50 hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 group"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" strokeWidth={2} />
              </button>
            </div>
            
            <div className="relative p-6 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
              <div className="text-base leading-relaxed text-gray-200">
                {content || text}
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
          </div>
        </div>
      )}
    </>
  );
};

export default HelpIcon;
