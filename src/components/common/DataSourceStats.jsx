import React, { useState, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Database,
  BarChart3,
  Layers,
  Hash,
  CheckSquare,
  X,
  Cpu,
  Activity
} from 'lucide-react';
import { diagnoseDataIssues, generateDataSummary } from '../../services/statisticsService';

const StatItem = ({ icon: Icon, label, value, color, bg, highlight }) => (
  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
    <div className={`flex items-center justify-center w-7 h-7 ${bg} rounded-md flex-shrink-0`}>
      <Icon className={`w-3.5 h-3.5 ${color}`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-amber-600' : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  </div>
);

StatItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
  bg: PropTypes.string.isRequired,
  highlight: PropTypes.bool
};

const DataSourceStats = ({ parsedData, availableMetrics, availableAlgos, metaColumns }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const analysis = useMemo(() => {
    if (!parsedData || parsedData.length === 0 || !availableMetrics || !availableAlgos) {
      return null;
    }

    const diagnosis = diagnoseDataIssues(parsedData, availableAlgos, availableMetrics);
    const summary = generateDataSummary(parsedData, availableAlgos, availableMetrics, metaColumns);

    return { diagnosis, summary };
  }, [parsedData, availableMetrics, availableAlgos, metaColumns]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        panelRef.current &&
        !panelRef.current.contains(e.target)
      ) {
        setIsExpanded(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (isExpanded && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const panelWidth = 340;

      let left = rect.left;
      if (left + panelWidth > viewportWidth - 16) {
        left = viewportWidth - panelWidth - 16;
      }
      left = Math.max(16, left);

      setPosition({
        top: rect.bottom + 8,
        left
      });
    }
  }, [isExpanded]);

  if (!parsedData || parsedData.length === 0) {
    return (
      <button
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/20 text-white/80 border border-white/20 cursor-not-allowed"
        disabled
      >
        <Database className="w-3.5 h-3.5" />
        <span>无数据</span>
      </button>
    );
  }

  if (!analysis) {
    return null;
  }

  const { diagnosis, summary } = analysis;
  const errorCount = diagnosis.issues.filter(i => i.type === 'error').length;
  const warningCount = diagnosis.issues.filter(i => i.type === 'warning').length;
  const infoCount = diagnosis.issues.filter(i => i.type === 'info').length;
  const totalMissing = diagnosis.stats.missingData 
    ? Object.values(diagnosis.stats.missingData).reduce((acc, d) => acc + d.missing, 0) 
    : 0;

  const getStatusConfig = () => {
    if (errorCount > 0) {
      return {
        bg: 'bg-white/25',
        border: 'border-white/30',
        text: 'text-white',
        hover: 'hover:bg-white/35',
        icon: XCircle,
        label: `${errorCount} 个错误`
      };
    }
    if (warningCount > 0) {
      return {
        bg: 'bg-white/25',
        border: 'border-white/30',
        text: 'text-white',
        hover: 'hover:bg-white/35',
        icon: AlertTriangle,
        label: `${warningCount} 个警告`
      };
    }
    return {
      bg: 'bg-white/25',
      border: 'border-white/30',
      text: 'text-white',
      hover: 'hover:bg-white/35',
      icon: CheckCircle,
      label: '数据良好'
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const statItems = [
    { label: '用例数', value: summary.overview.totalCases, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: '算法数', value: summary.overview.algorithmCount, icon: Cpu, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: '指标数', value: summary.overview.metricCount, icon: Hash, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: '属性列', value: summary.overview.metaColumnCount, icon: BarChart3, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    { label: '有效样本', value: summary.overview.totalCases, icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    {
      label: '缺失值',
      value: totalMissing,
      icon: AlertTriangle,
      color: totalMissing > 0 ? 'text-amber-600' : 'text-gray-400',
      bg: totalMissing > 0 ? 'bg-amber-100' : 'bg-gray-100',
      highlight: totalMissing > 0
    }
  ];

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        title="查看数据统计分析：用例数、算法数、指标数、缺失值等"
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
          ${config.bg} ${config.border} ${config.text} ${config.hover}
          border transition-all duration-200
          active:scale-95
        `}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
        {isExpanded ? <ChevronUp className="w-3 h-3 opacity-70" /> : <ChevronDown className="w-3 h-3 opacity-70" />}
      </button>

      {isExpanded && createPortal(
        <div
          ref={panelRef}
          className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 z-[9999] overflow-hidden"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: '340px',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-indigo-500" />
                数据统计分析
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="p-3 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {statItems.map((item, idx) => (
                <StatItem key={idx} {...item} />
              ))}
            </div>

            {availableAlgos && availableAlgos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1.5 font-medium flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  检测到的算法
                </p>
                <div className="flex flex-wrap gap-1">
                  {availableAlgos.map((algo, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-xs font-medium rounded border border-indigo-100">
                      {algo}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {availableMetrics && availableMetrics.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1.5 font-medium flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  检测到的指标
                </p>
                <div className="flex flex-wrap gap-1">
                  {availableMetrics.slice(0, 5).map((metric, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs font-medium rounded border border-gray-100">
                      {metric}
                    </span>
                  ))}
                  {availableMetrics.length > 5 && (
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-xs font-medium rounded border border-gray-100">
                      +{availableMetrics.length - 5}
                    </span>
                  )}
                </div>
              </div>
            )}

            {diagnosis.issues.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  问题诊断
                </p>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {diagnosis.issues.slice(0, 3).map((issue, i) => (
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
                  {diagnosis.issues.length > 3 && (
                    <p className="text-xs text-gray-400 text-center py-1">
                      还有 {diagnosis.issues.length - 3} 个问题...
                    </p>
                  )}
                </div>
              </div>
            )}

            {diagnosis.issues.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-emerald-700 font-medium">数据验证通过，无异常问题</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

DataSourceStats.propTypes = {
  parsedData: PropTypes.array.isRequired,
  availableMetrics: PropTypes.array.isRequired,
  availableAlgos: PropTypes.array.isRequired,
  metaColumns: PropTypes.array.isRequired
};

export default DataSourceStats;
