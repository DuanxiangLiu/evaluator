import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import aiManager from '../services/aiManager';

const AIContext = createContext(null);

export const AIProvider = ({ children }) => {
  const [aiHistory, setAiHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [lastAnalysisId, setLastAnalysisId] = useState(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('eda_ai_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setAiHistory(parsed.slice(-20));
        }
      } catch (e) {
        console.warn('Failed to parse saved AI history:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (aiHistory.length > 0) {
      localStorage.setItem('eda_ai_history', JSON.stringify(aiHistory.slice(-20)));
    }
  }, [aiHistory]);

  const generateDiagnosis = useCallback(async (config, params) => {
    setIsProcessing(true);
    setLastError(null);

    try {
      const result = await aiManager.generateDiagnosis(config, params);
      const analysisId = `diag_${Date.now()}`;
      
      setAiHistory(prev => [...prev, {
        id: analysisId,
        type: 'diagnosis',
        timestamp: new Date().toISOString(),
        params: {
          baseAlgo: params.baseAlgo,
          compareAlgo: params.compareAlgo,
          activeMetric: params.activeMetric
        },
        result: typeof result === 'string' ? result : JSON.stringify(result),
        fromCache: result.fromCache
      }].slice(-20));
      
      setLastAnalysisId(analysisId);
      return result;
    } catch (error) {
      setLastError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const generateCorrelationInsight = useCallback(async (config, params) => {
    setIsProcessing(true);
    setLastError(null);

    try {
      const result = await aiManager.generateCorrelationInsight(config, params);
      const analysisId = `corr_${Date.now()}`;
      
      setAiHistory(prev => [...prev, {
        id: analysisId,
        type: 'correlation',
        timestamp: new Date().toISOString(),
        params: {
          corrX: params.corrX,
          corrY: params.corrY
        },
        result: typeof result === 'string' ? result : JSON.stringify(result),
        fromCache: result.fromCache
      }].slice(-20));
      
      setLastAnalysisId(analysisId);
      return result;
    } catch (error) {
      setLastError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const generateLogRules = useCallback(async (config, logSample, existingMetrics = []) => {
    setIsProcessing(true);
    setLastError(null);

    try {
      const result = await aiManager.generateLogRules(config, logSample, existingMetrics);
      const analysisId = `log_${Date.now()}`;
      
      setAiHistory(prev => [...prev, {
        id: analysisId,
        type: 'log_rules',
        timestamp: new Date().toISOString(),
        params: {
          sampleLength: logSample.length
        },
        result: Array.isArray(result) ? `${result.length} rules generated` : 'Rules generated',
        fromCache: result.fromCache
      }].slice(-20));
      
      setLastAnalysisId(analysisId);
      return result;
    } catch (error) {
      setLastError(error.message);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const submitFeedback = useCallback((analysisId, feedback) => {
    const success = aiManager.addFeedback(analysisId, feedback);
    if (success) {
      setAiHistory(prev => prev.map(item => 
        item.id === analysisId 
          ? { ...item, feedback: { ...feedback, timestamp: Date.now() } }
          : item
      ));
    }
    return success;
  }, []);

  const getHistoricalAnalysis = useCallback((limit = 10) => {
    return aiManager.getHistoricalData(limit);
  }, []);

  const clearHistory = useCallback(() => {
    aiManager.clearHistory();
    setAiHistory([]);
    localStorage.removeItem('eda_ai_history');
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const getStats = useCallback(() => {
    return aiManager.getStats();
  }, []);

  const value = {
    generateDiagnosis,
    generateCorrelationInsight,
    generateLogRules,
    submitFeedback,
    getHistoricalAnalysis,
    clearHistory,
    clearError,
    getStats,
    aiHistory,
    isProcessing,
    lastError,
    lastAnalysisId
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

AIProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export default AIContext;
