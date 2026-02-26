import React, { useRef, useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

const HelpIcon = ({ 
  text, 
  content, 
  className = "w-3.5 h-3.5 text-gray-400 hover:text-indigo-500 transition-colors", 
  tooltipWidth = "w-80", 
  position = "bottom-right" 
}) => {
  const iconRef = useRef(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered && iconRef.current) {
      const iconRect = iconRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const tooltipWidthEstimate = tooltipWidth === "w-64" ? 256 : 
                                  tooltipWidth === "w-72" ? 288 : 
                                  tooltipWidth === "w-80" ? 320 : 
                                  tooltipWidth === "w-96" ? 384 : 320;
      const tooltipHeightEstimate = 250;

      let newPosition = position;

      if (position === "right-center") {
        if (iconRect.right + tooltipWidthEstimate > viewportWidth - 20) {
          newPosition = "left-center";
        }
      }

      if (position === "bottom-right" || position === "bottom-center" || position === "bottom-left") {
        if (iconRect.bottom + tooltipHeightEstimate > viewportHeight - 20) {
          newPosition = position.replace("bottom", "top");
        }
      }

      if (position === "left-center") {
        if (iconRect.left - tooltipWidthEstimate < 20) {
          newPosition = "right-center";
        }
      }

      if (position === "top-right" || position === "top-center" || position === "top-left") {
        if (iconRect.top - tooltipHeightEstimate < 20) {
          newPosition = position.replace("top", "bottom");
        }
      }

      setAdjustedPosition(newPosition);
    }
  }, [isHovered, position, tooltipWidth]);

  let posClass = "left-1/2 -translate-x-1/2";
  let arrowClass = "left-1/2 -translate-x-1/2";
  
  if (adjustedPosition === "bottom-right") { 
    posClass = "left-0"; 
    arrowClass = "left-2"; 
  } else if (adjustedPosition === "bottom-left") { 
    posClass = "right-0"; 
    arrowClass = "right-2"; 
  } else if (adjustedPosition === "bottom-center") {
    posClass = "left-1/2 -translate-x-1/2";
    arrowClass = "left-1/2 -translate-x-1/2";
  } else if (adjustedPosition === "top-right") {
    posClass = "left-0";
    arrowClass = "left-2";
  } else if (adjustedPosition === "top-left") {
    posClass = "right-0";
    arrowClass = "right-2";
  } else if (adjustedPosition === "top-center") {
    posClass = "left-1/2 -translate-x-1/2";
    arrowClass = "left-1/2 -translate-x-1/2";
  } else if (adjustedPosition === "right-center") { 
    posClass = "left-full top-1/2 -translate-y-1/2 ml-2"; 
    arrowClass = "right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-b-transparent border-t-transparent border-l-transparent"; 
  } else if (adjustedPosition === "left-center") {
    posClass = "right-full top-1/2 -translate-y-1/2 mr-2";
    arrowClass = "left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-b-transparent border-t-transparent border-r-transparent";
  }

  const isTopPosition = adjustedPosition.startsWith("top");
  const isLeftPosition = adjustedPosition === "left-center";
  const isRightPosition = adjustedPosition === "right-center";

  return (
    <div 
      className="group/help relative inline-flex items-center ml-1 cursor-help z-[100]"
      ref={iconRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <HelpCircle className={className} />
      <div 
        className={`absolute ${isRightPosition ? posClass : (isLeftPosition ? posClass : (isTopPosition ? 'bottom-full mb-2' : 'top-full mt-2'))} hidden group-hover/help:block ${tooltipWidth} p-4 bg-gray-900/98 backdrop-blur-md text-gray-100 text-sm rounded-xl shadow-2xl normal-case font-normal text-left pointer-events-none border border-gray-600 ${!isRightPosition && !isLeftPosition ? posClass : ''} max-w-[85vw] max-h-[75vh] overflow-y-auto custom-scrollbar leading-relaxed`}
      >
        {!isRightPosition && !isLeftPosition && (
          <div 
            className={`absolute ${isTopPosition ? 'top-full mt-0' : 'bottom-full mb-0'} ${arrowClass} border-4 border-transparent ${isTopPosition ? 'border-t-gray-700' : 'border-b-gray-700'}`}
          ></div>
        )}
        {isRightPosition && (
          <div className={`absolute ${arrowClass} border-4`}></div>
        )}
        {isLeftPosition && (
          <div className={`absolute ${arrowClass} border-4`}></div>
        )}
        <div className="space-y-2">
          {content || text}
        </div>
      </div>
    </div>
  );
};

export default HelpIcon;
