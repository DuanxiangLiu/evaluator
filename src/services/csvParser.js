import { detectDelimiter } from '../utils/validationUtils';

export const EDA_METRICS_CONFIG = {
  HPWL: { name: '半周长线长', unit: 'um', better: 'lower', description: '布线总长度，值越小越好' },
  TNS: { name: '时序负裕度总和', unit: 'ps', better: 'higher', description: '时序负裕度总和，值越大越好（越接近0或正值）' },
  WNS: { name: '最差时序负裕度', unit: 'ps', better: 'higher', description: '最差的时序负裕度，值越大越好（越接近0或正值）' },
  Congestion: { name: '拥塞', unit: '', better: 'lower', description: '布线拥塞程度，值越小越好' },
  Runtime: { name: '运行时间', unit: 's', better: 'lower', description: '算法运行时间，值越小越好' },
  Hb_Count: { name: '闩锁数量', unit: '个', better: 'lower', description: '闩锁数量，值越小越好' },
  Leakage: { name: '泄漏功耗', unit: 'mW', better: 'lower', description: '泄漏功耗，值越小越好' },
  Cell_Area: { name: '单元面积', unit: 'um²', better: 'lower', description: '单元总面积，值越小越好' },
  Metal_Layers: { name: '金属层数', unit: '层', better: 'lower', description: '金属层数，值越小越好' },
  Frequency: { name: '工作频率', unit: 'MHz', better: 'higher', description: '芯片工作频率，值越大越好' },
  Throughput: { name: '吞吐量', unit: 'GOPS', better: 'higher', description: '数据处理吞吐量，值越大越好' },
  IPC: { name: '每周期指令数', unit: '', better: 'higher', description: '每周期执行的指令数，值越大越好' },
  MTBF: { name: '平均无故障时间', unit: 'h', better: 'higher', description: '平均无故障时间，值越大越好' },
  EDP: { name: '能量延迟积', unit: 'pJ', better: 'lower', description: '能量延迟积，值越小越好' },
};

export const getMetricConfig = (metricName) => {
  return EDA_METRICS_CONFIG[metricName] || {
    name: metricName,
    unit: '',
    better: 'lower',
    description: '自定义指标'
  };
};

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
