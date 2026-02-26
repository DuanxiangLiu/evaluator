import React, { useRef, useState } from 'react';
import { FileText, Upload, Play, ChevronUp, ChevronDown, Database, Copy, Check } from 'lucide-react';
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
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(csvInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
  const displayRows = rows.slice(0, 10);
  const hasMoreRows = rows.length > 10;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-indigo-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsVisible(!isVisible)}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-gray-700">CSV 数据源配置</h2>
          <span className="text-xs text-gray-400">({rows.length} 条数据)</span>
        </div>
        <div className="flex items-center gap-2">
          <HelpIcon 
            content={
              <div className="space-y-2">
                <p className="font-bold text-indigo-600">CSV 数据格式说明</p>
                <div className="space-y-1 text-xs">
                  <p><b>第一列：</b>Case 名称（测试用例标识）</p>
                  <p><b>元数据列：</b>如 Instances、Nets 等设计属性</p>
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

          {csvInput && headers.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">数据预览（前 10 条）</span>
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
                {hasMoreRows && (
                  <div className="text-center py-2 bg-gray-50 text-xs text-gray-500 font-semibold">
                    还有 {rows.length - 10} 条数据...
                  </div>
                )}
              </div>
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
