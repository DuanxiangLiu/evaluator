import { API_TIMEOUT_MS, DEFAULT_LLM_CONFIG } from '../utils/constants';

export const fetchWithTimeout = async (url, options, timeout = API_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`请求超时 (${timeout / 1000}秒)，请检查网络连接或稍后重试`);
    }
    throw error;
  }
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
    ci: `[${stats.ciLower.toFixed(1)}%, ${stats.ciUpper.toFixed(1)}%]`,
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
