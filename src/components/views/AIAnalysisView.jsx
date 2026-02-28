import React from 'react';
import PropTypes from 'prop-types';
import { Bot, Settings, Zap, Loader2, AlertTriangle, Sparkles, FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import ChartHeader from '../common/ChartHeader';
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
  isOutdated,
  savedTimestamp
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
    <div className="flex items-center gap-2">
      <button 
        onClick={() => setShowAiConfig(true)} 
        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/90 font-medium rounded-lg border border-white/20 flex items-center gap-1.5 transition-all duration-200 text-sm"
      >
        <Settings className="w-3.5 h-3.5" /> 配置
      </button>
      <button 
        onClick={handleGenerateAIInsights} 
        disabled={isAnalyzing} 
        className={`px-4 py-1.5 font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 text-sm shadow-lg ${
          isAnalyzing 
            ? 'bg-gray-400/50 text-white/70 cursor-not-allowed' 
            : aiInsights 
              ? 'bg-amber-400 hover:bg-amber-300 text-amber-900 border border-amber-500' 
              : 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-emerald-900 border border-emerald-500'
        }`}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> 分析中...
          </>
        ) : aiInsights ? (
          <>
            <Sparkles className="w-4 h-4" /> 重新诊断
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" /> 生成诊断报告
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden w-full min-h-0">
        <ChartHeader
          title="EDA 算法智能诊断"
          variant="primary"
          icon={Bot}
          helpContent={
            <div className="space-y-1">
              <p className="font-bold text-indigo-400">AI 智能诊断</p>
              <div className="text-xs space-y-0.5">
                <p>基于大语言模型的智能算法性能分析</p>
                <p>自动生成结构化诊断报告</p>
                <p>支持 DeepSeek、Gemini、OpenAI 等主流 LLM</p>
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

        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50 to-slate-100 custom-scrollbar max-w-5xl mx-auto w-full">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-full text-purple-500 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-200 rounded-full animate-ping opacity-30"></div>
              <Loader2 className="w-14 h-14 animate-spin relative z-10" />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-gray-700">正在深度分析</p>
              <p className="text-sm text-gray-500 mt-1">{baseAlgo} vs {compareAlgo}</p>
              <p className="text-xs text-gray-400 mt-2">AI 正在生成诊断报告，请稍候...</p>
            </div>
          </div>
        ) : aiError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex gap-3 text-sm max-w-2xl mx-auto shadow-sm">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 text-red-500" />
            <div>
              <p className="font-bold mb-2 text-red-800">诊断失败</p>
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
                  <p className="text-xs text-amber-600">当前诊断报告基于旧数据生成，建议点击「重新诊断」获取最新分析</p>
                </div>
              </div>
            )}
            {!isOutdated && savedTimestamp && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-3 text-sm shadow-sm">
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-semibold">诊断报告为最新</span>
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
                点击上方「生成诊断报告」按钮，AI 将基于当前统计数据生成专业的算法评估报告
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
  isOutdated: PropTypes.bool,
  savedTimestamp: PropTypes.number
};

export default AIAnalysisView;
