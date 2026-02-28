import React from 'react';
import PropTypes from 'prop-types';
import HelpIcon from './HelpIcon';

const VARIANTS = {
  primary: {
    container: 'bg-gradient-to-r from-indigo-600 to-violet-600',
    title: 'text-white',
    metric: 'text-xs text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded',
    helpIcon: 'text-white/70 hover:text-white',
    children: 'text-white/80'
  },
  secondary: {
    container: 'bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg',
    title: 'text-gray-800',
    metric: 'text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded',
    helpIcon: 'text-gray-400 hover:text-indigo-500',
    children: 'text-gray-600'
  },
  ai: {
    container: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    title: 'text-white',
    metric: 'text-xs text-purple-200 bg-purple-500/20 px-2 py-0.5 rounded',
    helpIcon: 'text-white/70 hover:text-white',
    children: 'text-white/80'
  },
  table: {
    container: 'bg-white border-b border-gray-200',
    title: 'text-gray-800',
    metric: 'text-xs text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded shadow-inner',
    helpIcon: 'text-gray-400 hover:text-indigo-500',
    children: 'text-gray-600'
  }
};

const ChartHeader = ({ 
  title, 
  metric, 
  helpContent, 
  helpPosition = 'right-center',
  children,
  leftContent,
  rightContent,
  legendItems = [],
  variant = 'primary',
  className = '',
  icon: Icon
}) => {
  const styles = VARIANTS[variant] || VARIANTS.primary;
  
  const containerClass = variant === 'table' 
    ? `${styles.container} px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0`
    : `flex justify-between items-center ${styles.container} px-3 py-2 rounded-lg shadow-md ${className}`;

  return (
    <div className={containerClass}>
      <div className="flex flex-wrap items-center gap-3">
        {leftContent}
        <h3 className={`font-semibold ${styles.title} text-base flex items-center gap-2`}>
          {Icon && <Icon className="w-5 h-5" />}
          {title}
          {metric && (
            <span className={styles.metric}>
              {metric}
            </span>
          )}
          {helpContent && (
            <HelpIcon 
              content={helpContent}
              position={helpPosition}
              className={`w-4 h-4 ${styles.helpIcon}`}
            />
          )}
        </h3>
      </div>
      
      <div className={`flex items-center gap-3 text-xs ${styles.children}`}>
        {legendItems.map((item, index) => (
          <span key={index} className="flex items-center gap-1">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </span>
        ))}
        {children}
        {rightContent}
      </div>
    </div>
  );
};

ChartHeader.propTypes = {
  title: PropTypes.string.isRequired,
  metric: PropTypes.string,
  helpContent: PropTypes.node,
  helpPosition: PropTypes.string,
  children: PropTypes.node,
  leftContent: PropTypes.node,
  rightContent: PropTypes.node,
  legendItems: PropTypes.arrayOf(PropTypes.shape({
    color: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })),
  variant: PropTypes.oneOf(['primary', 'secondary', 'ai', 'table']),
  className: PropTypes.string,
  icon: PropTypes.elementType
};

export default ChartHeader;
