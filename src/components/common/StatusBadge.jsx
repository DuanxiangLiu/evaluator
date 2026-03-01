import React from 'react';
import PropTypes from 'prop-types';
import { Square, Zap, AlertTriangle, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const STATUS_CONFIG = {
  filtered: {
    icon: Square,
    className: 'bg-gray-200 text-gray-500',
    label: '已过滤'
  },
  outlier_opt_high: {
    icon: Zap,
    className: 'bg-purple-100 text-purple-800 border border-purple-300 shadow-sm',
    label: '异常高优化'
  },
  outlier_opt_low: {
    icon: TrendingUp,
    className: 'bg-blue-100 text-blue-800 border border-blue-300 shadow-sm',
    label: '异常低优化'
  },
  outlier_deg_high: {
    icon: TrendingDown,
    className: 'bg-orange-100 text-orange-800 border border-orange-300 shadow-sm',
    label: '异常高退化'
  },
  outlier_deg_low: {
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-800 border border-red-300 shadow-sm',
    label: '异常低退化'
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
    icon: Minus,
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
  type: PropTypes.oneOf([
    'filtered', 
    'outlier_opt_high', 'outlier_opt_low', 
    'outlier_deg_high', 'outlier_deg_low',
    'optimized', 'degraded', 'neutral'
  ]).isRequired,
  className: PropTypes.string
};

export const getStatusType = (isChecked, isNull, outlierType, improvement) => {
  if (!isChecked || isNull) return 'filtered';
  
  if (improvement === 0) return 'neutral';
  
  if (outlierType === 'positive') {
    return improvement > 0 ? 'outlier_opt_high' : 'outlier_deg_high';
  }
  if (outlierType === 'negative') {
    return improvement > 0 ? 'outlier_opt_low' : 'outlier_deg_low';
  }
  
  return improvement > 0 ? 'optimized' : 'degraded';
};

export default StatusBadge;
