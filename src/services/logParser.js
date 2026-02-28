export const DEFAULT_EXTRACTION_RULES = [
  {
    id: 'hpwl',
    name: 'HPWL',
    metric: 'HPWL',
    patterns: [
      /HPWL\s*[:=]?\s*([\d,\.]+)/i,
      /Total\s+HPWL\s*[:=]?\s*([\d,\.]+)/i,
      /hpwl\s*=\s*([\d,\.]+)/i,
      /Wirelength\s*[:=]?\s*([\d,\.]+)/i,
    ],
    description: '半周长线长',
    unit: 'um'
  },
  {
    id: 'tns',
    name: 'TNS',
    metric: 'TNS',
    patterns: [
      /TNS\s*[:=]?\s*([-\d,\.]+)/i,
      /Total\s+Negative\s+Slack\s*[:=]?\s*([-\d,\.]+)/i,
      /tns\s*=\s*([-\d,\.]+)/i,
    ],
    description: '时序负裕度总和',
    unit: 'ps'
  },
  {
    id: 'wns',
    name: 'WNS',
    metric: 'WNS',
    patterns: [
      /WNS\s*[:=]?\s*([-\d,\.]+)/i,
      /Worst\s+Negative\s+Slack\s*[:=]?\s*([-\d,\.]+)/i,
      /wns\s*=\s*([-\d,\.]+)/i,
    ],
    description: '最差时序负裕度',
    unit: 'ps'
  },
  {
    id: 'congestion',
    name: 'Congestion',
    metric: 'Congestion',
    patterns: [
      /Congestion\s*[:=]?\s*([\d,\.]+)/i,
      /congestion\s*=\s*([\d,\.]+)/i,
      /Overflow\s*[:=]?\s*([\d,\.]+)/i,
      /Global\s+Congestion\s*[:=]?\s*([\d,\.]+)/i,
    ],
    description: '拥塞',
    unit: ''
  },
  {
    id: 'runtime',
    name: 'Runtime',
    metric: 'Runtime',
    patterns: [
      /Runtime\s*[:=]?\s*([\d,\.]+)\s*(s|sec|seconds)?/i,
      /Total\s+Time\s*[:=]?\s*([\d,\.]+)\s*(s|sec|seconds)?/i,
      /Elapsed\s+Time\s*[:=]?\s*([\d,\.]+)\s*(s|sec|seconds)?/i,
      /CPU\s+Time\s*[:=]?\s*([\d,\.]+)\s*(s|sec|seconds)?/i,
      /run_time\s*=\s*([\d,\.]+)/i,
    ],
    description: '运行时间',
    unit: 's'
  },
  {
    id: 'leakage',
    name: 'Leakage',
    metric: 'Leakage',
    patterns: [
      /Leakage\s+Power\s*[:=]?\s*([\d,\.]+)\s*(mW|uW)?/i,
      /leakage\s*=\s*([\d,\.]+)/i,
      /Total\s+Leakage\s*[:=]?\s*([\d,\.]+)/i,
    ],
    description: '泄漏功耗',
    unit: 'mW'
  },
  {
    id: 'cell_area',
    name: 'Cell Area',
    metric: 'Cell_Area',
    patterns: [
      /Cell\s+Area\s*[:=]?\s*([\d,\.]+)/i,
      /Total\s+Area\s*[:=]?\s*([\d,\.]+)/i,
      /cell_area\s*=\s*([\d,\.]+)/i,
    ],
    description: '单元面积',
    unit: 'um²'
  },
  {
    id: 'inst',
    name: 'Instance Count',
    metric: 'Inst',
    patterns: [
      /Instance[s]?\s+(?:Count\s*)?[:=]?\s*([\d,]+)/i,
      /Total\s+Instance[s]?\s*[:=]?\s*([\d,]+)/i,
      /#Inst\s*[:=]?\s*([\d,]+)/i,
      /Number\s+of\s+Instance[s]?\s*[:=]?\s*([\d,]+)/i,
    ],
    description: '实例数量',
    unit: ''
  },
  {
    id: 'net',
    name: 'Net Count',
    metric: 'Net',
    patterns: [
      /Net[s]?\s+(?:Count\s*)?[:=]?\s*([\d,]+)/i,
      /Total\s+Net[s]?\s*[:=]?\s*([\d,]+)/i,
      /#Net\s*[:=]?\s*([\d,]+)/i,
      /Number\s+of\s+Net[s]?\s*[:=]?\s*([\d,]+)/i,
    ],
    description: '网络数量',
    unit: ''
  },
  {
    id: 'macro',
    name: 'Macro Count',
    metric: 'Macro',
    patterns: [
      /Macro[s]?\s+(?:Count\s*)?[:=]?\s*([\d,]+)/i,
      /Total\s+Macro[s]?\s*[:=]?\s*([\d,]+)/i,
      /#Macro\s*[:=]?\s*([\d,]+)/i,
    ],
    description: '宏单元数量',
    unit: ''
  },
  {
    id: 'frequency',
    name: 'Frequency',
    metric: 'Frequency',
    patterns: [
      /Frequency\s*[:=]?\s*([\d,\.]+)\s*(MHz|GHz)?/i,
      /Clock\s+Frequency\s*[:=]?\s*([\d,\.]+)\s*(MHz|GHz)?/i,
      /Target\s+Frequency\s*[:=]?\s*([\d,\.]+)\s*(MHz|GHz)?/i,
    ],
    description: '工作频率',
    unit: 'MHz'
  }
];

export const DEFAULT_ALGORITHM_RULES = [
  {
    id: 'algo1',
    name: '算法一',
    patterns: ['算法一', 'algorithm1', 'algo1', 'Algo1', 'ALGO1', 'base', 'Base', 'BASE'],
    color: '#3B82F6'
  },
  {
    id: 'algo2',
    name: '算法二',
    patterns: ['算法二', 'algorithm2', 'algo2', 'Algo2', 'ALGO2', 'compare', 'Compare', 'COMPARE'],
    color: '#10B981'
  }
];

export const parseNumber = (str) => {
  if (!str) return null;
  const cleaned = str.replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

export const extractMetricFromLine = (line, rules = DEFAULT_EXTRACTION_RULES) => {
  const results = [];
  
  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      const match = line.match(pattern);
      if (match) {
        const value = parseNumber(match[1]);
        if (value !== null) {
          results.push({
            metric: rule.metric,
            value: value,
            rule: rule,
            matchedText: match[0],
            line: line.trim()
          });
          break;
        }
      }
    }
  }
  
  return results;
};

export const parseLogFile = (content, rules = DEFAULT_EXTRACTION_RULES, options = {}) => {
  const {
    caseNamePattern = null,
    extractCaseName = true
  } = options;
  
  const lines = content.split('\n');
  const extractedData = {};
  const allMatches = [];
  let caseName = null;
  
  const casePatterns = [
    /Design\s*[:=]?\s*([\w\-\.]+)/i,
    /Case\s*[:=]?\s*([\w\-\.]+)/i,
    /Test\s*[:=]?\s*([\w\-\.]+)/i,
    /Module\s*[:=]?\s*([\w\-\.]+)/i,
    /Top\s+Module\s*[:=]?\s*([\w\-\.]+)/i,
    /^[\s]*Running\s+([\w\-\.]+)/i,
    /^[\s]*Processing\s+([\w\-\.]+)/i,
  ];
  
  if (caseNamePattern) {
    casePatterns.push(caseNamePattern);
  }
  
  for (const line of lines) {
    if (extractCaseName && !caseName) {
      for (const pattern of casePatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          caseName = match[1].trim();
          break;
        }
      }
    }
    
    const matches = extractMetricFromLine(line, rules);
    if (matches.length > 0) {
      allMatches.push(...matches);
      for (const m of matches) {
        if (!extractedData[m.metric]) {
          extractedData[m.metric] = [];
        }
        extractedData[m.metric].push({
          value: m.value,
          line: m.line,
          matchedText: m.matchedText
        });
      }
    }
  }
  
  const finalData = {};
  for (const [metric, values] of Object.entries(extractedData)) {
    if (values.length > 0) {
      finalData[metric] = values[values.length - 1].value;
    }
  }
  
  return {
    caseName: caseName || 'Unknown',
    extractedData: finalData,
    allMatches: allMatches,
    rawContent: content
  };
};

export const detectAlgorithm = (filePath, algorithmRules = DEFAULT_ALGORITHM_RULES) => {
  const path = filePath.toLowerCase();
  const fileName = filePath.split(/[/\\]/).pop() || '';
  const dirPath = filePath.substring(0, filePath.lastIndexOf(/[/\\]/.test(filePath) ? (filePath.includes('\\') ? '\\' : '/') : 0));
  
  for (const rule of algorithmRules) {
    for (const pattern of rule.patterns) {
      const patternLower = pattern.toLowerCase();
      if (path.includes(patternLower) || fileName.toLowerCase().includes(patternLower)) {
        return {
          id: rule.id,
          name: rule.name,
          color: rule.color,
          matchedPattern: pattern
        };
      }
      if (dirPath && dirPath.toLowerCase().includes(patternLower)) {
        return {
          id: rule.id,
          name: rule.name,
          color: rule.color,
          matchedPattern: pattern,
          matchedFrom: 'directory'
        };
      }
    }
  }
  
  return {
    id: 'unknown',
    name: '未知算法',
    color: '#6B7280',
    matchedPattern: null
  };
};

export const parseMultipleLogFiles = (files, options = {}) => {
  const {
    extractionRules = DEFAULT_EXTRACTION_RULES,
    algorithmRules = DEFAULT_ALGORITHM_RULES,
    caseNamePattern = null
  } = options;
  
  const results = [];
  const errors = [];
  
  for (const file of files) {
    try {
      const parseResult = parseLogFile(file.content, extractionRules, { caseNamePattern });
      const algorithm = detectAlgorithm(file.path, algorithmRules);
      
      results.push({
        id: file.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        filePath: file.path,
        caseName: parseResult.caseName,
        algorithm: algorithm,
        extractedData: parseResult.extractedData,
        allMatches: parseResult.allMatches,
        rawContent: parseResult.rawContent,
        parseTime: new Date().toISOString()
      });
    } catch (error) {
      errors.push({
        file: file.name,
        path: file.path,
        error: error.message
      });
    }
  }
  
  return { results, errors };
};

export const convertToCSVFormat = (parsedResults) => {
  const allMetrics = new Set();
  const allAlgorithms = new Set();
  const caseData = {};
  
  for (const result of parsedResults) {
    const caseName = result.caseName;
    const algoId = result.algorithm.id;
    
    if (!caseData[caseName]) {
      caseData[caseName] = {};
    }
    
    if (!caseData[caseName][algoId]) {
      caseData[caseName][algoId] = {};
    }
    
    for (const [metric, value] of Object.entries(result.extractedData)) {
      allMetrics.add(metric);
      allAlgorithms.add(algoId);
      caseData[caseName][algoId][metric] = value;
    }
  }
  
  const metrics = Array.from(allMetrics).sort();
  const algorithms = Array.from(allAlgorithms).sort();
  
  const headers = ['Case'];
  metrics.forEach(metric => {
    algorithms.forEach(algo => {
      headers.push(`m_${algo}_${metric}`);
    });
  });
  
  const rows = [];
  for (const [caseName, algoData] of Object.entries(caseData)) {
    const row = [caseName];
    metrics.forEach(metric => {
      algorithms.forEach(algo => {
        const value = algoData[algo]?.[metric];
        row.push(value !== undefined ? value.toString() : 'NaN');
      });
    });
    rows.push(row);
  }
  
  return {
    csvString: [headers.join(','), ...rows.map(r => r.join(','))].join('\n'),
    headers,
    rows,
    metrics,
    algorithms,
    caseData
  };
};

export const validateExtractionRules = (rules) => {
  const errors = [];
  const warnings = [];
  
  if (!Array.isArray(rules) || rules.length === 0) {
    errors.push('提取规则不能为空');
    return { valid: false, errors, warnings };
  }
  
  const seenIds = new Set();
  const seenMetrics = new Set();
  
  for (const rule of rules) {
    if (!rule.id) {
      errors.push(`规则缺少 id 字段`);
    } else if (seenIds.has(rule.id)) {
      errors.push(`重复的规则 id: ${rule.id}`);
    } else {
      seenIds.add(rule.id);
    }
    
    if (!rule.metric) {
      errors.push(`规则 "${rule.id || '未知'}" 缺少 metric 字段`);
    } else if (seenMetrics.has(rule.metric)) {
      warnings.push(`多个规则使用相同的 metric: ${rule.metric}`);
    } else {
      seenMetrics.add(rule.metric);
    }
    
    if (!rule.patterns || !Array.isArray(rule.patterns) || rule.patterns.length === 0) {
      errors.push(`规则 "${rule.id || '未知'}" 缺少有效的 patterns 字段`);
    } else {
      for (let i = 0; i < rule.patterns.length; i++) {
        try {
          new RegExp(rule.patterns[i]);
        } catch (e) {
          errors.push(`规则 "${rule.id || '未知'}" 的第 ${i + 1} 个正则表达式无效: ${e.message}`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

export const createCustomRule = (config) => {
  return {
    id: config.id || `custom_${Date.now()}`,
    name: config.name || '自定义规则',
    metric: config.metric || config.name,
    patterns: config.patterns || [],
    description: config.description || '',
    unit: config.unit || ''
  };
};

export const mergeExtractionResults = (results) => {
  const merged = {
    totalFiles: results.length,
    successfulParses: 0,
    failedParses: 0,
    algorithms: new Set(),
    metrics: new Set(),
    cases: new Set(),
    data: []
  };
  
  for (const result of results) {
    if (result.extractedData && Object.keys(result.extractedData).length > 0) {
      merged.successfulParses++;
      merged.algorithms.add(result.algorithm.id);
      merged.cases.add(result.caseName);
      
      for (const metric of Object.keys(result.extractedData)) {
        merged.metrics.add(metric);
      }
      
      merged.data.push(result);
    } else {
      merged.failedParses++;
    }
  }
  
  merged.algorithms = Array.from(merged.algorithms);
  merged.metrics = Array.from(merged.metrics);
  merged.cases = Array.from(merged.cases);
  
  return merged;
};

export const getExtractionStats = (parsedResults) => {
  const stats = {
    totalFiles: parsedResults.length,
    totalCases: 0,
    totalAlgorithms: 0,
    totalMetrics: 0,
    extractionRate: 0,
    byAlgorithm: {},
    byMetric: {}
  };
  
  const cases = new Set();
  const algorithms = new Set();
  const metrics = new Set();
  let successfulExtractions = 0;
  
  for (const result of parsedResults) {
    if (result.extractedData && Object.keys(result.extractedData).length > 0) {
      successfulExtractions++;
      cases.add(result.caseName);
      algorithms.add(result.algorithm.id);
      
      if (!stats.byAlgorithm[result.algorithm.id]) {
        stats.byAlgorithm[result.algorithm.id] = {
          name: result.algorithm.name,
          count: 0,
          metrics: {}
        };
      }
      stats.byAlgorithm[result.algorithm.id].count++;
      
      for (const [metric, value] of Object.entries(result.extractedData)) {
        metrics.add(metric);
        
        if (!stats.byMetric[metric]) {
          stats.byMetric[metric] = { count: 0, sum: 0, values: [] };
        }
        stats.byMetric[metric].count++;
        stats.byMetric[metric].sum += value;
        stats.byMetric[metric].values.push(value);
        
        if (!stats.byAlgorithm[result.algorithm.id].metrics[metric]) {
          stats.byAlgorithm[result.algorithm.id].metrics[metric] = { count: 0, sum: 0 };
        }
        stats.byAlgorithm[result.algorithm.id].metrics[metric].count++;
        stats.byAlgorithm[result.algorithm.id].metrics[metric].sum += value;
      }
    }
  }
  
  stats.totalCases = cases.size;
  stats.totalAlgorithms = algorithms.size;
  stats.totalMetrics = metrics.size;
  stats.extractionRate = parsedResults.length > 0 
    ? ((successfulExtractions / parsedResults.length) * 100).toFixed(1) 
    : 0;
  
  return stats;
};
