import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { parseCSV, computeStatistics, updateDataValue, dataToCSVString } from '../services/dataService';
import { generateDefaultDataset } from '../utils/dataGenerator';
import { DEFAULT_LLM_CONFIG, DEFAULT_CHART_SIZE } from '../utils/constants';
import { calculateImprovement } from '../utils/statistics';
import { getMetricConfig } from '../services/csvParser';

const calculateImprovementWithDirection = (baseVal, compareVal, metricName) => {
  if (baseVal == null || compareVal == null) return null;
  
  const config = getMetricConfig(metricName);
  const isHigherBetter = config.better === 'higher';
  
  if (isHigherBetter) {
    if (baseVal === 0 && compareVal === 0) return 0;
    if (baseVal === 0) return 100;
    return ((compareVal - baseVal) / Math.abs(baseVal)) * 100;
  } else {
    return calculateImprovement(baseVal, compareVal);
  }
};

const AppContext = createContext(null);

const DEFAULT_CSV = generateDefaultDataset();

export const AppProvider = ({ children }) => {
  const [csvInput, setCsvInput] = useLocalStorage('eda_csv_input', DEFAULT_CSV);
  const [llmConfig, setLlmConfig] = useLocalStorage('eda_llm_config', DEFAULT_LLM_CONFIG);
  const [activeMetric, setActiveMetric] = useLocalStorage('eda_active_metric', '');
  const [qorWeights, setQorWeights] = useLocalStorage('eda_qor_weights', {});
  const [savedAiInsights, setSavedAiInsights] = useLocalStorage('eda_ai_insights', {});
  const [chartSize, setChartSize] = useLocalStorage('eda_chart_size', DEFAULT_CHART_SIZE);
  
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
  const [paretoX, setParetoX] = useState('');
  const [paretoY, setParetoY] = useState('');
  const [paretoZ, setParetoZ] = useState('');
  const [selectedCases, setSelectedCases] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'Case', direction: 'asc' });
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [tooltipState, setTooltipState] = useState({ visible: false, x: 0, y: 0, title: '', lines: [] });
  const [deepDiveCase, setDeepDiveCase] = useState(null);
  const [hoveredCase, setHoveredCase] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState('');
  const [displayInsights, setDisplayInsights] = useState('');
  const [aiError, setAiError] = useState('');
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [showPromptConfig, setShowPromptConfig] = useState(false);
  
  const dataVersionRef = useRef(0);

  const runAnalysis = useCallback((inputData = csvInput) => {
    const { data, algos, metrics, metaColumns: metas } = parseCSV(inputData);
    
    setParsedData(data);
    setAvailableAlgos(algos);
    setAvailableMetrics(metrics);
    setMetaColumns(metas);
    
    dataVersionRef.current += 1;
    
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
    setParetoZ('');
    
    const instCol = metas.find(c => 
      c.toLowerCase() === 'inst' || 
      c.toLowerCase() === 'instance' || 
      c.toLowerCase() === 'instances' ||
      c.toLowerCase() === '#inst'
    );
    if (instCol) {
      setSortConfig({ key: instCol, direction: 'desc' });
    } else {
      setSortConfig({ key: null, direction: 'asc' });
    }
    
    setSelectedCases(new Set(data.map(d => d.Case)));
    setAiInsights('');
    setDisplayInsights('');
    setAiError('');
  }, [csvInput, baseAlgo, compareAlgo, activeMetric]);

  const getAiInsightsKey = useCallback((base, compare) => {
    const dataHash = csvInput.slice(0, 100) + dataVersionRef.current;
    return `${base}_${compare}_${dataHash.length}`;
  }, [csvInput]);

  const saveAiInsights = useCallback((base, compare, insights) => {
    const key = getAiInsightsKey(base, compare);
    setSavedAiInsights(prev => ({
      ...prev,
      [key]: {
        insights,
        timestamp: Date.now(),
        dataVersion: dataVersionRef.current,
        baseAlgo: base,
        compareAlgo: compare
      }
    }));
  }, [getAiInsightsKey, setSavedAiInsights]);

  const getSavedAiInsights = useCallback((base, compare) => {
    const key = getAiInsightsKey(base, compare);
    const saved = savedAiInsights[key];
    if (saved && saved.dataVersion === dataVersionRef.current) {
      return saved;
    }
    return null;
  }, [getAiInsightsKey, savedAiInsights]);

  const isInsightsOutdated = useCallback((base, compare) => {
    const key = getAiInsightsKey(base, compare);
    const saved = savedAiInsights[key];
    if (!saved) return false;
    return saved.dataVersion !== dataVersionRef.current;
  }, [getAiInsightsKey, savedAiInsights]);

  useEffect(() => {
    runAnalysis();
  }, []);

  useEffect(() => {
    if (availableMetrics.length > 0 && !paretoX) {
      setParetoX(availableMetrics[0]);
    }
    if (availableMetrics.length > 1 && !paretoY) {
      setParetoY(availableMetrics[1] || availableMetrics[0]);
    }
  }, [availableMetrics, paretoX, paretoY]);

  useEffect(() => {
    if (availableMetrics.length > 0) {
      const newWeights = {};
      let needInit = false;
      const avg = +(100 / availableMetrics.length).toFixed(2);
      
      availableMetrics.forEach(m => {
        if (qorWeights[m] === undefined) {
          needInit = true;
        }
        newWeights[m] = qorWeights[m] !== undefined ? qorWeights[m] : avg;
      });
      
      if (needInit) setQorWeights(newWeights);
    }
  }, [availableMetrics, qorWeights, setQorWeights]);

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
    if (sortConfig.key === null) {
      return [...parsedData];
    }
    
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
        
        aVal = aBase == null || aComp == null ? -Infinity : calculateImprovementWithDirection(aBase, aComp, activeMetric) ?? -Infinity;
        bVal = bBase == null || bComp == null ? -Infinity : calculateImprovementWithDirection(bBase, bComp, activeMetric) ?? -Infinity;
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

  const validCasesMap = useMemo(() => {
    if (!stats?.validCases) return new Map();
    return new Map(stats.validCases.map(v => [v.Case, v]));
  }, [stats]);

  const filteredTableData = useMemo(() => {
    let result = sortedTableData;

    if (tableSearchTerm.trim()) {
      const term = tableSearchTerm.toLowerCase().trim();
      result = result.filter(d => {
        if (d.Case.toLowerCase().includes(term)) return true;
        for (const mc of metaColumns) {
          const val = d.meta[mc];
          if (val && String(val).toLowerCase().includes(term)) return true;
        }
        for (const metric of Object.values(d.raw)) {
          for (const val of Object.values(metric)) {
            if (val != null && String(val).toLowerCase().includes(term)) return true;
          }
        }
        return false;
      });
    }

    const filtered = result.filter(d => {
      const isChecked = selectedCases.has(d.Case);
      const bVal = d.raw[activeMetric]?.[baseAlgo];
      const cVal = d.raw[activeMetric]?.[compareAlgo];
      const isNull = bVal == null || cVal == null;
      
      if (isNull && tableFilter !== 'filtered') {
        return false;
      }
      
      if (!isChecked && tableFilter === 'filtered') {
        return true;
      }
      
      if (!isChecked) {
        return true;
      }
      
      const imp = calculateImprovementWithDirection(bVal, cVal, activeMetric);
      const validMatch = validCasesMap.get(d.Case);
      const outlierType = validMatch?.outlierType || 'normal';

      if (tableFilter === 'degraded') return imp != null && imp < 0;
      if (tableFilter === 'outlier') return outlierType === 'positive' || outlierType === 'negative';
      if (tableFilter === 'filtered') return false;
      return true;
    });
    
    filtered.sort((a, b) => {
      const aChecked = selectedCases.has(a.Case);
      const bChecked = selectedCases.has(b.Case);
      if (aChecked === bChecked) return 0;
      return aChecked ? -1 : 1;
    });
    
    return filtered;
  }, [sortedTableData, tableFilter, tableSearchTerm, activeMetric, baseAlgo, compareAlgo, validCasesMap, selectedCases, metaColumns]);

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
    setTooltipState(prev => ({
      ...prev,
      x: e.clientX,
      y: e.clientY
    }));
  }, [tooltipState.visible]);

  const handleEditDataValue = useCallback((caseName, columnId, metric, algorithm, newValue) => {
    const updatedData = updateDataValue(parsedData, caseName, metric, algorithm, newValue);
    setParsedData(updatedData);
    
    const newCsvString = dataToCSVString(updatedData, availableAlgos, availableMetrics, metaColumns);
    setCsvInput(newCsvString);
  }, [parsedData, availableAlgos, availableMetrics, metaColumns, setCsvInput]);

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
    paretoX, setParetoX,
    paretoY, setParetoY,
    paretoZ, setParetoZ,
    qorWeights, setQorWeights,
    selectedCases, setSelectedCases,
    sortConfig, setSortConfig,
    tableSearchTerm, setTableSearchTerm,
    tooltipState, setTooltipState,
    deepDiveCase, setDeepDiveCase,
    hoveredCase, setHoveredCase,
    isAnalyzing, setIsAnalyzing,
    aiInsights, setAiInsights,
    displayInsights, setDisplayInsights,
    aiError, setAiError,
    showAiConfig, setShowAiConfig,
    showPromptConfig, setShowPromptConfig,
    stats,
    allMetricsStats,
    sortedTableData,
    filteredTableData,
    validCasesMap,
    runAnalysis,
    handleSort,
    toggleCase,
    toggleAll,
    equalizeWeights,
    handleChartMouseMove,
    handleEditDataValue,
    saveAiInsights,
    getSavedAiInsights,
    isInsightsOutdated,
    chartSize, setChartSize
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
