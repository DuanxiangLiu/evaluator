import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '../utils/logger';
import { 
  validateCSVStructure, 
  validateCSVQuick, 
  validateFileType, 
  validateFileSize,
  VALIDATION_SEVERITY 
} from '../utils/validationUtils';

export const INPUT_STATUS = {
  IDLE: 'idle',
  TYPING: 'typing',
  VALIDATING: 'validating',
  VALID: 'valid',
  INVALID: 'invalid',
  LOADING: 'loading'
};

export const useInputValidation = (options = {}) => {
  const {
    debounceMs = 300,
    validateOnChange = true,
    maxFileSizeMB = 10,
    onValidationComplete
  } = options;

  const [status, setStatus] = useState(INPUT_STATUS.IDLE);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [stats, setStats] = useState(null);
  const [isValid, setIsValid] = useState(true);
  const [touched, setTouched] = useState(false);

  const debounceTimerRef = useRef(null);
  const lastValidatedValueRef = useRef(null);

  const clearValidation = useCallback(() => {
    setErrors([]);
    setWarnings([]);
    setStats(null);
    setIsValid(true);
    setStatus(INPUT_STATUS.IDLE);
  }, []);

  const runValidation = useCallback((csvString) => {
    setStatus(INPUT_STATUS.VALIDATING);
    
    const result = validateCSVStructure(csvString);
    
    setErrors(result.errors || []);
    setWarnings(result.warnings || []);
    setStats(result.stats);
    setIsValid(result.valid);
    setStatus(result.valid ? INPUT_STATUS.VALID : INPUT_STATUS.INVALID);
    
    lastValidatedValueRef.current = csvString;
    
    if (onValidationComplete) {
      onValidationComplete(result);
    }
    
    return result;
  }, [onValidationComplete]);

  const validateDebounced = useCallback((csvString) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!csvString || !csvString.trim()) {
      clearValidation();
      return;
    }

    setStatus(INPUT_STATUS.TYPING);

    debounceTimerRef.current = setTimeout(() => {
      runValidation(csvString);
    }, debounceMs);
  }, [debounceMs, runValidation, clearValidation]);

  const validateImmediate = useCallback((csvString) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setTouched(true);
    
    if (!csvString || !csvString.trim()) {
      clearValidation();
      return { valid: false, errors: [], warnings: [] };
    }
    
    return runValidation(csvString);
  }, [runValidation, clearValidation]);

  const validateFile = useCallback((file) => {
    setTouched(true);
    
    const typeResult = validateFileType(file);
    if (!typeResult.valid) {
      setErrors(typeResult.errors);
      setWarnings([]);
      setStats(null);
      setIsValid(false);
      setStatus(INPUT_STATUS.INVALID);
      return typeResult;
    }

    const sizeResult = validateFileSize(file, maxFileSizeMB);
    if (!sizeResult.valid) {
      setErrors(sizeResult.errors);
      setWarnings([]);
      setStats(null);
      setIsValid(false);
      setStatus(INPUT_STATUS.INVALID);
      return sizeResult;
    }

    return { valid: true, errors: [], warnings: [] };
  }, [maxFileSizeMB]);

  const quickValidate = useCallback((csvString) => {
    return validateCSVQuick(csvString);
  }, []);

  const getErrorByField = useCallback((field) => {
    return errors.find(e => e.field === field || e.column === field);
  }, [errors]);

  const getWarningsByField = useCallback((field) => {
    return warnings.filter(w => w.field === field || w.column === field);
  }, [warnings]);

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const errorCount = errors.length;
  const warningCount = warnings.length;

  const getErrorsBySeverity = useCallback((severity) => {
    return errors.filter(e => e.severity === severity);
  }, [errors]);

  const getWarningsBySeverity = useCallback((severity) => {
    return warnings.filter(w => w.severity === severity);
  }, [warnings]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    status,
    errors,
    warnings,
    stats,
    isValid,
    touched,
    hasErrors,
    hasWarnings,
    errorCount,
    warningCount,
    validateDebounced,
    validateImmediate,
    validateFile,
    quickValidate,
    clearValidation,
    getErrorByField,
    getWarningsByField,
    getErrorsBySeverity,
    getWarningsBySeverity,
    setStatus
  };
};

export const useFileUpload = (options = {}) => {
  const {
    accept = '.csv,.txt',
    maxSizeMB = 10,
    onFileSelect,
    onFileError,
    onValidationStart,
    onValidationComplete
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const validateFileInternal = useCallback((file) => {
    const validExtensions = accept.split(',').map(ext => ext.trim());
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      const error = {
        code: 'INVALID_FILE_TYPE',
        message: `文件类型不支持，请上传 ${accept} 文件`
      };
      onFileError?.(error);
      return { valid: false, error };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const error = {
        code: 'FILE_TOO_LARGE',
        message: `文件大小超过限制 (${maxSizeMB}MB)`
      };
      onFileError?.(error);
      return { valid: false, error };
    }

    return { valid: true };
  }, [accept, maxSizeMB, onFileError]);

  const readFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadstart = () => {
        setIsLoading(true);
        setProgress(0);
        onValidationStart?.();
      };

      reader.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percentLoaded = Math.round((evt.loaded / evt.total) * 100);
          setProgress(percentLoaded);
        }
      };

      reader.onload = (evt) => {
        setProgress(100);
        setIsLoading(false);
        resolve(evt.target.result);
      };

      reader.onerror = () => {
        setIsLoading(false);
        setProgress(0);
        reject(new Error('文件读取失败'));
      };

      reader.readAsText(file);
    });
  }, [onValidationStart]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const validation = validateFileInternal(file);
    if (!validation.valid) {
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);

    try {
      const content = await readFile(file);
      onFileSelect?.(content, file);
      onValidationComplete?.({ valid: true, content });
    } catch (error) {
      onFileError?.({
        code: 'READ_ERROR',
        message: error.message
      });
    }
  }, [validateFileInternal, readFile, onFileSelect, onValidationComplete]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    e.target.value = '';
  }, [handleFile]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const reset = useCallback(() => {
    setFileName(null);
    setFileSize(null);
    setProgress(0);
    setIsLoading(false);
    setIsDragging(false);
  }, []);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === null || bytes === undefined) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, []);

  return {
    fileInputRef,
    isDragging,
    isLoading,
    fileName,
    fileSize,
    progress,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleInputChange,
    openFileDialog,
    reset,
    formatFileSize,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop
    }
  };
};

export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const setValue = useCallback((field, value) => {
    setValues(prev => {
      const newValues = { ...prev, [field]: value };
      
      if (validationRules[field]) {
        const rule = validationRules[field];
        const error = rule(value, newValues);
        setErrors(prevErrors => ({
          ...prevErrors,
          [field]: error || null
        }));
      }
      
      return newValues;
    });
  }, [validationRules]);

  const setTouchedField = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateField = useCallback((field, value) => {
    if (validationRules[field]) {
      const rule = validationRules[field];
      const fieldValue = value !== undefined ? value : valuesRef.current[field];
      const error = rule(fieldValue, valuesRef.current);
      setErrors(prev => ({
        ...prev,
        [field]: error || null
      }));
      return !error;
    }
    return true;
  }, [validationRules]);

  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const rule = validationRules[field];
      const error = rule(valuesRef.current[field], valuesRef.current);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationRules]);

  const handleSubmit = useCallback((onSubmit) => async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);

    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    const isValid = validateAll();

    if (isValid) {
      try {
        await onSubmit(values);
      } catch (error) {
        logger.error('表单提交错误:', error);
      }
    }

    setIsSubmitting(false);
    return isValid;
  }, [values, validateAll]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldProps = useCallback((field) => ({
    value: values[field] || '',
    onChange: (e) => {
      const value = e.target?.value !== undefined ? e.target.value : e;
      setValue(field, value);
    },
    onBlur: () => setTouchedField(field),
    error: touched[field] ? errors[field] : null
  }), [values, errors, touched, setValue, setTouchedField]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setTouchedField,
    validateField,
    validateAll,
    handleSubmit,
    reset,
    getFieldProps,
    hasErrors: Object.values(errors).some(e => e),
    isValid: !Object.values(errors).some(e => e)
  };
};

export default useInputValidation;
