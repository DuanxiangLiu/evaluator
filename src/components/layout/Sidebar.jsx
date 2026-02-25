import React, { useRef } from 'react';
import { FileText, Upload, Play } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';

const Sidebar = ({ isOpen, csvInput, onCsvChange, onRunAnalysis }) => {
  const fileInputRef = useRef(null);

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

  if (!isOpen) return null;

  return (
    <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col gap-4 transition-all duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          CSV 数据源
        </h2>
        <HelpIcon 
          content={
            <div className="space-y-1">
              <p><b>格式要求:</b></p>
              <p>• 第一列为 Case 名称</p>
              <p>• 指标列格式: m_算法名_指标名</p>
              <p>• 支持多个算法对比</p>
            </div>
          }
          position="right-center"
        />
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
    </div>
  );
};

export default Sidebar;
