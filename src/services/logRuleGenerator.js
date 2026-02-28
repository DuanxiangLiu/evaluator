import { API_TIMEOUT_MS } from '../utils/constants';
import { fetchWithTimeout } from './aiService';

export const LOG_RULE_GENERATION_PROMPT = `你是一位正则表达式专家，专门处理EDA工具日志解析。你的任务是根据用户提供的日志样例，生成用于提取关键指标数据的正则表达式规则。

**输出要求：**
1. 返回JSON格式，包含提取规则的数组
2. 每个规则包含：id、name、metric、patterns（正则表达式数组）、description、unit
3. 正则表达式必须包含捕获组来提取数值
4. 只返回JSON，不要包含其他解释文字

**规则格式示例：**
\`\`\`json
{
  "rules": [
    {
      "id": "hpwl",
      "name": "HPWL",
      "metric": "HPWL",
      "patterns": ["HPWL\\\\s*[:=]?\\\\s*([\\\\d,\\\\.]+)"],
      "description": "半周长线长",
      "unit": "um"
    }
  ]
}
\`\`\`

**注意事项：**
- 正则表达式要能匹配日志中的数值部分
- 考虑数值可能包含逗号分隔符（如1,234,567）
- 考虑数值可能带有单位（如ps、mW、MHz）
- 对于可能有负值的指标（如TNS、WNS），正则要支持负号
- 优先匹配日志中最终/汇总的结果值`;

export const generateLogExtractionRules = async (config, logSample, existingMetrics = []) => {
  if (!logSample || logSample.trim().length === 0) {
    throw new Error('日志样例不能为空');
  }

  if (config.provider !== 'gemini' && !config.apiKey) {
    throw new Error(`请先配置 ${config.provider} API Key`);
  }

  const userPrompt = `请分析以下日志样例，生成用于提取关键指标数据的正则表达式规则。

**日志样例：**
\`\`\`
${logSample}
\`\`\`

${existingMetrics.length > 0 ? `**已有指标（请优先保留这些指标的规则）：**\n${existingMetrics.join(', ')}` : ''}

**要求：**
1. 识别日志中的所有关键指标（如HPWL、TNS、WNS、Runtime、Congestion等）
2. 为每个指标生成至少一个正则表达式
3. 正则表达式要能准确匹配日志格式
4. 返回JSON格式的规则数组`;

  try {
    let text = '';

    if (config.provider === 'gemini') {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: LOG_RULE_GENERATION_PROMPT }] },
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (response.status === 401) {
        throw new Error("API Key 无效或未授权");
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
            { role: 'system', content: LOG_RULE_GENERATION_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });

      if (response.status === 401) {
        throw new Error("API Key 无效或未授权");
      }
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      text = result.choices?.[0]?.message?.content;
    }

    if (!text) {
      throw new Error('API 未返回有效内容');
    }

    const parsed = JSON.parse(text);
    const rules = parsed.rules || parsed;

    if (!Array.isArray(rules)) {
      throw new Error('返回的规则格式不正确');
    }

    return validateAndFixRules(rules);
  } catch (error) {
    if (error.name === 'SyntaxError') {
      throw new Error('AI返回的内容无法解析为有效的JSON');
    }
    throw new Error(`生成规则失败: ${error.message}`);
  }
};

export const validateAndFixRules = (rules) => {
  return rules.map((rule, index) => {
    const fixedRule = {
      id: rule.id || `rule_${Date.now()}_${index}`,
      name: rule.name || rule.metric || `规则${index + 1}`,
      metric: rule.metric || rule.name || `Metric_${index + 1}`,
      patterns: [],
      description: rule.description || '',
      unit: rule.unit || ''
    };

    if (Array.isArray(rule.patterns)) {
      fixedRule.patterns = rule.patterns.map(p => {
        if (typeof p === 'string') {
          return p;
        }
        if (p instanceof RegExp) {
          return p.source;
        }
        return String(p);
      });
    } else if (typeof rule.patterns === 'string') {
      fixedRule.patterns = [rule.patterns];
    } else if (rule.patterns instanceof RegExp) {
      fixedRule.patterns = [rule.patterns.source];
    }

    fixedRule.patterns = fixedRule.patterns.filter(p => {
      try {
        new RegExp(p);
        return true;
      } catch {
        return false;
      }
    });

    return fixedRule;
  }).filter(rule => rule.patterns.length > 0);
};

export const testRuleAgainstLog = (rule, logContent) => {
  const results = [];
  const lines = logContent.split('\n');

  for (const pattern of rule.patterns) {
    try {
      const regex = new RegExp(pattern, 'gi');
      let match;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        regex.lastIndex = 0;

        while ((match = regex.exec(line)) !== null) {
          const value = match[1] ? parseFloat(match[1].replace(/,/g, '')) : null;
          results.push({
            line: i + 1,
            content: line.trim(),
            matchedText: match[0],
            extractedValue: value,
            isValid: value !== null && !isNaN(value)
          });
        }
      }
    } catch (error) {
      results.push({
        error: `正则表达式错误: ${error.message}`,
        pattern: pattern
      });
    }
  }

  return {
    rule: rule,
    matchCount: results.filter(r => !r.error).length,
    validCount: results.filter(r => r.isValid).length,
    results: results
  };
};

export const optimizeRule = async (config, rule, logSample, failedCases = []) => {
  const prompt = `请优化以下正则表达式规则，使其能更好地匹配日志数据。

**当前规则：**
\`\`\`json
${JSON.stringify(rule, null, 2)}
\`\`\`

**日志样例：**
\`\`\`
${logSample}
\`\`\`

${failedCases.length > 0 ? `**匹配失败的案例：**\n${failedCases.join('\n')}` : ''}

**要求：**
1. 保持规则的id和metric不变
2. 优化或添加正则表达式模式
3. 确保能匹配日志中的目标值
4. 返回JSON格式的完整规则`;

  try {
    let text = '';

    if (config.provider === 'gemini') {
      const response = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: LOG_RULE_GENERATION_PROMPT }] },
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
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
            { role: 'system', content: LOG_RULE_GENERATION_PROMPT },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      text = result.choices?.[0]?.message?.content;
    }

    if (!text) {
      throw new Error('API 未返回有效内容');
    }

    const optimizedRule = JSON.parse(text);
    return validateAndFixRules([optimizedRule])[0];
  } catch (error) {
    throw new Error(`优化规则失败: ${error.message}`);
  }
};

export const suggestImprovements = (testResults, logSample) => {
  const suggestions = [];

  if (testResults.matchCount === 0) {
    suggestions.push({
      type: 'error',
      message: '规则未能匹配任何内容',
      suggestion: '检查正则表达式语法，确保与日志格式匹配'
    });
  }

  if (testResults.matchCount > 0 && testResults.validCount === 0) {
    suggestions.push({
      type: 'warning',
      message: '匹配成功但未能提取有效数值',
      suggestion: '确保正则表达式包含捕获组来提取数值部分'
    });
  }

  const invalidResults = testResults.results.filter(r => r.matchedText && !r.isValid);
  if (invalidResults.length > 0) {
    suggestions.push({
      type: 'info',
      message: `发现 ${invalidResults.length} 个无效数值提取`,
      suggestion: '检查捕获组是否正确匹配数值部分（可能包含逗号或单位）'
    });
  }

  return suggestions;
};

export const analyzeLogFormat = (logSample) => {
  const lines = logSample.split('\n');
  const analysis = {
    totalLines: lines.length,
    nonEmptyLines: lines.filter(l => l.trim()).length,
    potentialMetrics: [],
    patterns: []
  };

  const metricPatterns = [
    { pattern: /HPWL|Wirelength|wire.?length/i, name: 'HPWL' },
    { pattern: /TNS|Total.?Negative.?Slack/i, name: 'TNS' },
    { pattern: /WNS|Worst.?Negative.?Slack/i, name: 'WNS' },
    { pattern: /Congestion|Overflow/i, name: 'Congestion' },
    { pattern: /Runtime|Time|Elapsed/i, name: 'Runtime' },
    { pattern: /Leakage|Power/i, name: 'Leakage' },
    { pattern: /Area|Cell.?Area/i, name: 'Cell_Area' },
    { pattern: /Instance|Inst|#Inst/i, name: 'Inst' },
    { pattern: /Net|#Net/i, name: 'Net' },
    { pattern: /Macro|#Macro/i, name: 'Macro' },
    { pattern: /Frequency|Clock/i, name: 'Frequency' }
  ];

  for (const { pattern, name } of metricPatterns) {
    const matchingLines = lines.filter(l => pattern.test(l));
    if (matchingLines.length > 0) {
      analysis.potentialMetrics.push({
        name,
        count: matchingLines.length,
        samples: matchingLines.slice(0, 3).map(l => l.trim())
      });
    }
  }

  const numberPattern = /[-+]?\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?/g;
  const linesWithNumbers = lines.filter(l => numberPattern.test(l));
  if (linesWithNumbers.length > 0) {
    analysis.patterns.push({
      type: 'numeric_values',
      count: linesWithNumbers.length,
      description: '包含数值的行'
    });
  }

  return analysis;
};
