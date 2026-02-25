import React, { useRef, useState } from 'react';
import { FileText, Upload, Play, ChevronUp, ChevronDown, Database } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import { 
  generateDefaultDataset, 
  generateSmallDataset, 
  generateLargeDataset, 
  generatePowerDataset,
  generateTimingDataset 
} from '../../utils/dataGenerator';

const Sidebar = ({ isOpen, csvInput, onCsvChange, onRunAnalysis }) => {
  const fileInputRef = useRef(null);
  const [isCsvVisible, setIsCsvVisible] = useState(true);

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

  if (!isOpen) return null;

  return (
    <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col gap-4 transition-all duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          CSV 数据源
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCsvVisible(!isCsvVisible)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            title={isCsvVisible ? "收起输入面板" : "展开输入面板"}
          >
            {isCsvVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
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
        </div>
      </div>
      
      {isCsvVisible && (
        <>
          <div className="mb-3">
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
          
          <textarea
            value={csvInput}
            onChange={(e) => onCsvChange(e.target.value)}
            className="flex-1 min-h-[300px] w-full p-3 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-gray-50"
            placeholder="粘贴 CSV 数据或上传文件..."
          />
          
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
              className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-gray-200"
            >
              <Upload className="w-4 h-4" />
              上传文件
            </button>
            <button
              onClick={() => onRunAnalysis()}
              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Play className="w-4 h-4" />
              运行分析
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
