import React from 'react';
import PropTypes from 'prop-types';
import { Bot, Settings, Zap, Loader2, AlertTriangle } from 'lucide-react';
import { renderMarkdownText } from '../../services/aiService.jsx';

const AIAnalysisView = ({
  baseAlgo,
  compareAlgo,
  isAnalyzing,
  aiInsights,
  displayInsights,
  aiError,
  setShowAiConfig,
  handleGenerateAIInsights
}) => {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-purple-100 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
              <Bot className="w-6 h-6 text-purple-600" /> EDA 架构师智能诊断
            </h3>
            <p className="text-sm text-gray-500 mt-1">基于 {baseAlgo} vs {compareAlgo} 的深度分析报告</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAiConfig(true)} className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-lg border border-gray-200 flex items-center gap-2 transition-colors shadow-sm">
              <Settings className="w-4 h-4" /> AI 配置
            </button>
            <button onClick={handleGenerateAIInsights} disabled={isAnalyzing} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {aiInsights ? '重新诊断' : '生成诊断报告'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-full text-purple-400 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="font-bold animate-pulse">正在深度分析 {baseAlgo} vs {compareAlgo} ...</p>
            <p className="text-sm text-gray-400">AI 正在生成诊断报告，请稍候...</p>
          </div>
        ) : aiError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex gap-3 text-sm max-w-2xl mx-auto">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold mb-2">诊断失败</p>
              <p>{aiError}</p>
            </div>
          </div>
        ) : displayInsights ? (
          <div className="prose prose-sm prose-indigo max-w-4xl mx-auto text-sm text-gray-800 leading-relaxed bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            {renderMarkdownText(displayInsights)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
            <Bot className="w-16 h-16 opacity-50" />
            <p className="font-bold">点击上方「生成诊断报告」按钮开始 AI 智能分析</p>
            <p className="text-sm">需要先配置 AI API Key（支持 Gemini、OpenAI 等）</p>
          </div>
        )}
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
  handleGenerateAIInsights: PropTypes.func.isRequired
};

export default AIAnalysisView;
