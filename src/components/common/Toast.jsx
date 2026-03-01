import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, XCircle, CheckCircle2, AlertOctagon, InfoIcon, Copy, Check } from 'lucide-react';

const ToastContext = createContext(null);

export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

const TOAST_CONFIG = {
  [TOAST_TYPES.SUCCESS]: {
    icon: CheckCircle2,
    bgColor: 'bg-gradient-to-r from-emerald-50 to-green-50',
    borderColor: 'border-l-4 border-l-emerald-500 border border-emerald-100',
    iconBgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-900',
    textColor: 'text-emerald-700',
    progressColor: 'bg-gradient-to-r from-emerald-400 to-green-400',
    progressBg: 'bg-emerald-100',
    hoverBg: 'hover:bg-emerald-100/50',
    closeBtnHover: 'hover:bg-emerald-200/50',
    shadow: 'shadow-lg shadow-emerald-500/10',
    ring: 'ring-1 ring-emerald-500/20'
  },
  [TOAST_TYPES.ERROR]: {
    icon: AlertOctagon,
    bgColor: 'bg-gradient-to-r from-red-50 to-rose-50',
    borderColor: 'border-l-4 border-l-red-500 border border-red-100',
    iconBgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    textColor: 'text-red-700',
    progressColor: 'bg-gradient-to-r from-red-400 to-rose-400',
    progressBg: 'bg-red-100',
    hoverBg: 'hover:bg-red-100/50',
    closeBtnHover: 'hover:bg-red-200/50',
    shadow: 'shadow-lg shadow-red-500/10',
    ring: 'ring-1 ring-red-500/20'
  },
  [TOAST_TYPES.WARNING]: {
    icon: AlertTriangle,
    bgColor: 'bg-gradient-to-r from-amber-50 to-yellow-50',
    borderColor: 'border-l-4 border-l-amber-500 border border-amber-100',
    iconBgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
    textColor: 'text-amber-700',
    progressColor: 'bg-gradient-to-r from-amber-400 to-yellow-400',
    progressBg: 'bg-amber-100',
    hoverBg: 'hover:bg-amber-100/50',
    closeBtnHover: 'hover:bg-amber-200/50',
    shadow: 'shadow-lg shadow-amber-500/10',
    ring: 'ring-1 ring-amber-500/20'
  },
  [TOAST_TYPES.INFO]: {
    icon: InfoIcon,
    bgColor: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    borderColor: 'border-l-4 border-l-blue-500 border border-blue-100',
    iconBgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    textColor: 'text-blue-700',
    progressColor: 'bg-gradient-to-r from-blue-400 to-indigo-400',
    progressBg: 'bg-blue-100',
    hoverBg: 'hover:bg-blue-100/50',
    closeBtnHover: 'hover:bg-blue-200/50',
    shadow: 'shadow-lg shadow-blue-500/10',
    ring: 'ring-1 ring-blue-500/20'
  }
};

const Toast = ({ id, type, title, message, duration, onClose, index }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const config = TOAST_CONFIG[type] || TOAST_CONFIG[TOAST_TYPES.INFO];
  const Icon = config.icon;
  const toastRef = useRef(null);

  const handleCopy = useCallback(() => {
    const textToCopy = `${title ? title + '\n' : ''}${message || ''}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }, [title, message]);

  useEffect(() => {
    if (duration <= 0 || isPaused) return;

    const startTime = Date.now();
    const step = 50;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        handleClose();
      }
    }, step);

    return () => clearInterval(timer);
  }, [duration, isPaused]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  }, [id, onClose]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsPaused(false);
    setIsHovered(false);
  };

  const handleClick = (e) => {
    // 阻止点击事件冒泡，避免点击 Toast 时关闭
    e.stopPropagation();
  };

  return (
    <div
      ref={toastRef}
      className={`
        ${config.bgColor} ${config.borderColor} ${config.shadow} ${config.ring}
        rounded-xl p-0 min-w-[200px] max-w-[420px] sm:max-w-[480px]
        transform transition-all duration-300 ease-out
        ${isExiting 
          ? 'opacity-0 translate-x-full scale-95' 
          : 'opacity-100 translate-x-0 scale-100 animate-in slide-in-from-right-full'
        }
        ${config.hoverBg}
        backdrop-blur-sm
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        animationDelay: `${index * 50}ms`,
        zIndex: 9999 - index,
        width: 'fit-content'
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`
          ${config.iconBgColor} rounded-lg p-2 flex-shrink-0
          transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}
        `}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} strokeWidth={2} />
        </div>
        
        <div className="flex-1 min-w-0 py-0.5">
          {title && (
            <p className={`font-semibold text-sm ${config.titleColor} mb-1 leading-tight`}>
              {title}
            </p>
          )}
          {message && (
            <p className={`text-sm ${config.textColor} opacity-90 break-words leading-relaxed`}>
              {message}
            </p>
          )}
        </div>
        
        <div className="flex flex-col gap-1">
          <button
            onClick={handleCopy}
            className={`
              flex-shrink-0 p-1.5 rounded-lg transition-all duration-200
              ${config.closeBtnHover}
              opacity-60 hover:opacity-100
              focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300
            `}
            aria-label="复制内容"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-500" strokeWidth={2} />
            ) : (
              <Copy className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
          <button
            onClick={handleClose}
            className={`
              flex-shrink-0 p-1.5 rounded-lg transition-all duration-200
              ${config.closeBtnHover}
              opacity-60 hover:opacity-100
              focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300
            `}
            aria-label="关闭提示"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
      
      {duration > 0 && (
        <div className={`h-1.5 ${config.progressBg} rounded-b-xl overflow-hidden`}>
          <div
            className={`h-full ${config.progressColor} transition-all duration-100 ease-linear rounded-r-full`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

const ToastContainer = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none sm:gap-4">
      {toasts.map((toast, index) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            {...toast}
            index={index}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
};

export const ToastProvider = ({ children, maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = toast.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = {
      id,
      type: TOAST_TYPES.INFO,
      duration: 5000,
      ...toast
    };

    setToasts(prev => {
      const updated = [...prev, newToast];
      return updated.slice(-maxToasts);
    });

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback((title, message, options = {}) => {
    return addToast({ type: TOAST_TYPES.SUCCESS, title, message, ...options });
  }, [addToast]);

  const error = useCallback((title, message, options = {}) => {
    return addToast({ type: TOAST_TYPES.ERROR, title, message, duration: 7000, ...options });
  }, [addToast]);

  const warning = useCallback((title, message, options = {}) => {
    return addToast({ type: TOAST_TYPES.WARNING, title, message, ...options });
  }, [addToast]);

  const info = useCallback((title, message, options = {}) => {
    return addToast({ type: TOAST_TYPES.INFO, title, message, ...options });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ValidationErrorsToast = ({ errors, onDismiss }) => {
  const { error, clearToasts } = useToast();

  useEffect(() => {
    if (errors && errors.length > 0) {
      const firstError = errors[0];
      const hasMore = errors.length > 1;
      
      error(
        '数据验证失败',
        `${firstError.message}${hasMore ? ` (还有 ${errors.length - 1} 个错误)` : ''}`,
        { duration: 8000 }
      );
    }
  }, [errors, error]);

  return null;
};

export const ValidationWarningsToast = ({ warnings }) => {
  const { warning } = useToast();

  useEffect(() => {
    if (warnings && warnings.length > 0) {
      const firstWarning = warnings[0];
      const hasMore = warnings.length > 1;
      
      warning(
        '数据验证警告',
        `${firstWarning.message}${hasMore ? ` (还有 ${warnings.length - 1} 个警告)` : ''}`,
        { duration: 6000 }
      );
    }
  }, [warnings, warning]);

  return null;
};

export default ToastProvider;
