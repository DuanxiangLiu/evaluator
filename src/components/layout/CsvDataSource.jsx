import React, { useRef, useState } from 'react';
import { FileText, Upload, Play, ChevronUp, ChevronDown, Database, Copy, Check, Clipboard, ChevronLeft, ChevronRight } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import { 
  generateDefaultDataset, 
  generateSmallDataset, 
  generateLargeDataset, 
  generatePowerDataset,
  generateTimingDataset 
} from '../../utils/dataGenerator';

const CsvDataSource = ({ csvInput, onCsvChange, onRunAnalysis }) => {
  const fileInputRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pastedData, setPastedData] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const rowsPerPage = 20;

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      onCsvChange(evt.target.result);
      onRunAnalysis(evt.target.result);
      setCurrentPage(1);
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleDataSourceChange = (e) => {
    const selectedDataSource = e.target.value;
    if (defaultDataSources[selectedDataSource]) {
      const data = defaultDataSources[selectedDataSource].data;
      onCsvChange(data);
      onRunAnalysis(data);
      setCurrentPage(1);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(csvInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = () => {
    navigator.clipboard.readText().then(text => {
      setPastedData(text);
    }).catch(err => {
      console.error('无法读取剪贴板:', err);
    });
  };

  const applyPastedData = () => {
    if (pastedData.trim()) {
      onCsvChange(pastedData);
      onRunAnalysis(pastedData);
      setPastedData('');
      setShowPasteArea(false);
      setCurrentPage(1);
    }
  };

  const parseCSV = (csv) => {
    if (!csv) return { headers: [], rows: [] };
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return { headers: [], rows: [] };
    
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-indigo-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsVisible(!isVisible)}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-gray-700">数据源管理</h2>
          <span className="text-xs text-gray-400">({rows.length} 条数据)</span>
        </div>
        <div className="flex items-center gap-2">
          <HelpIcon 
            content={
              <div className="space-y-2">
                <p className="font-bold text-indigo-600">CSV 数据格式说明</p>
                <div className="space-y-1 text-xs">
                  <p><b>第一列：</b>Case 名称（测试用例标识）</p>
                  <p><b>元数据列：</b>#Inst（实例数）、#Net（网线数）、#Macro（宏单元数）、#Module（模块数）</p>
                  <p><b>指标列格式：</b>m_算法名_指标名</p>
                  <p><b>示例：</b>m_Base_HPWL, m_Algo1_HPWL</p>
                  <p><b>支持算法：</b>Base（基线）、Algo1、Algo2 等</p>
                  <p><b>缺失值：</b>使用 NaN 或 NA 表示</p>
                </div>
              </div>
            }
            position="right-center"
            tooltipWidth="w-72"
          />
          {isVisible ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </div>
      
      {isVisible && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              预设数据源
            </label>
            <select
              onChange={handleDataSourceChange}
              className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">选择预设数据源...</option>
              {Object.entries(defaultDataSources).map(([key, source]) => (
                <option key={key} value={key}>{source.name}</option>
              ))}
            </select>
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
                <div className="flex gap-2">
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
                {pastedData && (
                  <div className="space-y-2">
                    <textarea
                      value={pastedData}
                      onChange={(e) => setPastedData(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-gray-50"
                      rows={5}
                      placeholder="粘贴的 CSV 数据将显示在这里..."
                    />
                    <button
                      onClick={applyPastedData}
                      className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Play className="w-4 h-4" />
                      应用数据并运行分析
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {csvInput && headers.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">
                  数据预览 ({rows.length} 条数据，第 {currentPage} / {totalPages} 页)
                </span>
                <button 
                  onClick={handleCopy}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? '已复制' : '复制全部'}
                </button>
              </div>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-indigo-50 text-indigo-900 sticky top-0 z-10">
                    <tr>
                      {headers.map((header, idx) => (
                        <th key={idx} className="px-3 py-2 font-bold whitespace-nowrap border-r border-indigo-100 last:border-r-0">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-indigo-50/30">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-3 py-2 font-mono text-gray-600 whitespace-nowrap border-r border-gray-100 last:border-r-0">
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
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    上一页
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    下一页
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-gray-200"
            >
              <Upload className="w-4 h-4" />
              上传 CSV 文件
            </button>
            <button
              onClick={() => onRunAnalysis()}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Play className="w-4 h-4" />
              运行分析
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvDataSource;
