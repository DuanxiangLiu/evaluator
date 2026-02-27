import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, ChevronRight, X, Lightbulb, ChevronDown, ChevronUp, BarChart3, Layers, Hash, CheckSquare, AlertOctagon } from 'lucide-react';
import { VALIDATION_SEVERITY } from '../../utils/validationUtils';

const TYPE_CONFIG = {
  error: {
    icon: AlertOctagon,
    bgGradient: 'bg-gradient-to-r from-red-50 to-rose-50',
    borderStyle: 'border-l-4 border-l-red-500 border border-red-100',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    textColor: 'text-red-700',
    titleColor: 'text-red-800',
    shadow: 'shadow-md shadow-red-500/5',
    hoverBg: 'hover:bg-red-100/50'
  },
  warning: {
    icon: AlertTriangle,
    bgGradient: 'bg-gradient-to-r from-amber-50 to-yellow-50',
    borderStyle: 'border-l-4 border-l-amber-500 border border-amber-100',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    textColor: 'text-amber-700',
    titleColor: 'text-amber-800',
    shadow: 'shadow-md shadow-amber-500/5',
    hoverBg: 'hover:bg-amber-100/50'
  },
  info: {
    icon: Info,
    bgGradient: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    borderStyle: 'border-l-4 border-l-blue-500 border border-blue-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-700',
    titleColor: 'text-blue-800',
    shadow: 'shadow-md shadow-blue-500/5',
    hoverBg: 'hover:bg-blue-100/50'
  }
};

const ValidationItem = ({ item, type, onDismiss, index }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => {
      if (onDismiss) onDismiss(item);
    }, 300);
  };

  return (
    <div
      className={`
        ${config.bgGradient} ${config.borderStyle} ${config.shadow}
        rounded-xl p-4 relative group
        transform transition-all duration-300 ease-out
        ${isDismissed ? 'opacity-0 translate-x-4 scale-95 h-0 p-0 overflow-hidden' : 'opacity-100 translate-x-0 scale-100'}
        ${config.hoverBg}
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className={`${config.iconBg} rounded-lg p-2 flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}>
          <Icon className={`w-4 h-4 ${config.iconColor}`} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${config.textColor} font-medium leading-relaxed`}>{item.message}</p>
          {item.row && (
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                <Hash className="w-3 h-3" />
                第 {item.row} 行
              </span>
              {item.column && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                  第 {item.column} 列
                </span>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="关闭"
          >
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
};

const SuggestionItem = ({ suggestion, index }) => (
  <div 
    className="flex items-start gap-3 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 shadow-md shadow-indigo-500/5 group hover:shadow-lg transition-shadow duration-200"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <div className="bg-indigo-100 rounded-lg p-2 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
      <Lightbulb className="w-4 h-4 text-indigo-600" strokeWidth={2} />
    </div>
    <p className="text-sm text-indigo-700 font-medium leading-relaxed">{suggestion}</p>
  </div>
);

const DataStatsCard = ({ stats }) => {
  if (!stats) return null;

  const items = [
    { label: '数据行数', value: stats.totalRows, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: '数据列数', value: stats.totalColumns, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: '指标列数', value: stats.metricColumns, icon: Hash, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: '算法数量', value: stats.algorithms?.length || 0, icon: Layers, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    { label: '有效用例', value: stats.validCases, icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: '缺失值', value: stats.missingValueCount, icon: AlertCircle, color: stats.missingValueCount > 0 ? 'text-amber-600' : 'text-gray-400', bg: stats.missingValueCount > 0 ? 'bg-amber-100' : 'bg-gray-100', highlight: stats.missingValueCount > 0 }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-500/5 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          数据统计
        </h4>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="text-center group">
                <div className={`inline-flex items-center justify-center w-10 h-10 ${item.bg} rounded-xl mb-2 transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <p className={`text-xl font-bold ${item.highlight ? 'text-amber-600' : 'text-gray-800'}`}>
                  {item.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
              </div>
            );
          })}
        </div>
        
        {stats.algorithms && stats.algorithms.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2 font-medium">检测到的算法:</p>
            <div className="flex flex-wrap gap-1.5">
              {stats.algorithms.map((algo, idx) => (
                <span key={idx} className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-medium rounded-full border border-indigo-200/50">
                  {algo}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {stats.metrics && stats.metrics.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2 font-medium">检测到的指标:</p>
            <div className="flex flex-wrap gap-1.5">
              {stats.metrics.slice(0, 6).map((metric, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full border border-gray-200/50">
                  {metric}
                </span>
              ))}
              {stats.metrics.length > 6 && (
                <span className="px-3 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-full border border-gray-200/50">
                  +{stats.metrics.length - 6} 更多
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title, count, color, isExpanded, onToggle }) => (
  <button
    onClick={onToggle}
    className="flex items-center justify-between w-full group"
  >
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded-lg ${color.bg}`}>
        <Icon className={`w-4 h-4 ${color.text}`} strokeWidth={2} />
      </div>
      <h4 className={`text-sm font-bold ${color.title}`}>
        {title}
        {count !== undefined && <span className="ml-1.5 opacity-70">({count})</span>}
      </h4>
    </div>
    <div className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
      {isExpanded ? (
        <ChevronUp className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      )}
    </div>
  </button>
);

const ValidationResultPanel = ({ 
  errors = [], 
  warnings = [], 
  stats = null,
  suggestions = [],
  isValid = true,
  showStats = true,
  onDismissError,
  onDismissWarning,
  className = ''
}) => {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasSuggestions = suggestions.length > 0;
  
  const [errorsExpanded, setErrorsExpanded] = useState(true);
  const [warningsExpanded, setWarningsExpanded] = useState(true);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);

  if (!hasErrors && !hasWarnings && !showStats) {
    return null;
  }

  return (
    <div className={`space-y-5 ${className}`}>
      {isValid && !hasErrors && !hasWarnings && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl shadow-md shadow-emerald-500/5">
          <div className="bg-emerald-100 rounded-lg p-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" strokeWidth={2} />
          </div>
          <p className="text-sm font-semibold text-emerald-700">数据验证通过</p>
        </div>
      )}

      {hasErrors && (
        <div className="space-y-3">
          <SectionHeader
            icon={AlertOctagon}
            title="错误"
            count={errors.length}
            color={{ bg: 'bg-red-100', text: 'text-red-600', title: 'text-red-800' }}
            isExpanded={errorsExpanded}
            onToggle={() => setErrorsExpanded(!errorsExpanded)}
          />
          {errorsExpanded && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {errors.map((error, idx) => (
                <ValidationItem 
                  key={idx} 
                  item={error} 
                  type="error" 
                  onDismiss={onDismissError}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {hasWarnings && (
        <div className="space-y-3">
          <SectionHeader
            icon={AlertTriangle}
            title="警告"
            count={warnings.length}
            color={{ bg: 'bg-amber-100', text: 'text-amber-600', title: 'text-amber-800' }}
            isExpanded={warningsExpanded}
            onToggle={() => setWarningsExpanded(!warningsExpanded)}
          />
          {warningsExpanded && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {warnings.map((warning, idx) => (
                <ValidationItem 
                  key={idx} 
                  item={warning} 
                  type="warning" 
                  onDismiss={onDismissWarning}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {hasSuggestions && (
        <div className="space-y-3">
          <SectionHeader
            icon={Lightbulb}
            title="修复建议"
            color={{ bg: 'bg-indigo-100', text: 'text-indigo-600', title: 'text-indigo-800' }}
            isExpanded={suggestionsExpanded}
            onToggle={() => setSuggestionsExpanded(!suggestionsExpanded)}
          />
          {suggestionsExpanded && (
            <div className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <SuggestionItem key={idx} suggestion={suggestion} index={idx} />
              ))}
            </div>
          )}
        </div>
      )}

      {showStats && stats && (
        <DataStatsCard stats={stats} />
      )}
    </div>
  );
};

export const CompactValidationStatus = ({ errors = [], warnings = [], isValid = true, onClick }) => {
  const errorCount = errors.length;
  const warningCount = warnings.length;

  const getStatusConfig = () => {
    if (!isValid) {
      return {
        bg: 'bg-gradient-to-r from-red-100 to-rose-100',
        border: 'border-red-200',
        text: 'text-red-700',
        hover: 'hover:from-red-200 hover:to-rose-200',
        icon: AlertOctagon,
        label: `${errorCount} 个错误`
      };
    }
    if (warningCount > 0) {
      return {
        bg: 'bg-gradient-to-r from-amber-100 to-yellow-100',
        border: 'border-amber-200',
        text: 'text-amber-700',
        hover: 'hover:from-amber-200 hover:to-yellow-200',
        icon: AlertTriangle,
        label: `${warningCount} 个警告`
      };
    }
    return {
      bg: 'bg-gradient-to-r from-emerald-100 to-green-100',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      hover: 'hover:from-emerald-200 hover:to-green-200',
      icon: CheckCircle,
      label: '验证通过'
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
        ${config.bg} ${config.border} ${config.text} ${config.hover}
        border shadow-sm transition-all duration-200
        hover:shadow-md active:scale-95
      `}
    >
      <Icon className="w-4 h-4" strokeWidth={2} />
      <span>{config.label}</span>
      <ChevronRight className="w-4 h-4 opacity-60" />
    </button>
  );
};

export default ValidationResultPanel;
