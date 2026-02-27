import React, { useRef, useState, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

const HelpIcon = ({ 
  text, 
  content, 
  className = "w-3.5 h-3.5 text-gray-400 hover:text-indigo-500 transition-colors", 
  tooltipWidth = "w-80", 
  position = "bottom-right" 
}) => {
  const iconRef = useRef(null);
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showModal]);

  return (
    <>
      <div 
        className="relative inline-flex items-center ml-1 cursor-help"
        ref={iconRef}
        onClick={handleClick}
      >
        <HelpCircle className={className} />
      </div>

      {showModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/30"></div>
          <div 
            className={`relative ${tooltipWidth} max-w-[90vw] max-h-[85vh] bg-gray-900 text-gray-100 rounded-2xl shadow-2xl border border-gray-600 overflow-hidden animate-in fade-in zoom-in duration-200`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <span className="text-lg font-bold text-white">说明</span>
              </div>
              <button 
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-70px)] custom-scrollbar text-base leading-relaxed">
              {content || text}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpIcon;
