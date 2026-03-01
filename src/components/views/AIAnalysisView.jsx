import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Bot, Loader2, AlertTriangle, Sparkles, FileText, Clock, 
  AlertCircle, CheckCircle, ThumbsUp, ThumbsDown, MessageSquare,
  Download, Settings, RefreshCw, Copy, Check
} from 'lucide-react';
import ChartHeader from '../common/ChartHeader';
import AIDiagnosisButton from '../common/AIDiagnosisButton';
import AIConfigEnhancedModal from '../modals/AIConfigEnhancedModal';
import { renderMarkdownText } from '../../services/aiService.jsx';
import { useToast } from '../common/Toast';

const AIAnalysisView = ({
  baseAlgo,
  compareAlgo,
  isAnalyzing,
  aiInsights,
  displayInsights,
  aiError,
  setShowAiConfig,
  handleGenerateAIInsights,
  handleExport,
  isOutdated,
  savedTimestamp,
  hasData,
  aiConfig,
  onAiConfigChange
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenConfig = () => {
    setShowConfigModal(true);
  };

  const handleFeedback = useCallback((type) => {
    setFeedback(type);
    toast.success('感谢反馈', type === 'positive' ? '您的评价已记录' : '我们会持续改进');
  }, [toast]);

  const handleCopy = useCallback(() => {
    if (displayInsights) {
      navigator.clipboard.writeText(displayInsights);
      setCopied(true);
      toast.success('复制成功', '报告内容已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [displayInsights, toast]);

  const handleExportReport = useCallback((format) => {
    handleExport?.(format);
  }, [handleExport]);

  const actionButtons = (
    <AIDiagnosisButton
      onGenerate={handleGenerateAIInsights}
      onExport={handleExportReport}
      onOpenConfig={handleOpenConfig}
      isAnalyzing={isAnalyzing}
      hasExistingReport={!!aiInsights}
      hasData={hasData}
    />
  );

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center h-full text-purple-500 space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-purple-200 rounded-full animate-ping opacity-30"></div>
        <Loader2 className="w-14 h-14 animate-spin relative z-10" />
      </div>
      <div className="text-center">
        <p className="font-bold text-lg text-gray-700">正在生成诊断报告</p>
        <p className="text-sm text-gray-500 mt-1">{baseAlgo} vs {compareAlgo}</p>
        <p className="text-xs text-gray-400 mt-2">AI 正在分析数据，请稍候...</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex gap-3 text-sm max-w-2xl mx-auto shadow-sm">
      <AlertTriangle className="w-6 h-6 flex-shrink-0 text-red-500" />
      <div className="flex-1">
        <p className="font-bold mb-2 text-red-800">生成失败</p>
        <p className="text-red-600">{aiError}</p>
        <div className="mt-3 flex gap-2">
          <button 
            onClick={() => setShowAiConfig(true)}
            className="text-sm text-red-700 hover:text-red-800 underline font-medium"
          >
            检查 AI 配置
          </button>
          <span className="text-red-300">|</span>
          <button 
            onClick={handleGenerateAIInsights}
            className="text-sm text-red-700 hover:text-red-800 underline font-medium"
          >
            重试
          </button>
        </div>
      </div>
    </div>
  );

  const renderReportHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {isOutdated ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>数据已更新，建议重新生成</span>
          </div>
        ) : savedTimestamp ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>报告为最新</span>
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimestamp(savedTimestamp)}
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="复制报告"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  const renderFeedbackSection = () => (
    <div className="mt-6 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">这份报告对您有帮助吗？</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFeedback('positive')}
            className={`p-2 rounded-lg transition-all ${
              feedback === 'positive' 
                ? 'bg-green-100 text-green-600' 
                : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
            }`}
            title="有帮助"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFeedback('negative')}
            className={`p-2 rounded-lg transition-all ${
              feedback === 'negative' 
                ? 'bg-red-100 text-red-600' 
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            title="需要改进"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>
      {feedback && (
        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          感谢您的反馈，这将帮助我们改进诊断质量
        </div>
      )}
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-5">
      <div className="relative">
        <div className="absolute inset-0 bg-purple-100 rounded-full animate-pulse opacity-50"></div>
        <Bot className="w-20 h-20 opacity-40 relative z-10" />
      </div>
      <div className="text-center max-w-md">
        <p className="font-bold text-lg text-gray-600">AI 智能诊断</p>
        <p className="text-sm text-gray-500 mt-2">
          点击「生成报告」按钮，AI 将基于当前统计数据生成专业的算法评估报告
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> DeepSeek
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Gemini
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> OpenAI
          </span>
        </div>
      </div>
      <div className="mt-4 p-4 bg-slate-50 rounded-xl max-w-sm">
        <h4 className="font-semibold text-sm text-gray-700 mb-2">诊断报告包含</h4>
        <ul className="text-xs text-gray-500 space-y-1">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            最终判定结论与核心依据
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            全局指标综合分析
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Trade-off 分析与风险评估
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-500" />
            优化建议与行动方向
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <>
      <div className="h-full flex flex-col p-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden w-full min-h-0">
          <ChartHeader
            title="AI 智能诊断报告"
            variant="primary"
            icon={Bot}
            helpContent={
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-indigo-400 text-sm mb-2">AI 智能诊断</h3>
                  <p className="text-gray-300 text-xs mb-2">
                    基于大语言模型（LLM）的智能分析功能，自动解读统计数据并生成专业的算法评估报告。
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-300 text-xs">使用步骤</h4>
                  <ol className="text-gray-300 text-xs space-y-1 list-decimal list-inside">
                    <li>点击配置按钮自定义提示词（可选）</li>
                    <li>点击「生成报告」按钮生成AI分析</li>
                    <li>查看生成的诊断报告</li>
                    <li>点击导出按钮选择导出格式</li>
                  </ol>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-300 text-xs">导出格式</h4>
                  <ul className="text-gray-300 text-xs space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span><strong>HTML</strong> - 网页格式，可直接查看</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      <span><strong>Markdown</strong> - 纯文本格式，便于编辑</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      <span><strong>JSON</strong> - 结构化数据，便于程序处理</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
                  ⚠️ AI 生成内容仅供参考，请结合实际情况判断
                </div>
              </div>
            }
            rightContent={actionButtons}
          >
            <span className="text-white/70 text-xs flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              {baseAlgo} vs {compareAlgo} 深度分析
            </span>
          </ChartHeader>

          <div className="flex-1 overflow-y-auto p-3 bg-gradient-to-b from-slate-50 to-slate-100 custom-scrollbar max-w-5xl mx-auto w-full">
            {isAnalyzing ? (
              renderLoadingState()
            ) : aiError ? (
              renderErrorState()
            ) : displayInsights ? (
              <div className="max-w-4xl mx-auto space-y-4">
                {renderReportHeader()}
                <div className="prose prose-sm prose-indigo text-sm text-gray-800 leading-relaxed bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  {renderMarkdownText(displayInsights)}
                </div>
                {renderFeedbackSection()}
              </div>
            ) : (
              renderEmptyState()
            )}
          </div>
        </div>
      </div>

      <AIConfigEnhancedModal
        isOpen={showConfigModal}
        config={aiConfig || {}}
        onConfigChange={(newConfig) => {
          onAiConfigChange?.(newConfig);
          setShowConfigModal(false);
        }}
        onClose={() => setShowConfigModal(false)}
      />
    </>
  );
};

AIAnalysisView.propTypes = {
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string.isRequired,
  isAnalyzing: PropTypes.bool.isRequired,
  aiInsights: PropTypes.string,
  displayInsights: PropTypes.string,
  aiError: PropTypes.string,
  setShowAiConfig: PropTypes.func.isRequired,
  handleGenerateAIInsights: PropTypes.func.isRequired,
  handleExport: PropTypes.func,
  isOutdated: PropTypes.bool,
  savedTimestamp: PropTypes.number,
  hasData: PropTypes.bool,
  aiConfig: PropTypes.object,
  onAiConfigChange: PropTypes.func
};

AIAnalysisView.defaultProps = {
  hasData: false
};

export default AIAnalysisView;
