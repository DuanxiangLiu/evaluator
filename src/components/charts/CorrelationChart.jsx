import React, { useState, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, HelpCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartBody, ChartArea, ChartLegend, AreaLabel, EmptyState } from '../common/ChartContainer';
import HelpIcon from '../common/HelpIcon';
import { formatIndustrialNumber } from '../../utils/formatters';
import { calculateImprovementWithDirection, calculatePearsonCorrelation, calculateSpearmanCorrelation, calculateLinearRegression, detectOutliers, interpretCorrelation } from '../../utils/statistics';
import { getMetricConfig } from '../../services/csvParser';
import { CHART_HEADER_STYLES } from '../../utils/constants';
import { generateCorrelationInsight, renderMarkdownText } from '../../services/aiService';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../common/Toast';
import { useChartWidth } from '../../hooks/useChartWidth';

const STRONG_CORRELATION_THRESHOLD = 0.7;

const CorrelationDiscovery = ({ parsedData, selectedCases, metaColumns, availableMetrics, baseAlgo, compareAlgo, onSelectCorrelation }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const correlations = useMemo(() => {
    const results = [];
    const selectedData = parsedData.filter(d => selectedCases.has(d.Case));
    const seenPairs = new Set();
    
    if (selectedData.length < 5) return results;
    
    const allXOptions = [...metaColumns, ...availableMetrics];
    const allYOptions = [...availableMetrics];
    
    for (const xKey of allXOptions) {
      for (const yKey of allYOptions) {
        if (xKey === yKey) continue;
        
        const pairKey = [xKey, yKey].sort().join('|||');
        if (seenPairs.has(pairKey)) continue;
        seenPairs.add(pairKey);
        
        const isMetricX = availableMetrics.includes(xKey);
        const isMetricY = availableMetrics.includes(yKey);
        
        const points = selectedData.map(d => {
          let xValRaw;
          if (isMetricX) {
            const bx = d.raw[xKey]?.[baseAlgo];
            const cx = d.raw[xKey]?.[compareAlgo];
            if (bx == null || cx == null) return null;
            const config = getMetricConfig(xKey);
            xValRaw = calculateImprovementWithDirection(bx, cx, config.better === 'higher');
          } else {
            xValRaw = d.meta[xKey];
          }
          
          let yValRaw;
          if (isMetricY) {
            const by = d.raw[yKey]?.[baseAlgo];
            const cy = d.raw[yKey]?.[compareAlgo];
            if (by == null || cy == null) return null;
            const config = getMetricConfig(yKey);
            yValRaw = calculateImprovementWithDirection(by, cy, config.better === 'higher');
          } else {
            yValRaw = d.meta[yKey];
          }
          
          if (xValRaw == null || yValRaw == null) return null;
          const xVal = parseFloat(xValRaw);
          const yVal = parseFloat(yValRaw);
          if (isNaN(xVal) || isNaN(yVal)) return null;
          
          return { xVal, yVal };
        }).filter(p => p !== null);
        
        if (points.length < 5) continue;
        
        const xVals = points.map(p => p.xVal);
        const yVals = points.map(p => p.yVal);
        const pearsonR = calculatePearsonCorrelation(xVals, yVals);
        
        if (pearsonR !== null && Math.abs(pearsonR) >= STRONG_CORRELATION_THRESHOLD) {
          results.push({
            xKey,
            yKey,
            pearsonR,
            isMetricX,
            isMetricY,
            type: isMetricX ? '指标' : '属性',
            typeY: isMetricY ? '指标' : '属性'
          });
        }
      }
    }
    
    return results.sort((a, b) => Math.abs(b.pearsonR) - Math.abs(a.pearsonR));
  }, [parsedData, selectedCases, metaColumns, availableMetrics, baseAlgo, compareAlgo]);
  
  if (correlations.length === 0) {
    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Search className="w-4 h-4" />
            强相关性发现
          </h4>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          未发现强相关性 (|r| ≥ {STRONG_CORRELATION_THRESHOLD})，可能需要更多数据或不同的指标组合。
        </p>
      </div>
    );
  }
  
  return (
    <div className="mt-3 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-lg border border-indigo-100">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-indigo-50/50 transition-colors rounded-lg"
      >
        <h4 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
          <Search className="w-4 h-4" />
          强相关性发现
          <span className="text-xs font-normal text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
            {correlations.length} 对
          </span>
          <HelpIcon
            content={
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-indigo-400 text-sm mb-2">强相关性发现</h3>
                  <p className="text-gray-300 text-xs mb-2">
                    系统自动扫描所有属性与指标的组合，找出具有统计意义的相关关系。
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-emerald-300 text-xs">筛选标准</h4>
                  <ul className="text-gray-300 text-xs space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      <span><strong>Pearson |r| ≥ 0.7</strong>：强线性相关</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      <span><strong>正相关</strong>：一个变量增大，另一个也增大</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400">•</span>
                      <span><strong>负相关</strong>：一个变量增大，另一个减小</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-300 text-xs">相关性强度参考</h4>
                  <ul className="text-gray-300 text-xs space-y-1">
                    <li>• |r| ≥ 0.7：强相关</li>
                    <li>• 0.4 ≤ |r| &lt; 0.7：中等相关</li>
                    <li>• |r| &lt; 0.4：弱相关或无相关</li>
                  </ul>
                </div>
                
                <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
                  💡 点击相关组合可快速跳转查看散点图
                </div>
              </div>
            }
            className="w-3.5 h-3.5"
          />
        </h4>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-indigo-600" />}
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="flex flex-wrap gap-2">
            {correlations.map((c, i) => (
              <button
                key={`${c.xKey}-${c.yKey}`}
                onClick={() => onSelectCorrelation(c.xKey, c.yKey)}
                className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left"
              >
                <span className="text-xs px-1 py-0.5 rounded ${c.isMetricX ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
                  {c.type}
                </span>
                <span className="text-sm font-medium text-gray-700">{c.xKey}</span>
                <span className="text-xs text-gray-400">↔</span>
                <span className="text-sm font-medium text-gray-700">{c.yKey}</span>
                {c.pearsonR > 0 ? (
                  <span className="text-green-600 text-base">↗</span>
                ) : (
                  <span className="text-red-600 text-base">↘</span>
                )}
                <span className={`text-sm font-bold ${c.pearsonR > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {c.pearsonR.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

CorrelationDiscovery.propTypes = {
  parsedData: PropTypes.array.isRequired,
  selectedCases: PropTypes.instanceOf(Set).isRequired,
  metaColumns: PropTypes.array.isRequired,
  availableMetrics: PropTypes.array.isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string.isRequired,
  onSelectCorrelation: PropTypes.func.isRequired
};

const CorrelationChart = ({ 
  parsedData, selectedCases, metaColumns, availableMetrics, 
  corrX, corrY, setCorrX, setCorrY, handleChartMouseMove, 
  hoveredCase, setHoveredCase, setTooltipState, baseAlgo, compareAlgo,
  onCaseClick
}) => {
  const { llmConfig, setShowAiConfig } = useAppContext();
  const toast = useToast();
  const chartWidth = useChartWidth();
  const [aiInsight, setAiInsight] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  if (parsedData.length === 0) return null;
  
  // 计算强相关性发现
  const correlations = useMemo(() => {
    const results = [];
    const selectedData = parsedData.filter(d => selectedCases.has(d.Case));
    const seenPairs = new Set();
    
    if (selectedData.length < 5) return results;
    
    const allXOptions = [...metaColumns, ...availableMetrics];
    const allYOptions = [...availableMetrics];
    
    for (const xKey of allXOptions) {
      for (const yKey of allYOptions) {
        if (xKey === yKey) continue;
        
        const pairKey = [xKey, yKey].sort().join('|||');
        if (seenPairs.has(pairKey)) continue;
        seenPairs.add(pairKey);
        
        const isMetricX = availableMetrics.includes(xKey);
        const isMetricY = availableMetrics.includes(yKey);
        
        const points = selectedData.map(d => {
          let xValRaw;
          if (isMetricX) {
            const bx = d.raw[xKey]?.[baseAlgo];
            const cx = d.raw[xKey]?.[compareAlgo];
            if (bx == null || cx == null) return null;
            const config = getMetricConfig(xKey);
            xValRaw = calculateImprovementWithDirection(bx, cx, config.better === 'higher');
          } else {
            xValRaw = d.meta[xKey];
          }
          
          let yValRaw;
          if (isMetricY) {
            const by = d.raw[yKey]?.[baseAlgo];
            const cy = d.raw[yKey]?.[compareAlgo];
            if (by == null || cy == null) return null;
            const config = getMetricConfig(yKey);
            yValRaw = calculateImprovementWithDirection(by, cy, config.better === 'higher');
          } else {
            yValRaw = d.meta[yKey];
          }
          
          if (xValRaw == null || yValRaw == null) return null;
          const xVal = parseFloat(xValRaw);
          const yVal = parseFloat(yValRaw);
          if (isNaN(xVal) || isNaN(yVal)) return null;
          
          return { xVal, yVal };
        }).filter(p => p !== null);
        
        if (points.length < 5) continue;
        
        const xVals = points.map(p => p.xVal);
        const yVals = points.map(p => p.yVal);
        const pearsonR = calculatePearsonCorrelation(xVals, yVals);
        
        if (pearsonR !== null && Math.abs(pearsonR) >= STRONG_CORRELATION_THRESHOLD) {
          results.push({
            xKey,
            yKey,
            pearsonR,
            isMetricX,
            isMetricY,
            type: isMetricX ? '指标' : '属性',
            typeY: isMetricY ? '指标' : '属性'
          });
        }
      }
    }
    
    return results.sort((a, b) => Math.abs(b.pearsonR) - Math.abs(a.pearsonR));
  }, [parsedData, selectedCases, metaColumns, availableMetrics, baseAlgo, compareAlgo]);
  
  // 当强相关性发现存在时，自动设置默认的 XY
  useEffect(() => {
    if (correlations.length > 0) {
      const firstCorrelation = correlations[0];
      setCorrX(firstCorrelation.xKey);
      setCorrY(firstCorrelation.yKey);
    }
  }, [correlations, setCorrX, setCorrY]);

  const isMetricX = availableMetrics.includes(corrX);
  const isMetricY = availableMetrics.includes(corrY);
  const isInstX = !isMetricX && (corrX?.toLowerCase() === 'inst' || 
    corrX?.toLowerCase() === 'instance' || 
    corrX?.toLowerCase() === 'instances' || 
    corrX?.toLowerCase() === '#inst');
  const isInstY = !isMetricY && (corrY?.toLowerCase() === 'inst' || 
    corrY?.toLowerCase() === 'instance' || 
    corrY?.toLowerCase() === 'instances' || 
    corrY?.toLowerCase() === '#inst');
  
  const points = parsedData.filter(d => selectedCases.has(d.Case)).map(d => {
    let xValRaw;
    if (isMetricX) {
      const bxX = d.raw[corrX]?.[baseAlgo];
      const cxX = d.raw[corrX]?.[compareAlgo];
      if (bxX == null || cxX == null) return null;
      const configX = getMetricConfig(corrX);
      xValRaw = calculateImprovementWithDirection(bxX, cxX, configX.better === 'higher');
    } else {
      xValRaw = d.meta[corrX];
    }
    if (xValRaw === undefined || xValRaw === null) return null;
    const xVal = parseFloat(xValRaw);
    if (isNaN(xVal)) return null;

    let yValRaw;
    if (isMetricY) {
      const bxY = d.raw[corrY]?.[baseAlgo];
      const cxY = d.raw[corrY]?.[compareAlgo];
      if (bxY == null || cxY == null) return null;
      const configY = getMetricConfig(corrY);
      yValRaw = calculateImprovementWithDirection(bxY, cxY, configY.better === 'higher');
    } else {
      yValRaw = d.meta[corrY];
    }
    if (yValRaw === undefined || yValRaw === null) return null;
    const yVal = parseFloat(yValRaw);
    if (isNaN(yVal)) return null;
    
    return { case: d.Case, xVal, yVal, raw: d };
  }).filter(p => p !== null);

  if (isInstX) {
    points.sort((a, b) => b.xVal - a.xVal);
  } else if (isInstY) {
    points.sort((a, b) => b.yVal - a.yVal);
  }

  const xVals = points.map(p => p.xVal);
  const yVals = points.map(p => p.yVal);
  
  const stats = useMemo(() => {
    if (xVals.length < 2) return null;
    
    const pearsonR = calculatePearsonCorrelation(xVals, yVals);
    const spearmanR = calculateSpearmanCorrelation(xVals, yVals);
    const regression = calculateLinearRegression(xVals, yVals);
    const outliers = detectOutliers(yVals);
    
    return {
      pearsonR,
      spearmanR,
      slope: regression?.slope,
      intercept: regression?.intercept,
      rSquared: regression?.rSquared,
      outlierCount: outliers.length,
      pearsonInterpretation: pearsonR !== null ? interpretCorrelation(pearsonR) : null
    };
  }, [xVals, yVals]);

  const minX = xVals.length > 0 ? Math.min(...xVals) : 0;
  const maxX = xVals.length > 0 ? Math.max(...xVals) : 1;
  const xRange = maxX - minX || 1;
  
  const minY = yVals.length > 0 ? Math.min(...yVals) : 0;
  const maxY = yVals.length > 0 ? Math.max(...yVals) : 1;
  const yRange = maxY - minY || 1;

  const padding = 0.08;
  const xPad = xRange * padding;
  const yPad = yRange * padding;
  
  const xMin = minX - xPad;
  const xMax = maxX + xPad;
  const yMin = minY - yPad;
  const yMax = maxY + yPad;
  const xRangePadded = xMax - xMin;
  const yRangePadded = yMax - yMin;

  const mapX = (val) => ((val - xMin) / xRangePadded) * 90 + 5;
  const mapY = (val) => ((yMax - val) / yRangePadded) * 90 + 5;

  const calculateNiceTicks = (min, max, tickCount) => {
    const range = max - min;
    if (range === 0) return [min];
    
    const roughStep = range / (tickCount - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const residual = roughStep / magnitude;
    
    let niceStep;
    if (residual <= 1.5) niceStep = magnitude;
    else if (residual <= 3) niceStep = 2 * magnitude;
    else if (residual <= 7) niceStep = 5 * magnitude;
    else niceStep = 10 * magnitude;
    
    const ticks = [];
    const firstTick = Math.ceil(min / niceStep) * niceStep;
    for (let tick = firstTick; tick <= max; tick += niceStep) {
      ticks.push(tick);
    }
    
    return ticks;
  };

  const yTickCount = 5;
  const yTicks = [];
  
  const shouldIncludeZero = isMetricY && minY < 0 && maxY > 0;
  
  if (shouldIncludeZero) {
    const niceStep = yRangePadded / (yTickCount - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(niceStep)));
    const residual = niceStep / magnitude;
    
    let step;
    if (residual <= 1.5) step = magnitude;
    else if (residual <= 3) step = 2 * magnitude;
    else if (residual <= 7) step = 5 * magnitude;
    else step = 10 * magnitude;
    
    const maxTick = Math.min(Math.ceil(yMax / step) * step, yMax);
    const minTick = Math.max(Math.floor(yMin / step) * step, yMin);
    
    for (let tick = maxTick; tick >= minTick; tick -= step) {
      if (tick >= yMin && tick <= yMax) {
        yTicks.push({ val: tick });
      }
    }
    
    if (!yTicks.some(t => Math.abs(t.val) < 0.001)) {
      if (0 >= yMin && 0 <= yMax) {
        yTicks.push({ val: 0 });
        yTicks.sort((a, b) => b.val - a.val);
      }
    }
  } else {
    const niceTicks = calculateNiceTicks(yMin, yMax, yTickCount);
    niceTicks.filter(tick => tick >= yMin && tick <= yMax).reverse().forEach(tick => yTicks.push({ val: tick }));
  }

  const xTickCount = 5;
  const xTicks = [];
  
  if (!isInstX) {
    const niceTicks = calculateNiceTicks(xMin, xMax, xTickCount);
    niceTicks.forEach(tick => xTicks.push({ val: tick }));
  }

  const handleAIAnalysis = useCallback(async () => {
    if (!llmConfig?.apiKey) {
      setShowAiConfig(true);
      return;
    }
    
    if (!stats || !corrX || !corrY) {
      toast.error('数据不足', '请先选择有效的分析维度');
      return;
    }
    
    setIsAnalyzing(true);
    setAiInsight('');
    
    try {
      const distributionInfo = `X轴范围: [${minX.toFixed(2)}, ${maxX.toFixed(2)}], Y轴范围: [${minY.toFixed(2)}, ${maxY.toFixed(2)}]`;
      
      const result = await generateCorrelationInsight(llmConfig, {
        corrX: corrX,
        corrY: corrY,
        pearsonR: stats.pearsonR,
        spearmanR: stats.spearmanR,
        slope: stats.slope,
        rSquared: stats.rSquared,
        outlierCount: stats.outlierCount,
        dataPoints: points.length,
        distributionInfo
      });
      
      setAiInsight(result);
    } catch (error) {
      toast.error('AI 分析失败', error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [llmConfig, stats, corrX, corrY, minX, maxX, minY, maxY, points.length, toast, setShowAiConfig]);

  const renderContent = () => {
    if (!corrX || !corrY || points.length === 0) {
      return <EmptyState message="请选择 X 轴与 Y 轴进行分析" />;
    }

    const formatXTick = (val) => {
      if (isMetricX) {
        return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
      }
      return formatIndustrialNumber(val);
    };

    const formatYTick = (val) => {
      if (isMetricY) {
        return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
      }
      return formatIndustrialNumber(val);
    };

    return (
      <ChartBody className={`${chartWidth} mx-auto w-full`}>
        <div className="flex flex-col justify-between text-right pr-2 py-1 text-[10px] font-semibold text-gray-500 w-12 flex-shrink-0 relative">
          <span className="text-gray-400 text-[9px] -rotate-90 origin-center whitespace-nowrap absolute left-3 top-1/2 -translate-y-1/2">{corrY || 'Y'}</span>
          {yTicks.filter(tick => {
            const topPercent = mapY(tick.val);
            return topPercent >= 0 && topPercent <= 100;
          }).map((tick, i) => (
            <span 
              key={i} 
              className={`
                absolute right-2 text-[9px] font-medium tabular-nums
                ${isMetricY && tick.val > 0 ? 'text-green-600' : ''} 
                ${isMetricY && tick.val < 0 ? 'text-red-500' : ''}
                ${isMetricY && tick.val === 0 ? 'text-gray-600 font-bold' : ''}
              `}
              style={{ top: `${mapY(tick.val)}%`, transform: 'translateY(-50%)' }}
            >
              {formatYTick(tick.val)}
            </span>
          ))}
        </div>
        
        <div className="flex-1 flex flex-col">
          <ChartArea className={`border-l-2 border-b-2 border-gray-300 flex-1 ${isMetricY ? 'bg-gradient-to-b from-green-50/30 via-white to-red-50/30' : 'bg-gradient-to-b from-indigo-50/30 via-white to-purple-50/30'}`}>
            {isMetricY && (
              <>
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-green-100/20 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-red-100/20 to-transparent pointer-events-none"></div>
              </>
            )}
            
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              {yTicks.map((tick, i) => (
                <line 
                  key={`ytick-${i}`}
                  x1="0" 
                  y1={mapY(tick.val)} 
                  x2="100" 
                  y2={mapY(tick.val)} 
                  stroke={tick.val === 0 ? "#9ca3af" : "#e5e7eb"} 
                  strokeWidth={tick.val === 0 ? "0.5" : "0.3"} 
                  strokeDasharray={tick.val === 0 ? "2 2" : "1 2"}
                />
              ))}
              
              {stats && stats.slope != null && !isInstX && !isInstY && (
                <line 
                  x1={mapX(xMin)} 
                  y1={mapY(stats.slope * xMin + stats.intercept)} 
                  x2={mapX(xMax)} 
                  y2={mapY(stats.slope * xMax + stats.intercept)} 
                  stroke="#4f46e5" 
                  strokeWidth="0.8" 
                  strokeDasharray="2 1"
                  opacity="0.9"
                />
              )}
              
              {points.map((p, i) => {
                const isHovered = hoveredCase === p.case;
                const cx = isInstX ? (5 + (i / (points.length - 1 || 1)) * 90) : mapX(p.xVal);
                const cy = isInstY ? (5 + (i / (points.length - 1 || 1)) * 90) : mapY(p.yVal);
                
                let color = '#6366f1';
                if (isMetricY) {
                  if (p.yVal > 0) color = '#059669';
                  if (p.yVal < 0) color = '#dc2626';
                }

                const formatTooltipValue = (val, isMetric) => {
                  if (isMetric) {
                    if (val > 0) {
                      return { text: `+${val.toFixed(2)}%`, color: 'text-green-400' };
                    } else if (val < 0) {
                      return { text: `${val.toFixed(2)}%`, color: 'text-red-400' };
                    } else {
                      return '0.00%';
                    }
                  }
                  return formatIndustrialNumber(val);
                };

                return (
                  <g key={`corr-${p.case}`}>
                    <circle
                      cx={cx} cy={cy} r="6"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={(e) => {
                        setHoveredCase(p.case);
                        const xValue = formatTooltipValue(p.xVal, isMetricX);
                        const yValue = formatTooltipValue(p.yVal, isMetricY);
                        const lines = [
                          typeof xValue === 'string' ? `${corrX}: ${xValue}` : { text: `${corrX}: ${xValue.text}`, color: xValue.color },
                          typeof yValue === 'string' ? `${corrY}: ${yValue}` : { text: `${corrY}: ${yValue.text}`, color: yValue.color }
                        ];
                        setTooltipState({ visible: true, x: e.clientX, y: e.clientY, title: p.case, lines });
                      }}
                      onMouseMove={(e) => {
                        setTooltipState(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
                      }}
                      onMouseLeave={() => { setHoveredCase(null); setTooltipState(prev => ({...prev, visible: false})); }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setHoveredCase(null);
                        setTooltipState(prev => ({...prev, visible: false}));
                        if (onCaseClick) onCaseClick(p.case);
                      }}
                    />
                    <circle
                      cx={cx} cy={cy} 
                      r={isHovered ? "2" : "1"} 
                      fill={color} 
                      stroke={isHovered ? "#fff" : "none"} 
                      strokeWidth="0.3"
                      className={`transition-all duration-200 pointer-events-none ${isHovered ? 'animate-pulse' : ''}`}
                    />
                  </g>
                );
              })}
            </svg>
            
            {isMetricY ? (
              <>
                <AreaLabel position="top-left" variant="success">优化 ↑</AreaLabel>
                <AreaLabel position="bottom-left" variant="danger">退化 ↓</AreaLabel>
              </>
            ) : (
              <>
                <AreaLabel position="top-left" variant="info">大 ↑</AreaLabel>
                <AreaLabel position="bottom-left" variant="info">小 ↓</AreaLabel>
              </>
            )}
          </ChartArea>
          
          <div className="text-center py-1 text-xs font-semibold text-gray-500 relative h-6">
            {!isInstX && xTicks.length > 0 ? (
              <>
                <div className="absolute inset-0 flex justify-between px-0">
                  {xTicks.map((tick, i) => (
                    <span 
                      key={i}
                      className={`
                        text-xs 
                        ${isMetricX && tick.val > 0 ? 'text-green-600' : ''} 
                        ${isMetricX && tick.val < 0 ? 'text-red-500' : ''}
                      `}
                      style={{ 
                        position: 'absolute', 
                        left: `${mapX(tick.val)}%`, 
                        transform: 'translateX(-50%)' 
                      }}
                    >
                      {formatXTick(tick.val)}
                    </span>
                  ))}
                </div>
                <span className="text-gray-400 text-xs mt-3 block">{corrX || 'X'}</span>
              </>
            ) : (
              <span className="text-gray-400">{corrX || 'X'}</span>
            )}
          </div>
        </div>
      </ChartBody>
    );
  };

  const renderStats = () => {
    if (!stats || !corrX || !corrY || points.length === 0) return null;
    
    const TrendIcon = stats.pearsonR > 0.1 ? TrendingUp : stats.pearsonR < -0.1 ? TrendingDown : Minus;
    const trendColor = stats.pearsonR > 0.1 ? 'text-green-600' : stats.pearsonR < -0.1 ? 'text-red-500' : 'text-gray-500';
    
    return (
      <div className="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-gray-200 text-xs">
        <div className="flex items-center gap-1.5 bg-white/70 px-2 py-1 rounded-lg border border-indigo-100">
          <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
          <span className="text-gray-500 font-medium">Pearson:</span>
          <span className={`font-bold ${trendColor} text-sm`}>
            {stats.pearsonR !== null ? stats.pearsonR.toFixed(3) : 'N/A'}
            {stats.pearsonInterpretation && (
              <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">
                ({stats.pearsonInterpretation.strength}{stats.pearsonInterpretation.direction})
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Spearman:</span>
          <span className="font-semibold text-gray-700">
            {stats.spearmanR !== null ? stats.spearmanR.toFixed(3) : 'N/A'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">R²:</span>
          <span className="font-semibold text-gray-700">
            {stats.rSquared !== null ? stats.rSquared.toFixed(3) : 'N/A'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">样本数:</span>
          <span className="font-semibold text-gray-700">{points.length}</span>
        </div>
        <div className="flex items-center gap-1.5 group relative">
          <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
          <div className="absolute left-0 top-full mt-1 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-80 pointer-events-none">
            <div className="space-y-2.5">
              <p className="font-bold text-indigo-300 text-xs">统计指标说明</p>
              
              <div className="space-y-2">
                <div className="border-l-2 border-indigo-400 pl-2">
                  <p className="text-white font-semibold">Pearson 相关系数</p>
                  <p className="text-gray-300 mt-0.5">衡量两个变量之间的<strong className="text-emerald-300">线性相关程度</strong>，取值范围 [-1, 1]。</p>
                  <ul className="text-gray-400 mt-1 space-y-0.5">
                    <li>• |r| ≥ 0.7：强相关</li>
                    <li>• 0.4 ≤ |r| &lt; 0.7：中等相关</li>
                    <li>• |r| &lt; 0.4：弱相关或无相关</li>
                  </ul>
                </div>
                
                <div className="border-l-2 border-purple-400 pl-2">
                  <p className="text-white font-semibold">Spearman 相关系数</p>
                  <p className="text-gray-300 mt-0.5">衡量变量间的<strong className="text-purple-300">单调关系</strong>，不要求线性，对异常值更稳健。</p>
                </div>
                
                <div className="border-l-2 border-amber-400 pl-2">
                  <p className="text-white font-semibold">R² 决定系数</p>
                  <p className="text-gray-300 mt-0.5">回归模型的<strong className="text-amber-300">拟合优度</strong>，取值范围 [0, 1]。越接近 1 表示线性模型解释力越强。</p>
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded p-1.5 text-gray-400 border-t border-gray-600 pt-2">
                💡 指标由前端实时计算，基于当前选中的数据点
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAIInsight = () => {
    if (!aiInsight) return null;
    
    return (
      <div className="mt-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
        <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI 相关性解读
        </h4>
        <div className="text-sm text-gray-700 prose prose-sm prose-indigo max-w-none">
          {renderMarkdownText(aiInsight)}
        </div>
      </div>
    );
  };

  return (
    <ChartContainer onMouseMove={handleChartMouseMove}>
      <ChartHeader
        title="特征相关性散点分析"
        helpContent={
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-indigo-400 text-sm mb-2">特征相关性散点分析</h3>
              <p className="text-gray-300 text-xs mb-2">
                通过散点图探索不同变量之间的关系，发现潜在的规律和异常。
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-emerald-300 text-xs">分析维度</h4>
              <ul className="text-gray-300 text-xs space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>属性 vs 指标</strong>：探索设计规模与性能的关系，如实例数对时序的影响</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>指标 vs 指标</strong>：探索不同性能指标间的关联，如功耗与线长的关系</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-300 text-xs">统计指标</h4>
              <ul className="text-gray-300 text-xs space-y-1">
                <li>• <strong>Pearson</strong>：线性相关系数 (-1 到 1)</li>
                <li>• <strong>Spearman</strong>：秩相关系数 (单调关系)</li>
                <li>• <strong>R²</strong>：决定系数 (拟合优度)</li>
              </ul>
            </div>
            
            <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
              💡 <strong>提示</strong>：点击「AI 解读」获取智能分析
            </div>
          </div>
        }
        helpPosition="right-center"
      >
        <div className="flex items-center gap-2 text-xs">
          <span className={CHART_HEADER_STYLES.LABEL}>X:</span>
          <select value={corrX} onChange={(e) => { setCorrX(e.target.value); setAiInsight(''); }} className={CHART_HEADER_STYLES.SELECT}>
            <optgroup label="属性">
              {metaColumns.map(m => <option key={`mx-${m}`} value={m}>{m}</option>)}
            </optgroup>
            <optgroup label="指标">
              {availableMetrics.map(m => <option key={`tx-${m}`} value={m}>{m}</option>)}
            </optgroup>
          </select>
          <span className={`${CHART_HEADER_STYLES.LABEL} ml-1`}>Y:</span>
          <select value={corrY} onChange={(e) => { setCorrY(e.target.value); setAiInsight(''); }} className={CHART_HEADER_STYLES.SELECT}>
            <optgroup label="属性">
              {metaColumns.map(m => <option key={`my-${m}`} value={m}>{m}</option>)}
            </optgroup>
            <optgroup label="指标">
              {availableMetrics.map(m => <option key={`ty-${m}`} value={m}>{m}</option>)}
            </optgroup>
          </select>
          <button
            onClick={handleAIAnalysis}
            disabled={isAnalyzing || !stats}
            className={`
              ml-2 px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5
              ${isAnalyzing || !stats
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-sm'
              }
            `}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                分析中
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                AI 解读
              </>
            )}
          </button>
        </div>
      </ChartHeader>

      {renderStats()}
      
      <CorrelationDiscovery 
        parsedData={parsedData}
        selectedCases={selectedCases}
        metaColumns={metaColumns}
        availableMetrics={availableMetrics}
        baseAlgo={baseAlgo}
        compareAlgo={compareAlgo}
        onSelectCorrelation={(x, y) => {
          setCorrX(x);
          setCorrY(y);
          setAiInsight('');
        }}
      />
      
      {renderContent()}

      <ChartLegend items={[
        { color: '#059669', label: '优化', shape: 'circle' },
        { color: '#dc2626', label: '退化', shape: 'circle' },
        { color: '#4f46e5', label: '拟合线', shape: 'dashed-line' }
      ]} />
      
      {renderAIInsight()}
    </ChartContainer>
  );
};

CorrelationChart.propTypes = {
  parsedData: PropTypes.array.isRequired,
  selectedCases: PropTypes.instanceOf(Set).isRequired,
  metaColumns: PropTypes.array.isRequired,
  availableMetrics: PropTypes.array.isRequired,
  corrX: PropTypes.string,
  corrY: PropTypes.string,
  setCorrX: PropTypes.func.isRequired,
  setCorrY: PropTypes.func.isRequired,
  handleChartMouseMove: PropTypes.func.isRequired,
  hoveredCase: PropTypes.string,
  setHoveredCase: PropTypes.func.isRequired,
  setTooltipState: PropTypes.func.isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string.isRequired,
  onCaseClick: PropTypes.func
};

export default CorrelationChart;
