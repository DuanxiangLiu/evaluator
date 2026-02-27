export const VALIDATION_SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

export const VALIDATION_CODES = {
  EMPTY_INPUT: 'EMPTY_INPUT',
  NO_CASE_COLUMN: 'NO_CASE_COLUMN',
  NO_METRIC_COLUMNS: 'NO_METRIC_COLUMNS',
  INVALID_METRIC_FORMAT: 'INVALID_METRIC_FORMAT',
  NO_DATA_ROWS: 'NO_DATA_ROWS',
  INCONSISTENT_COLUMNS: 'INCONSISTENT_COLUMNS',
  MISSING_VALUES: 'MISSING_VALUES',
  INVALID_NUMBERS: 'INVALID_NUMBERS',
  DUPLICATE_CASES: 'DUPLICATE_CASES',
  SINGLE_ALGORITHM: 'SINGLE_ALGORITHM',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  EMPTY_CASE_NAME: 'EMPTY_CASE_NAME'
};

const ERROR_MESSAGES = {
  [VALIDATION_CODES.EMPTY_INPUT]: '输入数据为空，请上传或粘贴CSV数据',
  [VALIDATION_CODES.NO_CASE_COLUMN]: '缺少必需的 "Case" 列，第一列应为测试用例名称',
  [VALIDATION_CODES.NO_METRIC_COLUMNS]: '未找到有效的指标列，指标列格式应为 "m_算法名_指标名"',
  [VALIDATION_CODES.INVALID_METRIC_FORMAT]: '指标列格式不正确，应为 "m_算法名_指标名" 格式',
  [VALIDATION_CODES.NO_DATA_ROWS]: 'CSV文件没有数据行，请确保至少包含一行数据',
  [VALIDATION_CODES.INCONSISTENT_COLUMNS]: '第 {row} 行的列数 ({actual}) 与表头列数 ({expected}) 不一致',
  [VALIDATION_CODES.MISSING_VALUES]: '发现 {count} 个缺失值，将自动处理为空值',
  [VALIDATION_CODES.INVALID_NUMBERS]: '第 {row} 行 "{column}" 列的值 "{value}" 无法解析为数字',
  [VALIDATION_CODES.DUPLICATE_CASES]: '发现重复的测试用例: {cases}',
  [VALIDATION_CODES.SINGLE_ALGORITHM]: '仅检测到一个算法，无法进行对比分析',
  [VALIDATION_CODES.FILE_TOO_LARGE]: '文件大小超过限制 ({maxSize}MB)，请选择较小的文件',
  [VALIDATION_CODES.INVALID_FILE_TYPE]: '文件类型不支持，请上传 .csv 或 .txt 文件',
  [VALIDATION_CODES.EMPTY_CASE_NAME]: '第 {row} 行的测试用例名称为空'
};

export const formatMessage = (code, params = {}) => {
  let message = ERROR_MESSAGES[code] || '未知错误';
  Object.keys(params).forEach(key => {
    message = message.replace(`{${key}}`, params[key]);
  });
  return message;
};

export const validateFileType = (file) => {
  const validTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
  const validExtensions = ['.csv', '.txt'];
  const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  
  if (!validExtensions.includes(fileExtension)) {
    return {
      valid: false,
      errors: [{
        code: VALIDATION_CODES.INVALID_FILE_TYPE,
        severity: VALIDATION_SEVERITY.ERROR,
        message: formatMessage(VALIDATION_CODES.INVALID_FILE_TYPE)
      }]
    };
  }
  
  return { valid: true, errors: [] };
};

export const validateFileSize = (file, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      errors: [{
        code: VALIDATION_CODES.FILE_TOO_LARGE,
        severity: VALIDATION_SEVERITY.ERROR,
        message: formatMessage(VALIDATION_CODES.FILE_TOO_LARGE, { maxSize: maxSizeMB })
      }]
    };
  }
  
  return { valid: true, errors: [] };
};

export const SUPPORTED_DELIMITERS = [
  { char: ',', name: '逗号', description: '标准CSV格式', example: 'A,B,C' },
  { char: '\t', name: '制表符', description: 'TSV格式，Excel复制常用', example: 'A\tB\tC' },
  { char: ';', name: '分号', description: '欧洲地区常用', example: 'A;B;C' },
  { char: '|', name: '竖线', description: '管道分隔符', example: 'A|B|C' },
  { char: ' ', name: '空格', description: '空格分隔（连续空格视为单个）', example: 'A B C' }
];

export const detectDelimiter = (csvString) => {
  const firstLine = csvString.trim().split('\n')[0] || '';
  
  const counts = {
    ',': (firstLine.match(/,/g) || []).length,
    '\t': (firstLine.match(/\t/g) || []).length,
    ';': (firstLine.match(/;/g) || []).length,
    '|': (firstLine.match(/\|/g) || []).length,
    ' ': Math.max(0, (firstLine.match(/\s+/g) || []).length - 1)
  };
  
  let maxChar = ',';
  let maxCount = 0;
  
  Object.entries(counts).forEach(([char, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxChar = char;
    }
  });
  
  return maxChar;
};

export const getDelimiterInfo = (char) => {
  return SUPPORTED_DELIMITERS.find(d => d.char === char) || SUPPORTED_DELIMITERS[0];
};

export const validateCSVStructure = (csvString) => {
  const errors = [];
  const warnings = [];
  
  if (!csvString || !csvString.trim()) {
    return {
      valid: false,
      errors: [{
        code: VALIDATION_CODES.EMPTY_INPUT,
        severity: VALIDATION_SEVERITY.ERROR,
        message: formatMessage(VALIDATION_CODES.EMPTY_INPUT)
      }],
      warnings: [],
      stats: null
    };
  }
  
  const delimiter = detectDelimiter(csvString);
  const lines = csvString.trim().split('\n');
  
  if (lines.length < 2) {
    return {
      valid: false,
      errors: [{
        code: VALIDATION_CODES.NO_DATA_ROWS,
        severity: VALIDATION_SEVERITY.ERROR,
        message: formatMessage(VALIDATION_CODES.NO_DATA_ROWS)
      }],
      warnings: [],
      stats: null
    };
  }
  
  const headers = lines[0].split(delimiter).map(h => h.trim());
  const headerCount = headers.length;
  
  const hasCaseColumn = headers[0]?.toLowerCase() === 'case';
  if (!hasCaseColumn) {
    errors.push({
      code: VALIDATION_CODES.NO_CASE_COLUMN,
      severity: VALIDATION_SEVERITY.ERROR,
      message: formatMessage(VALIDATION_CODES.NO_CASE_COLUMN),
      row: 1
    });
  }
  
  const metricColumns = [];
  const invalidMetricColumns = [];
  
  headers.forEach((h, idx) => {
    if (idx === 0) return;
    if (h.startsWith('m_')) {
      const rest = h.substring(2);
      const underscoreIdx = rest.indexOf('_');
      if (underscoreIdx > 0 && underscoreIdx < rest.length - 1) {
        metricColumns.push({
          header: h,
          algorithm: rest.substring(0, underscoreIdx),
          metric: rest.substring(underscoreIdx + 1),
          index: idx
        });
      } else {
        invalidMetricColumns.push({ header: h, index: idx });
      }
    }
  });
  
  if (invalidMetricColumns.length > 0) {
    invalidMetricColumns.forEach(col => {
      errors.push({
        code: VALIDATION_CODES.INVALID_METRIC_FORMAT,
        severity: VALIDATION_SEVERITY.ERROR,
        message: `列 "${col.header}" 格式不正确，应为 "m_算法名_指标名"`,
        column: col.index + 1
      });
    });
  }
  
  if (metricColumns.length === 0) {
    errors.push({
      code: VALIDATION_CODES.NO_METRIC_COLUMNS,
      severity: VALIDATION_SEVERITY.ERROR,
      message: formatMessage(VALIDATION_CODES.NO_METRIC_COLUMNS)
    });
  }
  
  const algorithms = new Set(metricColumns.map(m => m.algorithm));
  if (algorithms.size < 2) {
    warnings.push({
      code: VALIDATION_CODES.SINGLE_ALGORITHM,
      severity: VALIDATION_SEVERITY.WARNING,
      message: formatMessage(VALIDATION_CODES.SINGLE_ALGORITHM)
    });
  }
  
  const dataRows = lines.slice(1);
  const inconsistentRows = [];
  const missingValues = [];
  const invalidNumbers = [];
  const duplicateCases = [];
  const emptyCaseNames = [];
  const caseNames = new Set();
  
  dataRows.forEach((line, idx) => {
    const rowNum = idx + 2;
    const values = line.split(delimiter).map(v => v.trim());
    
    if (values.length !== headerCount) {
      inconsistentRows.push({
        row: rowNum,
        actual: values.length,
        expected: headerCount
      });
    }
    
    const caseName = values[0];
    if (!caseName) {
      emptyCaseNames.push({ row: rowNum });
    } else if (caseNames.has(caseName)) {
      duplicateCases.push({ case: caseName, row: rowNum });
    } else {
      caseNames.add(caseName);
    }
    
    metricColumns.forEach(col => {
      const value = values[col.index];
      if (value === undefined || value === '' || value.toUpperCase() === 'NA' || value.toUpperCase() === 'NAN') {
        missingValues.push({ row: rowNum, column: col.header, case: caseName });
      } else {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
          invalidNumbers.push({ row: rowNum, column: col.header, value, case: caseName });
        }
      }
    });
  });
  
  if (inconsistentRows.length > 0) {
    inconsistentRows.forEach(r => {
      errors.push({
        code: VALIDATION_CODES.INCONSISTENT_COLUMNS,
        severity: VALIDATION_SEVERITY.ERROR,
        message: formatMessage(VALIDATION_CODES.INCONSISTENT_COLUMNS, {
          row: r.row,
          actual: r.actual,
          expected: r.expected
        }),
        row: r.row
      });
    });
  }
  
  if (emptyCaseNames.length > 0) {
    emptyCaseNames.forEach(r => {
      errors.push({
        code: VALIDATION_CODES.EMPTY_CASE_NAME,
        severity: VALIDATION_SEVERITY.ERROR,
        message: formatMessage(VALIDATION_CODES.EMPTY_CASE_NAME, { row: r.row }),
        row: r.row
      });
    });
  }
  
  if (duplicateCases.length > 0) {
    const caseList = [...new Set(duplicateCases.map(d => d.case))].slice(0, 5).join(', ');
    warnings.push({
      code: VALIDATION_CODES.DUPLICATE_CASES,
      severity: VALIDATION_SEVERITY.WARNING,
      message: formatMessage(VALIDATION_CODES.DUPLICATE_CASES, { cases: caseList }),
      details: duplicateCases
    });
  }
  
  if (missingValues.length > 0) {
    warnings.push({
      code: VALIDATION_CODES.MISSING_VALUES,
      severity: VALIDATION_SEVERITY.INFO,
      message: formatMessage(VALIDATION_CODES.MISSING_VALUES, { count: missingValues.length }),
      count: missingValues.length,
      details: missingValues.slice(0, 10)
    });
  }
  
  if (invalidNumbers.length > 0) {
    invalidNumbers.slice(0, 5).forEach(n => {
      warnings.push({
        code: VALIDATION_CODES.INVALID_NUMBERS,
        severity: VALIDATION_SEVERITY.WARNING,
        message: formatMessage(VALIDATION_CODES.INVALID_NUMBERS, {
          row: n.row,
          column: n.column,
          value: n.value
        }),
        row: n.row,
        column: n.column
      });
    });
  }
  
  const stats = {
    totalRows: dataRows.length,
    totalColumns: headerCount,
    metricColumns: metricColumns.length,
    algorithms: Array.from(algorithms),
    metrics: [...new Set(metricColumns.map(m => m.metric))],
    metaColumns: headers.filter((h, idx) => idx > 0 && !h.startsWith('m_')),
    validCases: dataRows.length - emptyCaseNames.length,
    missingValueCount: missingValues.length,
    invalidNumberCount: invalidNumbers.length
  };
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats
  };
};

export const validateCSVQuick = (csvString) => {
  if (!csvString || !csvString.trim()) {
    return { valid: false, message: '输入数据为空' };
  }
  
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) {
    return { valid: false, message: '数据行数不足' };
  }
  
  const delimiter = detectDelimiter(csvString);
  const headers = lines[0].split(delimiter).map(h => h.trim());
  const hasCase = headers[0]?.toLowerCase() === 'case';
  const hasMetrics = headers.some(h => h.startsWith('m_'));
  
  if (!hasCase) {
    return { valid: false, message: '缺少 Case 列' };
  }
  
  if (!hasMetrics) {
    return { valid: false, message: '缺少指标列' };
  }
  
  return { valid: true };
};

export const getValidationSuggestions = (validationResult) => {
  const suggestions = [];
  
  validationResult.errors?.forEach(error => {
    switch (error.code) {
      case VALIDATION_CODES.NO_CASE_COLUMN:
        suggestions.push('确保CSV第一列为 "Case"，包含测试用例名称');
        break;
      case VALIDATION_CODES.NO_METRIC_COLUMNS:
        suggestions.push('添加指标列，格式为 "m_算法名_指标名"，例如 "m_Base_HPWL"');
        break;
      case VALIDATION_CODES.INVALID_METRIC_FORMAT:
        suggestions.push('检查指标列命名，确保格式为 "m_算法名_指标名"');
        break;
      case VALIDATION_CODES.INCONSISTENT_COLUMNS:
        suggestions.push('检查每行的逗号数量是否一致，确保列数匹配');
        break;
      case VALIDATION_CODES.EMPTY_CASE_NAME:
        suggestions.push('为每个测试用例添加唯一名称');
        break;
      default:
        break;
    }
  });
  
  validationResult.warnings?.forEach(warning => {
    switch (warning.code) {
      case VALIDATION_CODES.SINGLE_ALGORITHM:
        suggestions.push('添加更多算法的指标列以进行对比分析');
        break;
      case VALIDATION_CODES.DUPLICATE_CASES:
        suggestions.push('检查并移除重复的测试用例，或为其添加唯一标识');
        break;
      default:
        break;
    }
  });
  
  return [...new Set(suggestions)];
};

export const validateAIConfig = (config) => {
  const errors = [];
  const warnings = [];
  
  if (!config.provider) {
    errors.push({
      field: 'provider',
      message: '请选择服务提供商'
    });
  }
  
  if (!config.apiKey || config.apiKey.trim() === '') {
    errors.push({
      field: 'apiKey',
      message: 'API Key 不能为空'
    });
  } else if (config.apiKey.length < 10) {
    warnings.push({
      field: 'apiKey',
      message: 'API Key 长度似乎不正确'
    });
  }
  
  if (config.provider !== 'gemini') {
    if (!config.baseUrl || config.baseUrl.trim() === '') {
      warnings.push({
        field: 'baseUrl',
        message: '建议填写 API Base URL'
      });
    } else {
      try {
        new URL(config.baseUrl);
      } catch {
        errors.push({
          field: 'baseUrl',
          message: 'API Base URL 格式不正确'
        });
      }
    }
    
    if (!config.model || config.model.trim() === '') {
      warnings.push({
        field: 'model',
        message: '建议填写模型名称'
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

export const createValidationResult = (valid, errors = [], warnings = [], stats = null) => {
  return {
    valid,
    errors,
    warnings,
    stats,
    suggestions: getValidationSuggestions({ errors, warnings })
  };
};
