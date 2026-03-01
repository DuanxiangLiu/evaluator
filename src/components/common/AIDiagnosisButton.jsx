import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FileText, ChevronDown, Download, Loader2, FileJson, FileCode } from 'lucide-react';

const AIDiagnosisButton = ({
  onGenerate,
  onExport,
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
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-0.5">
        <button
          onClick={onGenerate}
          disabled={isAnalyzing || disabled || !hasData}
          className={`px-4 py-1.5 font-bold rounded-l-lg transition-all duration-200 flex items-center gap-1.5 text-sm shadow-lg ${getButtonStyle()} disabled:opacity-50 disabled:cursor-not-allowed`}
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
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-2 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 px-2">导出格式</p>
          </div>
          <div className="p-2 space-y-1">
            <button
              onClick={() => handleExport('pdf')}
              className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-all"
            >
              <div className="p-1.5 rounded-lg bg-red-100">
                <FileCode className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm text-gray-800">PDF 报告</span>
                <p className="text-xs text-gray-400">打印为PDF文档</p>
              </div>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full text-left p-2.5 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-all"
            >
              <div className="p-1.5 rounded-lg bg-amber-100">
                <FileJson className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm text-gray-800">JSON 数据</span>
                <p className="text-xs text-gray-400">结构化数据文件</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

AIDiagnosisButton.propTypes = {
  onGenerate: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
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

export default AIDiagnosisButton;
