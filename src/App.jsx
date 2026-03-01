import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Header from './components/layout/Header';
import CsvDataSource from './components/layout/CsvDataSource';
import HelpIcon from './components/common/HelpIcon';
import { ImprovementFormulaHelp } from './components/common/HelpContents';
import DeepDiveModal from './components/modals/DeepDiveModal';
import AiConfigModal from './components/modals/AiConfigModal';
import TableView from './components/views/TableView';
import ChartsView from './components/views/ChartsView';
import AIAnalysisView from './components/views/AIAnalysisView';
import { ToastProvider, useToast } from './components/common/Toast';
import { generateAIInsights } from './services/aiService.jsx';
import { AlertTriangle, TrendingUp, BarChart2, Box, ScatterChart, GitMerge, Radar, Scale, Bot } from 'lucide-react';

const TAB_CONFIG = [
  { id: 'table', label: '详细数据', icon: BarChart2 },
  { id: 'single', label: '箱线图', icon: Box },
  { id: 'correlation', label: '特征相关性', icon: ScatterChart },
  { id: 'multi', label: '帕累托投影', icon: GitMerge },
  { id: 'all_metrics', label: '全局多维雷达', icon: Radar },
  { id: 'qor_simulator', label: 'QoR 模拟器', icon: Scale },
  { id: 'ai_analysis', label: 'AI 智能诊断', icon: Bot }
];

const TabButton = ({ tab, isActive, onClick }) => (
  <button
    className={`px-4 py-4 text-sm font-bold border-b-[3px] transition-colors flex items-center gap-2 whitespace-nowrap ${
      isActive 
        ? tab.id === 'ai_analysis' 
          ? 'border-purple-600 text-purple-700 bg-white' 
          : 'border-indigo-600 text-indigo-700 bg-white'
        : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
    }`}
    onClick={onClick}
  >
    <tab.icon className="w-3.5 h-3.5" />
    <span>{tab.label}</span>
  </button>
);

const StatsCards = ({ stats }) => {
  const [showAuxiliary, setShowAuxiliary] = useState(true);

  if (!stats) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-lg flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4" />
        没有合法的对比数据。请检查数据源或切换目标。
      </div>
    );
  }

  const improvedCount = stats.nValid - stats.degradedCount;
  const improvedRate = stats.nValid > 0 ? (improvedCount / stats.nValid * 100) : 0;
  const degradedRate = stats.nValid > 0 ? (stats.degradedCount / stats.nValid * 100) : 0;
  const cv = (stats.meanImp !== 0 && !isNaN(stats.std) && stats.meanImp !== null) 
    ? (stats.std / Math.abs(stats.meanImp)) 
    : null;

  const iqr = stats.q3 - stats.q1;

  const mainCards = [
    { label: '几何平均改进', value: stats.geomeanImp, isPositive: stats.geomeanImp > 0, helpId: 'geomean' },
    { label: '算术平均改进', value: stats.meanImp, isPositive: stats.meanImp > 0, helpId: 'arith' },
    { label: '显著性检验', value: stats.pValue, isPositive: stats.pValue < 0.05, format: 'pvalue', helpId: 'pvalue' },
    { label: '95% 置信区间', value: `[${stats.ciLower.toFixed(2)}%, ${stats.ciUpper.toFixed(2)}%]`, isPositive: stats.ciLower > 0, helpId: 'ci' },
    { 
      label: '退化案例', 
      value: stats.degradedCount, 
      suffix: `/${stats.nValid}`,
      subValue: `(${degradedRate.toFixed(2)}%)`,
      isPositive: stats.degradedCount === 0, 
      helpId: 'degraded' 
    },
    { 
      label: '极值范围', 
      value: stats.maxImp, 
      minImp: stats.minImp,
      isPositive: stats.maxImp > Math.abs(stats.minImp || 0), 
      helpId: 'extreme',
      format: 'range'
    }
  ];

  const auxiliaryCards = [
    { label: '中位数', value: stats.median, isPositive: stats.median > 0, helpId: 'median', description: '改进率的中位数值' },
    { label: '标准差', value: stats.std, isPositive: true, neutral: true, helpId: 'std', description: '数据离散程度的度量' },
    { label: '变异系数', value: cv, std: stats.std, meanImp: stats.meanImp, isPositive: true, neutral: true, format: 'cv', helpId: 'cv', description: '标准差/均值，衡量相对离散程度' },
    { label: 'IQR', value: iqr, isPositive: iqr > 0, neutral: true, helpId: 'iqr', description: '四分位距 Q3-Q1，中间50%数据的范围' }
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {mainCards.map((card, i) => (
          <div key={i} className={`p-3 rounded-xl border min-w-[200px] flex-1 ${card.isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`text-xs font-bold mb-1 flex items-center ${card.isPositive ? 'text-emerald-800' : 'text-red-800'}`}>
              {card.label}
              <HelpIcon content={<StatHelpContent helpId={card.helpId} />} position="bottom-right" className="w-4 h-4 ml-0.5" />
            </div>
            <div className={`text-xl font-black whitespace-nowrap ${card.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {card.format === 'pvalue' && typeof card.value === 'number' 
                ? card.value.toFixed(3) 
                : card.format === 'range'
                  ? <span className="flex items-center gap-1 text-lg">
                      <span className="text-red-600">{card.minImp.toFixed(2)}%</span>
                      <span className="text-gray-400 text-sm">~</span>
                      <span className="text-emerald-600">+{card.value.toFixed(2)}%</span>
                    </span>
                  : card.format === 'integer'
                    ? <span>{card.value}{card.suffix || ''} <span className="text-sm font-medium">{card.subValue}</span></span>
                    : card.suffix && card.subValue
                      ? <span>{card.value}{card.suffix} <span className="text-sm font-medium">{card.subValue}</span></span>
                      : typeof card.value === 'number' 
                        ? `${card.value > 0 ? '+' : ''}${card.value.toFixed(2)}%`
                        : card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAuxiliary(!showAuxiliary)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
        >
          {showAuxiliary ? '收起' : '展开'}辅助指标
          <svg className={`w-3 h-3 transition-transform ${showAuxiliary ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <span className="text-xs text-gray-400">中位数、标准差、变异系数、IQR</span>
      </div>

      {showAuxiliary && (
        <div className="flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 duration-200">
          {auxiliaryCards.map((card, i) => (
            <div key={i} className={`px-2.5 py-1.5 rounded border ${card.neutral ? 'bg-gray-50 border-gray-200' : card.isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className={`text-[10px] font-bold flex items-center ${card.neutral ? 'text-gray-600' : card.isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                {card.label}
                <HelpIcon content={<AuxiliaryStatHelp label={card.label} value={card.value} std={card.std} meanImp={card.meanImp} />} position="bottom-right" className="w-4 h-4 ml-0.5" />
              </div>
              <div className={`text-base font-black ${card.neutral ? 'text-gray-700' : card.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {card.format === 'cv'
                  ? (card.value === null || isNaN(card.value) 
                    ? 'N/A'
                    : card.value.toFixed(2))
                  : typeof card.value === 'number'
                    ? card.neutral
                      ? `${card.value.toFixed(2)}%`
                      : `${card.value > 0 ? '+' : ''}${card.value.toFixed(2)}%`
                    : card.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AuxiliaryStatHelp = ({ label, value, std, meanImp }) => {
  const helps = {
    '中位数': {
      title: '中位数 (Median)',
      description: '改进率的中位数值，反映典型案例的表现',
      formula: '将所有改进率排序后取中间值',
      details: [
        { label: '特点', value: '不受极端值影响，比平均值更稳健' },
        { label: '解读', value: '正值表示超过半数案例有优化效果' },
        { label: '对比', value: '若与平均值差异大，说明存在极端值干扰' }
      ],
      example: '例如：中位数 +5% 表示至少 50% 的案例改进率 ≥ 5%'
    },
    '标准差': {
      title: '标准差 (Standard Deviation)',
      description: '衡量改进率的波动程度',
      formula: 'σ = √[Σ(xi-μ)²/n]',
      details: [
        { label: '含义', value: '数值越小，算法表现越稳定一致' },
        { label: '解读', value: '标准差大说明不同案例间表现差异大' },
        { label: '建议', value: '标准差 < 平均改进率的一半较为理想' }
      ],
      example: '例如：平均改进 10%，标准差 3%，说明大多数案例改进率在 7%~13% 之间'
    },
    '变异系数': {
      title: '变异系数 (CV)',
      description: '相对离散程度，消除量纲影响',
      formula: 'CV = 标准差 / |平均值| × 100%',
      details: [
        { label: '特点', value: '无量纲，便于不同数据集间比较' },
        { label: '解读', value: 'CV < 50% 表示稳定性较好' },
        { label: '建议', value: 'CV > 100% 说明数据波动剧烈，需关注' }
      ],
      example: `当前：${std?.toFixed(2) || '-'} / ${Math.abs(meanImp || 0).toFixed(2)} = ${value?.toFixed(2) || '-'}%`
    },
    'IQR': {
      title: '四分位距 (Interquartile Range)',
      description: '中间 50% 数据的分布范围',
      formula: 'IQR = Q3(75%分位) - Q1(25%分位)',
      details: [
        { label: '特点', value: '不受极端值影响，反映核心数据分布' },
        { label: '解读', value: 'IQR 越小说明核心数据越集中' },
        { label: '应用', value: '箱线图的箱体高度就是 IQR' }
      ],
      example: '例如：IQR = 8% 表示中间 50% 案例的改进率跨度为 8 个百分点'
    }
  };

  const help = helps[label] || { title: label, description: '', formula: '', details: [], example: '' };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-bold text-indigo-400 text-sm">{help.title}</h3>
        <p className="text-gray-300 text-xs mt-1">{help.description}</p>
      </div>
      
      {help.formula && (
        <div className="bg-slate-800/50 rounded p-2">
          <span className="text-xs text-gray-400">计算公式：</span>
          <span className="text-xs text-emerald-300 font-mono ml-1">{help.formula}</span>
        </div>
      )}
      
      <div className="space-y-1.5">
        {help.details.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-amber-300 font-semibold min-w-[40px]">{item.label}：</span>
            <span className="text-gray-300">{item.value}</span>
          </div>
        ))}
      </div>
      
      {help.example && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded p-2 text-xs text-indigo-200">
          💡 {help.example}
        </div>
      )}
    </div>
  );
};

const StatHelpContent = ({ helpId }) => {
  const helps = {
    geomean: { 
      title: '几何平均改进率 (Geomean)', 
      description: '评估算法整体改进比例的黄金标准',
      formula: 'Geomean = exp(Σln(Ratio)/n)',
      details: [
        { label: '特点', value: '能有效抵消极端异常值的影响' },
        { label: '解读', value: '正值表示整体优化，负值表示整体退化' },
        { label: '建议', value: '与算术平均值对比，差异大说明存在极端值' }
      ],
      example: '例如：Geomean = +8% 表示整体改进约 8%，这是最可靠的改进指标'
    },
    arith: { 
      title: '算术平均改进率 (Arithmetic Mean)', 
      description: '直观的算术平均值，易受极端值影响',
      formula: 'Mean = Σ(改进率)/n',
      details: [
        { label: '特点', value: '直观易懂，但易受极端值影响' },
        { label: '解读', value: '若远大于 Geomean，说明个别案例被异常放大' },
        { label: '建议', value: '结合 Geomean 一起分析，两者差异大时需警惕' }
      ],
      example: '例如：Mean = +12%，Geomean = +8%，差异 4% 说明存在极端值'
    },
    pvalue: { 
      title: 'Wilcoxon 符号秩检验 P-Value', 
      description: '非参数统计检验的显著性指标',
      formula: '基于符号秩和计算的概率值',
      details: [
        { label: '原理', value: '判断数据分布改变是否真实有效' },
        { label: '解读', value: 'P < 0.05 表示提升具有统计学显著性' },
        { label: '建议', value: 'P 值越小，结果越可信，建议 P < 0.01' }
      ],
      example: '例如：P = 0.003 < 0.01，说明改进结果高度显著，可信度 99%+'
    },
    ci: { 
      title: '95% 置信区间', 
      description: '算法表现波动的预测范围',
      formula: 'CI = 均值 ± 1.96 × 标准误',
      details: [
        { label: '含义', value: '有 95% 概率真实改进率落在此区间内' },
        { label: '解读', value: '下限 > 0% 说明算法极为稳健' },
        { label: '建议', value: '区间越窄越稳定，关注下限是否为正' }
      ],
      example: '例如：[+3%, +12%] 表示有 95% 把握真实改进率在此范围内'
    },
    degraded: { 
      title: '退化案例统计', 
      description: '改进率为负的测试用例数量',
      formula: '退化率 = 退化案例数 / 总案例数 × 100%',
      details: [
        { label: '定义', value: '改进率 < 0% 的案例为退化案例' },
        { label: '解读', value: '括号内为退化案例占总案例的百分比' },
        { label: '建议', value: '通常退化率应控制在 10% 以内' }
      ],
      example: '例如：5/50 (10%) 表示 50 个案例中有 5 个退化，需分析原因'
    },
    extreme: { 
      title: '极值范围', 
      description: '算法表现的上下边界',
      formula: '范围 = [最小值, 最大值]',
      details: [
        { label: '展示', value: '最大退化幅度 ~ 最大改进幅度' },
        { label: '解读', value: '评估算法在最好和最差情况下的表现' },
        { label: '建议', value: '关注是否存在极端退化案例（<-20%）' }
      ],
      example: '例如：[-15%, +25%] 表示最差退化 15%，最好改进 25%'
    },
    improved_count: { 
      title: '改进案例', 
      description: '改进率为正的测试用例数量',
      formula: '改进率 = 改进案例数 / 总案例数 × 100%',
      details: [
        { label: '定义', value: '改进率 > 0% 的案例为改进案例' },
        { label: '解读', value: '括号内为改进案例占总案例的百分比' },
        { label: '建议', value: '改进率应 > 70% 才说明算法有效' }
      ],
      example: '例如：42/50 (84%) 表示 50 个案例中有 42 个有改进效果'
    },
    median: { 
      title: '中位数 (Median)', 
      description: '改进率的中位数值',
      formula: '将所有改进率排序后取中间值',
      details: [
        { label: '特点', value: '不受极端值影响，比平均值更稳健' },
        { label: '解读', value: '正值表示超过半数案例有优化效果' },
        { label: '建议', value: '与平均值对比，差异大说明存在极端值' }
      ],
      example: '例如：中位数 +5% 表示至少 50% 的案例改进率 ≥ 5%'
    },
    std: { 
      title: '标准差 (Standard Deviation)', 
      description: '数据离散程度的度量',
      formula: 'σ = √[Σ(xi-μ)²/n]',
      details: [
        { label: '含义', value: '数值越小，算法表现越稳定一致' },
        { label: '解读', value: '标准差大说明不同案例间表现差异大' },
        { label: '建议', value: '标准差 < 平均改进率的一半较为理想' }
      ],
      example: '例如：平均改进 10%，标准差 3%，说明大多数案例改进率在 7%~13% 之间'
    },
    cv: { 
      title: '变异系数 (Coefficient of Variation)', 
      description: '相对离散程度指标',
      formula: 'CV = 标准差 / |均值| × 100%',
      details: [
        { label: '特点', value: '无量纲，便于不同数据集间比较' },
        { label: '解读', value: 'CV < 50% 表示稳定性较好' },
        { label: '建议', value: 'CV > 100% 说明数据波动剧烈，需关注' }
      ],
      example: '例如：CV = 30% 表示相对稳定性良好'
    },
    iqr: { 
      title: '四分位距 (Interquartile Range)', 
      description: '中间 50% 数据的分布范围',
      formula: 'IQR = Q3(75%分位) - Q1(25%分位)',
      details: [
        { label: '特点', value: '不受极端值影响，反映核心数据分布' },
        { label: '解读', value: 'IQR 越小说明核心数据越集中' },
        { label: '应用', value: '箱线图的箱体高度就是 IQR' }
      ],
      example: '例如：IQR = 8% 表示中间 50% 案例的改进率跨度为 8 个百分点'
    }
  };
  const help = helps[helpId] || { title: '', description: '', formula: '', details: [], example: '' };
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-bold text-indigo-400 text-sm">{help.title}</h3>
        <p className="text-gray-300 text-xs mt-1">{help.description}</p>
      </div>
      
      {help.formula && (
        <div className="bg-slate-800/50 rounded p-2">
          <span className="text-xs text-gray-400">计算公式：</span>
          <span className="text-xs text-emerald-300 font-mono ml-1">{help.formula}</span>
        </div>
      )}
      
      <div className="space-y-1.5">
        {help.details.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-amber-300 font-semibold min-w-[40px]">{item.label}：</span>
            <span className="text-gray-300">{item.value}</span>
          </div>
        ))}
      </div>
      
      {help.example && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded p-2 text-xs text-indigo-200">
          💡 {help.example}
        </div>
      )}
    </div>
  );
};

const AppContent = () => {
  const {
    csvInput, setCsvInput, llmConfig, setLlmConfig, activeMetric, setActiveMetric,
    parsedData, isSidebarOpen, availableMetrics, availableAlgos, metaColumns,
    activeTab, setActiveTab, baseAlgo, setBaseAlgo, compareAlgo, setCompareAlgo,
    tableFilter, setTableFilter, corrX, setCorrX, corrY, setCorrY,
    paretoX, setParetoX, paretoY, setParetoY, paretoZ, setParetoZ,
    qorWeights, setQorWeights,
    selectedCases, sortConfig, tooltipState, setTooltipState,
    deepDiveCase, setDeepDiveCase, hoveredCase, setHoveredCase,
    isAnalyzing, setIsAnalyzing, aiInsights, setAiInsights,
    displayInsights, setDisplayInsights, aiError, setAiError,
    showAiConfig, setShowAiConfig,
    stats, allMetricsStats, filteredTableData,
    validCasesMap, runAnalysis, toggleCase, toggleAll, handleSort, handleChartMouseMove,
    tableSearchTerm, setTableSearchTerm,
    saveAiInsights, getSavedAiInsights, isInsightsOutdated
  } = useAppContext();

  useEffect(() => { runAnalysis(); }, []);

  useEffect(() => {
    if (availableMetrics.length > 0 && !corrX) {
      setCorrX(metaColumns.length > 0 ? metaColumns[0] : availableMetrics[0]);
    }
    if (availableMetrics.length > 0 && !corrY) {
      setCorrY(availableMetrics[0]);
    }
  }, [availableMetrics, metaColumns, corrX, corrY, setCorrX, setCorrY]);

  useEffect(() => {
    if (!isAnalyzing && aiInsights && activeTab === 'ai_analysis') {
      setDisplayInsights(aiInsights);
    }
  }, [aiInsights, isAnalyzing, activeTab]);

  useEffect(() => {
    if (activeTab === 'ai_analysis' && !aiInsights && !isAnalyzing) {
      const saved = getSavedAiInsights(baseAlgo, compareAlgo);
      if (saved) {
        setAiInsights(saved.insights);
        setDisplayInsights(saved.insights);
      }
    }
  }, [activeTab, baseAlgo, compareAlgo, aiInsights, isAnalyzing, getSavedAiInsights]);

  const handleGenerateAIInsights = async () => {
    if (!stats || !activeMetric) return;
    if (llmConfig.provider !== 'gemini' && !llmConfig.apiKey) {
      setAiError(`请先在设置中配置您的 ${llmConfig.provider} API Key`);
      setShowAiConfig(true);
      return;
    }
    setIsAnalyzing(true);
    setAiInsights('');
    setDisplayInsights('');
    setAiError('');
    try {
      const insights = await generateAIInsights(llmConfig, baseAlgo, compareAlgo, activeMetric, stats, allMetricsStats, parsedData, selectedCases, metaColumns);
      setAiInsights(insights);
      saveAiInsights(baseAlgo, compareAlgo, insights);
    } catch (err) {
      setAiError(`调用失败: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const caseData = deepDiveCase ? parsedData.find(d => d.Case === deepDiveCase) : null;

  return (
    <div className="min-h-screen bg-gray-100/50 p-4 lg:p-6 font-sans text-gray-800 relative">
      {tooltipState.visible && (
        <div className="fixed pointer-events-none bg-gray-900/95 border border-gray-700 text-white text-xs px-4 py-3 rounded-xl shadow-2xl z-[9999] backdrop-blur-sm transition-opacity duration-75 min-w-[120px] max-w-[300px]" style={{ left: tooltipState.x + 15, top: tooltipState.y + 15 }}>
          <div className="font-bold text-sm mb-1.5 text-indigo-300 border-b border-gray-700 pb-1 whitespace-nowrap">{tooltipState.title}</div>
          {tooltipState.lines.map((line, i) => (
            <div key={i} className={`font-mono text-sm leading-relaxed ${
              typeof line === 'string' ? 'text-gray-300' : line.color || 'text-gray-300'
            }`}>
              {typeof line === 'string' ? line : line.text}
            </div>
          ))}
        </div>
      )}
      <DeepDiveModal isOpen={!!deepDiveCase} caseData={caseData} baseAlgo={baseAlgo} compareAlgo={compareAlgo} availableMetrics={availableMetrics} onClose={() => setDeepDiveCase(null)} />
      <AiConfigModal isOpen={showAiConfig} config={llmConfig} onConfigChange={setLlmConfig} onClose={() => setShowAiConfig(false)} />

      <div className="max-w-[1600px] mx-auto space-y-6">
        <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <CsvDataSource csvInput={csvInput} onCsvChange={setCsvInput} onRunAnalysis={runAnalysis} llmConfig={llmConfig} />

        <div className="flex flex-wrap items-center gap-2 mb-2 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 rounded-xl shadow-md">
          <span className="text-base font-bold text-white flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-lg">
            <TrendingUp className="w-4 h-4" />关键指标概览
            <HelpIcon content={<div className="space-y-3">
              <div>
                <h3 className="font-bold text-indigo-400 text-sm mb-2">关键指标概览</h3>
                <p className="text-gray-300 text-xs mb-2">
                  展示当前选中指标 ({activeMetric}) 的核心统计数据，帮助您快速评估 {compareAlgo} 相对于 {baseAlgo} 的性能表现。
                </p>
              </div>
              
              <ImprovementFormulaHelp />
              
              <div className="space-y-2">
                <h4 className="font-semibold text-emerald-300 text-xs">核心指标</h4>
                <ul className="text-gray-300 text-xs space-y-1.5">
                  <li>• <strong>几何平均</strong>：整体改进的黄金标准，抗极端值干扰</li>
                  <li>• <strong>算术平均</strong>：直观的平均改进率，易受极端值影响</li>
                  <li>• <strong>P-Value</strong>：统计显著性，&lt;0.05 表示改进可信</li>
                  <li>• <strong>置信区间</strong>：95% 概率下真实改进率的范围</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-300 text-xs">风险指标</h4>
                <ul className="text-gray-300 text-xs space-y-1.5">
                  <li>• <strong>退化案例</strong>：改进率为负的案例数量和占比</li>
                  <li>• <strong>极值范围</strong>：最差到最好表现的边界值</li>
                </ul>
              </div>
              
              <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
                💡 点击各指标旁的 <strong>?</strong> 图标可查看详细解释和计算公式
              </div>
            </div>} position="bottom-right" className="w-4 h-4 text-white/70 hover:text-white" />
          </span>
          <div className="h-5 w-px bg-white/30"></div>
          <span className="text-xs font-bold text-white/80">指标:</span>
          <select value={activeMetric} onChange={(e) => setActiveMetric(e.target.value)} className="text-sm font-semibold border-0 rounded-lg py-1 px-2 focus:ring-2 focus:ring-white/50 bg-white/90 text-gray-800 shadow-sm">
            {availableMetrics.map(m => {
              let label = m;
              if (m === 'Runtime') label = 'Runtime (s)';
              if (m === 'HPWL') label = 'HPWL (μm)';
              if (m === 'TNS') label = 'TNS (ps)';
              if (m === 'HB') label = '#HB';
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>
          <span className="text-xs font-bold text-white/80">基线:</span>
          <select value={baseAlgo} onChange={(e) => setBaseAlgo(e.target.value)} className="text-sm font-semibold border-0 rounded-lg py-1 px-2 focus:ring-2 focus:ring-white/50 bg-white/90 text-gray-800 shadow-sm">
            {availableAlgos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <span className="text-white/60 font-bold text-xs">vs</span>
          <span className="text-xs font-bold text-white/80">对比:</span>
          <select value={compareAlgo} onChange={(e) => setCompareAlgo(e.target.value)} className="text-sm font-semibold border-0 rounded-lg py-1 px-2 focus:ring-2 focus:ring-white/50 bg-amber-100 text-amber-800 shadow-sm">
            {availableAlgos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {stats && (
            <span className="text-xs font-bold text-amber-900 bg-gradient-to-r from-amber-200 to-yellow-200 px-3 py-1.5 rounded-full ml-auto flex items-center gap-1.5 shadow-md border border-amber-300">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
              有效样本: {stats.nValid}/{stats.nTotalChecked}
            </span>
          )}
        </div>

        <StatsCards stats={stats} />

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden flex flex-col min-h-[700px] relative z-0">
          <div className="flex items-center overflow-x-auto border-b border-gray-200 bg-gray-50 scrollbar-hide flex-shrink-0 relative z-10">
            {TAB_CONFIG.map(tab => (
              <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
            ))}
          </div>

          <div className="bg-white flex-1 overflow-y-auto custom-scrollbar relative z-0">
            {activeTab === 'table' && (
            <TableView
              activeMetric={activeMetric}
              baseAlgo={baseAlgo}
              compareAlgo={compareAlgo}
              metaColumns={metaColumns}
              tableFilter={tableFilter}
              setTableFilter={setTableFilter}
              parsedData={parsedData}
              filteredTableData={filteredTableData}
              selectedCases={selectedCases}
              sortConfig={sortConfig}
              handleSort={handleSort}
              toggleCase={toggleCase}
              toggleAll={toggleAll}
              hoveredCase={hoveredCase}
              setHoveredCase={setHoveredCase}
              validCasesMap={validCasesMap}
              setDeepDiveCase={setDeepDiveCase}
              stats={stats}
              allMetricsStats={allMetricsStats}
              tableSearchTerm={tableSearchTerm}
              setTableSearchTerm={setTableSearchTerm}
            />
          )}

            {activeTab !== 'table' && activeTab !== 'ai_analysis' && (
              <ChartsView
                activeTab={activeTab}
                stats={stats}
                activeMetric={activeMetric}
                handleChartMouseMove={handleChartMouseMove}
                hoveredCase={hoveredCase}
                setHoveredCase={setHoveredCase}
                setTooltipState={setTooltipState}
                setDeepDiveCase={setDeepDiveCase}
                parsedData={parsedData}
                selectedCases={selectedCases}
                metaColumns={metaColumns}
                availableMetrics={availableMetrics}
                availableAlgos={availableAlgos}
                baseAlgo={baseAlgo}
                compareAlgo={compareAlgo}
                corrX={corrX}
                setCorrX={setCorrX}
                corrY={corrY}
                setCorrY={setCorrY}
                paretoX={paretoX}
                setParetoX={setParetoX}
                paretoY={paretoY}
                setParetoY={setParetoY}
                paretoZ={paretoZ}
                setParetoZ={setParetoZ}
                allMetricsStats={allMetricsStats}
                qorWeights={qorWeights}
                setQorWeights={setQorWeights}
              />
            )}

            {activeTab === 'ai_analysis' && (
              <AIAnalysisView
                baseAlgo={baseAlgo}
                compareAlgo={compareAlgo}
                isAnalyzing={isAnalyzing}
                aiInsights={aiInsights}
                displayInsights={displayInsights}
                aiError={aiError}
                setShowAiConfig={setShowAiConfig}
                handleGenerateAIInsights={handleGenerateAIInsights}
                isOutdated={isInsightsOutdated(baseAlgo, compareAlgo)}
                savedTimestamp={getSavedAiInsights(baseAlgo, compareAlgo)?.timestamp}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <AppProvider>
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  </AppProvider>
);

export default App;
