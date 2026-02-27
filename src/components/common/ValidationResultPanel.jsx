import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, ChevronRight, X, Lightbulb } from 'lucide-react';
import { VALIDATION_SEVERITY } from '../../utils/validationUtils';

const ValidationItem = ({ item, type, onDismiss }) => {
  const isError = type === 'error';
  const isWarning = type === 'warning';
  const isInfo = type === 'info';

  const bgColor = isError ? 'bg-red-50' : isWarning ? 'bg-yellow-50' : 'bg-blue-50';
  const borderColor = isError ? 'border-red-200' : isWarning ? 'border-yellow-200' : 'border-blue-200';
  const iconColor = isError ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-blue-500';
  const textColor = isError ? 'text-red-700' : isWarning ? 'text-yellow-700' : 'text-blue-700';

  const Icon = isError ? AlertCircle : isWarning ? AlertTriangle : Info;

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-3 relative group`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${textColor}`}>{item.message}</p>
          {item.row && (
            <p className="text-xs text-gray-500 mt-1">
              位置: 第 {item.row} 行
              {item.column && `, 第 ${item.column} 列`}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={() => onDismiss(item)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
};

const SuggestionItem = ({ suggestion }) => (
  <div className="flex items-start gap-2 p-2 bg-indigo-50 rounded-lg">
    <Lightbulb className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
    <p className="text-sm text-indigo-700">{suggestion}</p>
  </div>
);

const DataStatsCard = ({ stats }) => {
  if (!stats) return null;

  const items = [
    { label: '数据行数', value: stats.totalRows },
    { label: '数据列数', value: stats.totalColumns },
    { label: '指标列数', value: stats.metricColumns },
    { label: '算法数量', value: stats.algorithms?.length || 0 },
    { label: '有效用例', value: stats.validCases },
    { label: '缺失值', value: stats.missingValueCount, highlight: stats.missingValueCount > 0 }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-sm font-bold text-gray-700 mb-3">数据统计</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="text-center">
            <p className={`text-lg font-bold ${item.highlight ? 'text-yellow-600' : 'text-indigo-600'}`}>
              {item.value}
            </p>
            <p className="text-xs text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>
      {stats.algorithms && stats.algorithms.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-1">检测到的算法:</p>
          <div className="flex flex-wrap gap-1">
            {stats.algorithms.map((algo, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                {algo}
              </span>
            ))}
          </div>
        </div>
      )}
      {stats.metrics && stats.metrics.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1">检测到的指标:</p>
          <div className="flex flex-wrap gap-1">
            {stats.metrics.slice(0, 6).map((metric, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {metric}
              </span>
            ))}
            {stats.metrics.length > 6 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{stats.metrics.length - 6} 更多
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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

  if (!hasErrors && !hasWarnings && !showStats) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {isValid && !hasErrors && !hasWarnings && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-sm font-medium text-green-700">数据验证通过</p>
        </div>
      )}

      {hasErrors && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h4 className="text-sm font-bold text-red-700">
              错误 ({errors.length})
            </h4>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {errors.map((error, idx) => (
              <ValidationItem 
                key={idx} 
                item={error} 
                type="error" 
                onDismiss={onDismissError}
              />
            ))}
          </div>
        </div>
      )}

      {hasWarnings && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <h4 className="text-sm font-bold text-yellow-700">
              警告 ({warnings.length})
            </h4>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {warnings.map((warning, idx) => (
              <ValidationItem 
                key={idx} 
                item={warning} 
                type="warning" 
                onDismiss={onDismissWarning}
              />
            ))}
          </div>
        </div>
      )}

      {hasSuggestions && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-indigo-500" />
            <h4 className="text-sm font-bold text-indigo-700">修复建议</h4>
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <SuggestionItem key={idx} suggestion={suggestion} />
            ))}
          </div>
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

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
        ${!isValid 
          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
          : warningCount > 0 
            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        }
      `}
    >
      {!isValid ? (
        <>
          <AlertCircle className="w-4 h-4" />
          <span>{errorCount} 个错误</span>
        </>
      ) : warningCount > 0 ? (
        <>
          <AlertTriangle className="w-4 h-4" />
          <span>{warningCount} 个警告</span>
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>验证通过</span>
        </>
      )}
      <ChevronRight className="w-4 h-4" />
    </button>
  );
};

export default ValidationResultPanel;
