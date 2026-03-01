export const COLUMN_MAPPINGS = {
  CASE_COLUMN_NAMES: ['case', 'Case', 'CASE'],
  INST_COLUMN_NAMES: ['inst', 'instance', 'instances', '#inst', '#Inst', 'INST'],
  METRIC_PREFIX: 'm_',
  METRIC_SEPARATOR: '_'
};

export const MISSING_VALUE_INDICATORS = ['NA', 'NAN', 'N/A', 'NULL', ''];

export const CSV_PARSING = {
  DELIMITER_CANDIDATES: [',', ';', '\t', '|'],
  AUTO_DETECT_DELIMITER: true
};

export const DATA_VALIDATION = {
  MIN_ALGORITHMS: 2,
  MIN_CASES: 1,
  MAX_FILE_SIZE_MB: 10
};

export const COLUMN_NAME_PATTERNS = {
  METRIC_PATTERN: /^m_(.+?)_(.+)$/,
  ALGORITHM_GROUP: 1,
  METRIC_GROUP: 2
};

export const findInstColumn = (metaColumns) => {
  if (!metaColumns || metaColumns.length === 0) return null;
  
  return metaColumns.find(c => 
    COLUMN_MAPPINGS.INST_COLUMN_NAMES.some(name => 
      c.toLowerCase() === name.toLowerCase()
    )
  ) || metaColumns[0];
};

export const isCaseColumn = (columnName) => {
  return COLUMN_MAPPINGS.CASE_COLUMN_NAMES.some(name => 
    columnName.toLowerCase() === name.toLowerCase()
  );
};

export const parseMetricColumn = (columnName) => {
  if (!columnName.startsWith(COLUMN_MAPPINGS.METRIC_PREFIX)) {
    return null;
  }
  
  const rest = columnName.substring(COLUMN_MAPPINGS.METRIC_PREFIX.length);
  const separatorIndex = rest.indexOf(COLUMN_MAPPINGS.METRIC_SEPARATOR);
  
  if (separatorIndex <= 0) {
    return null;
  }
  
  return {
    algorithm: rest.substring(0, separatorIndex),
    metric: rest.substring(separatorIndex + 1)
  };
};

export const isMissingValue = (value) => {
  if (value == null) return true;
  const upperValue = String(value).toUpperCase().trim();
  return MISSING_VALUE_INDICATORS.includes(upperValue);
};
