import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { parseCSV, computeStatistics, updateDataValue, dataToCSVString } from '../services/dataService';
import { generateDefaultDataset } from '../utils/dataGenerator';
import { DEFAULT_LLM_CONFIG, DEFAULT_CHART_SIZE } from '../utils/constants';
import { calculateImprovement } from '../utils/statistics';
import { getMetricConfig } from '../services/csvParser';
import { appReducer, initialState, createActions, ACTION_TYPES } from './appReducer';

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
  const [savedAiInsights, setSavedAiInsights] = useLocalStorage('eda_ai_insights', {});
  const [chartSize, setChartSize] = useLocalStorage('eda_chart_size', DEFAULT_CHART_SIZE);
  
  const [state, dispatch] = useReducer(appReducer, initialState);
  const actions = useMemo(() => createActions(dispatch), []);
  const dataVersionRef = useRef(0);

  const runAnalysis = useCallback((inputData = csvInput) => {
    const { data, algos, metrics, metaColumns: metas } = parseCSV(inputData);
    
    dataVersionRef.current += 1;
    
    const instCol = metas.find(c => 
      c.toLowerCase() === 'inst' || 
      c.toLowerCase() === 'instance' || 
      c.toLowerCase() === 'instances' ||
      c.toLowerCase() === '#inst'
    );
    
    actions.initFromParse(data, algos, metrics, metas, instCol);
  }, [csvInput, actions]);

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

  const stats = useMemo(() => {
    if (state.parsedData.length === 0 || !state.activeMetric || !state.baseAlgo || !state.compareAlgo) return null;
    return computeStatistics(state.activeMetric, state.baseAlgo, state.compareAlgo, state.parsedData, state.selectedCases);
  }, [state.parsedData, state.selectedCases, state.activeMetric, state.baseAlgo, state.compareAlgo]);

  const allMetricsStats = useMemo(() => {
    if (state.parsedData.length === 0 || !state.baseAlgo || !state.compareAlgo) return [];
    return state.availableMetrics.map(m => ({
      metric: m,
      stats: computeStatistics(m, state.baseAlgo, state.compareAlgo, state.parsedData, state.selectedCases)
    }));
  }, [state.parsedData, state.selectedCases, state.availableMetrics, state.baseAlgo, state.compareAlgo]);

  const handleSort = useCallback((key) => {
    const newConfig = {
      key,
      direction: state.sortConfig.key === key && state.sortConfig.direction === 'asc' ? 'desc' : 'asc'
    };
    actions.setSortConfig(newConfig);
  }, [state.sortConfig, actions]);

  const sortedTableData = useMemo(() => {
    if (state.sortConfig.key === null) {
      return [...state.parsedData];
    }
    
    const sortableItems = [...state.parsedData];
    sortableItems.sort((a, b) => {
      let aVal, bVal;
      
      if (state.sortConfig.key === 'Case') {
        aVal = a.Case;
        bVal = b.Case;
      } else if (state.metaColumns.includes(state.sortConfig.key)) {
        aVal = parseFloat(a.meta[state.sortConfig.key]) || a.meta[state.sortConfig.key];
        bVal = parseFloat(b.meta[state.sortConfig.key]) || b.meta[state.sortConfig.key];
      } else if (state.sortConfig.key === 'imp') {
        const aBase = a.raw[state.activeMetric]?.[state.baseAlgo];
        const aComp = a.raw[state.activeMetric]?.[state.compareAlgo];
        const bBase = b.raw[state.activeMetric]?.[state.baseAlgo];
        const bComp = b.raw[state.activeMetric]?.[state.compareAlgo];
        
        aVal = aBase == null || aComp == null ? -Infinity : calculateImprovementWithDirection(aBase, aComp, state.activeMetric) ?? -Infinity;
        bVal = bBase == null || bComp == null ? -Infinity : calculateImprovementWithDirection(bBase, bComp, state.activeMetric) ?? -Infinity;
      } else {
        aVal = a.raw[state.activeMetric]?.[state.sortConfig.key] == null ? -Infinity : a.raw[state.activeMetric][state.sortConfig.key];
        bVal = b.raw[state.activeMetric]?.[state.sortConfig.key] == null ? -Infinity : b.raw[state.activeMetric][state.sortConfig.key];
      }
      
      if (aVal < bVal) return state.sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return state.sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sortableItems;
  }, [state.parsedData, state.sortConfig, state.activeMetric, state.baseAlgo, state.compareAlgo, state.metaColumns]);

  const validCasesMap = useMemo(() => {
    if (!stats?.validCases) return new Map();
    return new Map(stats.validCases.map(v => [v.Case, v]));
  }, [stats]);

  const filteredTableData = useMemo(() => {
    let result = sortedTableData;

    if (state.tableSearchTerm.trim()) {
      const term = state.tableSearchTerm.toLowerCase().trim();
      result = result.filter(d => {
        if (d.Case.toLowerCase().includes(term)) return true;
        for (const mc of state.metaColumns) {
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
      const isChecked = state.selectedCases.has(d.Case);
      const bVal = d.raw[state.activeMetric]?.[state.baseAlgo];
      const cVal = d.raw[state.activeMetric]?.[state.compareAlgo];
      const isNull = bVal == null || cVal == null;
      
      if (isNull && state.tableFilter !== 'filtered') {
        return false;
      }
      
      if (!isChecked && state.tableFilter === 'filtered') {
        return true;
      }
      
      if (!isChecked) {
        return true;
      }
      
      const imp = calculateImprovementWithDirection(bVal, cVal, state.activeMetric);
      const validMatch = validCasesMap.get(d.Case);
      const outlierType = validMatch?.outlierType || 'normal';

      if (state.tableFilter === 'degraded') return imp != null && imp < 0;
      if (state.tableFilter === 'outlier') return outlierType === 'positive' || outlierType === 'negative';
      if (state.tableFilter === 'filtered') return false;
      return true;
    });
    
    filtered.sort((a, b) => {
      const aChecked = state.selectedCases.has(a.Case);
      const bChecked = state.selectedCases.has(b.Case);
      if (aChecked === bChecked) return 0;
      return aChecked ? -1 : 1;
    });
    
    return filtered;
  }, [sortedTableData, state.tableFilter, state.tableSearchTerm, state.activeMetric, state.baseAlgo, state.compareAlgo, validCasesMap, state.selectedCases, state.metaColumns]);

  const toggleAll = useCallback(() => {
    actions.toggleAllCases();
  }, [actions]);

  const equalizeWeights = useCallback(() => {
    const newWeights = {};
    const avg = +(100 / state.availableMetrics.length).toFixed(2);
    state.availableMetrics.forEach(m => newWeights[m] = avg);
    actions.setQorWeights(newWeights);
  }, [state.availableMetrics, actions]);

  const handleChartMouseMove = useCallback((e) => {
    if (!state.tooltipState.visible) return;
    actions.setTooltip({
      ...state.tooltipState,
      x: e.clientX,
      y: e.clientY
    });
  }, [state.tooltipState.visible, state.tooltipState, actions]);

  const handleEditDataValue = useCallback((caseName, columnId, metric, algorithm, newValue) => {
    const updatedData = updateDataValue(state.parsedData, caseName, metric, algorithm, newValue);
    actions.setParsedData(updatedData);
    
    const newCsvString = dataToCSVString(updatedData, state.availableAlgos, state.availableMetrics, state.metaColumns);
    setCsvInput(newCsvString);
  }, [state.parsedData, state.availableAlgos, state.availableMetrics, state.metaColumns, actions, setCsvInput]);

  const value = useMemo(() => ({
    csvInput, setCsvInput,
    llmConfig, setLlmConfig,
    activeMetric: state.activeMetric,
    setActiveMetric: actions.setActiveMetric,
    parsedData: state.parsedData,
    setParsedData: actions.setParsedData,
    availableMetrics: state.availableMetrics,
    setAvailableMetrics: actions.setMetrics,
    availableAlgos: state.availableAlgos,
    setAvailableAlgos: actions.setAlgos,
    metaColumns: state.metaColumns,
    setMetaColumns: actions.setMetaColumns,
    isSidebarOpen: state.isSidebarOpen,
    setIsSidebarOpen: actions.setSidebar,
    activeTab: state.activeTab,
    setActiveTab: actions.setActiveTab,
    baseAlgo: state.baseAlgo,
    setBaseAlgo: actions.setBaseAlgo,
    compareAlgo: state.compareAlgo,
    setCompareAlgo: actions.setCompareAlgo,
    tableFilter: state.tableFilter,
    setTableFilter: actions.setTableFilter,
    corrX: state.corrX,
    setCorrX: (v) => actions.setChartAxis('corrX', v),
    corrY: state.corrY,
    setCorrY: (v) => actions.setChartAxis('corrY', v),
    paretoX: state.paretoX,
    setParetoX: (v) => actions.setChartAxis('paretoX', v),
    paretoY: state.paretoY,
    setParetoY: (v) => actions.setChartAxis('paretoY', v),
    paretoZ: state.paretoZ,
    setParetoZ: (v) => actions.setChartAxis('paretoZ', v),
    qorWeights: state.qorWeights,
    setQorWeights: actions.setQorWeights,
    selectedCases: state.selectedCases,
    setSelectedCases: actions.setSelectedCases,
    sortConfig: state.sortConfig,
    setSortConfig: actions.setSortConfig,
    tableSearchTerm: state.tableSearchTerm,
    setTableSearchTerm: actions.setTableSearch,
    tooltipState: state.tooltipState,
    setTooltipState: actions.setTooltip,
    deepDiveCase: state.deepDiveCase,
    setDeepDiveCase: actions.setDeepDiveCase,
    hoveredCase: state.hoveredCase,
    setHoveredCase: actions.setHoveredCase,
    isAnalyzing: state.isAnalyzing,
    setIsAnalyzing: (v) => actions.setAIState({ isAnalyzing: v }),
    aiInsights: state.aiInsights,
    setAiInsights: (v) => actions.setAIState({ aiInsights: v }),
    displayInsights: state.displayInsights,
    setDisplayInsights: (v) => actions.setAIState({ displayInsights: v }),
    aiError: state.aiError,
    setAiError: (v) => actions.setAIState({ aiError: v }),
    showAiConfig: state.showAiConfig,
    setShowAiConfig: (v) => actions.setAIState({ showAiConfig: v }),
    stats,
    allMetricsStats,
    sortedTableData,
    filteredTableData,
    validCasesMap,
    runAnalysis,
    handleSort,
    toggleCase: actions.toggleCase,
    toggleAll,
    equalizeWeights,
    handleChartMouseMove,
    handleEditDataValue,
    saveAiInsights,
    getSavedAiInsights,
    isInsightsOutdated,
    chartSize, setChartSize
  }), [
    csvInput, setCsvInput,
    llmConfig, setLlmConfig,
    state, actions,
    stats, allMetricsStats, sortedTableData, filteredTableData, validCasesMap,
    runAnalysis, handleSort, toggleAll, equalizeWeights, handleChartMouseMove, handleEditDataValue,
    saveAiInsights, getSavedAiInsights, isInsightsOutdated,
    chartSize, setChartSize
  ]);

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
