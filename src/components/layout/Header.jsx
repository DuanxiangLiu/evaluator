import React from 'react';
import { Activity, Github } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';

const helpContent = (
  <div className="space-y-3">
    <div>
      <h3 className="font-bold text-indigo-300 mb-2">系统简介</h3>
      <p className="text-gray-300">
        EDA算法评估器是一款用于评估和比较EDA算法性能的工具，支持CSV数据导入、统计分析、可视化图表展示及AI辅助分析等功能。
      </p>
    </div>
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
      <p className="text-amber-200 text-sm">
        ⚠️ 本系统代码由AI生成，未经完善测试，使用时请注意风险。
      </p>
    </div>
  </div>
);

const Header = () => {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      <div className="relative px-4 py-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/15 rounded-lg backdrop-blur-sm">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-bold text-white tracking-tight">
              EDA 算法评估器
            </h1>
            <HelpIcon 
              content={helpContent}
              className="w-4 h-4 text-white/70 hover:text-white transition-colors"
              tooltipWidth="w-[28rem]"
            />
            <span className="text-[10px] text-amber-200 font-semibold bg-amber-500/20 px-1.5 py-0.5 rounded-full">
              v1.2
            </span>
          </div>
          
          <a
            href="https://github.com/DuanxiangLiu/evaluator"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white/90 rounded-lg text-xs font-medium transition-all border border-white/10"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Header;
