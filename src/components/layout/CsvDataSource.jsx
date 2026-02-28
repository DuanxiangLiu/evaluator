import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { 
  FileText, Play, ChevronUp, ChevronDown, Copy, Check, 
  ChevronLeft, ChevronRight, Loader2, CheckCircle, 
  AlertCircle, Pencil, Plus, Trash2, Search, X, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import ValidationResultPanel, { CompactValidationStatus } from '../common/ValidationResultPanel';
import SavedDataSelector from '../common/SavedDataSelector';
import LogImporter from '../modals/LogImporter';
import { useInputValidation, useFileUpload, INPUT_STATUS } from '../../hooks/useInputValidation';
import { useToast } from '../common/Toast';
import { getValidationSuggestions, detectDelimiter } from '../../utils/validationUtils';
import { PREVIEW_TABLE_STYLES, getPreviewRowStyle } from '../../utils/tableStyles';

const CsvDataSource = ({ csvInput, onCsvChange, onRunAnalysis, llmConfig }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [lastAnalyzedCsv, setLastAnalyzedCsv] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showLogImporter, setShowLogImporter] = useState(false);
  const rowsPerPage = 20;
  const editInputRef = useRef(null);
  const searchInputRef = useRef(null);

  const toast = useToast();

  const dataChanged = lastAnalyzedCsv !== null && csvInput !== lastAnalyzedCsv;

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
    onFileSelect: (content, file) => {
      onCsvChange(content);
      const result = validateImmediate(content);
      if (result.valid) {
        setLastAnalyzedCsv(content);
        onRunAnalysis(content);
        if (result.warnings.length > 0) {
          toast.warning('数据验证通过', `发现 ${result.warnings.length} 个警告`);
        } else {
          toast.success('上传成功', `${result.stats?.totalRows || 0} 行数据`);
        }
      } else {
        toast.error('验证失败', '请检查数据格式');
        setShowValidationPanel(true);
      }
      setCurrentPage(1);
    },
    onFileError: (error) => toast.error('上传失败', error.message)
  });

  useEffect(() => {
    if (csvInput && csvInput.trim()) validateDebounced(csvInput);
  }, [csvInput, validateDebounced]);

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
        toast.success('上传成功', `${result.stats?.totalRows || 0} 行数据`);
      } else {
        toast.error('验证失败', '请检查数据格式');
        setShowValidationPanel(true);
      }
      setCurrentPage(1);
    };
    reader.readAsText(file);
  }, [onCsvChange, onRunAnalysis, validateImmediate, toast]);

  const handlePasteData = useCallback((data) => {
    onCsvChange(data);
    const result = validateImmediate(data);
    if (result.valid) {
      setLastAnalyzedCsv(data);
      onRunAnalysis(data);
      toast.success('应用成功', `${result.stats?.totalRows || 0} 行数据`);
    } else {
      toast.error('验证失败', '请检查数据格式');
      setShowValidationPanel(true);
    }
    setCurrentPage(1);
  }, [onCsvChange, onRunAnalysis, validateImmediate, toast]);

  const handleCopy = () => {
    navigator.clipboard.writeText(csvInput);
    setCopied(true);
    toast.success('已复制', 'CSV数据已复制');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunAnalysis = () => {
    if (!csvInput || !csvInput.trim()) {
      toast.error('数据为空', '请先上传或粘贴数据');
      return;
    }
    const result = validateImmediate(csvInput);
    if (result.valid) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setLastAnalyzedCsv(csvInput);
        onRunAnalysis();
        setIsAnalyzing(false);
        toast.success('分析完成', '数据处理完成');
      }, 300);
    } else {
      setShowValidationPanel(true);
      toast.error('验证失败', '请修复错误后重试');
    }
  };

  const parseCSV = (csv) => {
    if (!csv) return { headers: [], rows: [] };
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return { headers: [], rows: [] };
    const delimiter = detectDelimiter(csv);
    const headers = lines[0].split(delimiter).map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(delimiter).map(v => v.trim()));
    return { headers, rows, delimiter };
  };

  const reconstructCSV = useCallback((headers, rows, delimiter = ',') => {
    return [headers.join(delimiter), ...rows.map(row => row.join(delimiter))].join('\n');
  }, []);

  const handleCellDoubleClick = useCallback((rowIdx, cellIdx, currentValue) => {
    const actualRowIdx = (currentPage - 1) * rowsPerPage + rowIdx;
    setEditingCell({ rowIdx: actualRowIdx, cellIdx });
    setEditValue(currentValue);
  }, [currentPage]);

  const handleCellEditSave = useCallback(() => {
    if (editingCell) {
      const { headers, rows, delimiter } = parseCSV(csvInput);
      if (rows[editingCell.rowIdx]) {
        rows[editingCell.rowIdx][editingCell.cellIdx] = editValue;
        onCsvChange(reconstructCSV(headers, rows, delimiter));
        toast.success('已更新', '单元格已修改');
      }
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, csvInput, onCsvChange, reconstructCSV, toast]);

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
    toast.success('已添加', '新行已创建');
    setCurrentPage(position === 'end' ? Math.ceil(rows.length / rowsPerPage) : 1);
  }, [csvInput, onCsvChange, reconstructCSV, toast, rowsPerPage]);

  const handleDeleteRow = useCallback((displayRowIdx) => {
    const actualRowIdx = (currentPage - 1) * rowsPerPage + displayRowIdx;
    const { headers, rows, delimiter } = parseCSV(csvInput);
    if (rows.length === 0) return;
    rows.splice(actualRowIdx, 1);
    onCsvChange(reconstructCSV(headers, rows, delimiter));
    toast.success('已删除', '该行已移除');
    const newTotalPages = Math.ceil(rows.length / rowsPerPage) || 1;
    if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
  }, [csvInput, onCsvChange, reconstructCSV, toast, currentPage, rowsPerPage]);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortConfig]);

  const { headers, rows } = parseCSV(csvInput);

  const handleSort = useCallback((columnIdx) => {
    setSortConfig(prev => {
      if (prev.key === columnIdx) {
        return { key: columnIdx, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: columnIdx, direction: 'asc' };
    });
  }, []);

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

  const totalPages = Math.ceil(filteredAndSortedRows.length / rowsPerPage);
  const displayRows = filteredAndSortedRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const getSortIcon = (columnIdx) => {
    if (sortConfig.key !== columnIdx) {
      return <ArrowUpDown className="w-3 h-3 text-gray-300 inline ml-1 opacity-50 cursor-pointer hover:opacity-100" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600 inline ml-1" /> 
      : <ArrowDown className="w-3 h-3 text-indigo-600 inline ml-1" />;
  };

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const getStatusIcon = () => {
    switch (validationStatus) {
      case INPUT_STATUS.VALIDATING: return <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />;
      case INPUT_STATUS.VALID: return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case INPUT_STATUS.INVALID: return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      case INPUT_STATUS.TYPING: return <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden">
      <div 
        className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 cursor-pointer hover:from-violet-700 hover:to-indigo-700 transition-all"
        onClick={() => setIsVisible(!isVisible)}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white">数据源</span>
          <span className="text-[10px] text-white/70 bg-white/15 px-1.5 py-0.5 rounded-full">{rows.length} 条</span>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {validationTouched && <CompactValidationStatus errors={validationErrors} warnings={validationWarnings} isValid={isValidData} onClick={() => setShowValidationPanel(!showValidationPanel)} />}
          <HelpIcon 
            content={
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-indigo-400 text-sm mb-2">数据源与格式说明</h3>
                  <p className="text-gray-300 text-xs mb-2">
                    本系统支持 CSV 格式的数据文件，以下是数据要求和功能说明。
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-emerald-300 text-xs">CSV 格式要求</h4>
                  <ul className="text-gray-300 text-xs space-y-1">
                    <li>• <strong>第一列</strong>：Case 名称（测试用例标识）</li>
                    <li>• <strong>元数据列</strong>：如 #Inst、#Net 等设计属性</li>
                    <li>• <strong>指标列</strong>：格式为 <code className="bg-slate-700 px-1 rounded">m_算法名_指标名</code></li>
                    <li>• <strong>缺失值</strong>：使用 NaN 或 NA 表示</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-300 text-xs">数据管理功能</h4>
                  <ul className="text-gray-300 text-xs space-y-1">
                    <li>• <strong>选择数据集</strong>：从已保存的数据集中加载</li>
                    <li>• <strong>保存数据</strong>：将当前数据保存到本地</li>
                    <li>• <strong>上传 CSV</strong>：从本地上传 CSV 文件</li>
                    <li>• <strong>粘贴数据</strong>：直接粘贴 CSV 格式数据</li>
                    <li>• <strong>日志提取</strong>：从日志文件提取数据</li>
                  </ul>
                </div>
                
                <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
                  💡 数据保存在浏览器本地存储中，清除浏览器数据会导致保存的数据丢失
                </div>
              </div>
            }
            position="left-center"
            className="w-4 h-4 text-white/70 hover:text-white"
          />
          {isVisible ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
        </div>
      </div>
      
      {isVisible && (
        <div className="p-3 space-y-3">
          <SavedDataSelector
            currentCsvData={csvInput}
            onLoadDataset={handleLoadDataset}
            onSaveDataset={handleSaveDataset}
            autoSaveEnabled={true}
            onFileUpload={handleFileUpload}
            onPasteData={handlePasteData}
            isFileLoading={isFileLoading}
            fileName={fileName}
            onOpenLogImporter={() => setShowLogImporter(true)}
          />

          <LogImporter
            isOpen={showLogImporter}
            onClose={() => setShowLogImporter(false)}
            llmConfig={llmConfig}
            onImportData={(csvString, meta) => {
              onCsvChange(csvString);
              const result = validateImmediate(csvString);
              if (result.valid) {
                setLastAnalyzedCsv(csvString);
                onRunAnalysis(csvString);
                toast.success('导入成功', `从 ${meta?.fileCount || 0} 个日志文件提取数据`);
              } else {
                toast.error('验证失败', '提取的数据格式不正确');
                setShowValidationPanel(true);
              }
              setCurrentPage(1);
            }}
          />

          {validationTouched && (validationErrors.length > 0 || validationWarnings.length > 0) && (
            <div>
              <button onClick={() => setShowValidationPanel(!showValidationPanel)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600">
                {showValidationPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                验证结果 ({validationErrors.length} 错误, {validationWarnings.length} 警告)
              </button>
              {showValidationPanel && <ValidationResultPanel errors={validationErrors} warnings={validationWarnings} stats={validationStats} suggestions={getValidationSuggestions({ errors: validationErrors, warnings: validationWarnings })} isValid={isValidData} showStats={true} className="mt-2" />}
            </div>
          )}

          {csvInput && headers.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className={PREVIEW_TABLE_STYLES.toolbar}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">预览 第{currentPage}/{totalPages || 1}页</span>
                  <span className="text-xs text-gray-400">|</span>
                  <span className="text-xs text-gray-500">
                    {searchTerm ? `搜索结果: ${filteredAndSortedRows.length}/${rows.length} 条` : `共 ${rows.length} 条`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="搜索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-xs pl-6 pr-6 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 w-32"
                    />
                    {searchTerm && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={handleRunAnalysis} 
                    disabled={!csvInput || !csvInput.trim() || !isValidData || isAnalyzing} 
                    className={`text-xs px-4 py-1.5 rounded-lg font-bold shadow-md flex items-center gap-1.5 transition-all duration-200 ${
                      isAnalyzing 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-blue-200 cursor-wait' 
                        : dataChanged 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 animate-pulse shadow-orange-200' 
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200'
                    } disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:animate-none`}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        数据分析中
                      </>
                    ) : dataChanged ? (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        数据待分析
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        数据已分析
                      </>
                    )}
                  </button>
                  <button onClick={() => setIsEditingMode(!isEditingMode)} className={`text-xs px-2 py-0.5 rounded ${isEditingMode ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'}`}>
                    <Pencil className="w-3 h-3 inline mr-1" />{isEditingMode ? '完成' : '编辑'}
                  </button>
                  <button onClick={handleCopy} className="text-xs text-indigo-600 hover:text-indigo-800">
                    {copied ? <Check className="w-3 h-3 inline mr-0.5" /> : <Copy className="w-3 h-3 inline mr-0.5" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
              {isEditingMode && (
                <div className={PREVIEW_TABLE_STYLES.editToolbar}>
                  <button onClick={() => handleAddRow('start')} className="text-xs px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 rounded hover:bg-indigo-100"><Plus className="w-3 h-3 inline" /> 开头添加</button>
                  <button onClick={() => handleAddRow('end')} className="text-xs px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 rounded hover:bg-indigo-100"><Plus className="w-3 h-3 inline" /> 末尾添加</button>
                  <span className="text-[10px] text-indigo-500">双击编辑 | Enter保存 | Esc取消</span>
                </div>
              )}
              <div className={PREVIEW_TABLE_STYLES.wrapper}>
                <table className={PREVIEW_TABLE_STYLES.table}>
                  <thead className={PREVIEW_TABLE_STYLES.thead}>
                    <tr>
                      {isEditingMode && <th className="px-2 py-1.5 w-8 border-r border-indigo-100">操作</th>}
                      {headers.map((h, i) => (
                        <th 
                          key={i} 
                          className={`${PREVIEW_TABLE_STYLES.theadCell} cursor-pointer select-none hover:bg-indigo-100`}
                          onClick={() => handleSort(i)}
                        >
                          {h} {getSortIcon(i)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={PREVIEW_TABLE_STYLES.tbody}>
                    {displayRows.length === 0 ? (
                      <tr>
                        <td colSpan={headers.length + (isEditingMode ? 1 : 0)} className="px-4 py-8 text-center text-gray-400 text-xs">
                          {searchTerm ? '没有找到匹配的数据' : '暂无数据'}
                        </td>
                      </tr>
                    ) : (
                      displayRows.map(({ row, originalIdx }, rowIdx) => (
                        <tr key={rowIdx} className={getPreviewRowStyle(isEditingMode)}>
                          {isEditingMode && (
                            <td className="px-2 py-1.5 border-r border-gray-100">
                              <button onClick={() => handleDeleteRow(originalIdx)} className="p-0.5 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                            </td>
                          )}
                          {row.map((cell, cellIdx) => {
                            const isEditing = editingCell?.rowIdx === originalIdx && editingCell?.cellIdx === cellIdx;
                            return (
                              <td key={cellIdx} className={`${PREVIEW_TABLE_STYLES.cell} ${isEditingMode ? PREVIEW_TABLE_STYLES.cellEditable : ''}`} onDoubleClick={() => isEditingMode && handleCellDoubleClick(originalIdx, cellIdx, cell)}>
                                {isEditing ? <input ref={editInputRef} type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={handleCellEditKeyDown} onBlur={handleCellEditSave} className="w-full px-1 py-0.5 text-xs font-mono border border-indigo-400 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" /> : cell}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className={PREVIEW_TABLE_STYLES.pagination}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded disabled:opacity-50"><ChevronLeft className="w-3 h-3" /></button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                      return <button key={page} onClick={() => setCurrentPage(page)} className={`px-2 py-1 text-xs rounded ${currentPage === page ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200'}`}>{page}</button>;
                    })}
                  </div>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded disabled:opacity-50"><ChevronRight className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CsvDataSource;
