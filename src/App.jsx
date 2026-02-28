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
  { id: 'ai_analysis', label: 'AI 智能诊断', icon: Bot },
  { id: 'qor_simulator', label: 'QoR 模拟器', icon: Scale }
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
    <tab.icon className="w-4 h-4" />
    <span>{tab.label}</span>
    <HelpIcon
      content={<TabHelpContent tabId={tab.id} />}
      tooltipWidth="w-[40rem]"
      position="bottom-center"
      className="w-4 h-4 text-gray-400 hover:text-indigo-500"
    />
  </button>
);

const TabHelpContent = ({ tabId }) => {
  const helpTexts = {
    table: { title: '详细数据视图', items: ['展示所有测试案例的原始数据和改进率', '支持行选择、列排序、数据过滤和导出', '自动识别并标注显著优化和严重退化的案例'] },
    single: { title: '箱线图分析', items: ['展示当前焦点指标的数据分布情况', '显示中位数、四分位数、最大值、最小值等', '箱体外部的点表示异常值'] },
    correlation: { title: '特征相关性分析', items: ['分析不同特征之间的相关性关系', '使用散点图展示两个特征的关系', '可选择任意两个特征进行相关性分析'] },
    multi: { title: '帕累托投影分析', items: ['三维可视化展示多个指标的综合表现', '基于帕累托法则的多维度数据投影', '可自由选择三个维度进行投影分析'] },
    all_metrics: { title: '全局多维雷达分析', items: ['展示所有指标在不同算法下的综合表现', '多维度数据可视化，每个轴代表一个指标', '快速评估算法在多个指标上的综合优劣'] },
    ai_analysis: { title: 'AI 智能诊断', items: ['基于大语言模型的智能算法性能分析', '自动生成深度分析报告和优化建议', '支持 Gemini、OpenAI 等主流 LLM'] },
    qor_simulator: { title: 'QoR 模拟器', items: ['Quality of Result 模拟器，自定义权重计算综合评分', '可为不同指标设置自定义权重', '根据业务需求自定义评估标准'] }
  };
  const help = helpTexts[tabId] || { title: '', items: [] };
  return (
    <div className="space-y-3">
      <p className="font-bold text-indigo-400 text-lg">{help.title}</p>
      <div className="space-y-2 text-sm">
        {help.items.map((item, i) => <p key={i}><b>•</b> {item}</p>)}
      </div>
    </div>
  );
};

const StatsCards = ({ stats }) => {
  if (!stats) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-lg flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4" />
        没有合法的对比数据。请检查数据源或切换目标。
      </div>
    );
  }

  const cards = [
    { label: 'Geomean 改进', value: stats.geomeanImp, isPositive: stats.geomeanImp > 0, helpId: 'geomean' },
    { label: 'Arith Mean (算术)', value: stats.meanImp, isPositive: stats.meanImp > 0, helpId: 'arith' },
    { label: 'P-Value', value: stats.pValue, isPositive: stats.pValue < 0.05, format: 'pvalue', helpId: 'pvalue' },
    { label: '95% 置信区间', value: `[${stats.ciLower.toFixed(1)}%, ${stats.ciUpper.toFixed(1)}%]`, helpId: 'ci' },
    { label: '退化案例数', value: stats.degradedCount, isPositive: stats.degradedCount === 0, helpId: 'degraded' },
    { label: '最大退化幅度', value: stats.minImp < 0 ? `${stats.minImp.toFixed(2)}%` : '无', isPositive: stats.minImp >= 0, helpId: 'wns' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card, i) => (
        <div key={i} className={`p-3 rounded-xl border ${card.isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-xs font-bold mb-1 flex items-center ${card.isPositive ? 'text-emerald-800' : 'text-red-800'}`}>
            {card.label}
            <HelpIcon content={<StatHelpContent helpId={card.helpId} />} position="bottom-right" tooltipWidth="w-[36rem]" className="w-3 h-3 ml-0.5" />
          </div>
          <div className={`text-2xl font-black ${card.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {card.format === 'pvalue' && typeof card.value === 'number' ? card.value.toFixed(3) : (typeof card.value === 'number' ? `${card.value > 0 ? '+' : ''}${card.value.toFixed(2)}%` : card.value)}
          </div>
        </div>
      ))}
    </div>
  );
};

const StatHelpContent = ({ helpId }) => {
  const helps = {
    geomean: { title: '几何平均改进率', items: ['公式：exp(Σln(Ratio)/n)', '评估算法整体改进比例的绝对标准', '能有效抵消极端异常值的拉偏效应'] },
    arith: { title: '算术平均改进率', items: ['公式：Σ(改进率)/n', '直观的算术平均值', '若远大于Geomean，说明个别测试集被异常放大'] },
    pvalue: { title: 'Wilcoxon 符号秩检验', items: ['非参数统计检验，不依赖数据分布', '判断数据分布改变是否真实有效', 'P<0.05 表示提升具有统计学显著性'] },
    ci: { title: '95% 置信区间', items: ['算法表现波动的95%上下限预测', '下限>0%：说明该算法极为稳健', '区间越窄：算法表现越稳定'] },
    degraded: { title: '退化案例数', items: ['改进率<0%的案例总数', '参与计算的有效样本', '通常有严格的容忍度红线'] },
    wns: { title: '最大退化幅度 (WNS)', items: ['Worst Case分析，"最坏能有多坏"', '评估算法在最差情况下的表现', '严重跌破底线的改动通常被驳回'] }
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
    tableSearchTerm, setTableSearchTerm
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
      let i = 0;
      setDisplayInsights('');
      const interval = setInterval(() => {
        setDisplayInsights(aiInsights.substring(0, i));
        i += 3;
        if (i > aiInsights.length) clearInterval(interval);
      }, 10);
      return () => clearInterval(interval);
    }
  }, [aiInsights, isAnalyzing, activeTab]);

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

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 overflow-hidden flex flex-col h-[700px] relative z-0">
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
