import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Database, Save, Trash2, Edit3, Check, X, Clock, 
  FileText, ChevronDown, Search, Download,
  Upload, CheckCircle, Loader2, FolderOpen, Sparkles
} from 'lucide-react';
import { useToast } from '../common/Toast';
import datasetStorage, { formatDatasetDate, formatDatasetSize, getDatasetRowCount } from '../../utils/datasetStorage';
import { generateDefaultDataset } from '../../utils/dataGenerator';

const DEFAULT_DATASET_ID = '__default_dataset__';

const SavedDataSelector = ({ 
  currentCsvData, 
  onLoadDataset, 
  onSaveDataset,
  autoSaveEnabled = true 
}) => {
  const [datasets, setDatasets] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [selectedId, setSelectedId] = useState(DEFAULT_DATASET_ID);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedId, setLastSavedId] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const dropdownRef = useRef(null);
  const toast = useToast();

  const defaultDataset = {
    id: DEFAULT_DATASET_ID,
    name: '默认示例数据集',
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

  const handleSaveAsNew = () => {
    if (!currentCsvData || !currentCsvData.trim()) {
      toast.error('保存失败', '没有数据可保存');
      return;
    }
    setNewDatasetName(`数据集 ${datasets.length + 1}`);
    setShowSaveDialog(true);
  };

  const handleConfirmSaveAs = () => {
    if (!newDatasetName.trim()) {
      toast.error('保存失败', '请输入数据集名称');
      return;
    }

    setIsSaving(true);
    
    try {
      const saved = datasetStorage.save({
        name: newDatasetName.trim(),
        csvData: currentCsvData,
        stats: {
          rows: getDatasetRowCount(currentCsvData),
          size: formatDatasetSize(currentCsvData)
        }
      });

      setSelectedId(saved.id);
      datasetStorage.setCurrentId(saved.id);
      loadDatasets();
      setShowSaveDialog(false);
      toast.success('保存成功', `已保存为 "${saved.name}"`);
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

  const getSelectedDataset = () => {
    if (selectedId === DEFAULT_DATASET_ID) {
      return defaultDataset;
    }
    return datasets.find(d => d.id === selectedId);
  };

  const selectedDataset = getSelectedDataset();

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-indigo-300 transition-all shadow-sm"
        >
          <Database className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline max-w-[150px] truncate">
            {selectedDataset?.name || '选择数据集'}
          </span>
          <span className="sm:hidden">
            {selectedDataset ? '已选择' : '选择'}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={handleQuickSave}
          disabled={isSaving || !currentCsvData?.trim()}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all shadow-sm
            ${lastSavedId 
              ? 'bg-green-500 text-white' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }
            disabled:bg-gray-300 disabled:cursor-not-allowed
          `}
          title="快速保存当前数据"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : lastSavedId ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isSaving ? '保存中...' : lastSavedId ? '已保存' : '保存'}
          </span>
        </button>

        <button
          onClick={handleSaveAsNew}
          disabled={!currentCsvData?.trim()}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-indigo-300 transition-all shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          title="另存为新数据集"
        >
          <Upload className="w-4 h-4 text-indigo-500" />
          <span className="hidden lg:inline">另存为</span>
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索数据集..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
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
                    <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">内置</span>
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

      {showSaveDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSaveDialog(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
              <Save className="w-5 h-5 text-indigo-500" />
              另存为新数据集
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  数据集名称
                </label>
                <input
                  type="text"
                  value={newDatasetName}
                  onChange={(e) => setNewDatasetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmSaveAs();
                  }}
                  placeholder="输入数据集名称..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSaveAs}
                  disabled={!newDatasetName.trim() || isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      保存
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedDataSelector;
