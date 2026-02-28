import React, { useState, useEffect, useCallback } from 'react';
import { X, Settings, Key, Globe, Cpu, FileText, CheckCircle, AlertCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useFormValidation } from '../../hooks/useInputValidation';
import { useToast } from '../common/Toast';

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

const validationRules = {
  apiKey: (value) => {
    if (!value || value.trim() === '') {
      return 'API Key 不能为空';
    }
    if (value.length < 10) {
      return 'API Key 长度不正确';
    }
    return null;
  },
  baseUrl: (value, values) => {
    if (values.provider === 'gemini') return null;
    if (!value || value.trim() === '') {
      return 'API Base URL 不能为空';
    }
    try {
      new URL(value);
      return null;
    } catch {
      return '请输入有效的 URL';
    }
  },
  model: (value, values) => {
    if (values.provider === 'gemini') return null;
    if (!value || value.trim() === '') {
      return '模型名称不能为空';
    }
    return null;
  }
};

const InputField = ({ 
  label, 
  icon: Icon, 
  type = 'text',
  value, 
  onChange, 
  onBlur,
  placeholder, 
  error, 
  warning,
  success,
  disabled = false,
  helperText,
  className = ''
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (warning) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    if (success) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return null;
  };

  const getBorderColor = () => {
    if (error) return 'border-red-300 focus:ring-red-500 focus:border-red-500';
    if (warning) return 'border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500';
    if (success) return 'border-green-300 focus:ring-green-500 focus:border-green-500';
    return 'border-gray-300 focus:ring-indigo-500 focus:border-transparent';
  };

  return (
    <div className={className}>
      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-indigo-500" />}
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-2 border rounded-lg transition-all
            ${getBorderColor()}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${isPassword ? 'pr-20' : 'pr-10'}
            focus:ring-2 focus:outline-none
          `}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-gray-400" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}
          {getStatusIcon()}
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {warning && !error && (
        <p className="mt-1 text-sm text-yellow-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {warning}
        </p>
      )}
      {helperText && !error && !warning && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

const TextAreaField = ({ 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  onBlur,
  placeholder, 
  error, 
  warning,
  success,
  rows = 3,
  helperText,
  className = '',
  isMono = false
}) => {
  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (warning) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    if (success) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return null;
  };

  const getBorderColor = () => {
    if (error) return 'border-red-300 focus:ring-red-500 focus:border-red-500';
    if (warning) return 'border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500';
    if (success) return 'border-green-300 focus:ring-green-500 focus:border-green-500';
    return 'border-gray-300 focus:ring-indigo-500 focus:border-transparent';
  };

  return (
    <div className={className}>
      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-indigo-500" />}
        {label}
      </label>
      <div className="relative">
        <textarea
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          className={`
            w-full px-4 py-2 border rounded-lg transition-all resize-none
            ${getBorderColor()}
            ${isMono ? 'font-mono text-sm' : ''}
            focus:ring-2 focus:outline-none
          `}
        />
        <div className="absolute right-2 top-2">
          {getStatusIcon()}
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {warning && !error && (
        <p className="mt-1 text-sm text-yellow-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {warning}
        </p>
      )}
      {helperText && !error && !warning && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

const AiConfigModal = ({ isOpen, config, onConfigChange, onClose }) => {
  const toast = useToast();
  
  const {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setTouchedField,
    validateAll,
    handleSubmit,
    hasErrors
  } = useFormValidation(
    { ...config },
    validationRules
  );

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (isOpen && config && !initialized) {
      Object.keys(config).forEach(key => {
        setValue(key, config[key]);
      });
      setInitialized(true);
    }
    if (!isOpen) {
      setInitialized(false);
    }
  }, [isOpen, config, setValue, initialized]);

  if (!isOpen) return null;

  const currentPreset = PROVIDER_PRESETS[values.provider] || PROVIDER_PRESETS.custom;

  const handleProviderChange = (provider) => {
    const preset = PROVIDER_PRESETS[provider];
    setValue('provider', provider);
    setValue('baseUrl', preset.baseUrl);
    setValue('model', preset.model);
  };

  const handleSave = async () => {
    const isValid = validateAll();
    
    if (!isValid) {
      toast.error('验证失败', '请检查表单中的错误');
      return;
    }

    onConfigChange(values);
    toast.success('保存成功', 'AI 配置已更新');
    onClose();
  };

  const getFieldStatus = (field) => {
    const hasError = touched[field] && errors[field];
    const hasValue = values[field] && values[field].trim() !== '';
    return {
      error: hasError ? errors[field] : null,
      success: !hasError && touched[field] && hasValue,
      warning: null
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg sm:text-xl text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              AI 配置
            </h3>
            <p className="text-sm text-gray-500 mt-1 hidden sm:block">配置 AI 服务提供商和 API 密钥</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" />
              服务提供商
            </label>
            <select
              value={values.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>{preset.name}</option>
              ))}
            </select>
          </div>

          <InputField
            label="API Key"
            icon={Key}
            type="password"
            value={values.apiKey || ''}
            onChange={(e) => setValue('apiKey', e.target.value)}
            onBlur={() => setTouchedField('apiKey')}
            placeholder={currentPreset.placeholder}
            {...getFieldStatus('apiKey')}
            helperText="API Key 用于身份验证，将安全存储在本地"
          />

          {values.provider !== 'gemini' && (
            <>
              <InputField
                label="API Base URL"
                icon={Globe}
                value={values.baseUrl || ''}
                onChange={(e) => setValue('baseUrl', e.target.value)}
                onBlur={() => setTouchedField('baseUrl')}
                placeholder="https://api.openai.com/v1"
                {...getFieldStatus('baseUrl')}
                helperText="API 服务的基础 URL 地址"
              />

              <InputField
                label="模型名称"
                icon={Cpu}
                value={values.model || ''}
                onChange={(e) => setValue('model', e.target.value)}
                onBlur={() => setTouchedField('model')}
                placeholder="gpt-4o"
                {...getFieldStatus('model')}
                helperText="要使用的模型名称"
              />
            </>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              {showAdvanced ? '隐藏' : '显示'}高级选项
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <TextAreaField
                label="系统提示词"
                icon={FileText}
                value={values.systemPrompt || ''}
                onChange={(e) => setValue('systemPrompt', e.target.value)}
                onBlur={() => setTouchedField('systemPrompt')}
                rows={3}
                helperText="定义 AI 的角色和行为"
              />

              <TextAreaField
                label="用户提示词模板"
                value={values.userPrompt || ''}
                onChange={(e) => setValue('userPrompt', e.target.value)}
                onBlur={() => setTouchedField('userPrompt')}
                rows={6}
                isMono
                helperText="使用 {{变量名}} 插入动态内容"
              />
            </div>
          )}

          {hasErrors && Object.values(errors).some(Boolean) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                请修复表单中的错误后再保存
              </p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-bold transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={hasErrors}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiConfigModal;
