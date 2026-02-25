const DEFAULT_PROMPTS = {
  systemPrompt: '你是一位顶级的EDA物理设计与算法评估专家。请基于提供的数据输出结构化的诊断报告，务必将最终推荐结论放在最前面。请使用Markdown排版。',
  userPrompt: `我正在评估EDA新算法。Baseline = {{baseAlgo}}, Compare = {{compareAlgo}}。

【焦点指标 ({{activeMetric}}) 异常预警】
{{badCases}}

【全局多目标表现 (全面权衡)】
{{allMetricsSummary}}

请按以下结构输出报告：
### 1. 🏆 最终对比判定
（明确结论：【推荐采用 {{compareAlgo}}】、【建议保持 {{baseAlgo}}】 或 【需修复重测】）

### 2. 📊 全局 Trade-off 分析
（总体得失，是否在特定指标间存在拆东墙补西墙？）

### 3. 🚨 异常深潜诊断
（推测退化陷阱及物理原因）

### 4. 🏢 扩展性评估
（基于巨型设计评估在大规模 Instance 下的鲁棒性）`
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
    .map(d => ({
      case: d.Case,
      base: d.bVal,
      compare: d.cVal,
      diff_pct: d.imp.toFixed(2) + '%'
    }));

  let largeCases = [];
  const scaleCol = metaColumns.find(c => 
    c.toLowerCase().includes('instance') || 
    c.toLowerCase().includes('cell') || 
    c.toLowerCase().includes('net')
  );
  
  if (scaleCol) {
    largeCases = [...stats.validCases]
      .sort((a, b) => (parseFloat(b.meta[scaleCol]) || 0) - (parseFloat(a.meta[scaleCol]) || 0))
      .slice(0, 3)
      .map(d => ({
        case: d.Case,
        scale: d.meta[scaleCol],
        diff_pct: d.imp.toFixed(2) + '%'
      }));
  }

  const allMetricsSummary = allMetricsStats
    .map(m => `- ${m.metric}: 几何平均改进率 = ${m.stats ? m.stats.geomeanImp.toFixed(2) + '%' : 'N/A'}, P-Value = ${m.stats ? m.stats.pValue.toFixed(3) : 'N/A'}`)
    .join('\n');

  const promptPayload = config.userPrompt
    .replace(/{{baseAlgo}}/g, baseAlgo)
    .replace(/{{compareAlgo}}/g, compareAlgo)
    .replace(/{{activeMetric}}/g, activeMetric)
    .replace(/{{allMetricsSummary}}/g, allMetricsSummary)
    .replace(/{{badCases}}/g, JSON.stringify(badCases))
    .replace(/{{largeCases}}/g, JSON.stringify(largeCases));

  try {
    let text = '';
    
    if (config.provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptPayload }] }],
          systemInstruction: { parts: [{ text: config.systemPrompt }] }
        })
      });
      
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
      const response = await fetch(url, {
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
  return text.split('\n').map((line, i) => {
    if (line.trim() === '') return <br key={i} />;
    
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
    
    const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-900 font-bold">$1</strong>');
    return <p key={i} className="mb-2 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
  });
};

export { DEFAULT_PROMPTS };
