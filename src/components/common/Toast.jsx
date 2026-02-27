import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

const TOAST_CONFIG = {
  [TOAST_TYPES.SUCCESS]: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-500',
    textColor: 'text-green-800',
    progressColor: 'bg-green-400'
  },
  [TOAST_TYPES.ERROR]: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
    textColor: 'text-red-800',
    progressColor: 'bg-red-400'
  },
  [TOAST_TYPES.WARNING]: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-500',
    textColor: 'text-yellow-800',
    progressColor: 'bg-yellow-400'
  },
  [TOAST_TYPES.INFO]: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-800',
    progressColor: 'bg-blue-400'
  }
};

const Toast = ({ id, type, title, message, duration, onClose }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const config = TOAST_CONFIG[type] || TOAST_CONFIG[TOAST_TYPES.INFO];
  const Icon = config.icon;

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
        onClose(id);
      }
    }, step);

    return () => clearInterval(timer);
  }, [duration, isPaused, id, onClose]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[420px]
        transform transition-all duration-300 ease-out
        animate-in slide-in-from-right-full
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-bold text-sm mb-1">{title}</p>
          )}
          {message && (
            <p className="text-sm opacity-90 break-words">{message}</p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {duration > 0 && (
        <div className="mt-2 h-1 bg-black/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.progressColor} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
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
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={removeToast}
          />
        ))}
      </div>
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
