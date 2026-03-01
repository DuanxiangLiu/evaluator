import { BarChart2, Box, ScatterChart, GitMerge, Radar, Scale, Bot } from 'lucide-react';

export const TAB_CONFIG = [
  { id: 'table', label: '数据明细', icon: BarChart2 },
  { id: 'single', label: '箱线图', icon: Box },
  { id: 'correlation', label: '特征相关性', icon: ScatterChart },
  { id: 'multi', label: '帕累托投影', icon: GitMerge },
  { id: 'all_metrics', label: '全局多维雷达', icon: Radar },
  { id: 'qor_simulator', label: 'QoR 模拟器', icon: Scale },
  { id: 'ai_analysis', label: 'AI 智能诊断', icon: Bot }
];

export const CHART_LAYOUT = {
  PADDING_PERCENT: 0.15,
  MIN_PADDING: 1,
  Y_RANGE_OFFSET: 5,
  Y_SCALE: 90,
  X_START_OFFSET: 5,
  X_SCALE: 90
};

export const CHART_COLORS = {
  POSITIVE_OUTLIER: '#10b981',
  NEGATIVE_OUTLIER: '#dc2626',
  NORMAL_POINT: '#6366f1',
  MEDIAN_LINE: '#818cf8',
  Q1_LINE: '#f59e0b',
  Q3_LINE: '#22c55e',
  ZERO_LINE: '#e5e7eb',
  BOX_FILL: '#c7d2fe'
};

export const CHART_POINT_SIZES = {
  NORMAL_RADIUS: 1,
  OUTLIER_RADIUS: 1.5,
  HOVER_RADIUS: 2.5,
  HOVER_STROKE_WIDTH: 0.3,
  HOVER_AREA_RADIUS: 6
};

export const UI_TEXTS = {
  MAIN_TITLE: '算法对比器',
  KEY_METRICS_OVERVIEW: '关键指标概览',
  METRIC_LABEL: '指标:',
  BASELINE_LABEL: '基线:',
  COMPARE_LABEL: '对比:',
  VALID_SAMPLES: '有效样本',
  INST_LABEL: '#Inst:',
  SORTED_BY_INST: '按 #Inst 数量排序 →'
};

export const TAB_STYLES = {
  ACTIVE: {
    default: 'border-indigo-600 text-indigo-700 bg-white',
    ai_analysis: 'border-purple-600 text-purple-700 bg-white'
  },
  INACTIVE: 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
};

export const getTabStyle = (tabId, isActive) => {
  if (!isActive) {
    return TAB_STYLES.INACTIVE;
  }
  return TAB_STYLES.ACTIVE[tabId] || TAB_STYLES.ACTIVE.default;
};
