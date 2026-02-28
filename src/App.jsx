import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Header from './components/layout/Header';
import CsvDataSource from './components/layout/CsvDataSource';
import HelpIcon from './components/common/HelpIcon';
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
    { label: 'Geomean 改进', value: stats.geomeanImp, isPositive: stats.geomeanImp > 0, helpId: 'geomean' },
    { label: 'Arith Mean (算术)', value: stats.meanImp, isPositive: stats.meanImp > 0, helpId: 'arith' },
    { label: 'P-Value', value: stats.pValue, isPositive: stats.pValue < 0.05, format: 'pvalue', helpId: 'pvalue' },
    { label: '95% 置信区间', value: `[${stats.ciLower.toFixed(1)}%, ${stats.ciUpper.toFixed(1)}%]`, isPositive: stats.ciLower > 0, helpId: 'ci' },
    { 
      label: '退化案例', 
      value: stats.degradedCount, 
      suffix: `/${stats.nValid}`,
      subValue: `(${degradedRate.toFixed(1)}%)`,
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
    { label: 'IQR', value: iqr, isPositive: iqr > 0, helpId: 'iqr', description: '四分位距 Q3-Q1，中间50%数据的范围' }
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {mainCards.map((card, i) => (
          <div key={i} className={`p-3 rounded-xl border ${card.isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`text-xs font-bold mb-1 flex items-center ${card.isPositive ? 'text-emerald-800' : 'text-red-800'}`}>
              {card.label}
              <HelpIcon content={<StatHelpContent helpId={card.helpId} />} position="bottom-right" tooltipWidth="w-[36rem]" className="w-3 h-3 ml-0.5" />
            </div>
            <div className={`text-2xl font-black ${card.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {card.format === 'pvalue' && typeof card.value === 'number' 
                ? card.value.toFixed(3) 
                : card.format === 'range'
                  ? <span className="flex items-center gap-1 text-lg">
                      <span className="text-red-600">{card.minImp.toFixed(1)}%</span>
                      <span className="text-gray-400 text-sm">~</span>
                      <span className="text-emerald-600">+{card.value.toFixed(1)}%</span>
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
        <span className="text-[10px] text-gray-400">中位数、标准差、变异系数、IQR</span>
      </div>

      {showAuxiliary && (
        <div className="flex flex-wrap gap-1.5 animate-in slide-in-from-top-2 duration-200">
          {auxiliaryCards.map((card, i) => (
            <div key={i} className={`px-2.5 py-1.5 rounded border ${card.neutral ? 'bg-gray-50 border-gray-200' : card.isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className={`text-[10px] font-bold flex items-center ${card.neutral ? 'text-gray-600' : card.isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                {card.label}
                <HelpIcon content={
                  <div className="space-y-1">
                    <p className="font-bold text-indigo-400">{card.label}</p>
                    <p className="text-xs">{card.description}</p>
                  </div>
                } position="bottom-right" tooltipWidth="w-48" className="w-2 h-2 ml-0.5" />
              </div>
              <div className={`text-base font-black ${card.neutral ? 'text-gray-700' : card.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {card.format === 'cv'
                  ? (card.value === null || isNaN(card.value) 
                    ? 'N/A'
                    : <span>
                        <span className="text-xs font-normal text-gray-400">{card.std.toFixed(2)}/{Math.abs(card.meanImp).toFixed(2)}=</span>
                        {card.value.toFixed(2)}
                      </span>)
                  : typeof card.value === 'number'
                    ? `${card.value > 0 ? '+' : ''}${card.value.toFixed(2)}%`
                    : card.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatHelpContent = ({ helpId }) => {
  const helps = {
    geomean: { title: '几何平均改进率', items: ['公式：exp(Σln(Ratio)/n)', '评估算法整体改进比例的绝对标准', '能有效抵消极端异常值的拉偏效应'] },
    arith: { title: '算术平均改进率', items: ['公式：Σ(改进率)/n', '直观的算术平均值', '若远大于Geomean，说明个别测试集被异常放大'] },
    pvalue: { title: 'Wilcoxon 符号秩检验', items: ['非参数统计检验，不依赖数据分布', '判断数据分布改变是否真实有效', 'P<0.05 表示提升具有统计学显著性'] },
    ci: { title: '95% 置信区间', items: ['算法表现波动的95%上下限预测', '下限>0%：说明该算法极为稳健', '区间越窄：算法表现越稳定'] },
    degraded: { title: '退化案例', items: ['改进率<0%的案例数量', '括号内为退化案例占总有效案例的百分比', '通常有严格的容忍度红线'] },
    extreme: { title: '极值范围', items: ['最大退化幅度 ~ 最大改进幅度', '展示算法表现的上下边界', '评估算法在最好和最差情况下的表现'] },
    improved_count: { title: '改进案例', items: ['改进率>0%的案例数量', '括号内为改进案例占总案例的百分比'] },
    median: { title: '中位数', items: ['改进率的中位数值', '不受极端值影响', '反映典型案例的表现'] },
    std: { title: '标准差', items: ['数据离散程度的度量', '越小表示算法表现越稳定', '过大说明存在较大波动'] },
    cv: { title: '变异系数', items: ['公式：标准差/均值×100%', '衡量相对离散程度', '越小表示相对稳定性越好'] },
    iqr: { title: '四分位距 (IQR)', items: ['公式：Q3 - Q1', '中间50%数据的分布范围', '不受极端值影响'] }
  };
  const help = helps[helpId] || { title: '', items: [] };
  return (
    <div className="space-y-2">
      <p className="font-bold text-indigo-400">{help.title}</p>
      <div className="text-xs space-y-1">{help.items.map((item, i) => <p key={i}>• {item}</p>)}</div>
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
      <DeepDiveModal isOpen={!!deepDiveCase} caseData={caseData} baseAlgo={baseAlgo} compareAlgo={compareAlgo} availableMetrics={availableMetrics} onClose={() => setDeepDiveCase(null)} />
      <AiConfigModal isOpen={showAiConfig} config={llmConfig} onConfigChange={setLlmConfig} onClose={() => setShowAiConfig(false)} />

      <div className="max-w-[1600px] mx-auto space-y-6">
        <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <CsvDataSource csvInput={csvInput} onCsvChange={setCsvInput} onRunAnalysis={runAnalysis} />

        <div className="flex flex-wrap items-center gap-2 mb-2 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 rounded-xl shadow-md">
          <span className="text-base font-bold text-white flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-lg">
            <TrendingUp className="w-4 h-4" />关键指标概览
            <HelpIcon content={<div className="space-y-2"><p className="font-bold text-indigo-400">关键指标概览</p><div className="text-xs space-y-1"><p>下方6个统计卡片展示的是当前选中指标的详细统计数据。</p><p>您可以通过左侧的"指标"下拉框切换不同的评估指标。</p></div></div>} position="bottom-right" tooltipWidth="w-[32rem]" className="w-3.5 h-3.5 text-white/70 hover:text-white" />
          </span>
          <div className="h-5 w-px bg-white/30"></div>
          <span className="text-xs font-bold text-white/80">指标:</span>
          <select value={activeMetric} onChange={(e) => setActiveMetric(e.target.value)} className="text-sm font-semibold border-0 rounded-lg py-1 px-2 focus:ring-2 focus:ring-white/50 bg-white/90 text-gray-800 shadow-sm">
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
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
          {tooltipState.visible && (
            <div className="absolute pointer-events-none bg-gray-900/95 border border-gray-700 text-white text-xs px-4 py-3 rounded-xl shadow-2xl z-[100] whitespace-nowrap backdrop-blur-sm transition-opacity duration-75" style={{ left: tooltipState.x + 15, top: tooltipState.y + 15 }}>
              <div className="font-bold text-sm mb-1.5 text-indigo-300 border-b border-gray-700 pb-1">{tooltipState.title}</div>
              {tooltipState.lines.map((l, i) => (<div key={i} className="text-gray-300 font-mono text-[11px] leading-relaxed">{l}</div>))}
            </div>
          )}

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
