import { API_TIMEOUT_MS, DEFAULT_LLM_CONFIG, CORRELATION_ANALYSIS_PROMPT } from '../utils/constants';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000;

export const fetchWithTimeout = async (url, options, timeout = API_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`请求超时 (${timeout / 1000}秒)，请检查网络连接或稍后重试`);
    }
    throw error;
  }
};

export const callLLMAPIWithRetry = async (config, promptPayload, retryCount = 0) => {
  try {
    let text = '';
    
    if (config.provider === 'gemini') {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptPayload }] }],
            systemInstruction: { parts: [{ text: config.systemPrompt }] }
          })
        }
      );
      
      const result = await response.json();
      text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: config.systemPrompt },
            { role: 'user', content: promptPayload }
          ],
          temperature: 0.7
        })
      });
      
      const result = await response.json();
      text = result.choices?.[0]?.message?.content;
    }
    
    if (!text) {
      throw new Error('API 未返回有效的文本内容。');
    }
    
    return text;
  } catch (error) {
    const isRetryable = error.message.includes('timeout') || 
                        error.message.includes('network') ||
                        error.message.includes('429') ||
                        error.message.includes('503');
    
    if (retryCount < MAX_RETRY_ATTEMPTS && isRetryable) {
      const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callLLMAPIWithRetry(config, promptPayload, retryCount + 1);
    }
    
    throw error;
  }
};

export const getFallbackAnalysis = (stats, allMetricsStats, baseAlgo, compareAlgo) => {
  const significantMetrics = allMetricsStats.filter(m => m.stats?.pValue < 0.05);
  const improvedMetrics = allMetricsStats.filter(m => m.stats?.geomeanImp > 0);
  const degradedMetrics = allMetricsStats.filter(m => m.stats?.geomeanImp < 0);
  
  return `## 📊 算法评估报告 (离线分析)

### 🎯 1. 最终判定结论
- **推荐结论**：${stats.geomeanImp > 0 ? `【推荐采用 ${compareAlgo}】` : `【建议保持 ${baseAlgo}】`}
- **核心依据**：几何平均改进率 ${stats.geomeanImp.toFixed(2)}%，P值 ${stats.pValue.toFixed(4)}

### 📊 2. 统计分析摘要
- **几何平均改进率**：${stats.geomeanImp.toFixed(2)}%
- **算术平均改进率**：${stats.meanImp.toFixed(2)}%
- **P值**：${stats.pValue.toFixed(4)} ${stats.pValue < 0.05 ? '✓ 统计显著' : '✗ 不显著'}
- **95%置信区间**：[${stats.ciLower.toFixed(2)}%, ${stats.ciUpper.toFixed(2)}%]
- **有效样本数**：${stats.nValid} / ${stats.nTotalChecked}
- **退化案例数**：${stats.degradedCount}

### 📈 3. 多指标综合分析
- **改进指标**：${improvedMetrics.length} 个
- **退化指标**：${degradedMetrics.length} 个
- **显著指标**：${significantMetrics.length} 个

### ⚠️ 4. 注意事项
- 此为离线分析报告，AI服务暂时不可用
- 建议检查API配置后重新生成完整分析
- 数据仅供参考，请结合实际情况判断`;
};

export const generateHistoricalComparison = (currentStats, historicalData) => {
  if (!historicalData || historicalData.length === 0) {
    return null;
  }
  
  const latestHistorical = historicalData[historicalData.length - 1];
  const improvementTrend = currentStats.geomeanImp - (latestHistorical.geomeanImp || 0);
  const pValueChange = currentStats.pValue - (latestHistorical.pValue || 1);
  
  return {
    previousGeomeanImp: latestHistorical.geomeanImp,
    currentGeomeanImp: currentStats.geomeanImp,
    improvementTrend,
    pValueChange,
    trendDirection: improvementTrend > 0 ? 'improving' : improvementTrend < 0 ? 'declining' : 'stable',
    dataPoints: historicalData.length
  };
};

export const analyzePerformanceTrend = (historicalData) => {
  if (!historicalData || historicalData.length < 2) {
    return null;
  }
  
  const improvements = historicalData.map(d => d.geomeanImp).filter(v => v != null);
  if (improvements.length < 2) return null;
  
  const firstHalf = improvements.slice(0, Math.floor(improvements.length / 2));
  const secondHalf = improvements.slice(Math.floor(improvements.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const trend = secondAvg - firstAvg;
  
  return {
    trend,
    trendDirection: trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable',
    volatility: Math.sqrt(improvements.reduce((sum, v) => sum + Math.pow(v - (firstAvg + secondAvg) / 2, 2), 0) / improvements.length),
    dataPoints: improvements.length
  };
};

export const generateAIInsights = async (config, baseAlgo, compareAlgo, activeMetric, stats, allMetricsStats, parsedData, selectedCases, metaColumns) => {
  if (!stats || !activeMetric) {
    throw new Error('统计数据不完整，无法生成分析');
  }

  if (config.provider !== 'gemini' && !config.apiKey) {
    throw new Error(`请先配置 ${config.provider} API Key`);
  }

  const badCases = stats.validCases
    .filter(d => d.imp < 0)
    .sort((a, b) => a.imp - b.imp)
    .slice(0, 10)
    .map(d => ({
      case: d.Case,
      base: d.bVal,
      compare: d.cVal,
      diff_pct: d.imp.toFixed(2) + '%'
    }));

  const topCases = stats.validCases
    .filter(d => d.imp > 0)
    .sort((a, b) => b.imp - a.imp)
    .slice(0, 5)
    .map(d => ({
      case: d.Case,
      base: d.bVal,
      compare: d.cVal,
      diff_pct: d.imp.toFixed(2) + '%'
    }));

  let largeCases = [];
  const scaleCol = metaColumns.find(c => 
    c.toLowerCase().includes('instance') || 
    c.toLowerCase().includes('inst') ||
    c.toLowerCase().includes('cell') || 
    c.toLowerCase().includes('net')
  );
  
  if (scaleCol) {
    largeCases = [...stats.validCases]
      .sort((a, b) => (parseFloat(b.meta[scaleCol]) || 0) - (parseFloat(a.meta[scaleCol]) || 0))
      .slice(0, 5)
      .map(d => ({
        case: d.Case,
        scale: d.meta[scaleCol],
        diff_pct: d.imp.toFixed(2) + '%'
      }));
  }

  const allMetricsSummary = allMetricsStats
    .map(m => {
      if (!m.stats) return `- ${m.metric}: 无有效数据`;
      const sig = m.stats.pValue < 0.05 ? '✓ 显著' : '✗ 不显著';
      return `- ${m.metric}: Geomean=${m.stats.geomeanImp.toFixed(2)}%, P-Value=${m.stats.pValue.toFixed(3)} (${sig}), 退化=${m.stats.degradedCount}`;
    })
    .join('\n');

  const statsSummary = {
    metric: activeMetric,
    geomeanImp: stats.geomeanImp.toFixed(2) + '%',
    meanImp: stats.meanImp.toFixed(2) + '%',
    pValue: stats.pValue.toFixed(4),
    ci: `[${stats.ciLower.toFixed(2)}%, ${stats.ciUpper.toFixed(2)}%]`,
    degradedCount: stats.degradedCount,
    nValid: stats.nValid,
    nTotal: stats.nTotalChecked,
    maxImprovement: stats.maxImp ? stats.maxImp.toFixed(2) + '%' : 'N/A',
    maxDegradation: stats.minImp ? stats.minImp.toFixed(2) + '%' : 'N/A'
  };

  const promptPayload = config.userPrompt
    .replace(/{{baseAlgo}}/g, baseAlgo)
    .replace(/{{compareAlgo}}/g, compareAlgo)
    .replace(/{{activeMetric}}/g, activeMetric)
    .replace(/{{allMetricsSummary}}/g, allMetricsSummary)
    .replace(/{{badCases}}/g, JSON.stringify(badCases, null, 2))
    .replace(/{{largeCases}}/g, JSON.stringify(largeCases, null, 2))
    .replace(/{{statsSummary}}/g, JSON.stringify(statsSummary, null, 2))
    .replace(/{{topCases}}/g, JSON.stringify(topCases, null, 2));

  try {
    let text = '';
    
    if (config.provider === 'gemini') {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptPayload }] }],
            systemInstruction: { parts: [{ text: config.systemPrompt }] }
          })
        }
      );
      
      if (response.status === 401) {
        throw new Error("API Key 无效或未授权 (401错误)。请点击配置重新填入。");
      }
      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status}`);
      }
      
      const result = await response.json();
      text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: config.systemPrompt },
            { role: 'user', content: promptPayload }
          ],
          temperature: 0.7
        })
      });
      
      if (response.status === 401) {
        throw new Error("API Key 无效或未授权 (401错误)。请检查 API Key 设置。");
      }
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const result = await response.json();
      text = result.choices?.[0]?.message?.content;
    }
    
    if (!text) {
      throw new Error('API 未返回有效的文本内容。');
    }
    
    return text;
  } catch (error) {
    throw new Error(`调用失败: ${error.message}`);
  }
};

export const generateCorrelationInsight = async (config, params) => {
  const { corrX, corrY, pearsonR, spearmanR, slope, rSquared, outlierCount, dataPoints, distributionInfo } = params;
  
  if (config.provider !== 'gemini' && !config.apiKey) {
    throw new Error(`请先配置 ${config.provider} API Key`);
  }
  
  const systemPrompt = CORRELATION_ANALYSIS_PROMPT.systemPrompt;
  const promptPayload = CORRELATION_ANALYSIS_PROMPT.userPrompt
    .replace(/{{corrX}}/g, corrX)
    .replace(/{{corrY}}/g, corrY)
    .replace(/{{dataPoints}}/g, dataPoints)
    .replace(/{{pearsonR}}/g, pearsonR !== null ? pearsonR.toFixed(3) : 'N/A')
    .replace(/{{spearmanR}}/g, spearmanR !== null ? spearmanR.toFixed(3) : 'N/A')
    .replace(/{{slope}}/g, slope !== null ? slope.toFixed(4) : 'N/A')
    .replace(/{{rSquared}}/g, rSquared !== null ? rSquared.toFixed(3) : 'N/A')
    .replace(/{{outlierCount}}/g, outlierCount)
    .replace(/{{distributionInfo}}/g, distributionInfo || '无特殊分布特征');
  
  try {
    let text = '';
    
    if (config.provider === 'gemini') {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptPayload }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        }
      );
      
      if (response.status === 401) {
        throw new Error("API Key 无效或未授权 (401错误)。请点击配置重新填入。");
      }
      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status}`);
      }
      
      const result = await response.json();
      text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: promptPayload }
          ],
          temperature: 0.7
        })
      });
      
      if (response.status === 401) {
        throw new Error("API Key 无效或未授权 (401错误)。请检查 API Key 设置。");
      }
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const result = await response.json();
      text = result.choices?.[0]?.message?.content;
    }
    
    if (!text) {
      throw new Error('API 未返回有效的文本内容。');
    }
    
    return text;
  } catch (error) {
    throw new Error(`调用失败: ${error.message}`);
  }
};

export const renderMarkdownText = (text) => {
  let lines = text.split('\n');
  
  let startIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('###') || line.startsWith('##') || line.startsWith('🎯') || line.startsWith('📊')) {
      startIndex = i;
      break;
    }
  }
  
  lines = lines.slice(startIndex);
  
  return lines.map((line, i) => {
    if (line.trim() === '') return null;
    
    if (line.startsWith('### ')) {
      return (
        <h3 key={i} className="text-lg font-bold text-indigo-800 mt-6 mb-3 border-b border-indigo-100 pb-1">
          {line.replace('### ', '')}
        </h3>
      );
    }
    
    if (line.startsWith('## ')) {
      return (
        <h2 key={i} className="text-xl font-bold text-indigo-900 mt-6 mb-3 border-b border-indigo-200 pb-2">
          {line.replace('## ', '')}
        </h2>
      );
    }
    
    if (line.startsWith('- ')) {
      const content = line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-900 font-bold">$1</strong>');
      return (
        <li key={i} className="ml-4 list-disc mb-1 marker:text-indigo-400" dangerouslySetInnerHTML={{ __html: content }} />
      );
    }
    
    if (line.trim() === '---') return null;
    
    const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-900 font-bold">$1</strong>');
    return <p key={i} className="mb-2 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
  }).filter(Boolean);
};

export { DEFAULT_LLM_CONFIG };
