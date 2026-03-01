import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Database, Save, Trash2, Edit3, Check, X, Clock, 
  FileText, ChevronDown, Search, Download,
  Upload, CheckCircle, Loader2, FolderOpen, Sparkles, FileDown, Clipboard, Play
} from 'lucide-react';
import { useToast } from '../common/Toast';
import HelpIcon from './HelpIcon';
import datasetStorage, { formatDatasetDate, formatDatasetSize, getDatasetRowCount } from '../../utils/datasetStorage';
import { generateDefaultDataset } from '../../utils/dataGenerator';

const DEFAULT_DATASET_ID = '__default_dataset__';

const SavedDataSelector = ({ 
  currentCsvData, 
  onLoadDataset, 
  onSaveDataset,
  autoSaveEnabled = true,
  onFileUpload,
  onPasteData,
  isFileLoading = false,
  fileName = '',
  onOpenLogImporter
}) => {
  const [datasets, setDatasets] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [selectedId, setSelectedId] = useState(DEFAULT_DATASET_ID);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedId, setLastSavedId] = useState(null);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pastedData, setPastedData] = useState('');
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const defaultDataset = {
    id: DEFAULT_DATASET_ID,
    name: '随机数据(布局示例)',
    csvData: generateDefaultDataset(),
    stats: { rows: 30, size: '2.1 KB' },
    isDefault: true
  };

  const loadDatasets = useCallback(() => {
    const saved = datasetStorage.getAll();
    setDatasets(saved);
    const currentId = datasetStorage.getCurrentId();
    if (currentId) {
      setSelectedId(currentId);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDatasets = datasets.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectDataset = (dataset) => {
    setSelectedId(dataset.id);
    if (!dataset.isDefault) {
      datasetStorage.setCurrentId(dataset.id);
    }
    onLoadDataset(dataset.csvData, dataset);
    setIsOpen(false);
    toast.success('数据加载成功', `已加载 "${dataset.name}"`);
  };

  const handleDeleteDataset = (e, dataset) => {
    e.stopPropagation();
    
    if (window.confirm(`确定要删除 "${dataset.name}" 吗？此操作不可撤销。`)) {
      const success = datasetStorage.delete(dataset.id);
      if (success) {
        loadDatasets();
        if (selectedId === dataset.id) {
          setSelectedId(DEFAULT_DATASET_ID);
          datasetStorage.setCurrentId(null);
        }
        toast.success('删除成功', `已删除 "${dataset.name}"`);
      } else {
        toast.error('删除失败', '无法删除数据集');
      }
    }
  };

  const handleStartEdit = (e, dataset) => {
    e.stopPropagation();
    setEditingId(dataset.id);
    setEditingName(dataset.name);
  };

  const handleSaveEdit = (dataset) => {
    if (editingName.trim()) {
      const updated = datasetStorage.rename(dataset.id, editingName.trim());
      if (updated) {
        loadDatasets();
        toast.success('重命名成功', `已重命名为 "${editingName.trim()}"`);
      }
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleQuickSave = () => {
    if (!currentCsvData || !currentCsvData.trim()) {
      toast.error('保存失败', '没有数据可保存');
      return;
    }

    setIsSaving(true);
    
    try {
      const existingDataset = selectedId && selectedId !== DEFAULT_DATASET_ID 
        ? datasetStorage.getById(selectedId) 
        : null;
      
      const saved = datasetStorage.save({
        id: existingDataset?.id || null,
        name: existingDataset?.name || `数据集 ${datasets.length + 1}`,
        csvData: currentCsvData,
        stats: {
          rows: getDatasetRowCount(currentCsvData),
          size: formatDatasetSize(currentCsvData)
        }
      });

      setLastSavedId(saved.id);
      setSelectedId(saved.id);
      datasetStorage.setCurrentId(saved.id);
      loadDatasets();
      
      setTimeout(() => setLastSavedId(null), 2000);
      toast.success('保存成功', `已保存到 "${saved.name}"`);
    } catch (error) {
      toast.error('保存失败', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (e, dataset) => {
    e.stopPropagation();
    const jsonStr = datasetStorage.exportDataset(dataset.id);
    if (jsonStr) {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset.name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('导出成功', `已导出 "${dataset.name}"`);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const dataset = datasetStorage.importDataset(event.target.result);
            loadDatasets();
            toast.success('导入成功', `已导入 "${dataset.name}"`);
          } catch (error) {
            toast.error('导入失败', '无效的数据文件格式');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExportCSV = () => {
    if (!currentCsvData || !currentCsvData.trim()) {
      toast.error('导出失败', '没有数据可导出');
      return;
    }
    
    const blob = new Blob([currentCsvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDataset?.name || 'data'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('导出成功', 'CSV 文件已下载');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    e.target.value = null;
  };

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleApplyPastedData = () => {
    if (pastedData.trim() && onPasteData) {
      onPasteData(pastedData);
      setPastedData('');
      setShowPasteArea(false);
    }
  };

  const getSelectedDataset = () => {
    if (selectedId === DEFAULT_DATASET_ID) {
      return defaultDataset;
    }
    return datasets.find(d => d.id === selectedId);
  };

  const selectedDataset = getSelectedDataset();

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl text-xs font-medium text-gray-700 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200"
        >
          <Database className="w-3.5 h-3.5 text-violet-500" />
          <span className="hidden sm:inline max-w-[120px] truncate">
            {selectedDataset?.name || '选择数据集'}
          </span>
          <span className="sm:hidden">
            {selectedDataset ? '已选择' : '选择'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <span className="w-px h-5 bg-gray-300 mx-1" />

        <button
          onClick={handleOpenFileDialog}
          disabled={isFileLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl text-xs font-medium text-gray-700 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 disabled:opacity-50"
          title="上传 CSV 文件"
        >
          {isFileLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
          ) : (
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
          )}
          <span className="hidden lg:inline">上传 CSV</span>
        </button>

        <button
          onClick={() => setShowPasteArea(!showPasteArea)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
            showPasteArea 
              ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-violet-500/25' 
              : 'bg-white/80 backdrop-blur-sm border border-gray-200/80 text-gray-700 hover:bg-white hover:border-indigo-300'
          }`}
          title="粘贴数据"
        >
          <Clipboard className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">粘贴数据</span>
        </button>

        {onOpenLogImporter && (
          <button
            onClick={onOpenLogImporter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md bg-white/80 backdrop-blur-sm border border-gray-200/80 text-gray-700 hover:bg-white hover:border-indigo-300"
            title="从日志文件提取数据"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">日志提取</span>
          </button>
        )}

        <span className="w-px h-5 bg-gray-300 mx-1" />

        <button
          onClick={handleQuickSave}
          disabled={isSaving || !currentCsvData?.trim()}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200
            bg-white/80 backdrop-blur-sm border border-gray-200/80 text-gray-700 hover:bg-white hover:border-indigo-300 hover:shadow-md
            disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none
          `}
          title="保存数据到数据源"
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : lastSavedId ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {isSaving ? '保存中...' : lastSavedId ? '已保存' : '保存数据'}
          </span>
        </button>

        <button
          onClick={handleExportCSV}
          disabled={!currentCsvData?.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl text-xs font-medium text-gray-700 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
          title="导出为 CSV 文件"
        >
          <FileDown className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden lg:inline">导出 CSV</span>
        </button>

        {fileName && (
          <span className="text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="max-w-[100px] truncate font-medium">{fileName}</span>
          </span>
        )}
      </div>

      {showPasteArea && (
        <div className="mt-2 space-y-2 p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200/80 shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.readText().then(text => {
                  setPastedData(text);
                }).catch(() => {
                  toast.error('粘贴失败', '无法读取剪贴板内容');
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-medium transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md"
            >
              <Clipboard className="w-3.5 h-3.5" />
              从剪贴板
            </button>
            <button
              onClick={() => {
                setPastedData('');
                setShowPasteArea(false);
              }}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-medium transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md"
            >
              取消
            </button>
          </div>
          <textarea
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            className="w-full p-3 border border-gray-200/80 rounded-xl text-xs font-mono focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none bg-white shadow-sm"
            rows={4}
            placeholder="粘贴 CSV 数据..."
          />
          <button
            onClick={handleApplyPastedData}
            disabled={!pastedData.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md shadow-indigo-500/20"
          >
            <Play className="w-3.5 h-3.5" />
            应用数据
          </button>
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索数据集..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200/80 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
            <span className="text-xs text-gray-500 font-medium">
              共 {datasets.length + 1} 个数据集
            </span>
            <button
              onClick={handleImport}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              导入
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            <div
              onClick={() => handleSelectDataset(defaultDataset)}
              className={`
                p-3 border-b border-gray-100 cursor-pointer transition-all group
                ${selectedId === DEFAULT_DATASET_ID 
                  ? 'bg-indigo-50 border-l-4 border-l-indigo-500' 
                  : 'hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {defaultDataset.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 ml-6">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {defaultDataset.stats.rows} 行
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>{defaultDataset.stats.size}</span>
                    <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">内置</span>
                  </div>
                </div>
              </div>
            </div>

            {filteredDatasets.length === 0 ? (
              <div className="p-6 text-center">
                <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {searchTerm ? '未找到匹配的数据集' : '暂无保存的数据集'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  点击"保存"按钮保存当前数据
                </p>
              </div>
            ) : (
              filteredDatasets.map((dataset) => (
                <div
                  key={dataset.id}
                  onClick={() => handleSelectDataset(dataset)}
                  className={`
                    p-3 border-b border-gray-50 cursor-pointer transition-all group
                    ${selectedId === dataset.id 
                      ? 'bg-indigo-50 border-l-4 border-l-indigo-500' 
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {editingId === dataset.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(dataset);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(dataset)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {dataset.name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {dataset.stats?.rows || getDatasetRowCount(dataset.csvData)} 行
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>{dataset.stats?.size || formatDatasetSize(dataset.csvData)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDatasetDate(dataset.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleStartEdit(e, dataset)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                        title="重命名"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleExport(e, dataset)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                        title="导出"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteDataset(e, dataset)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedDataSelector;
