import React from 'react';
import PropTypes from 'prop-types';
import HelpIcon from './HelpIcon';

const ChartHeader = ({ 
  title, 
  metric, 
  helpContent, 
  helpPosition = 'right-center',
  helpWidth = 'w-[32rem]',
  children,
  legendItems = []
}) => {
  return (
    <div className="flex justify-between items-center mb-3 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 rounded-lg shadow-md">
      <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
        {title}
        {metric && (
          <span className="text-xs text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded">
            {metric}
          </span>
        )}
        {helpContent && (
          <HelpIcon 
            content={helpContent}
            position={helpPosition}
            tooltipWidth={helpWidth}
            className="w-3.5 h-3.5 text-white/70 hover:text-white"
          />
        )}
      </h3>
      
      <div className="flex items-center gap-3 text-xs">
        {legendItems.map((item, index) => (
          <span key={index} className="flex items-center gap-1 text-white/80">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </span>
        ))}
        {children}
      </div>
    </div>
  );
};

ChartHeader.propTypes = {
  title: PropTypes.string.isRequired,
  metric: PropTypes.string,
  helpContent: PropTypes.node,
  helpPosition: PropTypes.string,
  helpWidth: PropTypes.string,
  children: PropTypes.node,
  legendItems: PropTypes.arrayOf(PropTypes.shape({
    color: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  }))
};

export default ChartHeader;
