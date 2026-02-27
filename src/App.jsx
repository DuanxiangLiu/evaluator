import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import CsvDataSource from './components/layout/CsvDataSource';
import ControlBar from './components/layout/ControlBar';
import HelpIcon from './components/common/HelpIcon';
import SortIcon from './components/common/SortIcon';
import DeepDiveModal from './components/modals/DeepDiveModal';
import AiConfigModal from './components/modals/AiConfigModal';
import BoxPlotChart from './components/charts/BoxPlotChart';
import CorrelationChart from './components/charts/CorrelationChart';
import ParetoChart from './components/charts/ParetoChart';
import RadarChart from './components/charts/RadarChart';
import QoRSimulator from './components/charts/QoRSimulator';
import { generateAIInsights, renderMarkdownText } from './services/aiService.jsx';
import { exportToCSV } from './services/dataService';
import {
  CheckSquare, Square, ArrowUp, ArrowDown, Search, Download,
  Bot, Settings, X, Zap, Loader2, AlertTriangle,
  BarChart2, ScatterChart, GitMerge, Radar, Scale, TrendingUp
} from 'lucide-react';
import { formatIndustrialNumber } from './utils/formatters';

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
    showAiConfig, setShowAiConfig, showAiPanel, setShowAiPanel,
    stats, allMetricsStats, sortedTableData, filteredTableData,
    runAnalysis, toggleCase, toggleAll, handleSort, handleChartMouseMove
  } = useAppContext();

  useEffect(() => {
    runAnalysis();
  }, []);

  useEffect(() => {
    if (availableMetrics.length > 0 && !corrX) {
      // 自动选择第一个可用的元数据列作为 X 轴
      if (metaColumns.length > 0) {
        setCorrX(metaColumns[0]);
      } else {
        // 如果没有元数据列，选择第一个指标
        setCorrX(availableMetrics[0]);
      }
    }
    if (availableMetrics.length > 0 && !corrY) {
      // 自动选择第一个指标作为 Y 轴
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
      const insights = await generateAIInsights(
        llmConfig, baseAlgo, compareAlgo, activeMetric,
        stats, allMetricsStats, parsedData, selectedCases, metaColumns
      );
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
      <DeepDiveModal
        isOpen={!!deepDiveCase}
        caseData={caseData}
        baseAlgo={baseAlgo}
        compareAlgo={compareAlgo}
        availableMetrics={availableMetrics}
        onClose={() => setDeepDiveCase(null)}
      />

      <AiConfigModal
        isOpen={showAiConfig}
        config={llmConfig}
        onConfigChange={setLlmConfig}
        onClose={() => setShowAiConfig(false)}
      />

      <div className="max-w-[1600px] mx-auto space-y-6">
        <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <CsvDataSource
          csvInput={csvInput}
          onCsvChange={setCsvInput}
          onRunAnalysis={runAnalysis}
        />

        <ControlBar
          availableMetrics={availableMetrics}
          activeMetric={activeMetric}
          onMetricChange={setActiveMetric}
          availableAlgos={availableAlgos}
          baseAlgo={baseAlgo}
          compareAlgo={compareAlgo}
          onBaseAlgoChange={setBaseAlgo}
          onCompareAlgoChange={setCompareAlgo}
        />

        <div className="flex justify-between items-end px-1 mt-1">
          <div className="text-lg font-bold text-gray-700 flex items-center gap-1">
            核心统计指征 ({activeMetric})
            {stats && <span className="ml-3 text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shadow-sm">有效计算样本: {stats.nValid} / {stats.nTotalChecked}</span>}
          </div>
        </div>

        {stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <div className={`p-4 rounded-xl border relative group transition-colors ${stats.geomeanImp > 0 ? 'bg-emerald-50 border-emerald-200 shadow-sm' : (stats.geomeanImp < 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200')}`}>
              <div className={`text-sm font-bold mb-1 flex items-center ${stats.geomeanImp > 0 ? 'text-emerald-800' : (stats.geomeanImp < 0 ? 'text-red-800' : 'text-gray-600')}`}>
                Geomean 改进
                <HelpIcon
                  content={
                    <div className="space-y-2">
                      <p className="font-bold text-indigo-600">几何平均改进率</p>
                      <div className="space-y-1 text-xs">
                        <p><b>计算公式：</b>exp(Σln(Ratio)/n)</p>
                        <p><b>工业意义：</b>评估算法整体改进比例的绝对标准</p>
                        <p><b>优势：</b>能有效抵消极端异常值的拉偏效应</p>
                        <p><b>解读：</b>正值表示整体优化，负值表示整体退化</p>
                      </div>
                    </div>
                  }
                  position="bottom-right"
                  tooltipWidth="w-[36rem]"
                />
              </div>
              <div className={`text-3xl font-black ${stats.geomeanImp > 0 ? 'text-emerald-600' : (stats.geomeanImp < 0 ? 'text-red-600' : 'text-gray-700')}`}>
                {stats.geomeanImp > 0 ? '+' : ''}{stats.geomeanImp.toFixed(2)}%
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
              <div className="text-sm text-gray-500 font-bold mb-1 flex items-center">
                Arith Mean (算术)
                <HelpIcon
                  content={
                    <div className="space-y-2">
                      <p className="font-bold text-indigo-600">算术平均改进率</p>
                      <div className="space-y-1 text-xs">
                        <p><b>计算公式：</b>Σ(改进率)/n</p>
                        <p><b>工业意义：</b>直观的算术平均值</p>
                        <p><b>注意：</b>若远大于 Geomean，说明个别测试集表现被异常放大</p>
                        <p><b>示例：</b>基线分母极小导致改进率虚高</p>
                      </div>
                    </div>
                  }
                  position="bottom-right"
                  tooltipWidth="w-[36rem]"
                />
              </div>
              <div className={`text-3xl font-black ${stats.meanImp > 0 ? 'text-emerald-600' : (stats.meanImp < 0 ? 'text-red-600' : 'text-gray-700')}`}>
                {stats.meanImp > 0 ? '+' : ''}{stats.meanImp.toFixed(2)}%
              </div>
            </div>

            <div className={`p-4 rounded-xl border shadow-sm transition-colors ${stats.pValue < 0.05 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className={`text-sm font-bold mb-1 flex justify-between items-center ${stats.pValue < 0.05 ? 'text-emerald-800' : 'text-orange-800'}`}>
                <div className="flex items-center">
                  P-Value
                  <HelpIcon
                    content={
                      <div className="space-y-2">
                        <p className="font-bold text-indigo-600">Wilcoxon 符号秩检验</p>
                        <div className="space-y-1 text-xs">
                          <p><b>检验方法：</b>非参数统计检验，不依赖数据分布</p>
                          <p><b>工业意义：</b>判断数据分布的改变是否真实有效</p>
                          <p><b>判断标准：</b>P &lt; 0.05 表示提升具有统计学显著性</p>
                          <p><b>绿色显示：</b>证明整体提升非随机测试噪声</p>
                          <p><b>橙色显示：</b>可能存在随机波动，需要更多样本</p>
                        </div>
                      </div>
                    }
                    position="bottom-right"
                    tooltipWidth="w-[40rem]"
                  />
                </div>
              </div>
              <div className={`text-3xl font-black flex items-baseline gap-1 ${stats.pValue < 0.05 ? 'text-emerald-600' : 'text-orange-600'}`}>
                {stats.pValue.toFixed(3)}
                <span className="text-sm font-bold opacity-80">{stats.pValue < 0.05 ? '(显著)' : '(不显著)'}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200/80 rounded-full mt-2 overflow-hidden relative border border-gray-300/50">
                <div className="absolute left-[50%] top-0 bottom-0 w-px bg-red-500 z-10"></div>
                <div className={`h-full ${stats.pValue < 0.05 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${Math.min((stats.pValue / 0.1) * 100, 100)}%` }}></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group flex flex-col justify-between">
              <div className="text-sm text-gray-500 font-bold mb-1 flex items-center">
                95% 置信区间
                <HelpIcon
                  content={
                    <div className="space-y-2">
                      <p className="font-bold text-indigo-600">95% 置信区间</p>
                      <div className="space-y-1 text-xs">
                        <p><b>统计含义：</b>评估算法表现波动的 95% 上下限预测</p>
                        <p><b>下限 &gt; 0%：</b>说明该算法极为稳健</p>
                        <p><b>工业应用：</b>几乎在全场景下均有正向收益</p>
                        <p><b>区间越窄：</b>表示算法表现越稳定</p>
                      </div>
                    </div>
                  }
                  position="bottom-left"
                  tooltipWidth="w-[36rem]"
                />
              </div>
              <div className="text-lg xl:text-xl font-black text-gray-700 tracking-tighter bg-gray-50 p-1.5 rounded text-center border border-gray-100">[{stats.ciLower.toFixed(1)}%, {stats.ciUpper.toFixed(1)}%]</div>
            </div>

            <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between ${stats.degradedCount > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className={`text-sm font-bold mb-1 flex items-center ${stats.degradedCount > 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                退化案例数
                <HelpIcon
                  content={
                    <div className="space-y-2">
                      <p className="font-bold text-indigo-600">退化案例数</p>
                      <div className="space-y-1 text-xs">
                        <p><b>定义：</b>改进率 &lt; 0% 的案例总数</p>
                        <p><b>统计范围：</b>参与计算的有效样本</p>
                        <p><b>工业标准：</b>通常有极其严格的容忍度红线</p>
                        <p><b>绿色显示：</b>无退化案例，表现优秀</p>
                        <p><b>红色显示：</b>存在退化，需要重点关注</p>
                      </div>
                    </div>
                  }
                  position="bottom-left"
                  tooltipWidth="w-[36rem]"
                />
              </div>
              <div className={`text-3xl font-black ${stats.degradedCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{stats.degradedCount}</div>
            </div>

            <div className={`p-4 rounded-xl border shadow-sm transition-colors ${stats.minImp < 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className={`text-sm font-bold mb-1 flex items-center ${stats.minImp < 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                最大退化幅度
                <HelpIcon
                  content={
                    <div className="space-y-2">
                      <p className="font-bold text-indigo-600">最大退化幅度 (WNS)</p>
                      <div className="space-y-1 text-xs">
                        <p><b>WNS 思想：</b>Worst Case 分析，即"最坏能有多坏"</p>
                        <p><b>工业意义：</b>评估算法在最差情况下的表现</p>
                        <p><b>判断标准：</b>严重跌破底线的算法改动通常会被直接驳回</p>
                        <p><b>绿色显示：</b>无退化或退化幅度可控</p>
                        <p><b>红色显示：</b>存在严重退化，需要分析原因</p>
                      </div>
                    </div>
                  }
                  position="bottom-left"
                  tooltipWidth="w-[36rem]"
                />
              </div>
              <div className={`text-3xl font-black ${stats.minImp < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{stats.minImp < 0 ? stats.minImp.toFixed(2) + '%' : '无'}</div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-lg flex items-center gap-2 shadow-sm font-semibold text-sm">
            <AlertTriangle className="w-5 h-5" />
            没有合法的对比数据参与计算。请检查数据源，或切换焦点目标。
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[800px] relative z-0">
          {tooltipState.visible && (
            <div className="absolute pointer-events-none bg-gray-900/95 border border-gray-700 text-white text-xs px-4 py-3 rounded-xl shadow-2xl z-[100] whitespace-nowrap backdrop-blur-sm transition-opacity duration-75"
              style={{ left: tooltipState.x + 15, top: tooltipState.y + 15 }}>
              <div className="font-bold text-sm mb-1.5 text-indigo-300 border-b border-gray-700 pb-1">{tooltipState.title}</div>
              {tooltipState.lines.map((l, i) => (<div key={i} className="text-gray-300 font-mono text-[11px] leading-relaxed">{l}</div>))}
            </div>
          )}

          <div className="flex items-center overflow-x-auto border-b border-gray-200 bg-gray-50 scrollbar-hide flex-shrink-0 relative z-10">
            <div className="flex items-center gap-2">
              <button className={`px-4 py-4 text-sm font-bold border-b-[3px] transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'table' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'}`} onClick={() => setActiveTab('table')}>
                <BarChart2 className="w-4 h-4" />
                <span>详细数据</span>
                <HelpIcon
                  content={
                    <div className="space-y-2">
                      <p className="font-bold text-indigo-600">详细数据视图</p>
                      <div className="space-y-1 text-xs">
                        <p><b>功能说明：</b>展示所有测试案例的原始数据和改进率</p>
                        <p><b>数据内容：</b>包含基线算法、对比算法的原始值和改进百分比</p>
                        <p><b>交互功能：</b>支持行选择、列排序、数据过滤和导出</p>
                        <p><b>异常标注：</b>自动识别并标注显著优化和严重退化的案例</p>
                        <p><b>深度分析：</b>点击 🔍 图标可查看单个案例的多维雷达图</p>
                      </div>
                    </div>
                  }
                  tooltipWidth="w-[40rem]"
                  position="bottom-center"
                  className="w-4 h-4 text-gray-400 hover:text-indigo-500"
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className={`px-4 py-4 text-sm font-bold border-b-[3px] transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'single' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'}`} onClick={() => setActiveTab('single')}>
                <BarChart2 className="w-4 h-4" />
                <span>箱线图</span>
                <HelpIcon
                  content={
                    <div className="space-y-2">
                      <p className="font-bold text-indigo-600">箱线图分析</p>
                      <div className="space-y-1 text-xs">
                        <p><b>功能说明：</b>展示当前焦点指标的数据分布情况</p>
                        <p><b>统计信息：</b>显示中位数、四分位数、最大值、最小值等</p>
                        <p><b>对比展示：</b>同时展示基线算法和对比算法的分布</p>
                        <p><b>异常检测：</b>箱体外部的点表示异常值</p>
                        <p><b>交互功能：</b>鼠标悬停可查看具体案例的详细信息</p>
                      </div>
                    </div>
                  }
                  tooltipWidth="w-[40rem]"
                  position="bottom-center"
                  className="w-4 h-4 text-gray-400 hover:text-indigo-500"
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className={`px-4 py-4 text-sm font-bold border-b-[3px] transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'correlation' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'}`} onClick={() => setActiveTab('correlation')}>
                <ScatterChart className="w-4 h-4" />
                <span>特征相关性</span>
                <HelpIcon
                  content={
                    <div className="space-y-2">
                      <p className="font-bold text-indigo-600">特征相关性分析</p>
                      <div className="space-y-1 text-xs">
                        <p><b>功能说明：</b>分析不同特征之间的相关性关系</p>
                        <p><b>可视化方式：</b>使用散点图展示两个特征的关系</p>
                        <p><b>颜色编码：</b>不同颜色表示改进率的不同状态</p>
                        <p><b>交互功能：</b>可选择任意两个特征进行相关性分析</p>
                        <p><b>应用场景：</b>帮助理解特征间的相互影响和依赖关系</p>
                      </div>
                    </div>
                  }
                  tooltipWidth="w-[40rem]"
                  position="bottom-center"
                  className="w-4 h-4 text-gray-400 hover:text-indigo-500"
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className={`px-4 py-4 text-sm font-bold border-b-[3px] transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'multi' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'}`} onClick={() => setActiveTab('multi')}>
                <GitMerge className="w-4 h-4" />
                <span>帕累托投影</span>
                <HelpIcon
                  content={
                    <div className="space-y-2">
                      <p className="font-bold text-indigo-600">帕累托投影分析</p>
                      <div className="space-y-1 text-xs">
                        <p><b>功能说明：</b>三维可视化展示多个指标的综合表现</p>
                        <p><b>投影原理：</b>基于帕累托法则的多维度数据投影</p>
                        <p><b>坐标轴：</b>X、Y、Z 轴分别代表不同的指标或维度</p>
                        <p><b>颜色编码：</b>点的颜色表示改进率状态</p>
                        <p><b>交互功能：</b>可自由选择三个维度进行投影分析</p>
                      </div>
                    </div>
                  }
                  tooltipWidth="w-[40rem]"
                  position="bottom-center"
                  className="w-4 h-4 text-gray-400 hover:text-indigo-500"
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className={`px-4 py-4 text-sm font-bold border-b-[3px] transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'all_metrics' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'}`} onClick={() => setActiveTab('all_metrics')}>
                <Radar className="w-4 h-4" />
                <span>全局多维雷达</span>
                <HelpIcon
                  content={
                    <div className="space-y-2">
                      <p className="font-bold text-indigo-600">全局多维雷达分析</p>
                      <div className="space-y-1 text-xs">
                        <p><b>功能说明：</b>展示所有指标在不同算法下的综合表现</p>
                        <p><b>雷达图：</b>多维度数据可视化，每个轴代表一个指标</p>
                        <p><b>对比分析：</b>同时展示基线算法和对比算法的性能</p>
                        <p><b>面积对比：</b>雷达图面积越大，整体表现越好</p>
                        <p><b>应用场景：</b>快速评估算法在多个指标上的综合优劣</p>
                      </div>
                    </div>
                  }
                  tooltipWidth="w-[40rem]"
                  position="bottom-center"
                  className="w-4 h-4 text-gray-400 hover:text-indigo-500"
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className={`px-4 py-4 text-sm font-bold border-b-[3px] transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'ai_analysis' ? 'border-purple-600 text-purple-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'}`} onClick={() => setActiveTab('ai_analysis')}>
                <Bot className="w-4 h-4" />
                <span>AI 智能诊断</span>
                <HelpIcon
                  content={
                    <div className="space-y-2">
                      <p className="font-bold text-indigo-600">AI 智能诊断</p>
                      <div className="space-y-1 text-xs">
                        <p><b>功能说明：</b>基于大语言模型的智能算法性能分析</p>
                        <p><b>分析内容：</b>自动生成深度分析报告和优化建议</p>
                        <p><b>支持模型：</b>支持 Gemini、OpenAI 等主流 LLM</p>
                        <p><b>配置要求：</b>需要先配置相应的 API Key</p>
                        <p><b>输出格式：</b>以 Markdown 格式展示结构化分析报告</p>
                      </div>
                    </div>
                  }
                  tooltipWidth="w-[40rem]"
                  position="bottom-center"
                  className="w-4 h-4 text-gray-400 hover:text-indigo-500"
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className={`px-4 py-4 text-sm font-bold border-b-[3px] transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'qor_simulator' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'}`} onClick={() => setActiveTab('qor_simulator')}>
                <Scale className="w-4 h-4" />
                <span>QoR 模拟器</span>
                <HelpIcon
                  content={
                    <div className="space-y-2">
                      <p className="font-bold text-indigo-600">QoR 模拟器</p>
                      <div className="space-y-1 text-xs">
                        <p><b>功能说明：</b>Quality of Result 模拟器，自定义权重计算综合评分</p>
                        <p><b>权重配置：</b>可为不同指标设置自定义权重</p>
                        <p><b>实时计算：</b>调整权重后实时更新综合评分</p>
                        <p><b>对比分析：</b>同时展示基线和对比算法的 QoR 评分</p>
                        <p><b>应用场景：</b>根据业务需求自定义评估标准</p>
                      </div>
                    </div>
                  }
                  tooltipWidth="w-[40rem]"
                  position="bottom-center"
                  className="w-4 h-4 text-gray-400 hover:text-indigo-500"
                />
              </button>
            </div>
          </div>

          <div className="bg-white flex-1 overflow-y-auto custom-scrollbar relative z-0">
            {activeTab === 'table' && (
              <div className="flex flex-col h-full">
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0 relative z-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-bold text-indigo-800 flex items-center gap-1">
                      明细数据目标: <span className="bg-indigo-100 px-2 py-0.5 rounded text-indigo-700 shadow-inner ml-1">{activeMetric}</span>
                      <HelpIcon
                        content={
                          <div className="space-y-2">
                            <p className="font-bold text-indigo-600">详细数据表格说明</p>
                            <div className="space-y-1 text-xs">
                              <p><b>数据内容：</b>包含所有底层明细数据</p>
                              <p><b>行选择：</b>支持按行勾选，可剔除脏数据</p>
                              <p><b>列排序：</b>点击列头可进行升序/降序排序</p>
                              <p><b>默认排序：</b>若存在 Instance 属性列，系统默认按大到小排序</p>
                              <p><b>异常标注：</b>系统自动使用 IQR (四分位距) 法则标注离群异常值</p>
                              <p><b>深度透视：</b>点击最右侧 🔍 图标可进行个例深度雷达透视</p>
                            </div>
                          </div>
                        }
                        tooltipWidth="w-[40rem]"
                        position="right-center"
                      />
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-inner text-xs">
                      <button onClick={() => setTableFilter('all')} className={`px-3 py-1.5 rounded transition-colors ${tableFilter === 'all' ? 'bg-white text-indigo-700 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-700 font-semibold'}`}>全部</button>
                      <button onClick={() => setTableFilter('degraded')} className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${tableFilter === 'degraded' ? 'bg-white text-red-700 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-700 font-semibold'}`}><ArrowDown className="w-3 h-3" />退化</button>
                      <button onClick={() => setTableFilter('outlier')} className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${tableFilter === 'outlier' ? 'bg-white text-purple-700 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-700 font-semibold'}`}><AlertTriangle className="w-3 h-3" />异常</button>
                    </div>
                    <button onClick={() => exportToCSV(filteredTableData, activeMetric, baseAlgo, compareAlgo, metaColumns, stats)} className="text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"><Download className="w-4 h-4" />导出 CSV</button>
                  </div>
                </div>

                <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar pb-10 relative z-0">
                  <table className="min-w-full text-sm text-left relative">
                    <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10 shadow-sm border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 w-10 text-center cursor-pointer hover:bg-gray-200" onClick={toggleAll} title="全选/反选">
                          {selectedCases.size === parsedData.length ? <CheckSquare className="w-4 h-4 text-indigo-600 mx-auto" /> : <Square className="w-4 h-4 text-gray-400 mx-auto" />}
                        </th>
                        <th className="px-4 py-3 font-bold cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('Case')}><div className="flex items-center justify-between">Case Name <SortIcon config={sortConfig} columnKey="Case" /></div></th>
                        {metaColumns.map(mc => (
                          <th key={mc} className="px-4 py-3 font-bold text-right border-l border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors text-gray-600" onClick={() => handleSort(mc)}>
                            <div className="flex items-center justify-end">{mc} <SortIcon config={sortConfig} columnKey={mc} /></div>
                          </th>
                        ))}
                        <th className="px-4 py-3 font-bold text-right border-l border-gray-300 cursor-pointer hover:bg-gray-200 bg-gray-50" onClick={() => handleSort(baseAlgo)}><div className="flex justify-end items-center">{baseAlgo} <SortIcon config={sortConfig} columnKey={baseAlgo} /></div></th>
                        <th className="px-4 py-3 font-bold text-right cursor-pointer hover:bg-gray-200 bg-indigo-50/30 text-indigo-900" onClick={() => handleSort(compareAlgo)}><div className="flex justify-end items-center">{compareAlgo} <SortIcon config={sortConfig} columnKey={compareAlgo} /></div></th>
                        <th className="px-4 py-3 font-bold text-right border-l border-gray-300 cursor-pointer hover:bg-indigo-100 bg-indigo-50/60" onClick={() => handleSort('imp')}>
                          <div className="flex justify-end items-center text-indigo-900">
                            改进率 %
                            <HelpIcon
                              content={
                                <div className="space-y-2">
                                  <p className="font-bold text-indigo-600">改进率计算</p>
                                  <div className="space-y-1 text-xs">
                                    <p><b>计算公式：</b>((Base - Compare) / Base) × 100</p>
                                    <p><b>正值(绿色)：</b>新算法优化，性能提升</p>
                                    <p><b>负值(红色)：</b>新算法退化，性能下降</p>
                                    <p><b>零值：</b>两种算法表现相同</p>
                                  </div>
                                </div>
                              }
                              position="bottom-left"
                              tooltipWidth="w-[32rem]"
                            />
                            <SortIcon config={sortConfig} columnKey="imp" />
                          </div>
                        </th>
                        <th className="px-4 py-3 font-bold text-center w-36 bg-indigo-50/60 border-l border-indigo-100 flex items-center justify-center gap-1">
                          状态与透视
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTableData.map((d) => {
                        const isChecked = selectedCases.has(d.Case);
                        const bVal = d.raw[activeMetric]?.[baseAlgo];
                        const cVal = d.raw[activeMetric]?.[compareAlgo];
                        const isNull = bVal == null || cVal == null;

                        let imp = 0; let outlierType = 'normal';
                        if (!isNull) {
                          imp = bVal === 0 ? (cVal === 0 ? 0 : -100) : ((bVal - cVal) / bVal) * 100;
                          const validMatch = stats?.validCases.find(v => v.Case === d.Case);
                          if (validMatch) outlierType = validMatch.outlierType;
                        }

                        const isHovered = hoveredCase === d.Case;
                        let rowBg = !isChecked ? 'bg-gray-50/50 opacity-40 grayscale' : (isHovered ? 'bg-indigo-100/50 outline outline-2 outline-indigo-400 z-10 relative' : 'hover:bg-indigo-50/30');
                        let impColor = 'text-gray-500'; let badge = null;

                        if (!isChecked || isNull) {
                          badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-gray-200 text-gray-500"><Square className="w-3 h-3" /> 已过滤</span>;
                        } else if (outlierType === 'positive') {
                          impColor = 'text-purple-600 font-black';
                          badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300 shadow-sm"><Zap className="w-3 h-3" /> 显著优化</span>;
                        } else if (outlierType === 'negative') {
                          impColor = 'text-red-700 font-black';
                          badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 shadow-sm"><AlertTriangle className="w-3 h-3" /> 严重退化</span>;
                        } else if (imp > 0) {
                          impColor = 'text-emerald-600 font-bold';
                          badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><ArrowUp className="w-3 h-3" /> 优化</span>;
                        } else if (imp < 0) {
                          impColor = 'text-red-600 font-bold';
                          badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200"><ArrowDown className="w-3 h-3" /> 退化</span>;
                        } else {
                          badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">持平</span>;
                        }

                        return (
                          <tr key={d.Case} className={`transition-all duration-150 ${rowBg}`} onMouseEnter={() => { if (isChecked && !isNull) setHoveredCase(d.Case); }} onMouseLeave={() => setHoveredCase(null)}>
                            <td className="px-4 py-3 text-center cursor-pointer" onClick={() => toggleCase(d.Case)}><input type="checkbox" checked={isChecked} onChange={() => { }} className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4" /></td>
                            <td className="px-4 py-3 font-bold text-gray-800 max-w-[200px] truncate" title={d.Case}>{d.Case}</td>
                            {metaColumns.map(mc => (
                              <td key={mc} className="px-4 py-3 text-right font-mono text-xs text-gray-500 border-l border-gray-100" title={d.meta[mc]}>{formatIndustrialNumber(d.meta[mc]) || '-'}</td>
                            ))}
                            <td className="px-4 py-3 text-right font-mono text-gray-600 border-l border-gray-200 bg-gray-50/50">{bVal == null ? <span className="text-gray-300">NaN</span> : bVal}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-indigo-900 bg-indigo-50/20">{cVal == null ? <span className="text-gray-300">NaN</span> : cVal}</td>
                            <td className={`px-4 py-3 text-right font-mono tracking-tight border-l border-gray-200 ${impColor} bg-indigo-50/40`}>{isNull ? '-' : `${imp > 0 ? '+' : ''}${imp.toFixed(2)}%`}</td>
                            <td className="px-4 py-3 text-center bg-indigo-50/40 border-l border-indigo-100/50 flex justify-center items-center gap-2">
                              {badge}
                              {isChecked && !isNull && (
                                <button onClick={() => setDeepDiveCase(d.Case)} className="text-indigo-400 hover:text-indigo-700 bg-white p-1 rounded border border-indigo-200 shadow-sm" title="单点多维深度透视">
                                  <Search className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'single' && stats && (
              <BoxPlotChart
                stats={stats}
                activeMetric={activeMetric}
                handleChartMouseMove={handleChartMouseMove}
                hoveredCase={hoveredCase}
                setHoveredCase={setHoveredCase}
                setTooltipState={setTooltipState}
              />
            )}

            {activeTab === 'correlation' && parsedData.length > 0 && (
              <CorrelationChart
                parsedData={parsedData}
                selectedCases={selectedCases}
                metaColumns={metaColumns}
                availableMetrics={availableMetrics}
                corrX={corrX}
                corrY={corrY}
                setCorrX={setCorrX}
                setCorrY={setCorrY}
                handleChartMouseMove={handleChartMouseMove}
                hoveredCase={hoveredCase}
                setHoveredCase={setHoveredCase}
                setTooltipState={setTooltipState}
                baseAlgo={baseAlgo}
                compareAlgo={compareAlgo}
              />
            )}

            {activeTab === 'multi' && parsedData.length > 0 && (
              <ParetoChart
                parsedData={parsedData}
                selectedCases={selectedCases}
                availableMetrics={availableMetrics}
                paretoX={paretoX}
                paretoY={paretoY}
                paretoZ={paretoZ}
                setParetoX={setParetoX}
                setParetoY={setParetoY}
                setParetoZ={setParetoZ}
                handleChartMouseMove={handleChartMouseMove}
                hoveredCase={hoveredCase}
                setHoveredCase={setHoveredCase}
                setTooltipState={setTooltipState}
                baseAlgo={baseAlgo}
                compareAlgo={compareAlgo}
              />
            )}

            {activeTab === 'all_metrics' && allMetricsStats.length > 0 && (
              <RadarChart
                allMetricsStats={allMetricsStats}
                availableAlgos={availableAlgos}
                baseAlgo={baseAlgo}
                compareAlgo={compareAlgo}
              />
            )}

            {activeTab === 'ai_analysis' && (
              <div className="h-full flex flex-col">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-purple-100 flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                        <Bot className="w-6 h-6 text-purple-600" /> EDA 架构师智能诊断
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">基于 {baseAlgo} vs {compareAlgo} 的深度分析报告</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowAiConfig(true)} className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-lg border border-gray-200 flex items-center gap-2 transition-colors shadow-sm">
                        <Settings className="w-4 h-4" /> AI 配置
                      </button>
                      <button onClick={handleGenerateAIInsights} disabled={isAnalyzing} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm">
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {aiInsights ? '重新诊断' : '生成诊断报告'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center h-full text-purple-400 space-y-4">
                      <Loader2 className="w-12 h-12 animate-spin" />
                      <p className="font-bold animate-pulse">正在深度分析 {baseAlgo} vs {compareAlgo} ...</p>
                      <p className="text-sm text-gray-400">AI 正在生成诊断报告，请稍候...</p>
                    </div>
                  ) : aiError ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl flex gap-3 text-sm max-w-2xl mx-auto">
                      <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                      <div>
                        <p className="font-bold mb-2">诊断失败</p>
                        <p>{aiError}</p>
                      </div>
                    </div>
                  ) : displayInsights ? (
                    <div className="prose prose-sm prose-indigo max-w-4xl mx-auto text-sm text-gray-800 leading-relaxed bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                      {renderMarkdownText(displayInsights)}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                      <Bot className="w-16 h-16 opacity-50" />
                      <p className="font-bold">点击上方「生成诊断报告」按钮开始 AI 智能分析</p>
                      <p className="text-sm">需要先配置 AI API Key（支持 Gemini、OpenAI 等）</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'qor_simulator' && (
              <QoRSimulator
                allMetricsStats={allMetricsStats}
                availableMetrics={availableMetrics}
                availableAlgos={availableAlgos}
                baseAlgo={baseAlgo}
                compareAlgo={compareAlgo}
                qorWeights={qorWeights}
                setQorWeights={setQorWeights}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
