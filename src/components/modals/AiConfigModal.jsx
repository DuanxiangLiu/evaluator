import React, { useState, useEffect } from 'react';
import { X, Settings, Key, Globe, Cpu, FileText } from 'lucide-react';

const PROVIDER_PRESETS = {
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    placeholder: '输入 DeepSeek API Key'
  },
  gemini: {
    name: 'Google Gemini',
    baseUrl: '',
    model: '',
    placeholder: '输入 Gemini API Key'
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    placeholder: '输入 OpenAI API Key'
  },
  custom: {
    name: '自定义 OpenAI 兼容',
    baseUrl: '',
    model: '',
    placeholder: '输入 API Key'
  }
};

const AiConfigModal = ({ isOpen, config, onConfigChange, onClose }) => {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  const handleSave = () => {
    onConfigChange(localConfig);
    onClose();
  };

  const updateConfig = (key, value) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleProviderChange = (provider) => {
    const preset = PROVIDER_PRESETS[provider];
    setLocalConfig(prev => ({
      ...prev,
      provider,
      baseUrl: preset.baseUrl,
      model: preset.model
    }));
  };

  const currentPreset = PROVIDER_PRESETS[localConfig.provider] || PROVIDER_PRESETS.custom;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              AI 配置
            </h3>
            <p className="text-sm text-gray-500 mt-1">配置 AI 服务提供商和 API 密钥</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" />
              服务提供商
            </label>
            <select
              value={localConfig.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>{preset.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500" />
              API Key
            </label>
            <input
              type="password"
              value={localConfig.apiKey}
              onChange={(e) => updateConfig('apiKey', e.target.value)}
              placeholder={currentPreset.placeholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {localConfig.provider !== 'gemini' && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  API Base URL
                </label>
                <input
                  type="text"
                  value={localConfig.baseUrl}
                  onChange={(e) => updateConfig('baseUrl', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">模型名称</label>
                <input
                  type="text"
                  value={localConfig.model}
                  onChange={(e) => updateConfig('model', e.target.value)}
                  placeholder="gpt-4o"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              系统提示词
            </label>
            <textarea
              value={localConfig.systemPrompt}
              onChange={(e) => updateConfig('systemPrompt', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">用户提示词模板</label>
            <textarea
              value={localConfig.userPrompt}
              onChange={(e) => updateConfig('userPrompt', e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm font-mono"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-bold transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors shadow-sm"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiConfigModal;
