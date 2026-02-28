import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { useToast } from '../common/Toast';
import HelpIcon from '../common/HelpIcon';

const PromptConfigModal = ({ isOpen, config, onConfigChange, onClose }) => {
  const toast = useToast();
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && config && !initialized) {
      setSystemPrompt(config.systemPrompt || '');
      setUserPrompt(config.userPrompt || '');
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
      systemPrompt,
      userPrompt
    });
    toast.success('保存成功', '提示词配置已更新');
    onClose();
  };

  const handleReset = () => {
    setSystemPrompt(config.defaultSystemPrompt || '');
    setUserPrompt(config.defaultUserPrompt || '');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg sm:text-xl text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              提示词配置
              <HelpIcon 
                content={
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-emerald-400 text-sm mb-2">提示词配置</h3>
                      <p className="text-gray-300 text-xs mb-2">
                        自定义 AI 诊断报告的提示词模板，控制生成内容的风格和深度。
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-emerald-300 text-xs">可用变量</h4>
                      <ul className="text-gray-300 text-xs space-y-1">
                        <li>• <strong>{'{{baseAlgo}}'}</strong>：基线算法名称</li>
                        <li>• <strong>{'{{compareAlgo}}'}</strong>：对比算法名称</li>
                        <li>• <strong>{'{{metric}}'}</strong>：当前指标名称</li>
                        <li>• <strong>{'{{stats}}'}</strong>：统计数据摘要</li>
                        <li>• <strong>{'{{allMetricsStats}}'}</strong>：所有指标统计</li>
                      </ul>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
                      💡 提示词仅用于 AI 智能诊断功能
                    </div>
                  </div>
                }
                position="bottom-right"
                className="w-4 h-4 text-gray-400 hover:text-emerald-500"
              />
            </h3>
            <p className="text-sm text-gray-500 mt-1 hidden sm:block">自定义 AI 诊断报告的提示词模板</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              系统提示词
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              placeholder="定义 AI 的角色和行为..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg transition-all resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">定义 AI 的角色、专业背景和输出风格</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              用户提示词模板
            </label>
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={10}
              placeholder="使用 {{变量名}} 插入动态内容..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg transition-all resize-none font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">使用 {'{{变量名}}'} 插入动态内容，如 {'{{baseAlgo}}'}、{'{{stats}}'} 等</p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              提示词修改后，需要重新生成诊断报告才能生效
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex justify-between gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2"
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

export default PromptConfigModal;
