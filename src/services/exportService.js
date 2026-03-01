import { calculateImprovement } from '../utils/statistics';
import { downloadCSV, downloadJSON, downloadTSV } from '../utils/downloadUtils';
import { validateCSVStructure, VALIDATION_CODES } from '../utils/validationUtils';
import { parseCSV } from './csvParser';
import { formatNumberWithCommas } from '../utils/formatters';

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
        if (validMatch.outlierType === 'positive') {
          status = imp >= 0 ? 'Outlier_High_Opt' : 'Outlier_High_Deg';
        } else if (validMatch.outlierType === 'negative') {
          status = imp >= 0 ? 'Outlier_Low_Opt' : 'Outlier_Low_Deg';
        } else {
          status = imp > 0 ? 'Optimized' : (imp < 0 ? 'Degraded' : 'Neutral');
        }
      }
    }
    
    const metaVals = metaColumns.map(mc => d.meta[mc]).join(',');
    csvContent += `${d.Case},${metaVals},${bVal == null ? 'NaN' : formatNumberWithCommas(bVal)},${cVal == null ? 'NaN' : formatNumberWithCommas(cVal)},${isNull ? '-' : imp.toFixed(2)},${status}\n`;
  });
  
  downloadCSV(csvContent, `eda_export_${activeMetric}_${Date.now()}.csv`);
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
        values.push(val == null ? 'NaN' : formatNumberWithCommas(val));
      });
    });
    
    csvContent += values.join(',') + '\n';
  });
  
  downloadCSV(csvContent, `eda_full_export_${Date.now()}.csv`);
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
  
  downloadJSON(exportData, `eda_export_${Date.now()}.json`);
};

export const exportToExcel = (data, algos, metrics, metaColumns, activeMetric, baseAlgo, compareAlgo, stats) => {
  const headers = ['Case', ...metaColumns, `${activeMetric}_${baseAlgo}`, `${activeMetric}_${compareAlgo}`, 'Improvement(%)', 'Status'];
  
  let tsvContent = headers.join('\t') + '\n';
  
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
        if (validMatch.outlierType === 'positive') {
          status = imp >= 0 ? 'Outlier_High_Opt' : 'Outlier_High_Deg';
        } else if (validMatch.outlierType === 'negative') {
          status = imp >= 0 ? 'Outlier_Low_Opt' : 'Outlier_Low_Deg';
        } else {
          status = imp > 0 ? 'Optimized' : (imp < 0 ? 'Degraded' : 'Neutral');
        }
      }
    }
    
    const values = [
      row.Case,
      ...metaColumns.map(mc => row.meta[mc] ?? ''),
      bVal == null ? 'NaN' : formatNumberWithCommas(bVal),
      cVal == null ? 'NaN' : formatNumberWithCommas(cVal),
      isNull ? '-' : imp.toFixed(2),
      status
    ];
    
    tsvContent += values.join('\t') + '\n';
  });
  
  downloadTSV(tsvContent, `eda_export_${activeMetric}_${Date.now()}.tsv`);
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
