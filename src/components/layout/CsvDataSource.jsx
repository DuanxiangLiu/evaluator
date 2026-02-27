import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  FileText, Upload, Play, ChevronUp, ChevronDown, Database, Copy, Check, 
  Clipboard, ChevronLeft, ChevronRight, Loader2, CheckCircle, 
  AlertCircle, X, Pencil, Plus, Trash2, FileUp, FolderOpen
} from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import ValidationResultPanel, { CompactValidationStatus } from '../common/ValidationResultPanel';
import SavedDataSelector from '../common/SavedDataSelector';
import { useInputValidation, useFileUpload, INPUT_STATUS } from '../../hooks/useInputValidation';
import { useToast } from '../common/Toast';
import { getValidationSuggestions, detectDelimiter } from '../../utils/validationUtils';
import datasetStorage from '../../utils/datasetStorage';
import { generateDefaultDataset } from '../../utils/dataGenerator';

const CsvDataSource = ({ csvInput, onCsvChange, onRunAnalysis }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pastedData, setPastedData] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);
  const rowsPerPage = 20;
  const editInputRef = useRef(null);

  const toast = useToast();

  const {
    status: validationStatus,
    errors: validationErrors,
    warnings: validationWarnings,
    stats: validationStats,
    isValid: isValidData,
    touched: validationTouched,
    validateDebounced,
    validateImmediate,
    clearValidation
  } = useInputValidation({
    debounceMs: 500
  });

  const {
    fileInputRef,
    isDragging,
    isLoading: isFileLoading,
    fileName,
    progress: uploadProgress,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleInputChange,
    openFileDialog,
    formatFileSize
  } = useFileUpload({
    accept: '.csv,.txt',
    maxSizeMB: 10,
    onFileSelect: (content, file) => {
      onCsvChange(content);
      const result = validateImmediate(content);
      if (result.valid) {
        onRunAnalysis(content);
        if (result.warnings.length > 0) {
          toast.warning('数据验证通过', `发现 ${result.warnings.length} 个警告`);
        } else {
          toast.success('文件上传成功', `成功解析 ${result.stats?.totalRows || 0} 行数据`);
        }
      } else {
        toast.error('数据验证失败', '请检查数据格式');
        setShowValidationPanel(true);
      }
      setCurrentPage(1);
    },
    onFileError: (error) => {
      toast.error('文件上传失败', error.message);
    }
  });

  const defaultDataset = {
    name: '默认示例数据集',
    data: generateDefaultDataset()
  };

  useEffect(() => {
    if (csvInput && csvInput.trim()) {
      validateDebounced(csvInput);
    }
  }, [csvInput, validateDebounced]);

  const handleLoadDataset = useCallback((csvData, dataset) => {
    onCsvChange(csvData);
    const result = validateImmediate(csvData);
    if (result.valid) {
      onRunAnalysis(csvData);
    }
    setCurrentPage(1);
  }, [onCsvChange, onRunAnalysis, validateImmediate]);

  const handleSaveDataset = useCallback((csvData) => {
    onCsvChange(csvData);
  }, [onCsvChange]);

  const handleLoadDefaultDataset = () => {
    const data = defaultDataset.data;
    onCsvChange(data);
    const result = validateImmediate(data);
    if (result.valid) {
      onRunAnalysis(data);
      toast.success('数据加载成功', `已加载 ${defaultDataset.name}`);
    }
    setCurrentPage(1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(csvInput);
    setCopied(true);
    toast.success('复制成功', 'CSV数据已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  const applyPastedData = () => {
    if (pastedData.trim()) {
      onCsvChange(pastedData);
      const result = validateImmediate(pastedData);
      if (result.valid) {
        onRunAnalysis(pastedData);
        if (result.warnings.length > 0) {
          toast.warning('数据验证通过', `发现 ${result.warnings.length} 个警告`);
        } else {
          toast.success('数据应用成功', `成功解析 ${result.stats?.totalRows || 0} 行数据`);
        }
      } else {
        toast.error('数据验证失败', '请检查数据格式');
        setShowValidationPanel(true);
      }
      setPastedData('');
      setShowPasteArea(false);
      setCurrentPage(1);
    } else {
      toast.error('数据为空', '请先粘贴CSV数据');
    }
  };

  const handleRunAnalysis = () => {
    if (!csvInput || !csvInput.trim()) {
      toast.error('数据为空', '请先上传或粘贴CSV数据');
      return;
    }
    
    const result = validateImmediate(csvInput);
    if (result.valid) {
      onRunAnalysis();
      toast.success('分析开始', '正在处理数据...');
    } else {
      setShowValidationPanel(true);
      toast.error('数据验证失败', '请修复错误后重试');
    }
  };

  const parseCSV = (csv) => {
    if (!csv) return { headers: [], rows: [] };
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return { headers: [], rows: [] };
    
    const delimiter = detectDelimiter(csv);
    const headers = lines[0].split(delimiter).map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim());
      return values;
    });
    
    return { headers, rows, delimiter };
  };

  const reconstructCSV = useCallback((headers, rows, delimiter = ',') => {
    const headerLine = headers.join(delimiter);
    const dataLines = rows.map(row => row.join(delimiter));
    return [headerLine, ...dataLines].join('\n');
  }, []);

  const handleCellDoubleClick = useCallback((rowIdx, cellIdx, currentValue) => {
    const actualRowIdx = (currentPage - 1) * rowsPerPage + rowIdx;
    setEditingCell({ rowIdx: actualRowIdx, cellIdx });
    setEditValue(currentValue);
  }, [currentPage, rowsPerPage]);

  const handleCellEdit = useCallback((e) => {
    setEditValue(e.target.value);
  }, []);

  const handleCellEditSave = useCallback(() => {
    if (editingCell) {
      const { headers, rows, delimiter } = parseCSV(csvInput);
      if (rows[editingCell.rowIdx]) {
        rows[editingCell.rowIdx][editingCell.cellIdx] = editValue;
        const newCsv = reconstructCSV(headers, rows, delimiter);
        onCsvChange(newCsv);
        toast.success('编辑成功', '单元格已更新');
      }
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, csvInput, onCsvChange, reconstructCSV, toast]);

  const handleCellEditCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleCellEditKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellEditSave();
    } else if (e.key === 'Escape') {
      handleCellEditCancel();
    }
  }, [handleCellEditSave, handleCellEditCancel]);

  const handleAddRow = useCallback((position = 'end') => {
    const { headers, rows, delimiter } = parseCSV(csvInput);
    const newRow = new Array(headers.length).fill('');
    
    if (position === 'start') {
      rows.unshift(newRow);
    } else {
      rows.push(newRow);
    }
    
    const newCsv = reconstructCSV(headers, rows, delimiter);
    onCsvChange(newCsv);
    toast.success('添加成功', '已添加新行');
    
    if (position === 'end') {
      const newTotalPages = Math.ceil(rows.length / rowsPerPage);
      setCurrentPage(newTotalPages);
    } else {
      setCurrentPage(1);
    }
  }, [csvInput, onCsvChange, reconstructCSV, toast, rowsPerPage]);

  const handleDeleteRow = useCallback((displayRowIdx) => {
    const actualRowIdx = (currentPage - 1) * rowsPerPage + displayRowIdx;
    const { headers, rows, delimiter } = parseCSV(csvInput);
    
    if (rows.length === 0) {
      toast.error('删除失败', '没有可删除的行');
      return;
    }
    
    rows.splice(actualRowIdx, 1);
    const newCsv = reconstructCSV(headers, rows, delimiter);
    onCsvChange(newCsv);
    toast.success('删除成功', '已删除该行');
    
    const newTotalPages = Math.ceil(rows.length / rowsPerPage) || 1;
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  }, [csvInput, onCsvChange, reconstructCSV, toast, currentPage, rowsPerPage]);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  const { headers, rows } = parseCSV(csvInput);
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const displayRows = rows.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getStatusIcon = () => {
    switch (validationStatus) {
      case INPUT_STATUS.VALIDATING:
        return <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />;
      case INPUT_STATUS.VALID:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case INPUT_STATUS.INVALID:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case INPUT_STATUS.TYPING:
        return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />;
      default:
        return null;
    }
  };

  const suggestions = getValidationSuggestions({ errors: validationErrors, warnings: validationWarnings });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div 
        className="flex items-center justify-between px-4 sm:px-5 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 border-b border-indigo-500 cursor-pointer hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md"
        onClick={() => setIsVisible(!isVisible)}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <FileText className="w-5 h-5 text-white flex-shrink-0" />
          <h2 className="text-sm sm:text-base font-bold text-white">数据源管理</h2>
          <span className="text-xs text-indigo-100 bg-white/20 px-2 py-0.5 rounded-full hidden sm:inline">
            ({rows.length} 条数据)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {validationTouched && (
            <div onClick={(e) => e.stopPropagation()}>
              <CompactValidationStatus 
                errors={validationErrors} 
                warnings={validationWarnings} 
                isValid={isValidData}
                onClick={() => setShowValidationPanel(!showValidationPanel)}
              />
            </div>
          )}
          <HelpIcon 
            content={
              <div className="space-y-2">
                <p className="font-bold text-indigo-600">CSV 数据格式说明</p>
                <div className="space-y-1 text-xs">
                  <p><b>第一列：</b>Case 名称（测试用例标识）</p>
                  <p><b>元数据列：</b>#Inst（实例数）、#Net（网线数）等</p>
                  <p><b>指标列格式：</b>m_算法名_指标名</p>
                  <p><b>示例：</b>m_Base_HPWL, m_Algo1_HPWL</p>
                  <p><b>缺失值：</b>使用 NaN 或 NA 表示</p>
                </div>
              </div>
            }
            position="left-center"
            tooltipWidth="w-72"
            className="w-4 h-4 text-white hover:text-indigo-200 transition-colors hidden sm:block"
          />
          {isVisible ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
        </div>
      </div>
      
      {isVisible && (
        <div className="p-3 sm:p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-gray-100">
            <SavedDataSelector
              currentCsvData={csvInput}
              onLoadDataset={handleLoadDataset}
              onSaveDataset={handleSaveDataset}
              autoSaveEnabled={true}
            />
            <button
              onClick={handleLoadDefaultDataset}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-indigo-300 transition-all shadow-sm"
            >
              <FolderOpen className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">加载示例数据</span>
              <span className="sm:hidden">示例</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5 text-indigo-500" />
              上传或粘贴数据
              {getStatusIcon()}
              <span className="text-[10px] text-gray-400 font-normal ml-1">
                (支持: CSV, TXT | 分隔符: 逗号, Tab, 分号, 竖线)
              </span>
            </label>
            
            <div 
              className={`
                relative border-2 border-dashed rounded-lg transition-all cursor-pointer
                ${isDragging 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : isFileLoading 
                    ? 'border-gray-300 bg-gray-50' 
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleInputChange}
                className="hidden"
              />
              
              {isFileLoading ? (
                <div className="p-4 space-y-2 text-center">
                  <Loader2 className="w-6 h-6 mx-auto text-indigo-500 animate-spin" />
                  <p className="text-sm text-gray-600">正在读取文件...</p>
                  {uploadProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center space-y-1">
                  <Upload className="w-6 h-6 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {isDragging ? '释放以上传文件' : '拖拽文件到此处或点击上传'}
                  </p>
                  <p className="text-xs text-gray-400">支持 .csv, .txt 文件，最大 10MB</p>
                </div>
              )}
              
              {fileName && !isFileLoading && (
                <div className="px-4 pb-3 flex items-center justify-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>{fileName}</span>
                </div>
              )}
            </div>

            {!showPasteArea ? (
              <button
                onClick={(e) => { e.stopPropagation(); setShowPasteArea(true); }}
                className="mt-2 w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-gray-200"
              >
                <Clipboard className="w-4 h-4" />
                粘贴 CSV 数据
              </button>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.readText().then(text => {
                        setPastedData(text);
                      }).catch(() => {
                        toast.error('粘贴失败', '无法读取剪贴板内容');
                      });
                    }}
                    className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-gray-200"
                  >
                    <Clipboard className="w-4 h-4" />
                    从剪贴板粘贴
                  </button>
                  <button
                    onClick={() => {
                      setPastedData('');
                      setShowPasteArea(false);
                    }}
                    className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                  >
                    取消
                  </button>
                </div>
                <textarea
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full p-3 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-gray-50"
                  rows={5}
                  placeholder="粘贴的 CSV 数据将显示在这里..."
                />
                <button
                  onClick={(e) => { e.stopPropagation(); applyPastedData(); }}
                  disabled={!pastedData.trim()}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  应用数据并运行分析
                </button>
              </div>
            )}
          </div>

          {validationTouched && (validationErrors.length > 0 || validationWarnings.length > 0) && (
            <div>
              <button
                onClick={() => setShowValidationPanel(!showValidationPanel)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
              >
                {showValidationPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                验证结果 ({validationErrors.length} 错误, {validationWarnings.length} 警告)
              </button>
              
              {showValidationPanel && (
                <div className="mt-3">
                  <ValidationResultPanel
                    errors={validationErrors}
                    warnings={validationWarnings}
                    stats={validationStats}
                    suggestions={suggestions}
                    isValid={isValidData}
                    showStats={true}
                  />
                </div>
              )}
            </div>
          )}

          {csvInput && headers.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-600">
                  数据预览 ({rows.length} 条数据，第 {currentPage} / {totalPages || 1} 页)
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsEditingMode(!isEditingMode)}
                    className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                      isEditingMode 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                    }`}
                  >
                    <Pencil className="w-3 h-3" />
                    {isEditingMode ? '完成编辑' : '编辑模式'}
                  </button>
                  <button 
                    onClick={handleCopy}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? '已复制' : '复制全部'}
                  </button>
                </div>
              </div>
              {isEditingMode && (
                <div className="bg-indigo-50 px-3 py-2 border-b border-indigo-100 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAddRow('start')}
                    className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-700 rounded text-xs font-medium transition-colors border border-indigo-200 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    在开头添加行
                  </button>
                  <button
                    onClick={() => handleAddRow('end')}
                    className="px-2 py-1 bg-white hover:bg-indigo-100 text-indigo-700 rounded text-xs font-medium transition-colors border border-indigo-200 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    在末尾添加行
                  </button>
                  <span className="text-xs text-indigo-600 ml-2">
                    双击单元格编辑，按 Enter 保存，按 Esc 取消
                  </span>
                </div>
              )}
              <div className="overflow-x-auto max-h-[300px] sm:max-h-[400px]">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-indigo-50 text-indigo-900 sticky top-0 z-10">
                    <tr>
                      {isEditingMode && (
                        <th className="px-2 py-2 font-medium whitespace-nowrap border-r border-indigo-100 w-10">
                          操作
                        </th>
                      )}
                      {headers.map((header, idx) => (
                        <th key={idx} className="px-2 sm:px-3 py-2 font-medium whitespace-nowrap border-r border-indigo-100 last:border-r-0">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className={`hover:bg-indigo-50/30 ${isEditingMode ? 'group' : ''}`}>
                        {isEditingMode && (
                          <td className="px-2 py-2 border-r border-gray-100">
                            <button
                              onClick={() => handleDeleteRow(rowIdx)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="删除此行"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                        {row.map((cell, cellIdx) => {
                          const actualRowIdx = (currentPage - 1) * rowsPerPage + rowIdx;
                          const isEditing = editingCell && 
                            editingCell.rowIdx === actualRowIdx && 
                            editingCell.cellIdx === cellIdx;
                          
                          return (
                            <td 
                              key={cellIdx} 
                              className={`px-2 sm:px-3 py-2 font-mono text-gray-600 whitespace-nowrap border-r border-gray-100 last:border-r-0 ${
                                isEditingMode ? 'cursor-pointer hover:bg-indigo-100' : ''
                              }`}
                              onDoubleClick={() => isEditingMode && handleCellDoubleClick(rowIdx, cellIdx, cell)}
                            >
                              {isEditing ? (
                                <input
                                  ref={editInputRef}
                                  type="text"
                                  value={editValue}
                                  onChange={handleCellEdit}
                                  onKeyDown={handleCellEditKeyDown}
                                  onBlur={handleCellEditSave}
                                  className="w-full px-1 py-0.5 text-xs font-mono border border-indigo-400 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                />
                              ) : (
                                cell
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="bg-gray-50 px-3 py-2 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span className="hidden sm:inline">上一页</span>
                  </button>
                  <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <span className="text-gray-400">...</span>
                    )}
                  </div>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">下一页</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleRunAnalysis}
              disabled={!csvInput || !csvInput.trim() || !isValidData}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">运行分析</span>
              <span className="sm:hidden">分析</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvDataSource;
