import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, AlertCircle, Info, CheckCircle, RefreshCw, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { assessDataQualityWithAI, generateAnomalyReport } from '../../services/anomalyDetection.js';
import { useToast } from '../common/Toast';

const severityConfig = {
  error: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    iconColor: 'text-red-500'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    iconColor: 'text-amber-500'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-500'
  }
};

const statusConfig = {
  critical: { label: '严重', color: 'text-red-600', bgColor: 'bg-red-100' },
  warning: { label: '警告', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  notice: { label: '提示', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  good: { label: '良好', color: 'text-emerald-600', bgColor: 'bg-emerald-100' }
};

const DataQualityPanel = ({ parsedData, availableAlgos, availableMetrics, llmConfig, stats, allMetricsStats }) => {
  const [aiAssessment, setAiAssessment] = useState(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    issues: true,
    ai: false,
    recommendations: true
  });
  
  const toast = useToast();

  const anomalyReport = useMemo(() => {
    if (!stats) return null;
    return generateAnomalyReport(stats, allMetricsStats, parsedData);
  }, [stats, allMetricsStats, parsedData]);

  const handleAIAssessment = useCallback(async () => {
    if (!llmConfig?.apiKey && llmConfig?.provider !== 'gemini') {
      toast.error('请先配置API Key');
      return;
    }
    
    setIsAssessing(true);
    try {
      const result = await assessDataQualityWithAI(llmConfig, parsedData, availableAlgos, availableMetrics);
      setAiAssessment(result);
      toast.success('AI评估完成');
    } catch (error) {
      toast.error('AI评估失败', error.message);
    } finally {
      setIsAssessing(false);
    }
  }, [llmConfig, parsedData, availableAlgos, availableMetrics, toast]);

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  if (!stats) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
        请先加载数据以查看质量评估
      </div>
    );
  }

  const statusInfo = statusConfig[anomalyReport?.overallStatus || 'good'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-800">数据质量评估</h3>
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        <button
          onClick={handleAIAssessment}
          disabled={isAssessing}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isAssessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              评估中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              AI评估
            </>
          )}
        </button>
      </div>

      {anomalyReport && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-center">
            <div className="text-2xl font-bold text-red-600">{anomalyReport.severityCount.error}</div>
            <div className="text-xs text-red-500">严重问题</div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-center">
            <div className="text-2xl font-bold text-amber-600">{anomalyReport.severityCount.warning}</div>
            <div className="text-xs text-amber-500">警告</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
            <div className="text-2xl font-bold text-blue-600">{anomalyReport.severityCount.info}</div>
            <div className="text-xs text-blue-500">提示</div>
          </div>
        </div>
      )}

      {anomalyReport?.anomalies?.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('issues')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-700">发现问题 ({anomalyReport.anomalies.length})</span>
            {expandedSections.issues ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.issues && (
            <div className="p-3 space-y-2">
              {anomalyReport.anomalies.map((anomaly, index) => {
                const config = severityConfig[anomaly.severity];
                const Icon = config.icon;
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${config.textColor}`}>{anomaly.message}</div>
                      {anomaly.suggestion && (
                        <div className="text-xs text-gray-500 mt-1">{anomaly.suggestion}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {aiAssessment?.aiAssessment && (
        <div className="border border-purple-200 rounded-lg overflow-hidden bg-purple-50">
          <button
            onClick={() => toggleSection('ai')}
            className="w-full flex items-center justify-between p-3 bg-purple-100 hover:bg-purple-200 transition-colors"
          >
            <span className="font-medium text-purple-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI评估结果
            </span>
            {expandedSections.ai ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.ai && (
            <div className="p-3 text-sm text-gray-700 whitespace-pre-wrap">
              {aiAssessment.aiAssessment}
            </div>
          )}
        </div>
      )}

      {anomalyReport?.recommendations?.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('recommendations')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="font-medium text-gray-700">改进建议</span>
            {expandedSections.recommendations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expandedSections.recommendations && (
            <div className="p-3">
              <ul className="space-y-2">
                {anomalyReport.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

DataQualityPanel.propTypes = {
  parsedData: PropTypes.array.isRequired,
  availableAlgos: PropTypes.array.isRequired,
  availableMetrics: PropTypes.array.isRequired,
  llmConfig: PropTypes.object,
  stats: PropTypes.object,
  allMetricsStats: PropTypes.array
};

export default DataQualityPanel;
