import { calculateImprovement, calculateRatio, quantile, calculateWilcoxonPValue, calculateConfidenceInterval, calculateOutlierBounds, calculatePearsonCorrelation } from '../utils/statistics';
import { getMetricConfig } from '../config/metrics.js';
import { 
  DATA_QUALITY_THRESHOLDS, 
  QUALITY_SCORING 
} from '../config/thresholds.js';
import { findInstColumn } from '../config/business.js';

export const computeStatistics = (metricName, base, comp, casesData, selectedCasesSet) => {
  const metricConfig = getMetricConfig(metricName);
  const isHigherBetter = metricConfig.better === 'higher';
  
  const validCases = casesData
    .filter(d => selectedCasesSet.has(d.Case))
    .map(d => {
      const bVal = d.raw[metricName]?.[base];
      const cVal = d.raw[metricName]?.[comp];
      if (bVal == null || cVal == null) return null;
      
      let imp;
      if (isHigherBetter) {
        if (bVal === 0 && cVal === 0) imp = 0;
        else if (bVal === 0) imp = 100;
        else imp = ((cVal - bVal) / Math.abs(bVal)) * 100;
      } else {
        imp = calculateImprovement(bVal, cVal);
      }
      const ratio = calculateRatio(bVal, cVal);
      
      return { Case: d.Case, bVal, cVal, imp, ratio, meta: d.meta };
    })
    .filter(item => item !== null);

  const n = validCases.length;
  if (n === 0) return null;

  const instCol = findInstColumn(validCases.length > 0 ? Object.keys(validCases[0]?.meta || {}) : []);

  if (instCol) {
    validCases.sort((a, b) => {
      const aVal = parseFloat(a.meta[instCol]) || 0;
      const bVal = parseFloat(b.meta[instCol]) || 0;
      return bVal - aVal;
    });
  }

  const improvements = validCases.map(d => d.imp);
  const positiveRatios = validCases.filter(d => d.ratio > 0).map(d => d.ratio);
  const negativeRatioCount = validCases.filter(d => d.ratio < 0).length;
  const diffs = validCases.map(d => d.bVal - d.cVal);

  let geomeanRatio = 1;
  if (positiveRatios.length > 0) {
    const sumLog = positiveRatios.reduce((acc, val) => acc + Math.log(val), 0);
    geomeanRatio = Math.exp(sumLog / positiveRatios.length);
  }
  
  let geomeanImp = (1 - geomeanRatio) * 100;
  if (negativeRatioCount > validCases.length / 2) {
    geomeanImp = -Math.abs(geomeanImp);
  }
  
  const meanImp = improvements.reduce((a, b) => a + b, 0) / n;
  const pValue = calculateWilcoxonPValue(diffs);

  const variance = n > 1 
    ? improvements.reduce((a, b) => a + Math.pow(b - meanImp, 2), 0) / (n - 1)
    : 0;
  const std = Math.sqrt(variance);
  const { lower: ciLower, upper: ciUpper } = calculateConfidenceInterval(meanImp, variance, n);

  const degradedCount = improvements.filter(imp => imp < 0).length;
  const q1 = quantile(improvements, 0.25);
  const median = quantile(improvements, 0.5);
  const q3 = quantile(improvements, 0.75);
  const minImp = Math.min(...improvements);
  const maxImp = Math.max(...improvements);
  
  const { lower: outlierLower, upper: outlierUpper } = calculateOutlierBounds(q1, q3);

  validCases.forEach(v => {
    if (v.imp > outlierUpper) v.outlierType = 'positive';
    else if (v.imp < outlierLower) v.outlierType = 'negative';
    else v.outlierType = 'normal';
  });

  return {
    geomeanImp,
    meanImp,
    std,
    pValue,
    ciLower,
    ciUpper,
    degradedCount,
    q1,
    median,
    q3,
    iqr: q3 - q1,
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
        percentage: ((missingCount / totalCount) * 100).toFixed(2)
      };
    }
  });
  
  Object.entries(missingDataStats).forEach(([metric, stats]) => {
    if (stats.percentage > DATA_QUALITY_THRESHOLDS.MISSING_DATA.HIGH) {
      issues.push({
        type: 'error',
        code: 'HIGH_MISSING_RATE',
        message: `指标 "${metric}" 的缺失值比例过高 (${stats.percentage}%)`,
        suggestion: '检查数据源或考虑移除该指标'
      });
    } else if (stats.percentage > DATA_QUALITY_THRESHOLDS.MISSING_DATA.MODERATE) {
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
        percentage: ((zeroCount / validCount) * 100).toFixed(2)
      };
    }
  });
  
  Object.entries(zeroValueStats).forEach(([metric, stats]) => {
    if (stats.percentage > DATA_QUALITY_THRESHOLDS.ZERO_VALUES.HIGH) {
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
  
  if (data.length < DATA_QUALITY_THRESHOLDS.SAMPLE_SIZE.MINIMUM) {
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
        quality.score -= QUALITY_SCORING.ISSUE_PENALTY.ERROR;
        break;
      case 'warning':
        quality.score -= QUALITY_SCORING.ISSUE_PENALTY.WARNING;
        break;
      case 'info':
        quality.score -= QUALITY_SCORING.ISSUE_PENALTY.INFO;
        break;
    }
  });
  
  if (data.length < 5) {
    quality.factors.push({
      name: '样本量',
      score: 50,
      message: '样本量过小'
    });
    quality.score -= QUALITY_SCORING.SAMPLE_SIZE_PENALTY.VERY_SMALL;
  } else if (data.length < DATA_QUALITY_THRESHOLDS.SAMPLE_SIZE.SMALL) {
    quality.factors.push({
      name: '样本量',
      score: 75,
      message: '样本量较小'
    });
    quality.score -= QUALITY_SCORING.SAMPLE_SIZE_PENALTY.SMALL;
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
    quality.score -= QUALITY_SCORING.ALGORITHM_COMPARISON_PENALTY.SINGLE_ALGORITHM;
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
      message: `缺失值比例 ${missingRate.toFixed(2)}%`
    });
    quality.score -= QUALITY_SCORING.DATA_COMPLETENESS_PENALTY.HIGH_MISSING;
  } else if (missingRate > 10) {
    quality.factors.push({
      name: '数据完整性',
      score: 70,
      message: `缺失值比例 ${missingRate.toFixed(2)}%`
    });
    quality.score -= QUALITY_SCORING.DATA_COMPLETENESS_PENALTY.MODERATE_MISSING;
  } else {
    quality.factors.push({
      name: '数据完整性',
      score: 100,
      message: `缺失值比例 ${missingRate.toFixed(2)}%`
    });
  }
  
  quality.score = Math.max(0, Math.min(100, quality.score));
  
  return quality;
};
