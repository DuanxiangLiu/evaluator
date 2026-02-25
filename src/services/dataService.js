import { calculateImprovement, calculateRatio, quantile, calculateWilcoxonPValue } from '../utils/statistics';

// 常见 EDA 指标配置
export const EDA_METRICS_CONFIG = {
  // 物理设计指标
  HPWL: { name: '半周长线长', unit: 'um', better: 'lower', description: '布线总长度，值越小越好' },
  TNS: { name: '时序负裕度总和', unit: 'ps', better: 'lower', description: '时序违例总和，值越小越好' },
  WNS: { name: '最差时序负裕度', unit: 'ps', better: 'lower', description: '最差的时序违例，值越小越好' },
  Power: { name: '功耗', unit: 'mW', better: 'lower', description: '芯片功耗，值越小越好' },
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
  
  const headers = lines[0].split(',').map(h => h.trim());
  
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
    const parts = line.split(',');
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
