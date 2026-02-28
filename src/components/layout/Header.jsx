import React from 'react';
import { Github } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import EdaBannerLogo from '../common/EdaBannerLogo';

const helpContent = (
  <div className="space-y-4">
    <div>
      <h3 className="font-bold text-indigo-300 mb-2 text-base">欢迎使用 EDA 算法评估器</h3>
      <p className="text-gray-300 text-sm leading-relaxed">
        本工具帮助您快速分析和比较不同 EDA（电子设计自动化）算法的性能表现。
      </p>
    </div>
    
    <div className="space-y-2">
      <h4 className="font-semibold text-emerald-300 text-sm">主要功能</h4>
      <ul className="text-gray-300 text-xs space-y-1.5">
        <li className="flex items-start gap-2">
          <span className="text-emerald-400 mt-0.5">•</span>
          <span><strong>数据导入</strong>：支持 CSV 文件上传或直接粘贴数据</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-emerald-400 mt-0.5">•</span>
          <span><strong>统计分析</strong>：自动计算改进率、离群点等关键指标</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-emerald-400 mt-0.5">•</span>
          <span><strong>可视化图表</strong>：箱线图、散点图、雷达图等多种展示</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-emerald-400 mt-0.5">•</span>
          <span><strong>AI 诊断</strong>：智能生成算法性能分析报告</span>
        </li>
      </ul>
    </div>
    
    <div className="space-y-2">
      <h4 className="font-semibold text-amber-300 text-sm">快速开始</h4>
      <ol className="text-gray-300 text-xs space-y-1.5 list-decimal list-inside">
        <li>在左侧面板选择预设数据或上传 CSV 文件</li>
        <li>点击「运行分析」开始处理数据</li>
        <li>切换不同标签页查看分析结果</li>
      </ol>
    </div>
    
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
      <p className="text-amber-200 text-xs">
        ⚠️ 本系统由 AI 生成，仅供学习参考使用，请勿用于生产环境。
      </p>
    </div>
  </div>
);

const Header = () => {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />
      <EdaBannerLogo className="absolute inset-0 opacity-50" />
      
      <div className="relative px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">
              EDA 算法评估器
            </h1>
            <HelpIcon 
              content={helpContent}
              className="w-4 h-4 text-white/70 hover:text-white transition-colors"
              tooltipWidth="w-72"
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
