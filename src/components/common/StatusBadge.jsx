import React from 'react';
import PropTypes from 'prop-types';
import { Square, Zap, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

const STATUS_CONFIG = {
  filtered: {
    icon: Square,
    className: 'bg-gray-200 text-gray-500',
    label: '已过滤'
  },
  significant_opt: {
    icon: Zap,
    className: 'bg-purple-100 text-purple-800 border border-purple-300 shadow-sm',
    label: '显著优化'
  },
  severe_degrade: {
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-800 border border-red-300 shadow-sm',
    label: '严重退化'
  },
  optimized: {
    icon: ArrowUp,
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    label: '优化'
  },
  degraded: {
    icon: ArrowDown,
    className: 'bg-red-50 text-red-700 border border-red-200',
    label: '退化'
  },
  neutral: {
    icon: null,
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
    label: '持平'
  }
};

const StatusBadge = ({ type, className = '' }) => {
  const config = STATUS_CONFIG[type] || STATUS_CONFIG.neutral;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.className} ${className}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
};

StatusBadge.propTypes = {
  type: PropTypes.oneOf(['filtered', 'significant_opt', 'severe_degrade', 'optimized', 'degraded', 'neutral']).isRequired,
  className: PropTypes.string
};

export const getStatusType = (isChecked, isNull, outlierType, improvement) => {
  if (!isChecked || isNull) return 'filtered';
  if (outlierType === 'positive' || outlierType === 'negative') {
    return improvement >= 0 ? 'significant_opt' : 'severe_degrade';
  }
  if (improvement > 0) return 'optimized';
  if (improvement < 0) return 'degraded';
  return 'neutral';
};

export default StatusBadge;
