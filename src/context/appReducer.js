export const ACTION_TYPES = {
  SET_PARSED_DATA: 'SET_PARSED_DATA',
  SET_ALGOS: 'SET_ALGOS',
  SET_METRICS: 'SET_METRICS',
  SET_META_COLUMNS: 'SET_META_COLUMNS',
  SET_BASE_ALGO: 'SET_BASE_ALGO',
  SET_COMPARE_ALGO: 'SET_COMPARE_ALGO',
  SET_ACTIVE_METRIC: 'SET_ACTIVE_METRIC',
  SET_TABLE_FILTER: 'SET_TABLE_FILTER',
  SET_TABLE_SEARCH: 'SET_TABLE_SEARCH',
  SET_SORT_CONFIG: 'SET_SORT_CONFIG',
  SET_SELECTED_CASES: 'SET_SELECTED_CASES',
  TOGGLE_CASE: 'TOGGLE_CASE',
  TOGGLE_ALL_CASES: 'TOGGLE_ALL_CASES',
  SET_CHART_AXIS: 'SET_CHART_AXIS',
  SET_QOR_WEIGHTS: 'SET_QOR_WEIGHTS',
  SET_TOOLTIP: 'SET_TOOLTIP',
  SET_DEEP_DIVE_CASE: 'SET_DEEP_DIVE_CASE',
  SET_HOVERED_CASE: 'SET_HOVERED_CASE',
  SET_SIDEBAR: 'SET_SIDEBAR',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_AI_STATE: 'SET_AI_STATE',
  RESET_AI_INSIGHTS: 'RESET_AI_INSIGHTS',
  INIT_FROM_PARSE: 'INIT_FROM_PARSE',
};

export const initialState = {
  parsedData: [],
  availableMetrics: [],
  availableAlgos: [],
  metaColumns: [],
  baseAlgo: '',
  compareAlgo: '',
  activeMetric: '',
  tableFilter: 'all',
  tableSearchTerm: '',
  sortConfig: { key: 'Case', direction: 'asc' },
  selectedCases: new Set(),
  corrX: '',
  corrY: '',
  paretoX: '',
  paretoY: '',
  paretoZ: '',
  qorWeights: {},
  tooltipState: { visible: false, x: 0, y: 0, title: '', lines: [] },
  deepDiveCase: null,
  hoveredCase: null,
  isSidebarOpen: true,
  activeTab: 'table',
  isAnalyzing: false,
  aiInsights: '',
  displayInsights: '',
  aiError: '',
  showAiConfig: false,
};

export const appReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.INIT_FROM_PARSE: {
      const { data, algos, metrics, metaColumns, instCol } = action.payload;
      const newSelectedCases = new Set(data.map(d => d.Case));
      
      return {
        ...state,
        parsedData: data,
        availableAlgos: algos,
        availableMetrics: metrics,
        metaColumns: metaColumns,
        baseAlgo: algos.length > 0 ? (algos.includes(state.baseAlgo) ? state.baseAlgo : algos[0]) : state.baseAlgo,
        compareAlgo: algos.length > 1 ? (algos.includes(state.compareAlgo) ? state.compareAlgo : (algos[1] || algos[0])) : state.compareAlgo,
        activeMetric: metrics.length > 0 ? (metrics.includes(state.activeMetric) ? state.activeMetric : metrics[0]) : state.activeMetric,
        paretoX: metrics.length > 0 ? (metrics.includes(state.paretoX) ? state.paretoX : metrics[0]) : state.paretoX,
        paretoY: metrics.length > 1 ? (metrics.includes(state.paretoY) ? state.paretoY : (metrics[1] || metrics[0])) : state.paretoY,
        paretoZ: '',
        sortConfig: instCol 
          ? { key: instCol, direction: 'desc' }
          : { key: null, direction: 'asc' },
        selectedCases: newSelectedCases,
        aiInsights: '',
        displayInsights: '',
        aiError: '',
      };
    }

    case ACTION_TYPES.SET_PARSED_DATA:
      return { ...state, parsedData: action.payload };

    case ACTION_TYPES.SET_ALGOS:
      return { ...state, availableAlgos: action.payload };

    case ACTION_TYPES.SET_METRICS:
      return { ...state, availableMetrics: action.payload };

    case ACTION_TYPES.SET_META_COLUMNS:
      return { ...state, metaColumns: action.payload };

    case ACTION_TYPES.SET_BASE_ALGO:
      return { ...state, baseAlgo: action.payload };

    case ACTION_TYPES.SET_COMPARE_ALGO:
      return { ...state, compareAlgo: action.payload };

    case ACTION_TYPES.SET_ACTIVE_METRIC:
      return { ...state, activeMetric: action.payload };

    case ACTION_TYPES.SET_TABLE_FILTER:
      return { ...state, tableFilter: action.payload };

    case ACTION_TYPES.SET_TABLE_SEARCH:
      return { ...state, tableSearchTerm: action.payload };

    case ACTION_TYPES.SET_SORT_CONFIG:
      return { ...state, sortConfig: action.payload };

    case ACTION_TYPES.SET_SELECTED_CASES:
      return { ...state, selectedCases: action.payload };

    case ACTION_TYPES.TOGGLE_CASE: {
      const newSet = new Set(state.selectedCases);
      if (newSet.has(action.payload)) {
        newSet.delete(action.payload);
      } else {
        newSet.add(action.payload);
      }
      return { ...state, selectedCases: newSet };
    }

    case ACTION_TYPES.TOGGLE_ALL_CASES: {
      const newSet = state.selectedCases.size === state.parsedData.length
        ? new Set()
        : new Set(state.parsedData.map(d => d.Case));
      return { ...state, selectedCases: newSet };
    }

    case ACTION_TYPES.SET_CHART_AXIS: {
      const { axis, value } = action.payload;
      return { ...state, [axis]: value };
    }

    case ACTION_TYPES.SET_QOR_WEIGHTS:
      return { ...state, qorWeights: action.payload };

    case ACTION_TYPES.SET_TOOLTIP:
      return { ...state, tooltipState: action.payload };

    case ACTION_TYPES.SET_DEEP_DIVE_CASE:
      return { ...state, deepDiveCase: action.payload };

    case ACTION_TYPES.SET_HOVERED_CASE:
      return { ...state, hoveredCase: action.payload };

    case ACTION_TYPES.SET_SIDEBAR:
      return { ...state, isSidebarOpen: action.payload };

    case ACTION_TYPES.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };

    case ACTION_TYPES.SET_AI_STATE: {
      const { isAnalyzing, aiInsights, displayInsights, aiError, showAiConfig } = action.payload;
      return {
        ...state,
        ...(isAnalyzing !== undefined && { isAnalyzing }),
        ...(aiInsights !== undefined && { aiInsights }),
        ...(displayInsights !== undefined && { displayInsights }),
        ...(aiError !== undefined && { aiError }),
        ...(showAiConfig !== undefined && { showAiConfig }),
      };
    }

    case ACTION_TYPES.RESET_AI_INSIGHTS:
      return {
        ...state,
        aiInsights: '',
        displayInsights: '',
        aiError: '',
      };

    default:
      return state;
  }
};

export const createActions = (dispatch) => ({
  initFromParse: (data, algos, metrics, metaColumns, instCol) => 
    dispatch({ type: ACTION_TYPES.INIT_FROM_PARSE, payload: { data, algos, metrics, metaColumns, instCol } }),
  
  setParsedData: (data) => dispatch({ type: ACTION_TYPES.SET_PARSED_DATA, payload: data }),
  setAlgos: (algos) => dispatch({ type: ACTION_TYPES.SET_ALGOS, payload: algos }),
  setMetrics: (metrics) => dispatch({ type: ACTION_TYPES.SET_METRICS, payload: metrics }),
  setMetaColumns: (metaColumns) => dispatch({ type: ACTION_TYPES.SET_META_COLUMNS, payload: metaColumns }),
  setBaseAlgo: (algo) => dispatch({ type: ACTION_TYPES.SET_BASE_ALGO, payload: algo }),
  setCompareAlgo: (algo) => dispatch({ type: ACTION_TYPES.SET_COMPARE_ALGO, payload: algo }),
  setActiveMetric: (metric) => dispatch({ type: ACTION_TYPES.SET_ACTIVE_METRIC, payload: metric }),
  setTableFilter: (filter) => dispatch({ type: ACTION_TYPES.SET_TABLE_FILTER, payload: filter }),
  setTableSearch: (term) => dispatch({ type: ACTION_TYPES.SET_TABLE_SEARCH, payload: term }),
  setSortConfig: (config) => dispatch({ type: ACTION_TYPES.SET_SORT_CONFIG, payload: config }),
  setSelectedCases: (cases) => dispatch({ type: ACTION_TYPES.SET_SELECTED_CASES, payload: cases }),
  toggleCase: (caseName) => dispatch({ type: ACTION_TYPES.TOGGLE_CASE, payload: caseName }),
  toggleAllCases: () => dispatch({ type: ACTION_TYPES.TOGGLE_ALL_CASES }),
  setChartAxis: (axis, value) => dispatch({ type: ACTION_TYPES.SET_CHART_AXIS, payload: { axis, value } }),
  setQorWeights: (weights) => dispatch({ type: ACTION_TYPES.SET_QOR_WEIGHTS, payload: weights }),
  setTooltip: (tooltip) => dispatch({ type: ACTION_TYPES.SET_TOOLTIP, payload: tooltip }),
  setDeepDiveCase: (caseName) => dispatch({ type: ACTION_TYPES.SET_DEEP_DIVE_CASE, payload: caseName }),
  setHoveredCase: (caseName) => dispatch({ type: ACTION_TYPES.SET_HOVERED_CASE, payload: caseName }),
  setSidebar: (isOpen) => dispatch({ type: ACTION_TYPES.SET_SIDEBAR, payload: isOpen }),
  setActiveTab: (tab) => dispatch({ type: ACTION_TYPES.SET_ACTIVE_TAB, payload: tab }),
  setAIState: (state) => dispatch({ type: ACTION_TYPES.SET_AI_STATE, payload: state }),
  resetAIInsights: () => dispatch({ type: ACTION_TYPES.RESET_AI_INSIGHTS }),
});
