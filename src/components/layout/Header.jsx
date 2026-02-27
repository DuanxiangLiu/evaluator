import React from 'react';
import { Activity, Github, Zap } from 'lucide-react';

const Header = ({ isSidebarOpen, onToggleSidebar }) => {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      <div className="relative p-3 sm:p-4">
        <div className="flex justify-between items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
              <div className="relative p-1.5 sm:p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-sm">
                EDA 算法评估器
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-200 font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-2 py-0.5 rounded-full border border-amber-400/30 shadow-sm">
                <Zap className="w-2.5 h-2.5" />
                v1.1
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/DuanxiangLiu/evaluator"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white/90 hover:text-white rounded-xl text-xs font-medium transition-all duration-200 border border-white/10 hover:border-white/30 backdrop-blur-sm shadow-sm hover:shadow-md"
            >
              <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
