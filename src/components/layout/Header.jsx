import React from 'react';
import { Github, Settings } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import APP_CONFIG from '../../utils/appConfig';
import { useAppContext } from '../../context/AppContext';

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

const CircuitBackground = () => (
  <svg
    viewBox="0 0 1200 48"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 w-full h-full"
  >
    <defs>
      <linearGradient id="mainLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
        <stop offset="15%" stopColor="#60a5fa" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#a78bfa" stopOpacity="1" />
        <stop offset="85%" stopColor="#f472b6" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="50%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#f472b6" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="strongGlow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <line x1="0" y1="24" x2="1200" y2="24" stroke="url(#mainLineGrad)" strokeWidth="2" />

    <g opacity="0.7">
      <path 
        d="M40 24 L80 24 L90 14 L110 34 L130 14 L150 34 L160 24 L200 24" 
        stroke="url(#chipGrad)" strokeWidth="1.5" fill="none" filter="url(#glow)" 
      />
      <path 
        d="M1000 24 L1040 24 L1050 14 L1070 34 L1090 14 L1110 34 L1120 24 L1160 24" 
        stroke="url(#chipGrad)" strokeWidth="1.5" fill="none" filter="url(#glow)" 
      />
    </g>

    <g transform="translate(560, 6)" filter="url(#strongGlow)">
      <rect x="0" y="0" width="36" height="36" rx="4" fill="url(#chipGrad)" opacity="0.9" />
      <rect x="3" y="3" width="30" height="30" rx="3" fill="white" opacity="0.15" />
      
      <g stroke="url(#chipGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.9">
        <line x1="9" y1="0" x2="9" y2="-6" />
        <line x1="18" y1="0" x2="18" y2="-6" />
        <line x1="27" y1="0" x2="27" y2="-6" />
        <line x1="9" y1="36" x2="9" y2="42" />
        <line x1="18" y1="36" x2="18" y2="42" />
        <line x1="27" y1="36" x2="27" y2="42" />
        <line x1="0" y1="9" x2="-6" y2="9" />
        <line x1="0" y1="18" x2="-6" y2="18" />
        <line x1="0" y1="27" x2="-6" y2="27" />
        <line x1="36" y1="9" x2="42" y2="9" />
        <line x1="36" y1="18" x2="42" y2="18" />
        <line x1="36" y1="27" x2="42" y2="27" />
      </g>

      <g stroke="#e0e7ff" strokeWidth="1" opacity="0.9">
        <path d="M10 10 L16 10 L16 16 L22 16" />
        <path d="M22 10 L28 10 L28 20" />
        <path d="M10 18 L14 18 L14 26 L22 26" />
        <circle cx="10" cy="10" r="1.5" fill="#c7d2fe" />
        <circle cx="16" cy="16" r="1.5" fill="#c7d2fe" />
        <circle cx="22" cy="16" r="1.5" fill="#c7d2fe" />
        <circle cx="28" cy="20" r="1.5" fill="#c7d2fe" />
        <circle cx="22" cy="26" r="1.5" fill="#c7d2fe" />
      </g>
      
      <circle cx="18" cy="18" r="5" fill="white" opacity="0.3">
        <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="18" cy="18" r="3" fill="url(#chipGrad)">
        <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>

    <g opacity="0.6">
      <circle cx="280" cy="24" r="3" fill="#60a5fa" filter="url(#glow)">
        <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="920" cy="24" r="3" fill="#f472b6" filter="url(#glow)">
        <animate attributeName="r" values="2;4;2" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="380" cy="24" r="2.5" fill="#a78bfa" filter="url(#glow)">
        <animate attributeName="r" values="1.5;3.5;1.5" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="820" cy="24" r="2.5" fill="#34d399" filter="url(#glow)">
        <animate attributeName="r" values="1.5;3.5;1.5" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.2s" repeatCount="indefinite" />
      </circle>
    </g>

    <g opacity="0.4">
      <rect x="220" y="18" width="12" height="12" rx="2" fill="none" stroke="#60a5fa" strokeWidth="1" />
      <rect x="968" y="18" width="12" height="12" rx="2" fill="none" stroke="#f472b6" strokeWidth="1" />
      <rect x="340" y="19" width="10" height="10" rx="1" fill="none" stroke="#a78bfa" strokeWidth="1" />
      <rect x="850" y="19" width="10" height="10" rx="1" fill="none" stroke="#34d399" strokeWidth="1" />
    </g>

    <g opacity="0.3">
      <circle cx="480" cy="12" r="2" fill="#60a5fa">
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="720" cy="36" r="2" fill="#f472b6">
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="520" cy="38" r="1.5" fill="#a78bfa">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="680" cy="10" r="1.5" fill="#34d399">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </g>
  </svg>
);

const Header = () => {
  const { setShowAiConfig, llmConfig } = useAppContext();
  const hasApiKey = llmConfig?.apiKey && llmConfig.apiKey.trim() !== '';
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
      <CircuitBackground />
      
      <div className="relative px-4 py-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight">
              {APP_CONFIG.name}
            </h1>
            <HelpIcon 
              content={helpContent}
              className="w-4 h-4 text-white/70 hover:text-white transition-colors"
              tooltipWidth="w-72"
            />
            <span className="text-[10px] text-amber-200 font-semibold bg-amber-500/20 px-1.5 py-0.5 rounded-full">
              v{APP_CONFIG.version}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAiConfig(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                hasApiKey 
                  ? 'bg-white/10 hover:bg-white/20 text-white/90 border-white/10' 
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/30'
              }`}
              title={hasApiKey ? 'AI 设置' : '请配置 AI API Key'}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI 设置</span>
              {!hasApiKey && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />}
            </button>
            
            <a
              href={APP_CONFIG.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white/90 rounded-full text-xs font-medium transition-all border border-white/10"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
