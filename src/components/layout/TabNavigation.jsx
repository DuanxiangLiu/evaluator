import React from 'react';
import PropTypes from 'prop-types';
import { BarChart2, Box, ScatterChart, GitMerge, Radar, Scale, Bot } from 'lucide-react';

export const TAB_CONFIG = [
  { id: 'table', label: '数据明细', icon: BarChart2 },
  { id: 'single', label: '箱线图', icon: Box },
  { id: 'correlation', label: '特征相关性', icon: ScatterChart },
  { id: 'multi', label: '帕累托投影', icon: GitMerge },
  { id: 'all_metrics', label: '全局多维雷达', icon: Radar },
  { id: 'qor_simulator', label: 'QoR 权重评估', icon: Scale },
  { id: 'ai_analysis', label: 'AI 智能诊断', icon: Bot }
];

const TabButton = ({ tab, isActive, onClick }) => (
  <button
    className={`px-5 py-3 text-sm font-semibold border-b-[3px] transition-colors flex items-center gap-2 whitespace-nowrap min-w-fit ${
      isActive 
        ? tab.id === 'ai_analysis' 
          ? 'border-purple-600 text-purple-700 bg-white' 
          : 'border-indigo-600 text-indigo-700 bg-white'
        : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
    }`}
    onClick={onClick}
  >
    <tab.icon className="w-4 h-4 flex-shrink-0" />
    <span>{tab.label}</span>
  </button>
);

TabButton.propTypes = {
  tab: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

const TabNavigation = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center overflow-x-auto border-b border-gray-200 bg-gray-50 scrollbar-hide flex-shrink-0 relative z-10">
      {TAB_CONFIG.map(tab => (
        <TabButton 
          key={tab.id} 
          tab={tab} 
          isActive={activeTab === tab.id} 
          onClick={() => onTabChange(tab.id)} 
        />
      ))}
    </div>
  );
};

TabNavigation.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired
};

export default TabNavigation;
