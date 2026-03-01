import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useInputValidation, useFileUpload, INPUT_STATUS } from '../../hooks/useInputValidation';
import { detectDelimiter } from '../../utils/validationUtils';

const ROWS_PER_PAGE = 20;

export const useCsvDataSource = ({ csvInput, onCsvChange, onRunAnalysis }) => {
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [lastAnalyzedCsv, setLastAnalyzedCsv] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const editInputRef = useRef(null);
  const searchInputRef = useRef(null);

  const {
    status: validationStatus,
    errors: validationErrors,
    warnings: validationWarnings,
    stats: validationStats,
    isValid: isValidData,
    touched: validationTouched,
    validateDebounced,
    validateImmediate,
  } = useInputValidation({ debounceMs: 500 });

  const {
    isLoading: isFileLoading,
    fileName
  } = useFileUpload({
    accept: '.csv,.txt',
    maxSizeMB: 10,
    onFileSelect: (content) => {
      onCsvChange(content);
      const result = validateImmediate(content);
      if (result.valid) {
        setLastAnalyzedCsv(content);
        onRunAnalysis(content);
      }
      setCurrentPage(1);
    },
    onFileError: () => {}
  });

  useEffect(() => {
    if (csvInput && csvInput.trim()) validateDebounced(csvInput);
  }, [csvInput, validateDebounced]);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);

  const dataChanged = lastAnalyzedCsv !== null && csvInput !== lastAnalyzedCsv;

  const parseCSV = useCallback((csv) => {
    if (!csv) return { headers: [], rows: [] };
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return { headers: [], rows: [] };
    const delimiter = detectDelimiter(csv);
    let headers = lines[0].split(delimiter).map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(delimiter).map(v => v.trim()));
    
    // 重新排列列顺序：Case, 元数据列, HPWL列, HB列, Congestion列, TNS列, 其他指标列
    const caseColumn = headers.find(h => h.toLowerCase() === 'case');
    const metaColumns = headers.filter(h => !h.startsWith('m_') && h.toLowerCase() !== 'case');
    const hpwlColumns = headers.filter(h => h.includes('_HPWL'));
    const hbColumns = headers.filter(h => h.includes('_HB'));
    const congestionColumns = headers.filter(h => h.includes('_Congestion'));
    const tnsColumns = headers.filter(h => h.includes('_TNS'));
    const otherColumns = headers.filter(h => 
      h.startsWith('m_') && 
      !h.includes('_HPWL') && 
      !h.includes('_HB') && 
      !h.includes('_Congestion') && 
      !h.includes('_TNS')
    );
    
    // 按照正确顺序重组列
    const newHeaders = [];
    if (caseColumn) newHeaders.push(caseColumn);
    newHeaders.push(...metaColumns);
    newHeaders.push(...hpwlColumns);
    newHeaders.push(...hbColumns);
    newHeaders.push(...congestionColumns);
    newHeaders.push(...tnsColumns);
    newHeaders.push(...otherColumns);
    
    // 如果列顺序有变化，重新排列行数据
    if (JSON.stringify(newHeaders) !== JSON.stringify(headers)) {
      headers = newHeaders;
      const originalHeaders = lines[0].split(delimiter).map(h => h.trim());
      const originalHeaderMap = new Map(originalHeaders.map((h, i) => [h, i]));
      
      const reorderedRows = rows.map(row => {
        return headers.map(header => {
          const originalIndex = originalHeaderMap.get(header);
          return originalIndex !== undefined ? row[originalIndex] : '';
        });
      });
      
      return { headers, rows: reorderedRows, delimiter };
    }
    
    return { headers, rows, delimiter };
  }, []);

  const reconstructCSV = useCallback((headers, rows, delimiter = ',') => {
    return [headers.join(delimiter), ...rows.map(row => row.join(delimiter))].join('\n');
  }, []);

  const handleLoadDataset = useCallback((csvData) => {
    onCsvChange(csvData);
    const result = validateImmediate(csvData);
    if (result.valid) {
      setLastAnalyzedCsv(csvData);
      onRunAnalysis(csvData);
    }
    setCurrentPage(1);
  }, [onCsvChange, onRunAnalysis, validateImmediate]);

  const handleSaveDataset = useCallback((csvData) => onCsvChange(csvData), [onCsvChange]);

  const handleFileUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      onCsvChange(content);
      const result = validateImmediate(content);
      if (result.valid) {
        setLastAnalyzedCsv(content);
        onRunAnalysis(content);
      }
      setCurrentPage(1);
    };
    reader.readAsText(file);
  }, [onCsvChange, onRunAnalysis, validateImmediate]);

  const handlePasteData = useCallback((data) => {
    onCsvChange(data);
    const result = validateImmediate(data);
    if (result.valid) {
      setLastAnalyzedCsv(data);
      onRunAnalysis(data);
    }
    setCurrentPage(1);
  }, [onCsvChange, onRunAnalysis, validateImmediate]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(csvInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [csvInput]);

  const handleRunAnalysis = useCallback(() => {
    if (!csvInput || !csvInput.trim()) return false;
    const result = validateImmediate(csvInput);
    if (result.valid) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setLastAnalyzedCsv(csvInput);
        onRunAnalysis();
        setIsAnalyzing(false);
      }, 300);
      return true;
    }
    return false;
  }, [csvInput, onRunAnalysis, validateImmediate]);

  const handleCellDoubleClick = useCallback((rowIdx, cellIdx, currentValue) => {
    const actualRowIdx = (currentPage - 1) * ROWS_PER_PAGE + rowIdx;
    setEditingCell({ rowIdx: actualRowIdx, cellIdx });
    setEditValue(currentValue);
  }, [currentPage]);

  const handleCellEditSave = useCallback(() => {
    if (editingCell) {
      const { headers, rows, delimiter } = parseCSV(csvInput);
      if (rows[editingCell.rowIdx]) {
        rows[editingCell.rowIdx][editingCell.cellIdx] = editValue;
        onCsvChange(reconstructCSV(headers, rows, delimiter));
      }
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, csvInput, onCsvChange, parseCSV, reconstructCSV]);

  const handleCellEditKeyDown = useCallback((e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleCellEditSave(); }
    else if (e.key === 'Escape') { setEditingCell(null); setEditValue(''); }
  }, [handleCellEditSave]);

  const handleAddRow = useCallback((position = 'end') => {
    const { headers, rows, delimiter } = parseCSV(csvInput);
    const newRow = new Array(headers.length).fill('');
    if (position === 'start') rows.unshift(newRow);
    else rows.push(newRow);
    onCsvChange(reconstructCSV(headers, rows, delimiter));
    setCurrentPage(position === 'end' ? Math.ceil(rows.length / ROWS_PER_PAGE) : 1);
  }, [csvInput, onCsvChange, parseCSV, reconstructCSV]);

  const handleDeleteRow = useCallback((displayRowIdx) => {
    const actualRowIdx = (currentPage - 1) * ROWS_PER_PAGE + displayRowIdx;
    const { headers, rows, delimiter } = parseCSV(csvInput);
    if (rows.length === 0) return;
    rows.splice(actualRowIdx, 1);
    onCsvChange(reconstructCSV(headers, rows, delimiter));
    const newTotalPages = Math.ceil(rows.length / ROWS_PER_PAGE) || 1;
    if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
  }, [csvInput, onCsvChange, parseCSV, reconstructCSV, currentPage]);

  const handleSort = useCallback((columnIdx) => {
    setSortConfig(prev => {
      if (prev.key === columnIdx) {
        return { key: columnIdx, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: columnIdx, direction: 'asc' };
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const { headers, rows } = parseCSV(csvInput);

  const filteredAndSortedRows = useMemo(() => {
    let result = rows.map((row, idx) => ({ row, originalIdx: idx }));

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(({ row }) => 
        row.some(cell => cell.toLowerCase().includes(term))
      );
    }

    if (sortConfig.key !== null) {
      result.sort((a, b) => {
        const aVal = a.row[sortConfig.key] || '';
        const bVal = b.row[sortConfig.key] || '';
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        
        let comparison = 0;
        if (!isNaN(aNum) && !isNaN(bNum)) {
          comparison = aNum - bNum;
        } else {
          comparison = aVal.localeCompare(bVal, 'zh-CN');
        }
        
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [rows, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedRows.length / ROWS_PER_PAGE);
  const displayRows = filteredAndSortedRows.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const getStatusIcon = () => {
    switch (validationStatus) {
      case INPUT_STATUS.VALIDATING: return 'validating';
      case INPUT_STATUS.VALID: return 'valid';
      case INPUT_STATUS.INVALID: return 'invalid';
      case INPUT_STATUS.TYPING: return 'typing';
      default: return null;
    }
  };

  return {
    copied,
    currentPage,
    setCurrentPage,
    editingCell,
    editValue,
    setEditValue,
    isEditingMode,
    setIsEditingMode,
    searchTerm,
    setSearchTerm,
    sortConfig,
    isAnalyzing,
    dataChanged,
    editInputRef,
    searchInputRef,
    validationStatus,
    validationErrors,
    validationWarnings,
    validationStats,
    isValidData,
    validationTouched,
    isFileLoading,
    fileName,
    headers,
    rows,
    filteredAndSortedRows,
    totalPages,
    displayRows,
    handleLoadDataset,
    handleSaveDataset,
    handleFileUpload,
    handlePasteData,
    handleCopy,
    handleRunAnalysis,
    handleCellDoubleClick,
    handleCellEditSave,
    handleCellEditKeyDown,
    handleAddRow,
    handleDeleteRow,
    handleSort,
    clearSearch,
    getStatusIcon,
    validateImmediate,
    setLastAnalyzedCsv,
    ROWS_PER_PAGE
  };
};

export default useCsvDataSource;
