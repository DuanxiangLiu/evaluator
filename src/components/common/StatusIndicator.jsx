import React, { useState, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info, ChevronDown, ChevronUp, Database, BarChart3, AlertCircle, FileCheck, X } from 'lucide-react';
import { checkDataQuality, diagnoseDataIssues, generateDataSummary } from '../../services/statisticsService';

const QualityScoreRing = ({ score, size = 80 }) => {
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = (s) => {
    if (s >= 80) return { stroke: '#10b981', text: 'text-emerald-600' };
    if (s >= 60) return { stroke: '#f59e0b', text: 'text-amber-600' };
    return { stroke: '#ef4444', text: 'text-red-600' };
  };
  
  const color = getColor(score);
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth="6" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color.stroke}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-black ${color.text}`}>{Math.round(score)}</span>
      </div>
    </div>
  );
};

QualityScoreRing.propTypes = {
  score: PropTypes.number.isRequired,
  size: PropTypes.number
};

const StatusIndicator = ({ parsedData, availableMetrics, availableAlgos, metaColumns }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef(null);

  const qualityAnalysis = useMemo(() => {
    if (!parsedData || parsedData.length === 0 || !availableMetrics || !availableAlgos) {
      return null;
    }
    
    const quality = checkDataQuality(parsedData, availableAlgos, availableMetrics);
    const diagnosis = diagnoseDataIssues(parsedData, availableAlgos, availableMetrics);
    const summary = generateDataSummary(parsedData, availableAlgos, availableMetrics, metaColumns);
    
    return { quality, diagnosis, summary };
  }, [parsedData, availableMetrics, availableAlgos, metaColumns]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  if (!parsedData || parsedData.length === 0) {
    return (
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 border border-gray-200"
        disabled
      >
        <Database className="w-4 h-4" />
        <span>数据状态</span>
      </button>
    );
  }

  if (!qualityAnalysis) {
    return null;
  }

  const { quality, diagnosis, summary } = qualityAnalysis;
  const errorCount = diagnosis.issues.filter(i => i.type === 'error').length;
  const warningCount = diagnosis.issues.filter(i => i.type === 'warning').length;
  const infoCount = diagnosis.issues.filter(i => i.type === 'info').length;
  const hasIssues = errorCount > 0 || warningCount > 0;

  const getStatusConfig = () => {
    if (errorCount > 0) {
      return {
        bg: 'bg-gradient-to-r from-red-100 to-rose-100',
        border: 'border-red-300',
        text: 'text-red-700',
        hover: 'hover:from-red-200 hover:to-rose-200',
        icon: XCircle,
        label: `${errorCount} 个错误`,
        ringColor: 'ring-red-200'
      };
    }
    if (warningCount > 0) {
      return {
        bg: 'bg-gradient-to-r from-amber-100 to-yellow-100',
        border: 'border-amber-200',
        text: 'text-amber-700',
        hover: 'hover:from-amber-200 hover:to-yellow-200',
        icon: AlertTriangle,
        label: `${warningCount} 个警告`,
        ringColor: 'ring-amber-200'
      };
    }
    return {
      bg: 'bg-gradient-to-r from-emerald-100 to-green-100',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      hover: 'hover:from-emerald-200 hover:to-green-200',
      icon: CheckCircle,
      label: '数据良好',
      ringColor: 'ring-emerald-200'
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold
          ${config.bg} ${config.border} ${config.text} ${config.hover}
          border shadow-sm transition-all duration-200
          hover:shadow-md active:scale-95
          ${isExpanded ? `ring-2 ${config.ringColor}` : ''}
        `}
      >
        <Icon className="w-4 h-4" />
        <span>{config.label}</span>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
      </button>

      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                数据状态
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="p-4 max-h-[400px] overflow-y-auto">
            <div className="flex items-start gap-4 mb-4">
              <QualityScoreRing score={quality.score} size={80} />
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">综合质量评分</div>
                <div className="flex items-center gap-2 mb-2">
                  {errorCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      <XCircle className="w-3 h-3" />
                      {errorCount} 错误
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      {warningCount} 警告
                    </span>
                  )}
                  {infoCount > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      <Info className="w-3 h-3" />
                      {infoCount} 提示
                    </span>
                  )}
                  {!hasIssues && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      无问题
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-gray-800">{summary.overview.totalCases}</div>
                <div className="text-xs text-gray-500">用例</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-gray-800">{summary.overview.algorithmCount}</div>
                <div className="text-xs text-gray-500">算法</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-gray-800">{summary.overview.metricCount}</div>
                <div className="text-xs text-gray-500">指标</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-gray-800">{summary.overview.metaColumnCount}</div>
                <div className="text-xs text-gray-500">属性</div>
              </div>
            </div>

            {quality.factors && quality.factors.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  分维度评估
                </div>
                <div className="space-y-1.5">
                  {quality.factors.slice(0, 3).map((factor, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-16 truncate">{factor.name}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            factor.score >= 80 ? 'bg-emerald-500' :
                            factor.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-8 text-right">{factor.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diagnosis.issues.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  问题诊断
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {diagnosis.issues.slice(0, 4).map((issue, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-xs ${
                        issue.type === 'error' ? 'bg-red-50 border border-red-100' :
                        issue.type === 'warning' ? 'bg-amber-50 border border-amber-100' :
                        'bg-blue-50 border border-blue-100'
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        {issue.type === 'error' ? (
                          <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                        ) : issue.type === 'warning' ? (
                          <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Info className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={`${
                          issue.type === 'error' ? 'text-red-700' :
                          issue.type === 'warning' ? 'text-amber-700' : 'text-blue-700'
                        }`}>{issue.message}</span>
                      </div>
                    </div>
                  ))}
                  {diagnosis.issues.length > 4 && (
                    <div className="text-xs text-gray-400 text-center py-1">
                      还有 {diagnosis.issues.length - 4} 个问题...
                    </div>
                  )}
                </div>
              </div>
            )}

            {diagnosis.suggestions.length > 0 && (
              <div className="mt-4 p-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                <div className="text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                  <FileCheck className="w-3 h-3" />
                  改进建议
                </div>
                <ul className="space-y-0.5">
                  {diagnosis.suggestions.slice(0, 2).map((suggestion, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-indigo-500">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

StatusIndicator.propTypes = {
  parsedData: PropTypes.array.isRequired,
  availableMetrics: PropTypes.array.isRequired,
  availableAlgos: PropTypes.array.isRequired,
  metaColumns: PropTypes.array.isRequired
};

export default StatusIndicator;
