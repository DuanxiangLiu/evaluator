import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '../utils/logger';

const DEBOUNCE_DELAY = 300;

const debounceMap = new Map();

const debouncedSetItem = (key, value, delay = DEBOUNCE_DELAY) => {
  if (debounceMap.has(key)) {
    clearTimeout(debounceMap.get(key));
  }
  
  const timeoutId = setTimeout(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      debounceMap.delete(key);
    } catch (error) {
      logger.warn(`设置 localStorage 键 "${key}" 失败:`, error);
    }
  }, delay);
  
  debounceMap.set(key, timeoutId);
};

export const useLocalStorage = (key, initialValue, options = {}) => {
  const { debounce = true, debounceDelay = DEBOUNCE_DELAY } = options;
  
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.warn(`读取 localStorage 键 "${key}" 失败:`, error);
      return initialValue;
    }
  });

  const valueRef = useRef(storedValue);

  useEffect(() => {
    return () => {
      if (debounceMap.has(key)) {
        clearTimeout(debounceMap.get(key));
        debounceMap.delete(key);
      }
    };
  }, [key]);

  const setValue = useCallback((value) => {
    try {
      const newValue = value instanceof Function ? value(valueRef.current) : value;
      valueRef.current = newValue;
      setStoredValue(newValue);
      
      if (typeof window !== 'undefined') {
        if (debounce) {
          debouncedSetItem(key, newValue, debounceDelay);
        } else {
          window.localStorage.setItem(key, JSON.stringify(newValue));
        }
      }
    } catch (error) {
      logger.warn(`设置 localStorage 键 "${key}" 失败:`, error);
    }
  }, [key, debounce, debounceDelay]);

  const flushValue = useCallback(() => {
    if (debounceMap.has(key)) {
      clearTimeout(debounceMap.get(key));
      debounceMap.delete(key);
      try {
        window.localStorage.setItem(key, JSON.stringify(valueRef.current));
      } catch (error) {
        logger.warn(`刷新 localStorage 键 "${key}" 失败:`, error);
      }
    }
  }, [key]);

  return [storedValue, setValue, flushValue];
};

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
