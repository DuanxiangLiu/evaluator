import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  FileText, Play, ChevronUp, ChevronDown, Copy, Check, 
  ChevronLeft, ChevronRight, Loader2, CheckCircle, 
  AlertCircle, Pencil, Plus, Trash2
} from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import ValidationResultPanel, { CompactValidationStatus } from '../common/ValidationResultPanel';
import SavedDataSelector from '../common/SavedDataSelector';
import { useInputValidation, useFileUpload, INPUT_STATUS } from '../../hooks/useInputValidation';
import { useToast } from '../common/Toast';
import { getValidationSuggestions, detectDelimiter } from '../../utils/validationUtils';

const CsvDataSource = ({ csvInput, onCsvChange, onRunAnalysis }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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
    if (result.valid) onRunAnalysis(csvData);
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
      onRunAnalysis();
      toast.success('分析开始', '正在处理...');
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

  const { headers, rows } = parseCSV(csvInput);
  const totalPages = Math.ceil(rows.length / rowsPerPage);
  const displayRows = rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
            content={<div className="space-y-2"><p className="font-bold text-indigo-400">CSV 格式</p><div className="text-xs space-y-1"><p>第一列: Case名称</p><p>指标列: m_算法_指标</p><p>缺失值: NaN 或 NA</p></div></div>}
            position="left-center"
            className="w-3.5 h-3.5 text-white/70 hover:text-white"
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
              <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">预览 第{currentPage}/{totalPages || 1}页</span>
                <div className="flex items-center gap-2">
                  <button onClick={handleRunAnalysis} disabled={!csvInput || !csvInput.trim() || !isValidData} className="text-xs px-3 py-1 rounded font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 shadow-sm flex items-center gap-1">
                    <Play className="w-3 h-3" />运行分析
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
                <div className="bg-indigo-50 px-3 py-1.5 border-b border-indigo-100 flex items-center gap-2">
                  <button onClick={() => handleAddRow('start')} className="text-xs px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 rounded hover:bg-indigo-100"><Plus className="w-3 h-3 inline" /> 开头添加</button>
                  <button onClick={() => handleAddRow('end')} className="text-xs px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 rounded hover:bg-indigo-100"><Plus className="w-3 h-3 inline" /> 末尾添加</button>
                  <span className="text-[10px] text-indigo-500">双击编辑 | Enter保存 | Esc取消</span>
                </div>
              )}
              <div className="overflow-x-auto max-h-[250px]">
                <table className="min-w-full text-xs">
                  <thead className="bg-indigo-50 text-indigo-900 sticky top-0">
                    <tr>
                      {isEditingMode && <th className="px-2 py-1.5 w-8 border-r border-indigo-100">操作</th>}
                      {headers.map((h, i) => <th key={i} className="px-2 py-1.5 whitespace-nowrap border-r border-indigo-100 last:border-r-0">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className={`hover:bg-indigo-50/30 ${isEditingMode ? 'group' : ''}`}>
                        {isEditingMode && (
                          <td className="px-2 py-1.5 border-r border-gray-100">
                            <button onClick={() => handleDeleteRow(rowIdx)} className="p-0.5 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                          </td>
                        )}
                        {row.map((cell, cellIdx) => {
                          const actualRowIdx = (currentPage - 1) * rowsPerPage + rowIdx;
                          const isEditing = editingCell?.rowIdx === actualRowIdx && editingCell?.cellIdx === cellIdx;
                          return (
                            <td key={cellIdx} className={`px-2 py-1.5 font-mono text-gray-600 border-r border-gray-100 last:border-r-0 ${isEditingMode ? 'cursor-pointer hover:bg-indigo-100' : ''}`} onDoubleClick={() => isEditingMode && handleCellDoubleClick(rowIdx, cellIdx, cell)}>
                              {isEditing ? <input ref={editInputRef} type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={handleCellEditKeyDown} onBlur={handleCellEditSave} className="w-full px-1 py-0.5 text-xs font-mono border border-indigo-400 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" /> : cell}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-200 flex items-center justify-between">
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
