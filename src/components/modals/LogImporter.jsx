import React, { useState, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import {
  X, FolderOpen, FileText, Loader2, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Play, Download, Settings, RefreshCw,
  Trash2, Eye, Filter, Layers, Cpu, HardDrive, Clock, HelpCircle,
  Sparkles, Zap
} from 'lucide-react';
import {
  scanFilesFromFileList,
  formatFileSize,
  groupFilesByDirectory,
  groupFilesByAlgorithm,
  getScanSummary,
  sortFiles,
  SUPPORTED_LOG_EXTENSIONS
} from '../../services/folderScanner';
import {
  parseMultipleLogFiles,
  convertToCSVFormat,
  getExtractionStats,
  DEFAULT_EXTRACTION_RULES,
  DEFAULT_ALGORITHM_RULES
} from '../../services/logParser';
import { getActiveRuleSet, setActiveRuleSet, getAllRuleSets } from '../../services/ruleStorage';
import { useToast } from '../common/Toast';
import HelpIcon from '../common/HelpIcon';
import AIRuleGenerator from './AIRuleGenerator';
import RuleTester from '../common/RuleTester';
import RuleManager from '../common/RuleManager';

const STEPS = {
  SELECT: 'select',
  SCANNING: 'scanning',
  EXTRACTING: 'extracting',
  PREVIEW: 'preview'
};

const LogImporter = ({ isOpen, onClose, onImportData, llmConfig }) => {
  const [step, setStep] = useState(STEPS.SELECT);
  const [scannedFiles, setScannedFiles] = useState([]);
  const [scanStats, setScanStats] = useState(null);
  const [parseResults, setParseResults] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [extractionStats, setExtractionStats] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, fileName: '' });
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterAlgo, setFilterAlgo] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [extractionRules, setExtractionRules] = useState(() => {
    const activeSet = getActiveRuleSet();
    return activeSet?.rules || DEFAULT_EXTRACTION_RULES;
  });
  const [algorithmRules, setAlgorithmRules] = useState(DEFAULT_ALGORITHM_RULES);
  const [viewMode, setViewMode] = useState('list');
  const [showAIRuleGenerator, setShowAIRuleGenerator] = useState(false);
  const [showRuleManager, setShowRuleManager] = useState(false);
  const [sampleLogContent, setSampleLogContent] = useState('');

  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const resetState = useCallback(() => {
    setStep(STEPS.SELECT);
    setScannedFiles([]);
    setScanStats(null);
    setParseResults([]);
    setParseErrors([]);
    setExtractionStats(null);
    setProgress({ current: 0, total: 0, fileName: '' });
    setSelectedFiles(new Set());
  }, []);

  const handleFolderSelect = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setStep(STEPS.SCANNING);
    setProgress({ current: 0, total: files.length, fileName: '正在扫描...' });

    try {
      const result = await scanFilesFromFileList(files, {
        maxFiles: 1000,
        maxSizeMB: 50,
        onProgress: (p) => {
          setProgress({
            current: p.current,
            total: p.total,
            fileName: p.fileName
          });
        }
      });

      setScannedFiles(result.files);
      setScanStats(getScanSummary(result));
      setSelectedFiles(new Set(result.files.map(f => f.id)));

      if (result.files.length === 0) {
        toast.warning('未找到日志文件', `支持的格式: ${SUPPORTED_LOG_EXTENSIONS.join(', ')}`);
        setStep(STEPS.SELECT);
      } else {
        toast.success('扫描完成', `找到 ${result.files.length} 个日志文件`);
        setStep(STEPS.PREVIEW);
      }

      if (result.errors.length > 0) {
        console.warn('扫描错误:', result.errors);
      }
    } catch (error) {
      toast.error('扫描失败', error.message);
      setStep(STEPS.SELECT);
    }
  }, [toast]);

  const handleFileSelect = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setStep(STEPS.SCANNING);

    try {
      const result = await scanFilesFromFileList(files, {
        maxFiles: 1000,
        maxSizeMB: 50
      });

      setScannedFiles(result.files);
      setScanStats(getScanSummary(result));
      setSelectedFiles(new Set(result.files.map(f => f.id)));

      if (result.files.length === 0) {
        toast.warning('未找到日志文件', '请选择有效的日志文件');
        setStep(STEPS.SELECT);
      } else {
        toast.success('扫描完成', `找到 ${result.files.length} 个日志文件`);
        setStep(STEPS.PREVIEW);
      }
    } catch (error) {
      toast.error('扫描失败', error.message);
      setStep(STEPS.SELECT);
    }
  }, [toast]);

  const handleExtract = useCallback(async () => {
    const filesToExtract = scannedFiles.filter(f => selectedFiles.has(f.id));
    if (filesToExtract.length === 0) {
      toast.error('请选择文件', '至少选择一个日志文件进行提取');
      return;
    }

    setStep(STEPS.EXTRACTING);
    setProgress({ current: 0, total: filesToExtract.length, fileName: '正在提取...' });

    try {
      const { results, errors } = parseMultipleLogFiles(filesToExtract, {
        extractionRules,
        algorithmRules
      });

      setParseResults(results);
      setParseErrors(errors);
      setExtractionStats(getExtractionStats(results));

      if (results.length > 0) {
        toast.success('提取完成', `成功提取 ${results.length} 个文件的数据`);
      } else {
        toast.warning('提取结果为空', '未能从日志中提取到有效数据');
      }

      setStep(STEPS.PREVIEW);
    } catch (error) {
      toast.error('提取失败', error.message);
      setStep(STEPS.PREVIEW);
    }
  }, [scannedFiles, selectedFiles, extractionRules, algorithmRules, toast]);

  const handleImport = useCallback(() => {
    if (parseResults.length === 0) {
      toast.error('无数据可导入', '请先提取日志数据');
      return;
    }

    const { csvString, metrics, algorithms } = convertToCSVFormat(parseResults);

    if (onImportData) {
      onImportData(csvString, {
        metrics,
        algorithms,
        source: 'log_extraction',
        fileCount: parseResults.length,
        extractedAt: new Date().toISOString()
      });
    }

    toast.success('导入成功', `已导入 ${parseResults.length} 条记录`);
    onClose();
  }, [parseResults, onImportData, toast, onClose]);

  const handleExportJSON = useCallback(() => {
    if (parseResults.length === 0) return;

    const exportData = {
      extractedAt: new Date().toISOString(),
      stats: extractionStats,
      results: parseResults.map(r => ({
        fileName: r.fileName,
        filePath: r.filePath,
        caseName: r.caseName,
        algorithm: r.algorithm,
        extractedData: r.extractedData
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log_extraction_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('导出成功', 'JSON文件已下载');
  }, [parseResults, extractionStats, toast]);

  const handleExportCSV = useCallback(() => {
    if (parseResults.length === 0) return;

    const { csvString } = convertToCSVFormat(parseResults);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log_extraction_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('导出成功', 'CSV文件已下载');
  }, [parseResults, toast]);

  const toggleFileSelection = useCallback((fileId) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    if (selectedFiles.size === scannedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(scannedFiles.map(f => f.id)));
    }
  }, [selectedFiles.size, scannedFiles]);

  const sortedAndFilteredFiles = useMemo(() => {
    let files = [...scannedFiles];

    if (filterAlgo !== 'all') {
      files = files.filter(f => {
        const path = f.path.toLowerCase();
        const rule = algorithmRules.find(r => r.id === filterAlgo);
        if (!rule) return true;
        return rule.patterns.some(p => path.includes(p.toLowerCase()));
      });
    }

    return sortFiles(files, sortBy, sortOrder);
  }, [scannedFiles, filterAlgo, sortBy, sortOrder, algorithmRules]);

  const algorithmGroups = useMemo(() => {
    return groupFilesByAlgorithm(scannedFiles, algorithmRules);
  }, [scannedFiles, algorithmRules]);

  const directoryGroups = useMemo(() => {
    return groupFilesByDirectory(scannedFiles);
  }, [scannedFiles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-violet-600 to-indigo-600 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-bold text-lg text-white">日志数据提取</h3>
              <p className="text-xs text-white/70">从日志文件中自动提取关键指标数据</p>
            </div>
            <HelpIcon 
              content={
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-indigo-400 text-sm mb-2">日志数据提取</h3>
                    <p className="text-gray-300 text-xs mb-2">
                      自动从 EDA 工具生成的日志文件中提取关键性能指标，转换为可分析的 CSV 格式。
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-emerald-300 text-xs">支持的日志格式</h4>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• <strong>.log, .txt, .out</strong>：通用日志文件</li>
                      <li>• <strong>.rpt, .report</strong>：报告文件</li>
                      <li>• <strong>.summary</strong>：摘要文件</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-amber-300 text-xs">提取流程</h4>
                    <ol className="text-gray-300 text-xs space-y-1 list-decimal list-inside">
                      <li>选择包含日志文件的文件夹</li>
                      <li>系统自动扫描并识别日志文件</li>
                      <li>提取 HPWL、时序、功耗等指标</li>
                      <li>预览并导入到分析器</li>
                    </ol>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
                    💡 日志文件命名建议包含算法名称和测试用例名称
                  </div>
                </div>
              }
              position="bottom-right"
              className="w-4 h-4 text-white/70 hover:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10'}`}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">提取规则配置</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAIRuleGenerator(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 bg-purple-50 rounded hover:bg-purple-100"
                >
                  <Sparkles className="w-3 h-3" />
                  AI生成规则
                </button>
                <button
                  onClick={() => setShowRuleManager(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100"
                >
                  <Settings className="w-3 h-3" />
                  管理规则集
                </button>
                <button
                  onClick={() => setExtractionRules(DEFAULT_EXTRACTION_RULES)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  重置
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {extractionRules.map(rule => (
                <div key={rule.id} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                  <span className="font-medium text-gray-700">{rule.metric}</span>
                  <span className="text-gray-400">({rule.patterns.length} 条规则)</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">算法识别规则</span>
              <button
                onClick={() => setAlgorithmRules(DEFAULT_ALGORITHM_RULES)}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                重置为默认
              </button>
            </div>
            <div className="flex gap-2 text-xs">
              {algorithmRules.map(rule => (
                <div key={rule.id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: rule.color }}
                  />
                  <span className="font-medium text-gray-700">{rule.name}</span>
                  <span className="text-gray-400">({rule.patterns.length} 个关键词)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          {step === STEPS.SELECT && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
              <div className="text-center space-y-2">
                <FolderOpen className="w-16 h-16 text-indigo-300 mx-auto" />
                <h4 className="text-xl font-bold text-gray-800">选择日志文件</h4>
                <p className="text-sm text-gray-500">支持格式: {SUPPORTED_LOG_EXTENSIONS.join(', ')}</p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <FolderOpen className="w-5 h-5" />
                  选择文件夹
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-200 text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  选择文件
                </button>
              </div>

              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFolderSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={SUPPORTED_LOG_EXTENSIONS.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {(step === STEPS.SCANNING || step === STEPS.EXTRACTING) && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <div className="text-center">
                <h4 className="text-lg font-bold text-gray-800">
                  {step === STEPS.SCANNING ? '正在扫描文件...' : '正在提取数据...'}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {progress.fileName}
                </p>
              </div>
              <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                {progress.current} / {progress.total}
              </p>
            </div>
          )}

          {step === STEPS.PREVIEW && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {scanStats && (
                <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                  <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span className="text-gray-600">文件:</span>
                      <span className="font-bold text-gray-800">{scanStats.validLogFiles}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">大小:</span>
                      <span className="font-bold text-gray-800">{formatFileSize(scanStats.totalSize)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">目录:</span>
                      <span className="font-bold text-gray-800">{directoryGroups.length}</span>
                    </div>
                    {extractionStats && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-orange-500" />
                          <span className="text-gray-600">算法:</span>
                          <span className="font-bold text-gray-800">{extractionStats.totalAlgorithms}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-gray-600">提取率:</span>
                          <span className="font-bold text-emerald-600">{extractionStats.extractionRate}%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-hidden flex">
                <div className="w-64 border-r border-gray-200 bg-gray-50 p-3 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">算法分组</span>
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => setFilterAlgo('all')}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${filterAlgo === 'all' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                      全部 ({scannedFiles.length})
                    </button>
                    {algorithmGroups.map(group => (
                      <button
                        key={group.id}
                        onClick={() => setFilterAlgo(group.id)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${filterAlgo === group.id ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100 text-gray-600'}`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                        {group.name} ({group.files.length})
                      </button>
                    ))}
                  </div>

                  {parseResults.length > 0 && extractionStats && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="text-xs font-medium text-gray-500">提取统计</span>
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>成功提取</span>
                          <span className="font-medium text-green-600">{parseResults.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>提取失败</span>
                          <span className="font-medium text-red-600">{parseErrors.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>指标数</span>
                          <span className="font-medium">{extractionStats.totalMetrics}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>用例数</span>
                          <span className="font-medium">{extractionStats.totalCases}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleAllSelection}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        {selectedFiles.size === scannedFiles.length ? '取消全选' : '全选'}
                      </button>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-500">已选 {selectedFiles.size} / {scannedFiles.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-xs border border-gray-200 rounded px-2 py-1"
                      >
                        <option value="name">按名称</option>
                        <option value="path">按路径</option>
                        <option value="size">按大小</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        {sortOrder === 'asc' ? '↑ 升序' : '↓ 降序'}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="w-8 px-2 py-2 text-left">
                            <input
                              type="checkbox"
                              checked={selectedFiles.size === scannedFiles.length && scannedFiles.length > 0}
                              onChange={toggleAllSelection}
                              className="rounded border-gray-300"
                            />
                          </th>
                          <th className="px-2 py-2 text-left text-gray-500 font-medium">文件名</th>
                          <th className="px-2 py-2 text-left text-gray-500 font-medium">路径</th>
                          <th className="px-2 py-2 text-left text-gray-500 font-medium">大小</th>
                          <th className="px-2 py-2 text-left text-gray-500 font-medium">算法</th>
                          {parseResults.length > 0 && (
                            <th className="px-2 py-2 text-left text-gray-500 font-medium">提取结果</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAndFilteredFiles.map(file => {
                          const parseResult = parseResults.find(r => r.filePath === file.path);
                          const isSelected = selectedFiles.has(file.id);
                          const algo = algorithmGroups.find(g => g.files.some(f => f.id === file.id));

                          return (
                            <tr
                              key={file.id}
                              className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-indigo-50/50' : ''}`}
                              onClick={() => toggleFileSelection(file.id)}
                            >
                              <td className="px-2 py-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleFileSelection(file.id)}
                                  className="rounded border-gray-300"
                                />
                              </td>
                              <td className="px-2 py-2 font-medium text-gray-700 truncate max-w-[150px]" title={file.name}>
                                {file.name}
                              </td>
                              <td className="px-2 py-2 text-gray-500 truncate max-w-[200px]" title={file.path}>
                                {file.path}
                              </td>
                              <td className="px-2 py-2 text-gray-500">
                                {formatFileSize(file.size)}
                              </td>
                              <td className="px-2 py-2">
                                {algo && (
                                  <span
                                    className="px-2 py-0.5 rounded-full text-white text-[10px]"
                                    style={{ backgroundColor: algo.color }}
                                  >
                                    {algo.name}
                                  </span>
                                )}
                              </td>
                              {parseResults.length > 0 && (
                                <td className="px-2 py-2">
                                  {parseResult ? (
                                    <span className="flex items-center gap-1 text-green-600">
                                      <CheckCircle className="w-3 h-3" />
                                      {Object.keys(parseResult.extractedData).length} 指标
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-gray-400">
                                      <AlertCircle className="w-3 h-3" />
                                      无数据
                                    </span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === STEPS.PREVIEW && (
              <>
                <button
                  onClick={resetState}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  重新选择
                </button>
                {parseResults.length > 0 && (
                  <>
                    <button
                      onClick={handleExportJSON}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      导出JSON
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      导出CSV
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === STEPS.PREVIEW && parseResults.length === 0 && (
              <button
                onClick={handleExtract}
                disabled={selectedFiles.size === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                提取数据 ({selectedFiles.size})
              </button>
            )}
            {step === STEPS.PREVIEW && parseResults.length > 0 && (
              <button
                onClick={handleImport}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                导入到分析器 ({parseResults.length} 条)
              </button>
            )}
          </div>
        </div>
      </div>

      {showAIRuleGenerator && createPortal(
        <AIRuleGenerator
          isOpen={showAIRuleGenerator}
          onClose={() => setShowAIRuleGenerator(false)}
          llmConfig={llmConfig}
          logSample={sampleLogContent}
          onRulesGenerated={(rules) => {
            setExtractionRules(rules);
            toast.success('规则已应用', `已更新 ${rules.length} 条提取规则`);
          }}
        />,
        document.body
      )}

      {showRuleManager && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[300] p-4" onClick={() => setShowRuleManager(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <RuleManager
              isOpen={true}
              onClose={() => setShowRuleManager(false)}
              onRuleSetSelect={(ruleSet) => {
                setExtractionRules(ruleSet.rules);
                toast.success('规则集已切换', `当前使用: ${ruleSet.name}`);
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

LogImporter.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onImportData: PropTypes.func,
  llmConfig: PropTypes.object
};

export default LogImporter;
