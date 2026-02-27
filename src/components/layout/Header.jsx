import React from 'react';
import { Activity, PanelLeftClose, PanelLeftOpen, Github } from 'lucide-react';

const Header = ({ isSidebarOpen, onToggleSidebar }) => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-indigo-50 rounded-lg text-gray-500 hover:text-indigo-600 transition-colors border border-gray-200 flex-shrink-0"
            title={isSidebarOpen ? "隐藏数据输入面板" : "显示数据输入面板"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 truncate">EDA 算法评估器</h1>
            <span className="text-xs sm:text-sm text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex-shrink-0">v1.1</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          <a
            href="https://github.com/DuanxiangLiu/evaluator"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-bold transition-colors border border-gray-200"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Header;
