import { generateAIInsights, generateCorrelationInsight } from './aiService.jsx';
import { generateLogExtractionRules } from './logRuleGenerator.js';

const CACHE_EXPIRY_MS = 3600000;
const MAX_HISTORY_SIZE = 50;

class AIManager {
  constructor() {
    this.cache = new Map();
    this.history = [];
    this.config = {
      timeout: 60000,
      retryAttempts: 3
    };
  }

  getCachedResult(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > CACHE_EXPIRY_MS) {
      this.cache.delete(key);
      return null;
    }
    return cached.value;
  }

  setCachedResult(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  addToHistory(analysis) {
    this.history.push({
      ...analysis,
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    });
    
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history.shift();
    }
  }

  getHistoricalData(limit = 10) {
    return this.history.slice(-limit);
  }

  getHistoryById(id) {
    return this.history.find(h => h.id === id);
  }

  generateCacheKey(prefix, params) {
    const stableParams = JSON.stringify(params, Object.keys(params).sort());
    return `${prefix}_${btoa(stableParams).slice(0, 32)}`;
  }

  async generateDiagnosis(config, params) {
    const cacheKey = this.generateCacheKey('diagnosis', {
      base: params.baseAlgo,
      compare: params.compareAlgo,
      metric: params.activeMetric,
      dataHash: params.parsedData?.length || 0
    });
    
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const result = await generateAIInsights(
        config,
        params.baseAlgo,
        params.compareAlgo,
        params.activeMetric,
        params.stats,
        params.allMetricsStats,
        params.parsedData,
        params.selectedCases,
        params.metaColumns
      );
      
      this.setCachedResult(cacheKey, result);
      this.addToHistory({
        type: 'diagnosis',
        params: {
          baseAlgo: params.baseAlgo,
          compareAlgo: params.compareAlgo,
          activeMetric: params.activeMetric
        },
        result
      });
      
      return { ...result, fromCache: false };
    } catch (error) {
      console.error('AIManager: Diagnosis error:', error);
      throw error;
    }
  }

  async generateCorrelationInsight(config, params) {
    const cacheKey = this.generateCacheKey('correlation', {
      x: params.corrX,
      y: params.corrY,
      pearson: params.pearsonR,
      spearman: params.spearmanR
    });
    
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const result = await generateCorrelationInsight(config, params);
      
      this.setCachedResult(cacheKey, result);
      this.addToHistory({
        type: 'correlation',
        params: {
          corrX: params.corrX,
          corrY: params.corrY
        },
        result
      });
      
      return { ...result, fromCache: false };
    } catch (error) {
      console.error('AIManager: Correlation insight error:', error);
      throw error;
    }
  }

  async generateLogRules(config, logSample, existingMetrics = []) {
    const cacheKey = this.generateCacheKey('log_rules', {
      sample: logSample.slice(0, 200),
      metrics: existingMetrics.slice(0, 5)
    });
    
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      const result = await generateLogExtractionRules(config, logSample, existingMetrics);
      
      this.setCachedResult(cacheKey, result);
      this.addToHistory({
        type: 'log_rules',
        params: {
          sampleLength: logSample.length,
          existingMetrics
        },
        result
      });
      
      return { ...result, fromCache: false };
    } catch (error) {
      console.error('AIManager: Log rules generation error:', error);
      throw error;
    }
  }

  addFeedback(analysisId, feedback) {
    const analysis = this.history.find(h => h.id === analysisId);
    if (analysis) {
      analysis.feedback = {
        ...feedback,
        timestamp: Date.now()
      };
      return true;
    }
    return false;
  }

  getFeedbackStats() {
    const withFeedback = this.history.filter(h => h.feedback);
    return {
      total: this.history.length,
      withFeedback: withFeedback.length,
      positiveCount: withFeedback.filter(h => h.feedback?.rating === 'positive').length,
      negativeCount: withFeedback.filter(h => h.feedback?.rating === 'negative').length
    };
  }

  clearCache() {
    this.cache.clear();
  }

  clearHistory() {
    this.history = [];
  }

  exportHistory() {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      history: this.history,
      stats: this.getFeedbackStats()
    }, null, 2);
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      historySize: this.history.length,
      ...this.getFeedbackStats()
    };
  }
}

export const aiManager = new AIManager();
export default aiManager;
