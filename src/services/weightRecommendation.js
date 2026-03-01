import { getMetricConfig } from '../config/metrics.js';

export const WEIGHT_PRESETS = {
  balanced: {
    name: '均衡模式',
    description: '所有指标权重相等，适用于综合评估',
    icon: 'Scale',
    getWeights: (metrics) => {
      const weight = 100 / metrics.length;
      const weights = {};
      metrics.forEach(m => weights[m] = weight);
      return weights;
    }
  },
  timing: {
    name: '时序优先',
    description: '优先考虑时序相关指标 (TNS, WNS)',
    icon: 'Clock',
    priorityMetrics: ['TNS', 'WNS', 'Timing', 'Slack'],
    getWeights: (metrics) => {
      const weights = {};
      const timingMetrics = metrics.filter(m => 
        ['TNS', 'WNS', 'Timing', 'Slack', 'Frequency'].includes(m)
      );
      const otherMetrics = metrics.filter(m => !timingMetrics.includes(m));
      
      const timingWeight = timingMetrics.length > 0 ? 60 / timingMetrics.length : 0;
      const otherWeight = otherMetrics.length > 0 ? 40 / otherMetrics.length : 0;
      
      metrics.forEach(m => {
        if (timingMetrics.includes(m)) {
          weights[m] = timingWeight;
        } else {
          weights[m] = otherWeight;
        }
      });
      return weights;
    }
  },
  power: {
    name: '功耗优先',
    description: '优先考虑功耗相关指标 (Leakage, Power)',
    icon: 'Zap',
    priorityMetrics: ['Leakage', 'Power', 'Dynamic_Power', 'Total_Power'],
    getWeights: (metrics) => {
      const weights = {};
      const powerMetrics = metrics.filter(m => 
        ['Leakage', 'Power', 'Dynamic_Power', 'Total_Power', 'EDP'].includes(m)
      );
      const otherMetrics = metrics.filter(m => !powerMetrics.includes(m));
      
      const powerWeight = powerMetrics.length > 0 ? 50 / powerMetrics.length : 0;
      const otherWeight = otherMetrics.length > 0 ? 50 / otherMetrics.length : 0;
      
      metrics.forEach(m => {
        if (powerMetrics.includes(m)) {
          weights[m] = powerWeight;
        } else {
          weights[m] = otherWeight;
        }
      });
      return weights;
    }
  },
  area: {
    name: '面积优先',
    description: '优先考虑面积相关指标 (Cell_Area, HPWL)',
    icon: 'Square',
    priorityMetrics: ['Cell_Area', 'Area', 'HPWL', 'Metal_Layers'],
    getWeights: (metrics) => {
      const weights = {};
      const areaMetrics = metrics.filter(m => 
        ['Cell_Area', 'Area', 'HPWL', 'Metal_Layers', 'Congestion'].includes(m)
      );
      const otherMetrics = metrics.filter(m => !areaMetrics.includes(m));
      
      const areaWeight = areaMetrics.length > 0 ? 55 / areaMetrics.length : 0;
      const otherWeight = otherMetrics.length > 0 ? 45 / otherMetrics.length : 0;
      
      metrics.forEach(m => {
        if (areaMetrics.includes(m)) {
          weights[m] = areaWeight;
        } else {
          weights[m] = otherWeight;
        }
      });
      return weights;
    }
  },
  runtime: {
    name: '效率优先',
    description: '优先考虑运行时间和效率指标',
    icon: 'Timer',
    priorityMetrics: ['Runtime', 'CPU_Time', 'Memory'],
    getWeights: (metrics) => {
      const weights = {};
      const runtimeMetrics = metrics.filter(m => 
        ['Runtime', 'CPU_Time', 'Memory', 'Iterations'].includes(m)
      );
      const otherMetrics = metrics.filter(m => !runtimeMetrics.includes(m));
      
      const runtimeWeight = runtimeMetrics.length > 0 ? 40 / runtimeMetrics.length : 0;
      const otherWeight = otherMetrics.length > 0 ? 60 / otherMetrics.length : 0;
      
      metrics.forEach(m => {
        if (runtimeMetrics.includes(m)) {
          weights[m] = runtimeWeight;
        } else {
          weights[m] = otherWeight;
        }
      });
      return weights;
    }
  }
};

export const recommendWeights = (metrics, allMetricsStats, baseAlgo, strategy = 'auto') => {
  if (!metrics || metrics.length === 0) return {};
  
  if (strategy !== 'auto' && WEIGHT_PRESETS[strategy]) {
    return WEIGHT_PRESETS[strategy].getWeights(metrics);
  }
  
  const weights = {};
  const metricScores = {};
  
  metrics.forEach(metric => {
    const stat = allMetricsStats.find(s => s.metric === metric);
    const config = getMetricConfig(metric);
    
    if (!stat?.stats) {
      metricScores[metric] = 1;
      return;
    }
    
    let score = 1;
    
    const geomeanImp = Math.abs(stat.stats.geomeanImp || 0);
    if (geomeanImp > 10) score += 2;
    else if (geomeanImp > 5) score += 1;
    else if (geomeanImp > 2) score += 0.5;
    
    const pValue = stat.stats.pValue;
    if (pValue !== null && pValue < 0.01) score += 1.5;
    else if (pValue !== null && pValue < 0.05) score += 1;
    
    const degradedRate = stat.stats.nValid > 0 
      ? stat.stats.degradedCount / stat.stats.nValid 
      : 0;
    if (degradedRate < 0.05) score += 1;
    else if (degradedRate < 0.1) score += 0.5;
    else if (degradedRate > 0.2) score -= 0.5;
    
    const std = stat.stats.std || 0;
    const meanImp = Math.abs(stat.stats.meanImp || 1);
    const cv = std / meanImp;
    if (cv < 0.5) score += 0.5;
    else if (cv > 1.5) score -= 0.5;
    
    metricScores[metric] = Math.max(0.1, score);
  });
  
  const totalScore = Object.values(metricScores).reduce((a, b) => a + b, 0);
  
  metrics.forEach(metric => {
    weights[metric] = (metricScores[metric] / totalScore) * 100;
  });
  
  return weights;
};

export const analyzeWeightSensitivity = (metrics, allMetricsStats, baseAlgo, currentWeights) => {
  if (!metrics || metrics.length === 0 || !allMetricsStats) return [];
  
  const sensitivity = [];
  
  metrics.forEach(metric => {
    const stat = allMetricsStats.find(s => s.metric === metric);
    if (!stat?.stats) {
      sensitivity.push({
        metric,
        sensitivity: 'low',
        impact: 0,
        recommendation: '数据不足'
      });
      return;
    }
    
    const geomeanImp = stat.stats.geomeanImp || 0;
    const std = stat.stats.std || 0;
    const pValue = stat.stats.pValue;
    
    const impactScore = Math.abs(geomeanImp) * (pValue < 0.05 ? 1.5 : 1);
    
    const variability = std > 0 ? std / Math.abs(geomeanImp || 1) : 0;
    
    let sensitivityLevel;
    if (impactScore > 5 && variability < 1) {
      sensitivityLevel = 'high';
    } else if (impactScore > 2 || variability > 1.5) {
      sensitivityLevel = 'medium';
    } else {
      sensitivityLevel = 'low';
    }
    
    let recommendation;
    const currentWeight = currentWeights[metric] || 0;
    
    if (geomeanImp > 5 && pValue < 0.05 && currentWeight < 20) {
      recommendation = '建议增加权重';
    } else if (geomeanImp < -2 && currentWeight > 15) {
      recommendation = '建议降低权重';
    } else if (variability > 1.5) {
      recommendation = '波动较大，谨慎调整';
    } else {
      recommendation = '当前权重合理';
    }
    
    sensitivity.push({
      metric,
      sensitivity: sensitivityLevel,
      impact: impactScore,
      variability,
      recommendation,
      currentWeight
    });
  });
  
  return sensitivity.sort((a, b) => b.impact - a.impact);
};

export const optimizeWeights = (metrics, allMetricsStats, baseAlgo, compareAlgo, objective = 'maximize_improvement') => {
  if (!metrics || metrics.length === 0 || !allMetricsStats) {
    return { weights: {}, score: 0, iterations: 0 };
  }
  
  const initialWeights = recommendWeights(metrics, allMetricsStats, baseAlgo, 'auto');
  
  const optimizedWeights = { ...initialWeights };
  
  const calculateScore = (weights) => {
    let totalScore = 0;
    let totalWeight = 0;
    
    metrics.forEach(metric => {
      const stat = allMetricsStats.find(s => s.metric === metric);
      const config = getMetricConfig(metric);
      const weight = weights[metric] || 0;
      
      if (!stat?.stats) return;
      
      const imp = stat.stats.geomeanImp || 0;
      const adjustedImp = config.better === 'lower' ? imp : -imp;
      
      totalScore += adjustedImp * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };
  
  let bestScore = calculateScore(optimizedWeights);
  let iterations = 0;
  const maxIterations = 100;
  const step = 2;
  
  while (iterations < maxIterations) {
    let improved = false;
    
    for (const metric of metrics) {
      const currentWeight = optimizedWeights[metric] || 0;
      
      if (currentWeight + step <= 100) {
        const testWeights = { ...optimizedWeights };
        testWeights[metric] = currentWeight + step;
        
        const otherMetrics = metrics.filter(m => m !== metric && testWeights[m] > 0);
        if (otherMetrics.length > 0) {
          const reduction = step / otherMetrics.length;
          otherMetrics.forEach(m => {
            testWeights[m] = Math.max(0, testWeights[m] - reduction);
          });
          
          const testScore = calculateScore(testWeights);
          if (testScore > bestScore) {
            optimizedWeights[metric] = testWeights[metric];
            otherMetrics.forEach(m => {
              optimizedWeights[m] = testWeights[m];
            });
            bestScore = testScore;
            improved = true;
          }
        }
      }
    }
    
    if (!improved) break;
    iterations++;
  }
  
  return {
    weights: optimizedWeights,
    score: bestScore,
    iterations
  };
};

export const getWeightPresetList = () => {
  return Object.entries(WEIGHT_PRESETS).map(([key, preset]) => ({
    id: key,
    name: preset.name,
    description: preset.description,
    icon: preset.icon
  }));
};
