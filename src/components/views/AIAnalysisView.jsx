import React from 'react';
import PropTypes from 'prop-types';
import { Bot, Loader2, AlertTriangle, Sparkles, FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import ChartHeader from '../common/ChartHeader';
import AIDiagnosisButton from '../common/AIDiagnosisButton';
import { renderMarkdownText } from '../../services/aiService.jsx';

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
  hasData
}) => {
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

  const actionButtons = (
    <AIDiagnosisButton
      onGenerate={handleGenerateAIInsights}
      onExport={handleExport}
      isAnalyzing={isAnalyzing}
      hasExistingReport={!!aiInsights}
      hasData={hasData}
    />
  );

  return (
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
                <h4 className="font-semibold text-emerald-300 text-xs">使用步骤</h4>
                <ol className="text-gray-300 text-xs space-y-1 list-decimal list-inside">
                  <li>点击「生成报告」按钮生成AI分析</li>
                  <li>查看生成的诊断报告</li>
                  <li>点击下拉菜单选择导出格式</li>
                </ol>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-300 text-xs">导出格式</h4>
                <ul className="text-gray-300 text-xs space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span><strong>PDF</strong> - 打印为PDF文档，适合分享</span>
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
          <div className="flex flex-col items-center justify-center h-full text-purple-500 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-200 rounded-full animate-ping opacity-30"></div>
              <Loader2 className="w-14 h-14 animate-spin relative z-10" />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-gray-700">正在生成报告</p>
              <p className="text-sm text-gray-500 mt-1">{baseAlgo} vs {compareAlgo}</p>
              <p className="text-xs text-gray-400 mt-2">AI 正在分析数据，请稍候...</p>
            </div>
          </div>
        ) : aiError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex gap-3 text-sm max-w-2xl mx-auto shadow-sm">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 text-red-500" />
            <div>
              <p className="font-bold mb-2 text-red-800">生成失败</p>
              <p className="text-red-600">{aiError}</p>
              <button 
                onClick={() => setShowAiConfig(true)}
                className="mt-3 text-sm text-red-700 hover:text-red-800 underline font-medium"
              >
                检查 AI 配置
              </button>
            </div>
          </div>
        ) : displayInsights ? (
          <div className="max-w-4xl mx-auto space-y-4">
            {isOutdated && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-center gap-3 text-sm shadow-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                <div className="flex-1">
                  <p className="font-semibold">数据已更新</p>
                  <p className="text-xs text-amber-600">当前报告基于旧数据生成，建议点击「重新生成」获取最新分析</p>
                </div>
              </div>
            )}
            {!isOutdated && savedTimestamp && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-3 text-sm shadow-sm">
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-semibold">报告为最新</span>
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    生成于 {formatTimestamp(savedTimestamp)}
                  </span>
                </div>
              </div>
            )}
            <div className="prose prose-sm prose-indigo text-sm text-gray-800 leading-relaxed bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              {renderMarkdownText(displayInsights)}
            </div>
          </div>
        ) : (
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
          </div>
        )}
        </div>
      </div>
    </div>
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
  hasData: PropTypes.bool
};

AIAnalysisView.defaultProps = {
  hasData: false
};

export default AIAnalysisView;
