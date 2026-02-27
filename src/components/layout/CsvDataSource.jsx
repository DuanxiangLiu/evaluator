import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  FileText, Upload, Play, ChevronUp, ChevronDown, Database, Copy, Check, 
  Clipboard, ChevronLeft, ChevronRight, FileUp, Loader2, CheckCircle, 
  AlertCircle, AlertTriangle, X, RefreshCw
} from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import ValidationResultPanel, { CompactValidationStatus } from '../common/ValidationResultPanel';
import { useInputValidation, useFileUpload, INPUT_STATUS } from '../../hooks/useInputValidation';
import { useToast } from '../common/Toast';
import { getValidationSuggestions, detectDelimiter } from '../../utils/validationUtils';
import { 
  generateDefaultDataset, 
  generateSmallDataset, 
  generateLargeDataset, 
  generatePowerDataset,
  generateTimingDataset 
} from '../../utils/dataGenerator';

const CsvDataSource = ({ csvInput, onCsvChange, onRunAnalysis }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pastedData, setPastedData] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const rowsPerPage = 20;
  const isUserActionRef = useRef(false);

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

  const defaultDataSources = {
    default: {
      name: '综合设计数据集 (30 cases)',
      data: generateDefaultDataset()
    },
    small: {
      name: '小型设计数据集 (30 cases)',
      data: generateSmallDataset()
    },
    large: {
      name: '大型设计数据集 (30 cases)',
      data: generateLargeDataset()
    },
    power: {
      name: '功耗优化数据集 (30 cases)',
      data: generatePowerDataset()
    },
    timing: {
      name: '时序优化数据集 (30 cases)',
      data: generateTimingDataset()
    }
  };

  useEffect(() => {
    if (csvInput && csvInput.trim()) {
      validateDebounced(csvInput);
    }
  }, [csvInput, validateDebounced]);

  const handleDataSourceChange = (e) => {
    const selectedDataSource = e.target.value;
    if (defaultDataSources[selectedDataSource]) {
      const data = defaultDataSources[selectedDataSource].data;
      onCsvChange(data);
      const result = validateImmediate(data);
      if (result.valid) {
        onRunAnalysis(data);
        toast.success('数据加载成功', `已加载 ${defaultDataSources[selectedDataSource].name}`);
      } else {
        toast.error('数据验证失败', '请检查数据格式');
        setShowValidationPanel(true);
      }
      setCurrentPage(1);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(csvInput);
    setCopied(true);
    toast.success('复制成功', 'CSV数据已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = () => {
    navigator.clipboard.readText().then(text => {
      setPastedData(text);
    }).catch(err => {
      toast.error('粘贴失败', '无法读取剪贴板内容');
    });
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
    
    return { headers, rows };
  };

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                预设数据源
              </label>
              <select
                onChange={handleDataSourceChange}
                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">选择预设数据源...</option>
                {Object.entries(defaultDataSources).map(([key, source]) => (
                  <option key={key} value={key}>{source.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1.5">
                <FileUp className="w-3.5 h-3.5 text-indigo-500" />
                文件上传
                {getStatusIcon()}
              </label>
              <div 
                className={`
                  relative border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer
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
                  <div className="space-y-2">
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
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {isDragging ? '释放以上传文件' : '拖拽文件到此处或点击上传'}
                    </p>
                    <p className="text-xs text-gray-400">支持 .csv, .txt 文件，最大 10MB</p>
                  </div>
                )}
                
                {fileName && !isFileLoading && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>{fileName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Clipboard className="w-3.5 h-3.5 text-indigo-500" />
              粘贴 CSV 数据
            </label>
            {!showPasteArea ? (
              <button
                onClick={() => setShowPasteArea(true)}
                className="w-full py-2 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-indigo-200"
              >
                <Clipboard className="w-4 h-4" />
                打开粘贴区域
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handlePaste}
                    className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-gray-200"
                  >
                    <Clipboard className="w-4 h-4" />
                    从剪贴板粘贴
                  </button>
                  <button
                    onClick={() => {
                      setPastedData('');
                      setShowPasteArea(false);
                    }}
                    className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors border border-gray-200"
                  >
                    取消
                  </button>
                </div>
                <div className="space-y-2">
                  <textarea
                    value={pastedData}
                    onChange={(e) => {
                      setPastedData(e.target.value);
                    }}
                    className="w-full p-3 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-gray-50"
                    rows={5}
                    placeholder="粘贴的 CSV 数据将显示在这里..."
                  />
                  <button
                    onClick={applyPastedData}
                    disabled={!pastedData.trim()}
                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Play className="w-4 h-4" />
                    应用数据并运行分析
                  </button>
                </div>
              </div>
            )}
          </div>

          {validationTouched && (validationErrors.length > 0 || validationWarnings.length > 0) && (
            <div>
              <button
                onClick={() => setShowValidationPanel(!showValidationPanel)}
                className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors"
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
                <span className="text-xs font-bold text-gray-600">
                  数据预览 ({rows.length} 条数据，第 {currentPage} / {totalPages || 1} 页)
                </span>
                <button 
                  onClick={handleCopy}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? '已复制' : '复制全部'}
                </button>
              </div>
              <div className="overflow-x-auto max-h-[300px] sm:max-h-[400px]">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-indigo-50 text-indigo-900 sticky top-0 z-10">
                    <tr>
                      {headers.map((header, idx) => (
                        <th key={idx} className="px-2 sm:px-3 py-2 font-bold whitespace-nowrap border-r border-indigo-100 last:border-r-0">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-indigo-50/30">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-2 sm:px-3 py-2 font-mono text-gray-600 whitespace-nowrap border-r border-gray-100 last:border-r-0">
                            {cell}
                          </td>
                        ))}
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
                    className="px-2 sm:px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
                          className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
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
                    className="px-2 sm:px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
              onClick={openFileDialog}
              className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-gray-200"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">上传 CSV 文件</span>
              <span className="sm:hidden">上传</span>
            </button>
            <button
              onClick={handleRunAnalysis}
              disabled={!csvInput || !csvInput.trim() || !isValidData}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
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
