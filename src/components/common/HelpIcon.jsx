import React from 'react';
import { HelpCircle } from 'lucide-react';

const HelpIcon = ({ 
  text, 
  content, 
  className = "w-3.5 h-3.5 text-gray-400 hover:text-indigo-500 transition-colors", 
  tooltipWidth = "w-64", 
  position = "bottom-right" 
}) => {
  let posClass = "left-1/2 -translate-x-1/2";
  let arrowClass = "left-1/2 -translate-x-1/2";
  
  if (position === "bottom-right") { 
    posClass = "left-0"; 
    arrowClass = "left-2"; 
  } else if (position === "bottom-left") { 
    posClass = "right-0"; 
    arrowClass = "right-2"; 
  } else if (position === "right-center") { 
    posClass = "left-full top-1/2 -translate-y-1/2 ml-2"; 
    arrowClass = "right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-b-transparent border-t-transparent border-l-transparent"; 
  }
  
  return (
    <div className="group/help relative inline-flex items-center ml-1 cursor-help z-50">
      <HelpCircle className={className} />
      <div className={`absolute ${position === "right-center" ? posClass : 'top-full mt-2'} hidden group-hover/help:block ${tooltipWidth} p-3 bg-gray-900/95 backdrop-blur-sm text-gray-100 text-xs rounded-lg shadow-xl normal-case font-normal text-left pointer-events-none border border-gray-700 ${position !== "right-center" ? posClass : ''}`}>
        {position !== "right-center" && (
          <div className={`absolute bottom-full mb-0 ${arrowClass} border-4 border-transparent border-b-gray-800`}></div>
        )}
        {position === "right-center" && (
          <div className={`absolute ${arrowClass} border-4`}></div>
        )}
        {content || text}
      </div>
    </div>
  );
};

export default HelpIcon;
