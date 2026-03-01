import React, { useRef, useState } from 'react';
import { FileText, Upload, Play, ChevronUp, ChevronDown, Database } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import { 
  generateDefaultDataset, 
  generateSmallDataset, 
  generateLargeDataset, 
  generateCongestionDataset,
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
    congestion: {
      name: '拥塞优化数据集 (30 cases)',
      data: generateCongestionDataset()
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
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-indigo-400 text-base mb-2">CSV 数据格式说明</h3>
                  <p className="text-gray-300 text-xs mb-3">
                    CSV 是一种简单的表格数据格式，每行代表一条记录，每列代表一个字段。以下是本系统要求的数据格式：
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <h4 className="font-semibold text-emerald-300 text-sm mb-2">列结构要求</h4>
                    <ul className="text-gray-300 text-xs space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-mono">1.</span>
                        <span><strong>第一列</strong>：Case 名称，即测试用例的唯一标识（如 case1, design_A）</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-mono">2.</span>
                        <span><strong>元数据列</strong>：设计属性信息，如 #Inst（实例数）、#Net（网络数）等</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-400 font-mono">3.</span>
                        <span><strong>指标列</strong>：算法运行结果，格式为 <code className="bg-slate-700 px-1 rounded">m_算法名_指标名</code></span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <h4 className="font-semibold text-amber-300 text-sm mb-2">示例数据</h4>
                    <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
{`Case,#Inst,#Net,m_Base_HPWL,m_Algo1_HPWL
case1,1000,500,125000,118000
case2,2000,800,250000,235000`}
                    </pre>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <h4 className="font-semibold text-cyan-300 text-sm mb-2">注意事项</h4>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• <strong>缺失值</strong>：支持 NA、NAN、N/A、NULL、空格或留空</li>
                      <li>• <strong>基线算法</strong>：通常命名为 Base，用于对比基准</li>
                      <li>• <strong>文件编码</strong>：建议使用 UTF-8 编码</li>
                    </ul>
                  </div>
                </div>
              </div>
            }
            position="right-center"
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
