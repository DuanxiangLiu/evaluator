import React from 'react';
import PropTypes from 'prop-types';

const ChartContainer = ({ 
  children, 
  onMouseMove,
  className = ''
}) => {
  return (
    <div 
      className={`p-2 h-full flex flex-col min-h-0 ${className}`}
      onMouseMove={onMouseMove}
    >
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden w-full min-h-0">
        {children}
      </div>
    </div>
  );
};

ChartContainer.propTypes = {
  children: PropTypes.node.isRequired,
  onMouseMove: PropTypes.func,
  className: PropTypes.string
};

export const ChartBody = ({ children, className = '' }) => (
  <div className={`flex-1 flex min-h-0 pt-3 ${className}`}>
    {children}
  </div>
);

ChartBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export const ChartArea = ({ children, className = '' }) => (
  <div className={`flex-1 relative chart-area ${className}`}>
    {children}
  </div>
);

ChartArea.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export const YAxisLabels = ({ ticks, formatTick = (v) => v }) => (
  <div className="flex flex-col justify-between text-right pr-2 py-2 text-[10px] font-semibold text-gray-500 w-12 flex-shrink-0">
    {ticks.map((tick, i) => (
      <span 
        key={i} 
        className={`
          ${tick.val > 0 ? 'text-green-600' : ''} 
          ${tick.val < 0 ? 'text-red-500' : ''}
        `}
      >
        {formatTick(tick.val)}
      </span>
    ))}
  </div>
);

YAxisLabels.propTypes = {
  ticks: PropTypes.arrayOf(PropTypes.shape({
    val: PropTypes.number.isRequired
  })).isRequired,
  formatTick: PropTypes.func
};

export const ChartLegend = ({ items }) => (
  <div className="flex justify-center gap-4 py-1 border-t border-gray-100 text-[10px] text-gray-500 flex-shrink-0">
    {items.map((item, i) => (
      <span key={i} className="flex items-center gap-1">
        {item.color && (
          item.shape === 'circle' ? (
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          ) : item.shape === 'dashed-line' ? (
            <span className="w-4 border-t-2 border-dashed" style={{ borderColor: item.color }} />
          ) : (
            <span className="w-3 h-0.5 rounded" style={{ backgroundColor: item.color }} />
          )
        )}
        {item.label}
      </span>
    ))}
  </div>
);

ChartLegend.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    color: PropTypes.string,
    label: PropTypes.string.isRequired,
    shape: PropTypes.string
  })).isRequired
};

export const AreaLabel = ({ children, position = 'top-left', variant = 'default' }) => {
  const positionClasses = {
    'top-left': 'top-1 left-2',
    'top-right': 'top-1 right-2',
    'bottom-left': 'bottom-1 left-2',
    'bottom-right': 'bottom-1 right-2'
  };
  
  const variantClasses = {
    'default': 'bg-white/90 border border-gray-200/50',
    'success': 'bg-green-50/90 text-green-700',
    'danger': 'bg-red-50/90 text-red-600',
    'info': 'bg-indigo-50/90 text-indigo-700'
  };
  
  return (
    <div className={`absolute ${positionClasses[position]} text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm ${variantClasses[variant]}`}>
      {children}
    </div>
  );
};

AreaLabel.propTypes = {
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  variant: PropTypes.oneOf(['default', 'success', 'danger', 'info'])
};

export const EmptyState = ({ message }) => (
  <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-sm">
    {message}
  </div>
);

EmptyState.propTypes = {
  message: PropTypes.string.isRequired
};

export default ChartContainer;
