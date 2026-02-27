import { calculateImprovement, calculateRatio, quantile, calculateWilcoxonPValue } from '../utils/statistics';
import { validateCSVStructure, VALIDATION_CODES, VALIDATION_SEVERITY, detectDelimiter } from '../utils/validationUtils';

export const EDA_METRICS_CONFIG = {
  // 物理设计指标
  HPWL: { name: '半周长线长', unit: 'um', better: 'lower', description: '布线总长度，值越小越好' },
  TNS: { name: '时序负裕度总和', unit: 'ps', better: 'lower', description: '时序违例总和，值越小越好' },
  WNS: { name: '最差时序负裕度', unit: 'ps', better: 'lower', description: '最差的时序违例，值越小越好' },
  Congestion: { name: '拥塞', unit: '', better: 'lower', description: '布线拥塞程度，值越小越好' },
  Runtime: { name: '运行时间', unit: 's', better: 'lower', description: '算法运行时间，值越小越好' },
  Hb_Count: { name: '闩锁数量', unit: '个', better: 'lower', description: '闩锁数量，值越小越好' },
  Leakage: { name: '泄漏功耗', unit: 'mW', better: 'lower', description: '泄漏功耗，值越小越好' },
  Cell_Area: { name: '单元面积', unit: 'um²', better: 'lower', description: '单元总面积，值越小越好' },
  Metal_Layers: { name: '金属层数', unit: '层', better: 'lower', description: '金属层数，值越小越好' },
  
  // 性能指标
  Frequency: { name: '工作频率', unit: 'MHz', better: 'higher', description: '芯片工作频率，值越大越好' },
  Throughput: { name: '吞吐量', unit: 'GOPS', better: 'higher', description: '数据处理吞吐量，值越大越好' },
  IPC: { name: '每周期指令数', unit: '', better: 'higher', description: '每周期执行的指令数，值越大越好' },
  
  // 可靠性指标
  MTBF: { name: '平均无故障时间', unit: 'h', better: 'higher', description: '平均无故障时间，值越大越好' },
  EDP: { name: '能量延迟积', unit: 'pJ', better: 'lower', description: '能量延迟积，值越小越好' },
};

// 获取指标的评估标准
export const getMetricConfig = (metricName) => {
  return EDA_METRICS_CONFIG[metricName] || {
    name: metricName,
    unit: '',
    better: 'lower', // 默认值越小越好
    description: '自定义指标'
  };
};

// 检查指标是否为内置指标
export const isBuiltInMetric = (metricName) => {
  return !!EDA_METRICS_CONFIG[metricName];
};

export const parseCSV = (csvString) => {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return { data: [], algos: [], metrics: [], metaColumns: [] };
  
  const delimiter = detectDelimiter(csvString);
  const headers = lines[0].split(delimiter).map(h => h.trim());
  
  const algosSet = new Set();
  const metricsSet = new Set();
  const metaCols = [];
  
  headers.forEach(h => {
    if (h.toLowerCase() === 'case') return;
    if (h.startsWith('m_')) {
      const rest = h.substring(2);
      const firstUnderscoreIdx = rest.indexOf('_');
      if (firstUnderscoreIdx > 0) {
        algosSet.add(rest.substring(0, firstUnderscoreIdx));
        metricsSet.add(rest.substring(firstUnderscoreIdx + 1));
      }
    } else {
      metaCols.push(h);
    }
  });

  const algosList = Array.from(algosSet);
  const metricsList = Array.from(metricsSet);
  
  const data = lines.slice(1).map(line => {
    const parts = line.split(delimiter);
    const row = { Case: parts[0]?.trim(), raw: {}, meta: {} };
    const rowMap = {};
    
    headers.forEach((h, i) => { 
      rowMap[h] = parts[i] ? parts[i].trim() : ''; 
    });
    
    metaCols.forEach(m => { 
      row.meta[m] = rowMap[m]; 
    });

    metricsList.forEach(m => {
      row.raw[m] = {};
      algosList.forEach(a => {
        const strVal = rowMap[`m_${a}_${m}`];
        if (!strVal || strVal.toUpperCase() === 'NA' || strVal.toUpperCase() === 'NAN') {
          row.raw[m][a] = null;
        } else {
          const parsed = parseFloat(strVal);
          row.raw[m][a] = isNaN(parsed) ? null : parsed;
        }
      });
    });
    
    return row;
  }).filter(row => row.Case);
  
  return { data, algos: algosList, metrics: metricsList, metaColumns: metaCols };
};

export const computeStatistics = (metricName, base, comp, casesData, selectedCasesSet) => {
  const validCases = casesData
    .filter(d => selectedCasesSet.has(d.Case))
    .map(d => {
      const bVal = d.raw[metricName]?.[base];
      const cVal = d.raw[metricName]?.[comp];
      if (bVal == null || cVal == null) return null;
      
      const imp = calculateImprovement(bVal, cVal);
      const ratio = calculateRatio(bVal, cVal);
      
      return { Case: d.Case, bVal, cVal, imp, ratio, meta: d.meta };
    })
    .filter(item => item !== null);

  const n = validCases.length;
  if (n === 0) return null;

  const improvements = validCases.map(d => d.imp);
  const ratios = validCases.map(d => d.ratio).filter(r => r > 0);
  const diffs = validCases.map(d => d.bVal - d.cVal);

  let geomeanRatio = 1;
  if (ratios.length > 0) {
    const sumLog = ratios.reduce((acc, val) => acc + Math.log(val), 0);
    geomeanRatio = Math.exp(sumLog / ratios.length);
  }
  
  const geomeanImp = (1 - geomeanRatio) * 100;
  const meanImp = improvements.reduce((a, b) => a + b, 0) / n;
  const pValue = calculateWilcoxonPValue(diffs);

  const variance = improvements.reduce((a, b) => a + Math.pow(b - meanImp, 2), 0) / (n - 1 || 1);
  const ciDelta = 1.96 * (Math.sqrt(variance) / Math.sqrt(n));
  const ciLower = meanImp - ciDelta;
  const ciUpper = meanImp + ciDelta;

  const degradedCount = improvements.filter(imp => imp < 0).length;
  const q1 = quantile(improvements, 0.25);
  const median = quantile(improvements, 0.5);
  const q3 = quantile(improvements, 0.75);
  const iqr = q3 - q1;
  const minImp = Math.min(...improvements);
  const maxImp = Math.max(...improvements);
  const outlierUpper = q3 + 1.5 * iqr;
  const outlierLower = q1 - 1.5 * iqr;

  validCases.forEach(v => {
    if (v.imp > outlierUpper) v.outlierType = 'positive';
    else if (v.imp < outlierLower) v.outlierType = 'negative';
    else v.outlierType = 'normal';
  });

  return {
    geomeanImp,
    meanImp,
    pValue,
    ciLower,
    ciUpper,
    degradedCount,
    q1,
    median,
    q3,
    iqr,
    minImp,
    maxImp,
    outlierUpper,
    outlierLower,
    improvements,
    validCases,
    nTotalChecked: selectedCasesSet.size,
    nValid: n
  };
};

export const exportToCSV = (filteredData, activeMetric, baseAlgo, compareAlgo, metaColumns, stats) => {
  let csvContent = `Case,${metaColumns.join(',')},Base_${baseAlgo},Comp_${compareAlgo},Improvement(%),Status\n`;
  
  filteredData.forEach(d => {
    const bVal = d.raw[activeMetric]?.[baseAlgo];
    const cVal = d.raw[activeMetric]?.[compareAlgo];
    const isNull = bVal == null || cVal == null;
    let imp = 0;
    let status = 'Filtered';
    
    if (!isNull) {
      imp = calculateImprovement(bVal, cVal);
      const validMatch = stats?.validCases.find(v => v.Case === d.Case);
      if (validMatch) {
        if (validMatch.outlierType === 'positive') status = 'Significant_Opt';
        else if (validMatch.outlierType === 'negative') status = 'Severe_Degrade';
        else status = imp > 0 ? 'Optimized' : (imp < 0 ? 'Degraded' : 'Neutral');
      }
    }
    
    const metaVals = metaColumns.map(mc => d.meta[mc]).join(',');
    csvContent += `${d.Case},${metaVals},${bVal == null ? 'NaN' : bVal},${cVal == null ? 'NaN' : cVal},${isNull ? '-' : imp.toFixed(2)},${status}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `eda_export_${activeMetric}_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportFullDataToCSV = (data, algos, metrics, metaColumns) => {
  const headers = ['Case', ...metaColumns];
  
  metrics.forEach(metric => {
    algos.forEach(algo => {
      headers.push(`m_${algo}_${metric}`);
    });
  });
  
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = [row.Case];
    
    metaColumns.forEach(mc => {
      values.push(row.meta[mc] ?? '');
    });
    
    metrics.forEach(metric => {
      algos.forEach(algo => {
        const val = row.raw[metric]?.[algo];
        values.push(val == null ? 'NaN' : val.toString());
      });
    });
    
    csvContent += values.join(',') + '\n';
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `eda_full_export_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data, algos, metrics, metaColumns) => {
  const exportData = {
    exportedAt: new Date().toISOString(),
    summary: {
      totalCases: data.length,
      algorithms: algos,
      metrics: metrics,
      metaColumns: metaColumns
    },
    data: data.map(row => ({
      case: row.Case,
      meta: row.meta,
      values: metrics.reduce((acc, metric) => {
        acc[metric] = algos.reduce((algoAcc, algo) => {
          algoAcc[algo] = row.raw[metric]?.[algo] ?? null;
          return algoAcc;
        }, {});
        return acc;
      }, {})
    }))
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `eda_export_${new Date().getTime()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data, algos, metrics, metaColumns, activeMetric, baseAlgo, compareAlgo, stats) => {
  const headers = ['Case', ...metaColumns, `${activeMetric}_${baseAlgo}`, `${activeMetric}_${compareAlgo}`, 'Improvement(%)', 'Status'];
  
  let csvContent = headers.join('\t') + '\n';
  
  data.forEach(row => {
    const bVal = row.raw[activeMetric]?.[baseAlgo];
    const cVal = row.raw[activeMetric]?.[compareAlgo];
    const isNull = bVal == null || cVal == null;
    let imp = 0;
    let status = 'Filtered';
    
    if (!isNull) {
      imp = calculateImprovement(bVal, cVal);
      const validMatch = stats?.validCases.find(v => v.Case === row.Case);
      if (validMatch) {
        if (validMatch.outlierType === 'positive') status = 'Significant_Opt';
        else if (validMatch.outlierType === 'negative') status = 'Severe_Degrade';
        else status = imp > 0 ? 'Optimized' : (imp < 0 ? 'Degraded' : 'Neutral');
      }
    }
    
    const values = [
      row.Case,
      ...metaColumns.map(mc => row.meta[mc] ?? ''),
      bVal == null ? 'NaN' : bVal,
      cVal == null ? 'NaN' : cVal,
      isNull ? '-' : imp.toFixed(2),
      status
    ];
    
    csvContent += values.join('\t') + '\n';
  });
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `eda_export_${activeMetric}_${new Date().getTime()}.tsv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const updateDataValue = (data, caseName, metric, algorithm, newValue) => {
  return data.map(row => {
    if (row.Case === caseName) {
      return {
        ...row,
        raw: {
          ...row.raw,
          [metric]: {
            ...row.raw[metric],
            [algorithm]: newValue
          }
        }
      };
    }
    return row;
  });
};

export const dataToCSVString = (data, algos, metrics, metaColumns) => {
  const headers = ['Case', ...metaColumns];
  
  metrics.forEach(metric => {
    algos.forEach(algo => {
      headers.push(`m_${algo}_${metric}`);
    });
  });
  
  let csvContent = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = [row.Case];
    
    metaColumns.forEach(mc => {
      values.push(row.meta[mc] ?? '');
    });
    
    metrics.forEach(metric => {
      algos.forEach(algo => {
        const val = row.raw[metric]?.[algo];
        values.push(val == null ? 'NaN' : val.toString());
      });
    });
    
    csvContent += values.join(',') + '\n';
  });
  
  return csvContent;
};

export const validateAndParseCSV = (csvString) => {
  const validation = validateCSVStructure(csvString);
  
  if (!validation.valid) {
    return {
      success: false,
      data: [],
      algos: [],
      metrics: [],
      metaColumns: [],
      validation
    };
  }
  
  const parsed = parseCSV(csvString);
  
  return {
    success: true,
    ...parsed,
    validation
  };
};

export const diagnoseDataIssues = (data, algos, metrics) => {
  const issues = [];
  const suggestions = [];
  
  if (algos.length < 2) {
    issues.push({
      type: 'warning',
      code: 'SINGLE_ALGORITHM',
      message: '仅检测到一个算法，无法进行对比分析',
      suggestion: '添加更多算法的指标列以进行对比分析'
    });
  }
  
  const missingDataStats = {};
  metrics.forEach(metric => {
    let missingCount = 0;
    let totalCount = 0;
    
    data.forEach(row => {
      algos.forEach(algo => {
        totalCount++;
        if (row.raw[metric]?.[algo] == null) {
          missingCount++;
        }
      });
    });
    
    if (missingCount > 0) {
      missingDataStats[metric] = {
        missing: missingCount,
        total: totalCount,
        percentage: ((missingCount / totalCount) * 100).toFixed(1)
      };
    }
  });
  
  Object.entries(missingDataStats).forEach(([metric, stats]) => {
    if (stats.percentage > 50) {
      issues.push({
        type: 'error',
        code: 'HIGH_MISSING_RATE',
        message: `指标 "${metric}" 的缺失值比例过高 (${stats.percentage}%)`,
        suggestion: '检查数据源或考虑移除该指标'
      });
    } else if (stats.percentage > 20) {
      issues.push({
        type: 'warning',
        code: 'MODERATE_MISSING_RATE',
        message: `指标 "${metric}" 存在一定比例的缺失值 (${stats.percentage}%)`,
        suggestion: '建议检查数据完整性'
      });
    }
  });
  
  const zeroValueStats = {};
  metrics.forEach(metric => {
    let zeroCount = 0;
    let validCount = 0;
    
    data.forEach(row => {
      algos.forEach(algo => {
        const val = row.raw[metric]?.[algo];
        if (val != null) {
          validCount++;
          if (val === 0) zeroCount++;
        }
      });
    });
    
    if (zeroCount > 0 && validCount > 0) {
      zeroValueStats[metric] = {
        zeros: zeroCount,
        valid: validCount,
        percentage: ((zeroCount / validCount) * 100).toFixed(1)
      };
    }
  });
  
  Object.entries(zeroValueStats).forEach(([metric, stats]) => {
    if (stats.percentage > 30) {
      issues.push({
        type: 'warning',
        code: 'HIGH_ZERO_RATE',
        message: `指标 "${metric}" 的零值比例较高 (${stats.percentage}%)`,
        suggestion: '确认零值是否为有效数据或表示缺失'
      });
    }
  });
  
  const negativeValueMetrics = [];
  metrics.forEach(metric => {
    const config = getMetricConfig(metric);
    if (config.better === 'lower') {
      let hasNegative = false;
      data.forEach(row => {
        algos.forEach(algo => {
          const val = row.raw[metric]?.[algo];
          if (val != null && val < 0) {
            hasNegative = true;
          }
        });
      });
      if (hasNegative) {
        negativeValueMetrics.push(metric);
      }
    }
  });
  
  if (negativeValueMetrics.length > 0) {
    issues.push({
      type: 'info',
      code: 'NEGATIVE_VALUES',
      message: `以下指标存在负值: ${negativeValueMetrics.join(', ')}`,
      suggestion: '确认负值是否符合预期'
    });
  }
  
  if (data.length < 10) {
    issues.push({
      type: 'warning',
      code: 'SMALL_SAMPLE_SIZE',
      message: `样本量较小 (${data.length} 条)，统计显著性可能受限`,
      suggestion: '建议增加测试用例数量以提高统计可靠性'
    });
  }
  
  issues.forEach(issue => {
    if (issue.suggestion) {
      suggestions.push(issue.suggestion);
    }
  });
  
  return {
    issues,
    suggestions: [...new Set(suggestions)],
    stats: {
      missingData: missingDataStats,
      zeroValues: zeroValueStats,
      dataSize: data.length,
      algorithmCount: algos.length,
      metricCount: metrics.length
    }
  };
};

export const suggestDataFixes = (csvString, validation) => {
  const fixes = [];
  
  if (!validation.valid) {
    validation.errors.forEach(error => {
      switch (error.code) {
        case VALIDATION_CODES.NO_CASE_COLUMN:
          fixes.push({
            type: 'auto',
            description: '添加 Case 列作为第一列',
            apply: (lines) => {
              return lines.map((line, idx) => {
                if (idx === 0) return 'Case,' + line;
                return `Case${idx},` + line;
              });
            }
          });
          break;
          
        case VALIDATION_CODES.INCONSISTENT_COLUMNS:
          fixes.push({
            type: 'manual',
            description: `第 ${error.row} 行的列数不一致，需要手动检查并修复`,
            row: error.row
          });
          break;
          
        case VALIDATION_CODES.EMPTY_CASE_NAME:
          fixes.push({
            type: 'auto',
            description: `为第 ${error.row} 行生成默认用例名称`,
            apply: (lines) => {
              if (lines[error.row - 1]) {
                const parts = lines[error.row - 1].split(',');
                if (parts[0] === '') {
                  parts[0] = `Unnamed_${error.row}`;
                  lines[error.row - 1] = parts.join(',');
                }
              }
              return lines;
            }
          });
          break;
          
        default:
          break;
      }
    });
  }
  
  return fixes;
};

export const generateDataSummary = (data, algos, metrics, metaColumns) => {
  const summary = {
    overview: {
      totalCases: data.length,
      algorithmCount: algos.length,
      metricCount: metrics.length,
      metaColumnCount: metaColumns.length
    },
    algorithms: algos.map(algo => ({
      name: algo,
      metrics: {}
    })),
    metrics: metrics.map(metric => {
      const config = getMetricConfig(metric);
      const values = [];
      
      data.forEach(row => {
        algos.forEach(algo => {
          const val = row.raw[metric]?.[algo];
          if (val != null) values.push(val);
        });
      });
      
      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = values.length > 0 ? sum / values.length : 0;
      
      return {
        name: metric,
        displayName: config.name,
        unit: config.unit,
        better: config.better,
        stats: {
          min: sorted[0] ?? null,
          max: sorted[sorted.length - 1] ?? null,
          mean: mean,
          median: sorted[Math.floor(sorted.length / 2)] ?? null,
          validCount: values.length,
          missingCount: data.length * algos.length - values.length
        }
      };
    }),
    metaColumns: metaColumns.map(col => {
      const values = data.map(row => row.meta[col]).filter(v => v != null && v !== '');
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      
      return {
        name: col,
        type: numericValues.length === values.length ? 'numeric' : 'string',
        uniqueCount: new Set(values).size
      };
    })
  };
  
  algos.forEach((algo, idx) => {
    metrics.forEach(metric => {
      const values = data
        .map(row => row.raw[metric]?.[algo])
        .filter(v => v != null);
      
      if (values.length > 0) {
        summary.algorithms[idx].metrics[metric] = {
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          validCount: values.length
        };
      }
    });
  });
  
  return summary;
};

export const checkDataQuality = (data, algos, metrics) => {
  const quality = {
    score: 100,
    factors: []
  };
  
  const diagnosis = diagnoseDataIssues(data, algos, metrics);
  
  diagnosis.issues.forEach(issue => {
    switch (issue.type) {
      case 'error':
        quality.score -= 20;
        break;
      case 'warning':
        quality.score -= 10;
        break;
      case 'info':
        quality.score -= 2;
        break;
    }
  });
  
  if (data.length < 5) {
    quality.factors.push({
      name: '样本量',
      score: 50,
      message: '样本量过小'
    });
    quality.score -= 25;
  } else if (data.length < 20) {
    quality.factors.push({
      name: '样本量',
      score: 75,
      message: '样本量较小'
    });
    quality.score -= 10;
  } else {
    quality.factors.push({
      name: '样本量',
      score: 100,
      message: '样本量充足'
    });
  }
  
  if (algos.length < 2) {
    quality.factors.push({
      name: '算法对比',
      score: 0,
      message: '仅有一个算法，无法对比'
    });
    quality.score -= 30;
  } else {
    quality.factors.push({
      name: '算法对比',
      score: 100,
      message: `${algos.length} 个算法可对比`
    });
  }
  
  let totalMissing = 0;
  let totalValues = 0;
  metrics.forEach(metric => {
    data.forEach(row => {
      algos.forEach(algo => {
        totalValues++;
        if (row.raw[metric]?.[algo] == null) {
          totalMissing++;
        }
      });
    });
  });
  
  const missingRate = totalValues > 0 ? (totalMissing / totalValues) * 100 : 0;
  if (missingRate > 30) {
    quality.factors.push({
      name: '数据完整性',
      score: 40,
      message: `缺失值比例 ${missingRate.toFixed(1)}%`
    });
    quality.score -= 20;
  } else if (missingRate > 10) {
    quality.factors.push({
      name: '数据完整性',
      score: 70,
      message: `缺失值比例 ${missingRate.toFixed(1)}%`
    });
    quality.score -= 10;
  } else {
    quality.factors.push({
      name: '数据完整性',
      score: 100,
      message: `缺失值比例 ${missingRate.toFixed(1)}%`
    });
  }
  
  quality.score = Math.max(0, Math.min(100, quality.score));
  
  return quality;
};
