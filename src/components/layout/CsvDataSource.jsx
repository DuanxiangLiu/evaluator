import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FileText, ChevronUp, ChevronDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import ValidationResultPanel, { CompactValidationStatus } from '../common/ValidationResultPanel';
import SavedDataSelector from '../common/SavedDataSelector';
import LogImporter from '../modals/LogImporter';
import PreviewTable from './PreviewTable';
import { useCsvDataSource } from './useCsvDataSource';
import { useToast } from '../common/Toast';
import { getValidationSuggestions } from '../../utils/validationUtils';

const CsvDataSource = ({ csvInput, onCsvChange, onRunAnalysis, llmConfig }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [showLogImporter, setShowLogImporter] = useState(false);
  
  const toast = useToast();
  
  const {
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
  } = useCsvDataSource({ csvInput, onCsvChange, onRunAnalysis });

  const handleRunAnalysisWithToast = () => {
    if (!csvInput || !csvInput.trim()) {
      toast.error('数据为空', '请先上传或粘贴数据');
      return;
    }
    const result = handleRunAnalysis();
    if (result) {
      toast.success('分析完成', '数据处理完成');
    } else {
      setShowValidationPanel(true);
      toast.error('验证失败', '请修复错误后重试');
    }
  };

  const handleLoadDatasetWithToast = (csvData) => {
    handleLoadDataset(csvData);
    toast.success('加载成功', '数据集已加载');
  };

  const handleFileUploadWithToast = (file) => {
    handleFileUpload(file);
    toast.success('上传成功', '文件已加载');
  };

  const handlePasteDataWithToast = (data) => {
    handlePasteData(data);
    toast.success('应用成功', '数据已粘贴');
  };

  const handleCopyWithToast = () => {
    handleCopy();
    toast.success('已复制', 'CSV数据已复制');
  };

  const handleCellEditSaveWithToast = () => {
    handleCellEditSave();
    toast.success('已更新', '单元格已修改');
  };

  const handleAddRowWithToast = (position) => {
    handleAddRow(position);
    toast.success('已添加', '新行已创建');
  };

  const handleDeleteRowWithToast = (idx) => {
    handleDeleteRow(idx);
    toast.success('已删除', '该行已移除');
  };

  const handleLogImport = (csvString, meta) => {
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
  };

  const StatusIcon = () => {
    const status = getStatusIcon();
    switch (status) {
      case 'validating': return <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />;
      case 'valid': return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case 'invalid': return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'typing': return <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />;
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
          <span className="text-xs text-white/70 bg-white/15 px-1.5 py-0.5 rounded-full">{rows.length} 条</span>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {validationTouched && (
            <CompactValidationStatus 
              errors={validationErrors} 
              warnings={validationWarnings} 
              isValid={isValidData} 
              onClick={() => setShowValidationPanel(!showValidationPanel)} 
            />
          )}
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
            onLoadDataset={handleLoadDatasetWithToast}
            onSaveDataset={handleSaveDataset}
            autoSaveEnabled={true}
            onFileUpload={handleFileUploadWithToast}
            onPasteData={handlePasteDataWithToast}
            isFileLoading={isFileLoading}
            fileName={fileName}
            onOpenLogImporter={() => setShowLogImporter(true)}
          />

          <LogImporter
            isOpen={showLogImporter}
            onClose={() => setShowLogImporter(false)}
            llmConfig={llmConfig}
            onImportData={handleLogImport}
          />

          {validationTouched && (validationErrors.length > 0 || validationWarnings.length > 0) && (
            <div>
              <button onClick={() => setShowValidationPanel(!showValidationPanel)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600">
                {showValidationPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                验证结果 ({validationErrors.length} 错误, {validationWarnings.length} 警告)
              </button>
              {showValidationPanel && (
                <ValidationResultPanel 
                  errors={validationErrors} 
                  warnings={validationWarnings} 
                  stats={validationStats} 
                  suggestions={getValidationSuggestions({ errors: validationErrors, warnings: validationWarnings })} 
                  isValid={isValidData} 
                  showStats={true} 
                  className="mt-2" 
                />
              )}
            </div>
          )}

          {csvInput && headers.length > 0 && (
            <PreviewTable
              headers={headers}
              displayRows={displayRows}
              currentPage={currentPage}
              totalPages={totalPages}
              searchTerm={searchTerm}
              rows={rows}
              filteredAndSortedRows={filteredAndSortedRows}
              isEditingMode={isEditingMode}
              editingCell={editingCell}
              editValue={editValue}
              setEditValue={setEditValue}
              editInputRef={editInputRef}
              searchInputRef={searchInputRef}
              sortConfig={sortConfig}
              copied={copied}
              isAnalyzing={isAnalyzing}
              dataChanged={dataChanged}
              isValidData={isValidData}
              onSort={handleSort}
              onSearchChange={setSearchTerm}
              onClearSearch={clearSearch}
              onCopy={handleCopyWithToast}
              onRunAnalysis={handleRunAnalysisWithToast}
              onToggleEditMode={() => setIsEditingMode(!isEditingMode)}
              onCellDoubleClick={handleCellDoubleClick}
              onCellEditKeyDown={handleCellEditKeyDown}
              onCellEditSave={handleCellEditSaveWithToast}
              onAddRow={handleAddRowWithToast}
              onDeleteRow={handleDeleteRowWithToast}
              onPageChange={setCurrentPage}
              ROWS_PER_PAGE={ROWS_PER_PAGE}
            />
          )}
        </div>
      )}
    </div>
  );
};

CsvDataSource.propTypes = {
  csvInput: PropTypes.string.isRequired,
  onCsvChange: PropTypes.func.isRequired,
  onRunAnalysis: PropTypes.func.isRequired,
  llmConfig: PropTypes.object
};

export default CsvDataSource;
