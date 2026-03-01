import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FileText, ChevronDown, Loader2, Settings } from 'lucide-react';

const REPORT_MODES = {
  quick: {
    id: 'quick',
    name: '快速摘要',
    description: '快速生成核心结论和关键指标',
    color: 'amber',
    sections: ['summary', 'key_metrics', 'recommendation']
  },
  detailed: {
    id: 'detailed',
    name: '详细分析',
    description: '全面的统计分析与案例详情',
    color: 'indigo',
    sections: ['summary', 'statistics', 'metrics', 'cases', 'ai_analysis', 'recommendations']
  },
  executive: {
    id: 'executive',
    name: '执行报告',
    description: '面向管理层的决策支持报告',
    color: 'emerald',
    sections: ['executive_summary', 'business_impact', 'risk_assessment', 'recommendation']
  },
  technical: {
    id: 'technical',
    name: '技术深潜',
    description: '深入的技术分析与统计验证',
    color: 'purple',
    sections: ['methodology', 'statistics', 'significance_tests', 'outlier_analysis', 'detailed_cases']
  }
};

const AIDiagnosisButton = ({
  onGenerate,
  onExport,
  onOpenConfig,
  isAnalyzing,
  hasExistingReport,
  disabled,
  hasData
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = useCallback((format) => {
    setIsOpen(false);
    onExport?.(format);
  }, [onExport]);

  const getButtonStyle = () => {
    if (isAnalyzing) {
      return 'bg-gray-400/50 text-white/70 cursor-not-allowed';
    }
    if (hasExistingReport) {
      return 'bg-amber-400 hover:bg-amber-300 text-amber-900 border border-amber-500';
    }
    return 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-emerald-900 border border-emerald-500';
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onOpenConfig}
        disabled={isAnalyzing || disabled}
        className="px-2 py-1.5 font-bold rounded-l-lg transition-all duration-200 flex items-center gap-1.5 text-sm shadow-lg bg-white border-2 border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        title="配置"
      >
        <Settings className="w-4 h-4" />
      </button>

      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center">
          <button
            onClick={onGenerate}
            disabled={isAnalyzing || disabled || !hasData}
            className={`px-4 py-1.5 font-bold transition-all duration-200 flex items-center gap-1.5 text-sm shadow-lg ${getButtonStyle()} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                {hasExistingReport ? '重新生成' : '生成报告'}
              </>
            )}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isAnalyzing || disabled || !hasData}
            className={`px-2 py-1.5 font-bold rounded-r-lg transition-all duration-200 border-l border-white/20 shadow-lg ${getButtonStyle()} disabled:opacity-50 disabled:cursor-not-allowed`}
            title="导出报告"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-2 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 px-2">导出格式</p>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={() => handleExport('html')}
                className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-all"
              >
                <div className="p-1.5 rounded-lg bg-blue-100">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-sm text-gray-800">HTML 报告</span>
                  <p className="text-xs text-gray-400">网页格式报告</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AIDiagnosisButton.propTypes = {
  onGenerate: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onOpenConfig: PropTypes.func.isRequired,
  isAnalyzing: PropTypes.bool,
  hasExistingReport: PropTypes.bool,
  disabled: PropTypes.bool,
  hasData: PropTypes.bool
};

AIDiagnosisButton.defaultProps = {
  isAnalyzing: false,
  hasExistingReport: false,
  disabled: false,
  hasData: false
};

export { REPORT_MODES };
export default AIDiagnosisButton;
