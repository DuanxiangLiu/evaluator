import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, FileText, Download, Loader2, CheckCircle, AlertCircle, FileJson, FileCode, Database } from 'lucide-react';
import { generateAIReport, downloadReport } from '../../services/reportExport.js';
import { useToast } from '../common/Toast';

const ReportExportModal = ({
  isOpen,
  onClose,
  stats,
  allMetricsStats,
  baseAlgo,
  compareAlgo,
  activeMetric,
  parsedData,
  selectedCases,
  metaColumns,
  llmConfig,
  aiInsights
}) => {
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [includeData, setIncludeData] = useState(true);
  
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setReportData(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (aiInsights && isOpen && !reportData) {
      setReportData({
        metadata: {
          title: `EDA算法评估报告 - ${baseAlgo} vs ${compareAlgo}`,
          generatedAt: new Date().toISOString(),
          baseAlgo,
          compareAlgo,
          activeMetric
        },
        aiAnalysis: aiInsights,
        aiAvailable: true
      });
    }
  }, [aiInsights, isOpen, baseAlgo, compareAlgo, activeMetric, reportData]);

  const handleGenerateReport = useCallback(async () => {
    if (!stats) {
      toast.error('请先加载数据');
      return;
    }
    
    setIsGenerating(true);
    setReportData(null);
    
    try {
      const data = await generateAIReport(llmConfig, {
        stats,
        allMetricsStats,
        baseAlgo,
        compareAlgo,
        activeMetric,
        parsedData: includeData ? parsedData : null,
        selectedCases,
        metaColumns
      });
      
      setReportData(data);
      toast.success('报告生成成功');
    } catch (error) {
      toast.error('报告生成失败', error.message);
    } finally {
      setIsGenerating(false);
    }
  }, [llmConfig, stats, allMetricsStats, baseAlgo, compareAlgo, activeMetric, parsedData, selectedCases, metaColumns, includeData, toast]);

  const handleExport = useCallback(() => {
    if (!reportData) return;
    
    try {
      downloadReport(reportData, exportFormat === 'pdf' ? 'html' : exportFormat);
      toast.success(`报告已导出为 ${exportFormat.toUpperCase()} 格式`);
      onClose();
    } catch (error) {
      toast.error('导出失败', error.message);
    }
  }, [reportData, exportFormat, toast, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-lg text-gray-900">导出报告</h3>
              <p className="text-sm text-gray-500">{baseAlgo} vs {compareAlgo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">导出格式</label>
            <div className="flex gap-2">
              <button
                onClick={() => setExportFormat('pdf')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  exportFormat === 'pdf'
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                <FileCode className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  exportFormat === 'json'
                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                <FileJson className="w-4 h-4" />
                JSON
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">数据选项</label>
            <button
              onClick={() => setIncludeData(!includeData)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                includeData
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              <Database className="w-5 h-5" />
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">包含分析数据</p>
                <p className="text-xs text-gray-500">导出完整统计数据和案例详情</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                includeData ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
              }`}>
                {includeData && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
            </button>
          </div>

          {reportData && !isGenerating && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-emerald-700 font-medium text-sm">报告已就绪</span>
            </div>
          )}

          {reportData && !reportData.aiAvailable && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span className="text-amber-700 text-sm">
                离线分析模式
              </span>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-4">
              <Loader2 className="w-10 h-10 mx-auto text-emerald-500 animate-spin mb-2" />
              <p className="text-gray-600 font-medium text-sm">正在生成报告...</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm"
          >
            取消
          </button>
          {reportData ? (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm text-sm"
            >
              <Download className="w-4 h-4" />
              导出 {exportFormat.toUpperCase()}
            </button>
          ) : (
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-sm disabled:opacity-50 text-sm"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              生成报告
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

ReportExportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  stats: PropTypes.object,
  allMetricsStats: PropTypes.array,
  baseAlgo: PropTypes.string,
  compareAlgo: PropTypes.string,
  activeMetric: PropTypes.string,
  parsedData: PropTypes.array,
  selectedCases: PropTypes.instanceOf(Set),
  metaColumns: PropTypes.array,
  llmConfig: PropTypes.object,
  aiInsights: PropTypes.string
};

export default ReportExportModal;
