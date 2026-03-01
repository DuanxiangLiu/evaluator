import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Settings, FileText, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '../common/Toast';
import HelpIcon from '../common/HelpIcon';

const DEFAULT_CONFIG = {
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: `你是一位专业的EDA算法评估专家，拥有深厚的集成电路设计和算法优化背景。你的任务是分析算法对比数据，提供专业、客观、深入的评估报告。

请基于提供的统计数据，从以下维度进行分析：
1. 整体性能评估
2. 统计显著性分析
3. 改进/退化案例特征
4. 潜在风险与机会
5. 行动建议

报告应当：
- 专业严谨，引用具体数据
- 结构清晰，层次分明
- 客观中立，避免主观臆断
- 可操作性强，提供明确建议`,
  userPromptTemplate: `请分析以下EDA算法对比数据：

**对比算法**: {{baseAlgo}} vs {{compareAlgo}}
**主要指标**: {{metric}}

**统计数据**:
{{stats}}

**所有指标统计**:
{{allMetricsStats}}

**改进案例样本**:
{{topImprovements}}

**退化案例样本**:
{{topDegradations}}

请生成专业的评估报告。`,
  includeOutliers: true,
  includeCaseDetails: true,
  analysisDepth: 'detailed',
  language: 'zh-CN'
};

const AIConfigEnhancedModal = ({ isOpen, config, onConfigChange, onClose }) => {
  const toast = useToast();
  const [localConfig, setLocalConfig] = useState(DEFAULT_CONFIG);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && config && !initialized) {
      setLocalConfig({
        ...DEFAULT_CONFIG,
        ...config,
        systemPrompt: config.systemPrompt || DEFAULT_CONFIG.systemPrompt,
        userPromptTemplate: config.userPromptTemplate || DEFAULT_CONFIG.userPromptTemplate
      });
      setInitialized(true);
    }
    if (!isOpen) {
      setInitialized(false);
    }
  }, [isOpen, config, initialized]);

  if (!isOpen) return null;

  const handleSave = () => {
    onConfigChange({
      ...config,
      ...localConfig
    });
    toast.success('保存成功', 'AI 配置已更新');
    onClose();
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_CONFIG);
    toast.info('已重置', '配置已恢复为默认值');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Settings className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-gray-900 flex items-center gap-2">
                AI 诊断配置
                <HelpIcon 
                  content={
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-bold text-indigo-400 text-sm mb-2">AI 诊断配置</h3>
                        <p className="text-gray-300 text-xs mb-2">
                          配置 AI 智能诊断的提示词和输出语言。
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-indigo-300 text-xs">配置项</h4>
                        <ul className="text-gray-300 text-xs space-y-1">
                          <li>• <strong>输出语言</strong>：报告使用的语言</li>
                          <li>• <strong>系统提示词</strong>：定义 AI 的角色和行为</li>
                          <li>• <strong>用户提示词模板</strong>：数据输入格式</li>
                        </ul>
                      </div>
                    </div>
                  }
                  position="bottom-right"
                  className="w-4 h-4 text-gray-400 hover:text-indigo-500"
                />
              </h3>
              <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">自定义 AI 诊断报告的生成方式</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              输出语言
            </label>
            <select
              value={localConfig.language}
              onChange={(e) => setLocalConfig({ ...localConfig, language: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              系统提示词
            </label>
            <textarea
              value={localConfig.systemPrompt}
              onChange={(e) => setLocalConfig({ ...localConfig, systemPrompt: e.target.value })}
              rows={6}
              placeholder="定义 AI 的角色和行为..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-all resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            <p className="mt-1.5 text-xs text-gray-500">定义 AI 的角色、专业背景和输出风格</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              用户提示词模板
            </label>
            <textarea
              value={localConfig.userPromptTemplate}
              onChange={(e) => setLocalConfig({ ...localConfig, userPromptTemplate: e.target.value })}
              rows={10}
              placeholder="使用 {{变量名}} 插入动态内容..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-all resize-none font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              可用变量: {'{{baseAlgo}}'}, {'{{compareAlgo}}'}, {'{{metric}}'}, {'{{stats}}'}, {'{{allMetricsStats}}'}, {'{{topImprovements}}'}, {'{{topDegradations}}'}
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              提示词修改后，需要重新生成诊断报告才能生效
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50 flex justify-between gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            恢复默认
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-bold transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-bold transition-all shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

AIConfigEnhancedModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  config: PropTypes.object,
  onConfigChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export { DEFAULT_CONFIG };
export default AIConfigEnhancedModal;
