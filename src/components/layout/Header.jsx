import React from 'react';
import { Activity, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const Header = ({ isSidebarOpen, onToggleSidebar }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-indigo-50 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors border border-gray-200"
          title={isSidebarOpen ? "隐藏数据输入面板" : "显示数据输入面板"}
        >
          {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600" />
            EDA 算法评估器
          </h1>
          <p className="text-sm text-gray-500 mt-1">专业版 v1.0 - 多维度对比分析与智能诊断</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full font-bold border border-indigo-100">
          React + Vite
        </span>
        <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full font-bold">
          本地运行
        </span>
      </div>
    </div>
  );
};

export default Header;
