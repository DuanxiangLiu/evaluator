import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { parseCSV, computeStatistics } from '../services/dataService';

const AppContext = createContext(null);

const DEFAULT_CSV = `Case,Instances,Nets,m_Base_HPWL,m_Algo1_HPWL,m_Algo2_HPWL,m_Base_TNS,m_Algo1_TNS,m_Algo2_TNS,m_Base_Power,m_Algo1_Power,m_Algo2_Power,m_Base_Runtime,m_Algo1_Runtime,m_Algo2_Runtime,m_Base_Hb_Count,m_Algo1_Hb_Count,m_Algo2_Hb_Count
superblue1_core_very_long,890000,900000,10000,9500,9200,500,480,450,120,118,115,3600,3400,3200,50,45,40
superblue2_top_module,1200000,1250000,20000,19800,21000,0,0,10,250,248,260,7200,7000,7500,120,115,130
superblue3_mac_engine,950000,970000,15000,NaN,14000,100,200,80,180,NaN,175,5400,NaN,5200,80,NaN,75
superblue4_dsp_cluster_huge,2500000,2600000,50000,42000,41000,1000,500,400,600,580,590,14400,12000,11500,300,250,220
superblue5_control_logic,500000,550000,8000,7900,7800,0,0,0,90,92,91,1800,1750,1700,20,18,15
superblue10_mixed_signal,1800000,1900000,12000,11000,10500,50,40,30,300,295,290,9000,8500,8000,150,130,120
superblue18_soc_top_die,2100000,2200000,30000,25000,24000,2000,1800,1500,450,420,410,10800,9500,9000,400,350,300
bigblue1_network_switch,1500000,1600000,40000,41000,39000,500,600,450,500,510,490,8000,8200,7800,200,210,190
bigblue3_gpu_core,2800000,2900000,25000,24500,24000,10,5,0,320,315,310,15000,14500,14000,500,480,450
bigblue4_cpu_cluster_matrix,4000000,4200000,60000,58000,NA,300,280,NaN,800,780,NaN,20000,19000,NA,800,750,NA`;

const DEFAULT_LLM_CONFIG = {
  provider: 'deepseek',
  apiKey: '',
  baseUrl: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  systemPrompt: '你是一位顶级的EDA物理设计与算法评估专家。请基于提供的数据输出结构化的诊断报告，务必将最终推荐结论放在最前面。请使用Markdown排版。',
  userPrompt: `我正在评估EDA新算法。Baseline = {{baseAlgo}}, Compare = {{compareAlgo}}。

【焦点指标 ({{activeMetric}}) 异常预警】
{{badCases}}

【全局多目标表现 (全面权衡)】
{{allMetricsSummary}}

请按以下结构输出报告：
### 1. 🏆 最终对比判定
（明确结论：【推荐采用 {{compareAlgo}}】、【建议保持 {{baseAlgo}}】 或 【需修复重测】）

### 2. 📊 全局 Trade-off 分析
（总体得失，是否在特定指标间存在拆东墙补西墙？）

### 3. 🚨 异常深潜诊断
（推测退化陷阱及物理原因）

### 4. 🏢 扩展性评估
（基于巨型设计评估在大规模 Instance 下的鲁棒性）`
};

export const AppProvider = ({ children }) => {
  const [csvInput, setCsvInput] = useLocalStorage('eda_csv_input', DEFAULT_CSV);
  const [llmConfig, setLlmConfig] = useLocalStorage('eda_llm_config', DEFAULT_LLM_CONFIG);
  const [activeMetric, setActiveMetric] = useLocalStorage('eda_active_metric', '');
  const [qorWeights, setQorWeights] = useLocalStorage('eda_qor_weights', {});
  
  const [parsedData, setParsedData] = useState([]);
  const [availableMetrics, setAvailableMetrics] = useState([]);
  const [availableAlgos, setAvailableAlgos] = useState([]);
  const [metaColumns, setMetaColumns] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('table');
  const [baseAlgo, setBaseAlgo] = useState('');
  const [compareAlgo, setCompareAlgo] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const [corrX, setCorrX] = useState('');
  const [corrY, setCorrY] = useState('');
  const [trendBase, setTrendBase] = useState('');
  const [paretoX, setParetoX] = useState('');
  const [paretoY, setParetoY] = useState('');
  const [paretoZ, setParetoZ] = useState('');
  const [selectedCases, setSelectedCases] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'Case', direction: 'asc' });
  const [tooltipState, setTooltipState] = useState({ visible: false, x: 0, y: 0, title: '', lines: [] });
  const [deepDiveCase, setDeepDiveCase] = useState(null);
  const [hoveredCase, setHoveredCase] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState('');
  const [displayInsights, setDisplayInsights] = useState('');
  const [aiError, setAiError] = useState('');
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const runAnalysis = useCallback((inputData = csvInput) => {
    const { data, algos, metrics, metaColumns: metas } = parseCSV(inputData);
    
    setParsedData(data);
    setAvailableAlgos(algos);
    setAvailableMetrics(metrics);
    setMetaColumns(metas);
    
    if (algos.length > 0 && !algos.includes(baseAlgo)) {
      setBaseAlgo(algos[0]);
    }
    if (algos.length > 1 && !algos.includes(compareAlgo)) {
      setCompareAlgo(algos[1] || algos[0]);
    }
    if (metrics.length > 0 && !metrics.includes(activeMetric)) {
      setActiveMetric(metrics[0]);
    }
    if (metrics.length > 0 && !metrics.includes(paretoX)) {
      setParetoX(metrics[0]);
    }
    if (metrics.length > 1 && !metrics.includes(paretoY)) {
      setParetoY(metrics[1] || metrics[0]);
    }
    if (metrics.length > 2 && !metrics.includes(paretoZ)) {
      setParetoZ(metrics[2] || metrics[0]);
    }
    
    const instanceCol = metas.find(c => c.toLowerCase() === 'instances' || c.toLowerCase() === 'instance');
    if (instanceCol) {
      setSortConfig({ key: instanceCol, direction: 'desc' });
    }
    
    setSelectedCases(new Set(data.map(d => d.Case)));
    setAiInsights('');
    setDisplayInsights('');
    setAiError('');
  }, [csvInput, baseAlgo, compareAlgo, activeMetric, paretoX, paretoY, paretoZ]);

  useEffect(() => {
    runAnalysis();
  }, []);

  useEffect(() => {
    if (availableMetrics.length > 0) {
      const newWeights = { ...qorWeights };
      let changed = false;
      const avg = +(100 / availableMetrics.length).toFixed(2);
      
      availableMetrics.forEach(m => {
        if (newWeights[m] === undefined) {
          newWeights[m] = avg;
          changed = true;
        }
      });
      
      if (changed) setQorWeights(newWeights);
    }
  }, [availableMetrics]);

  const stats = useMemo(() => {
    if (parsedData.length === 0 || !activeMetric || !baseAlgo || !compareAlgo) return null;
    return computeStatistics(activeMetric, baseAlgo, compareAlgo, parsedData, selectedCases);
  }, [parsedData, selectedCases, activeMetric, baseAlgo, compareAlgo]);

  const allMetricsStats = useMemo(() => {
    if (parsedData.length === 0 || !baseAlgo || !compareAlgo) return [];
    return availableMetrics.map(m => ({
      metric: m,
      stats: computeStatistics(m, baseAlgo, compareAlgo, parsedData, selectedCases)
    }));
  }, [parsedData, selectedCases, availableMetrics, baseAlgo, compareAlgo]);

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const sortedTableData = useMemo(() => {
    const sortableItems = [...parsedData];
    sortableItems.sort((a, b) => {
      let aVal, bVal;
      
      if (sortConfig.key === 'Case') {
        aVal = a.Case;
        bVal = b.Case;
      } else if (metaColumns.includes(sortConfig.key)) {
        aVal = parseFloat(a.meta[sortConfig.key]) || a.meta[sortConfig.key];
        bVal = parseFloat(b.meta[sortConfig.key]) || b.meta[sortConfig.key];
      } else if (sortConfig.key === 'imp') {
        const aBase = a.raw[activeMetric]?.[baseAlgo];
        const aComp = a.raw[activeMetric]?.[compareAlgo];
        const bBase = b.raw[activeMetric]?.[baseAlgo];
        const bComp = b.raw[activeMetric]?.[compareAlgo];
        
        const getImp = (bv, cv) => {
          if (bv == null || cv == null) return -Infinity;
          if (bv === 0 && cv === 0) return 0;
          if (bv === 0 && cv > 0) return -100;
          return ((bv - cv) / bv) * 100;
        };
        
        aVal = getImp(aBase, aComp);
        bVal = getImp(bBase, bComp);
      } else {
        aVal = a.raw[activeMetric]?.[sortConfig.key] == null ? -Infinity : a.raw[activeMetric][sortConfig.key];
        bVal = b.raw[activeMetric]?.[sortConfig.key] == null ? -Infinity : b.raw[activeMetric][sortConfig.key];
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sortableItems;
  }, [parsedData, sortConfig, activeMetric, baseAlgo, compareAlgo, metaColumns]);

  const filteredTableData = useMemo(() => {
    return sortedTableData.filter(d => {
      const isChecked = selectedCases.has(d.Case);
      const bVal = d.raw[activeMetric]?.[baseAlgo];
      const cVal = d.raw[activeMetric]?.[compareAlgo];
      const isNull = bVal == null || cVal == null;
      
      let imp = 0;
      let outlierType = 'normal';
      
      if (!isNull) {
        imp = bVal === 0 ? (cVal === 0 ? 0 : -100) : ((bVal - cVal) / bVal) * 100;
        const validMatch = stats?.validCases.find(v => v.Case === d.Case);
        if (validMatch) outlierType = validMatch.outlierType;
      }

      if (tableFilter === 'degraded') return !isNull && imp < 0;
      if (tableFilter === 'outlier') return outlierType === 'positive' || outlierType === 'negative';
      if (tableFilter === 'filtered') return isNull || !isChecked;
      return true;
    });
  }, [sortedTableData, tableFilter, activeMetric, baseAlgo, compareAlgo, stats, selectedCases]);

  const toggleCase = useCallback((caseName) => {
    setSelectedCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(caseName)) {
        newSet.delete(caseName);
      } else {
        newSet.add(caseName);
      }
      return newSet;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedCases.size === parsedData.length) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(parsedData.map(d => d.Case)));
    }
  }, [selectedCases, parsedData]);

  const equalizeWeights = useCallback(() => {
    const newWeights = {};
    const avg = +(100 / availableMetrics.length).toFixed(2);
    availableMetrics.forEach(m => newWeights[m] = avg);
    setQorWeights(newWeights);
  }, [availableMetrics]);

  const handleChartMouseMove = useCallback((e) => {
    if (!tooltipState.visible) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipState(prev => ({
      ...prev,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }));
  }, [tooltipState.visible]);

  const value = {
    csvInput, setCsvInput,
    llmConfig, setLlmConfig,
    activeMetric, setActiveMetric,
    parsedData, setParsedData,
    availableMetrics, setAvailableMetrics,
    availableAlgos, setAvailableAlgos,
    metaColumns, setMetaColumns,
    isSidebarOpen, setIsSidebarOpen,
    activeTab, setActiveTab,
    baseAlgo, setBaseAlgo,
    compareAlgo, setCompareAlgo,
    tableFilter, setTableFilter,
    corrX, setCorrX,
    corrY, setCorrY,
    trendBase, setTrendBase,
    paretoX, setParetoX,
    paretoY, setParetoY,
    paretoZ, setParetoZ,
    qorWeights, setQorWeights,
    selectedCases, setSelectedCases,
    sortConfig, setSortConfig,
    tooltipState, setTooltipState,
    deepDiveCase, setDeepDiveCase,
    hoveredCase, setHoveredCase,
    isAnalyzing, setIsAnalyzing,
    aiInsights, setAiInsights,
    displayInsights, setDisplayInsights,
    aiError, setAiError,
    showAiConfig, setShowAiConfig,
    showAiPanel, setShowAiPanel,
    stats,
    allMetricsStats,
    sortedTableData,
    filteredTableData,
    runAnalysis,
    handleSort,
    toggleCase,
    toggleAll,
    equalizeWeights,
    handleChartMouseMove
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
