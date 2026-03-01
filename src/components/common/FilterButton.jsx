import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Filter, RotateCcw, Check, ChevronDown, X, TrendingUp, TrendingDown, Minus, AlertCircle, Layers } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { calculateImprovementWithDirection } from '../../utils/statistics';
import { getMetricConfig } from '../../services/csvParser';

const DEFAULT_FILTER_CONFIG = {
  topN: 0,
  bottomN: 0,
  excludeSmall: false,
  excludeMedium: false,
  excludeLarge: false,
  smallThreshold: 50000,
  largeThreshold: 1000000,
  excludeNull: true
};

const FilterButton = ({
  parsedData,
  metaColumns,
  activeMetric,
  baseAlgo,
  compareAlgo,
  selectedCases,
  onFilterApply
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterConfig, setFilterConfig] = useLocalStorage('eda_filter_config', DEFAULT_FILTER_CONFIG);
  const [tempConfig, setTempConfig] = useState(filterConfig);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const instCol = metaColumns.find(c => 
    c.toLowerCase() === 'inst' || 
    c.toLowerCase() === 'instance' || 
    c.toLowerCase() === 'instances' ||
    c.toLowerCase() === '#inst'
  );

  const getCaseSize = useCallback((dataItem, config) => {
    if (!instCol) return 'medium';
    const instValue = parseFloat(dataItem.meta[instCol]);
    if (isNaN(instValue)) return 'medium';
    if (instValue < config.smallThreshold) return 'small';
    if (instValue > config.largeThreshold) return 'large';
    return 'medium';
  }, [instCol]);

  const calculateImprovement = useCallback((dataItem) => {
    const bVal = dataItem.raw[activeMetric]?.[baseAlgo];
    const cVal = dataItem.raw[activeMetric]?.[compareAlgo];
    if (bVal == null || cVal == null) return null;
    
    const metricConfig = getMetricConfig(activeMetric);
    return calculateImprovementWithDirection(bVal, cVal, metricConfig.better === 'higher');
  }, [activeMetric, baseAlgo, compareAlgo]);

  const sizeDistribution = useMemo(() => {
    if (!parsedData || parsedData.length === 0 || !instCol) return { small: 0, medium: 0, large: 0 };
    
    const dist = { small: 0, medium: 0, large: 0 };
    parsedData.forEach(d => {
      const size = getCaseSize(d, filterConfig);
      dist[size]++;
    });
    return dist;
  }, [parsedData, instCol, getCaseSize, filterConfig]);

  const previewFilteredCount = useMemo(() => {
    if (!parsedData || parsedData.length === 0) return 0;
    
    let count = 0;
    const config = tempConfig;
    
    const validCases = parsedData.filter(d => {
      const bVal = d.raw[activeMetric]?.[baseAlgo];
      const cVal = d.raw[activeMetric]?.[compareAlgo];
      return bVal != null && cVal != null;
    });
    
    const sortedByImp = [...validCases].sort((a, b) => {
      const aImp = calculateImprovement(a) ?? 0;
      const bImp = calculateImprovement(b) ?? 0;
      return bImp - aImp;
    });
    
    const topCases = new Set();
    const bottomCases = new Set();
    
    if (config.topN > 0) {
      sortedByImp.slice(0, config.topN).forEach(d => topCases.add(d.Case));
    }
    if (config.bottomN > 0) {
      sortedByImp.slice(-config.bottomN).forEach(d => bottomCases.add(d.Case));
    }
    
    parsedData.forEach(d => {
      let willBeFiltered = false;
      
      if (config.topN > 0 && topCases.has(d.Case)) willBeFiltered = true;
      if (config.bottomN > 0 && bottomCases.has(d.Case)) willBeFiltered = true;
      
      if (config.excludeSmall || config.excludeMedium || config.excludeLarge) {
        const size = getCaseSize(d, config);
        if ((size === 'small' && config.excludeSmall) ||
            (size === 'medium' && config.excludeMedium) ||
            (size === 'large' && config.excludeLarge)) {
          willBeFiltered = true;
        }
      }
      
      if (willBeFiltered) count++;
    });
    
    return count;
  }, [parsedData, tempConfig, activeMetric, baseAlgo, compareAlgo, calculateImprovement, getCaseSize]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterConfig.topN > 0) count++;
    if (filterConfig.bottomN > 0) count++;
    if (filterConfig.excludeSmall) count++;
    if (filterConfig.excludeMedium) count++;
    if (filterConfig.excludeLarge) count++;
    return count;
  }, [filterConfig]);

  const currentFilteredCount = useMemo(() => {
    return parsedData.length - selectedCases.size;
  }, [parsedData, selectedCases]);

  useEffect(() => {
    setTempConfig(filterConfig);
  }, [filterConfig]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && buttonRef.current && panelRef.current) {
        if (!buttonRef.current.contains(e.target) && !panelRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleButtonClick = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = 320;
      const panelHeight = 420;
      let left = rect.left;
      let top = rect.bottom + 4;
      
      if (left + panelWidth > window.innerWidth - 10) {
        left = window.innerWidth - panelWidth - 10;
      }
      if (left < 10) left = 10;
      if (top + panelHeight > window.innerHeight - 10) {
        top = rect.top - panelHeight - 4;
      }
      
      setPanelPosition({ top, left });
    }
    setIsOpen(!isOpen);
  };

  const handleConfigChange = (key, value) => {
    setTempConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const computeFilteredCases = useCallback((config) => {
    if (!parsedData || parsedData.length === 0) return null;
    
    let casesToRemove = new Set();
    
    if (config.topN > 0 || config.bottomN > 0) {
      const validCases = parsedData.filter(d => {
        const bVal = d.raw[activeMetric]?.[baseAlgo];
        const cVal = d.raw[activeMetric]?.[compareAlgo];
        return bVal != null && cVal != null;
      });
      
      const sortedByImp = [...validCases].sort((a, b) => {
        const aImp = calculateImprovement(a) ?? 0;
        const bImp = calculateImprovement(b) ?? 0;
        return bImp - aImp;
      });
      
      if (config.topN > 0) {
        sortedByImp.slice(0, config.topN).forEach(d => casesToRemove.add(d.Case));
      }
      if (config.bottomN > 0) {
        sortedByImp.slice(-config.bottomN).forEach(d => casesToRemove.add(d.Case));
      }
    }
    
    if (config.excludeSmall || config.excludeMedium || config.excludeLarge) {
      parsedData.forEach(d => {
        const size = getCaseSize(d, config);
        if ((size === 'small' && config.excludeSmall) ||
            (size === 'medium' && config.excludeMedium) ||
            (size === 'large' && config.excludeLarge)) {
          casesToRemove.add(d.Case);
        }
      });
    }
    
    return casesToRemove;
  }, [parsedData, activeMetric, baseAlgo, compareAlgo, calculateImprovement, getCaseSize]);

  const handleApply = () => {
    setFilterConfig(tempConfig);
    setIsOpen(false);
    if (onFilterApply) {
      const filteredCases = computeFilteredCases(tempConfig);
      onFilterApply(filteredCases);
    }
  };

  const handleReset = () => {
    const resetConfig = { ...DEFAULT_FILTER_CONFIG };
    setTempConfig(resetConfig);
    setFilterConfig(resetConfig);
    if (onFilterApply) {
      onFilterApply(null);
    }
  };

  const hasChanges = JSON.stringify(tempConfig) !== JSON.stringify(filterConfig);

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={handleButtonClick}
        className={`h-7 px-2.5 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all ${
          activeFilterCount > 0 || currentFilteredCount > 0
            ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
        }`}
      >
        <Filter className="w-3 h-3" />
        <span>过滤</span>
        {(activeFilterCount > 0 || currentFilteredCount > 0) && (
          <span className="bg-amber-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center">
            {currentFilteredCount > 0 ? currentFilteredCount : activeFilterCount}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div
          ref={panelRef}
          className="fixed bg-white rounded-xl shadow-xl border border-gray-200 z-[9999] overflow-hidden"
          style={{
            top: `${panelPosition.top}px`,
            left: `${panelPosition.left}px`,
            width: '340px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">过滤条件</span>
            <div className="flex items-center gap-2">
              {previewFilteredCount > 0 && (
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                  将过滤 {previewFilteredCount} 个
                </span>
              )}
              {(activeFilterCount > 0 || currentFilteredCount > 0) && (
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-0.5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  重置
                </button>
              )}
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-gray-600">极端值过滤</span>
                <span className="text-xs text-gray-400 ml-auto">按改进率排序</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-gray-600">过滤最佳</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tempConfig.topN}
                      onChange={(e) => handleConfigChange('topN', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-center text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                    />
                    <span className="text-sm text-gray-400">个</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-600">过滤最差</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={tempConfig.bottomN}
                      onChange={(e) => handleConfigChange('bottomN', Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full text-center text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                    />
                    <span className="text-sm text-gray-400">个</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-gray-600">规模过滤</span>
                {!instCol && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded ml-auto">
                    未检测到 Inst 列
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { key: 'excludeSmall', label: '小型', count: sizeDistribution.small, color: 'blue' },
                  { key: 'excludeMedium', label: '中型', count: sizeDistribution.medium, color: 'gray' },
                  { key: 'excludeLarge', label: '大型', count: sizeDistribution.large, color: 'purple' }
                ].map(({ key, label, count, color }) => (
                  <button
                    key={key}
                    onClick={() => handleConfigChange(key, !tempConfig[key])}
                    disabled={!instCol}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1 ${
                      tempConfig[key]
                        ? 'bg-red-100 text-red-700 border border-red-200 shadow-sm'
                        : `bg-${color}-50 text-${color}-600 border border-${color}-200 hover:bg-${color}-100`
                    } ${!instCol ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {tempConfig[key] && <X className="w-3 h-3" />}
                    {label}
                    <span className="text-gray-400">({count})</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50/50 rounded border border-blue-100">
                  <label className="text-xs text-gray-500 block mb-1.5">小型阈值 &lt;</label>
                  <input
                    type="number"
                    min="0"
                    value={tempConfig.smallThreshold}
                    onChange={(e) => handleConfigChange('smallThreshold', Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                  />
                </div>
                <div className="p-3 bg-purple-50/50 rounded border border-purple-100">
                  <label className="text-xs text-gray-500 block mb-1.5">大型阈值 &gt;</label>
                  <input
                    type="number"
                    min="0"
                    value={tempConfig.largeThreshold}
                    onChange={(e) => handleConfigChange('largeThreshold', Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                  />
                </div>
              </div>
            </div>

            {currentFilteredCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                <Minus className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-700">
                  当前已过滤 <strong>{currentFilteredCount}</strong> 个案例
                </span>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleApply}
              disabled={!hasChanges && previewFilteredCount === currentFilteredCount}
              className={`flex-1 text-sm font-medium px-3 py-2 rounded flex items-center justify-center gap-1.5 transition-colors ${
                hasChanges || previewFilteredCount !== currentFilteredCount
                  ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              应用过滤
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

FilterButton.propTypes = {
  parsedData: PropTypes.array.isRequired,
  metaColumns: PropTypes.array.isRequired,
  activeMetric: PropTypes.string.isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string.isRequired,
  selectedCases: PropTypes.instanceOf(Set).isRequired,
  onFilterApply: PropTypes.func
};

export default FilterButton;
