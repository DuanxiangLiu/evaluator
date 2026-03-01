import { detectDelimiter } from '../utils/validationUtils';
import { 
  EDA_METRICS_CONFIG, 
  getMetricConfig, 
  isBuiltInMetric 
} from '../config/metrics.js';
import { 
  COLUMN_MAPPINGS, 
  MISSING_VALUE_INDICATORS, 
  parseMetricColumn, 
  isCaseColumn, 
  isMissingValue 
} from '../config/business.js';

export { EDA_METRICS_CONFIG, getMetricConfig, isBuiltInMetric };

export const parseCSV = (csvString) => {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return { data: [], algos: [], metrics: [], metaColumns: [] };
  
  const delimiter = detectDelimiter(csvString);
  const headers = lines[0].split(delimiter).map(h => h.trim());
  
  const algosSet = new Set();
  const metricsSet = new Set();
  const metaCols = [];
  
  headers.forEach(h => {
    if (isCaseColumn(h)) return;
    
    const parsed = parseMetricColumn(h);
    if (parsed) {
      algosSet.add(parsed.algorithm);
      metricsSet.add(parsed.metric);
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
        const columnName = `${COLUMN_MAPPINGS.METRIC_PREFIX}${a}${COLUMN_MAPPINGS.METRIC_SEPARATOR}${m}`;
        const strVal = rowMap[columnName];
        
        if (isMissingValue(strVal)) {
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
      headers.push(`${COLUMN_MAPPINGS.METRIC_PREFIX}${algo}${COLUMN_MAPPINGS.METRIC_SEPARATOR}${metric}`);
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
