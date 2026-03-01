import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartBody, ChartArea, ChartLegend, AreaLabel } from '../common/ChartContainer';
import { ImprovementFormulaHelp } from '../common/HelpContents';
import { calculateImprovementWithDirection } from '../../utils/statistics';
import { getMetricConfig } from '../../config/metrics.js';
import { useChartWidth } from '../../hooks/useChartWidth';
import { findInstColumn } from '../../config/business.js';
import { CHART_LAYOUT, CHART_COLORS, CHART_POINT_SIZES } from '../../config/ui.js';

const BoxPlotChart = ({ stats, activeMetric, handleChartMouseMove, hoveredCase, setHoveredCase, setTooltipState, onCaseClick, parsedData, metaColumns }) => {
  const chartWidth = useChartWidth();
  
  const instColumn = useMemo(() => {
    return findInstColumn(metaColumns);
  }, [metaColumns]);

  const sortedCases = useMemo(() => {
    if (!stats || !parsedData || !instColumn) return stats?.validCases || [];
    
    const caseInstMap = new Map();
    parsedData.forEach(d => {
      const instValue = d[instColumn] || d.meta?.[instColumn] || 0;
      caseInstMap.set(d.Case, parseFloat(instValue) || 0);
    });
    
    return [...stats.validCases].sort((a, b) => {
      const instA = caseInstMap.get(a.Case) || 0;
      const instB = caseInstMap.get(b.Case) || 0;
      return instB - instA;
    });
  }, [stats, parsedData, instColumn]);

  const instValues = useMemo(() => {
    if (!parsedData || !instColumn) return [];
    return parsedData.map(d => parseFloat(d[instColumn] || d.meta?.[instColumn]) || 0).filter(v => v > 0);
  }, [parsedData, instColumn]);

  const maxInst = useMemo(() => instValues.length > 0 ? Math.max(...instValues) : 0, [instValues]);
  const minInst = useMemo(() => instValues.length > 0 ? Math.min(...instValues) : 0, [instValues]);

  if (!stats) return null;

  const dataRange = stats.maxImp - stats.minImp;
  const paddingPercent = CHART_LAYOUT.PADDING_PERCENT;
  const dynamicPadding = Math.max(dataRange * paddingPercent, CHART_LAYOUT.MIN_PADDING);
  
  const yMin = stats.minImp - dynamicPadding;
  const yMax = stats.maxImp + dynamicPadding;
  const yRange = yMax - yMin || CHART_LAYOUT.Y_RANGE_MIN;
  const mapY = (val) => ((yMax - val) / yRange) * CHART_LAYOUT.Y_SCALE + CHART_LAYOUT.Y_RANGE_OFFSET;

  const formatYTick = (val) => {
    if (Math.abs(val) < 0.001) return '0%';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  const specialTicks = useMemo(() => {
    const ticks = [];
    const addTick = (val, label, colorClass, priority) => {
      if (val >= yMin - 0.001 && val <= yMax + 0.001) {
        ticks.push({ val, label, colorClass, priority });
      }
    };
    
    addTick(stats.maxImp, <>最大<br/>{stats.maxImp > 0 ? '+' : ''}{stats.maxImp.toFixed(2)}%</>, 'text-green-600', 1);
    addTick(stats.q3, <>Q3<br/>{stats.q3 > 0 ? '+' : ''}{stats.q3.toFixed(2)}%</>, 'text-emerald-600', 2);
    addTick(stats.median, <>中位<br/>{stats.median > 0 ? '+' : ''}{stats.median.toFixed(2)}%</>, 'text-indigo-600 font-bold', 3);
    addTick(stats.q1, <>Q1<br/>{stats.q1 > 0 ? '+' : ''}{stats.q1.toFixed(2)}%</>, 'text-amber-600', 4);
    addTick(stats.minImp, <>最小<br/>{stats.minImp > 0 ? '+' : ''}{stats.minImp.toFixed(2)}%</>, 'text-red-500', 5);
    addTick(0, '0%', 'text-gray-400', 6);
    
    const uniqueTicks = [];
    const seenVals = new Set();
    for (const tick of ticks) {
      const key = tick.val.toFixed(2);
      if (!seenVals.has(key)) {
        seenVals.add(key);
        uniqueTicks.push(tick);
      }
    }
    
    uniqueTicks.sort((a, b) => b.val - a.val);
    return uniqueTicks;
  }, [yMin, yMax, stats]);

  const getInstValue = (caseName) => {
    if (!parsedData || !instColumn) return 0;
    const d = parsedData.find(p => p.Case === caseName);
    return d ? (parseFloat(d[instColumn] || d.meta?.[instColumn]) || 0) : 0;
  };

  return (
    <ChartContainer onMouseMove={handleChartMouseMove}>
      <ChartHeader
        title="改进率分布箱线图"
        metric={activeMetric}
        helpContent={
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-indigo-400 text-sm mb-2">改进率分布箱线图</h3>
              <p className="text-gray-300 text-xs mb-2">
                箱线图是一种直观展示数据分布的图表，帮助您快速了解算法改进效果的整体情况。
              </p>
            </div>
            
            <ImprovementFormulaHelp />
            
            <div className="space-y-2">
              <h4 className="font-semibold text-emerald-300 text-xs">图表解读</h4>
              <ul className="text-gray-300 text-xs space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>X 轴</strong>：按设计规模（#Inst 实例数）从大到小排列各测试用例</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>Y 轴</strong>：改进率百分比，正值表示优化，负值表示退化</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>蓝色阴影区</strong>：中间 50% 数据的分布范围（IQR 四分位距）</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
              💡 <strong>提示</strong>：单击任意数据点可查看该用例的详细分析
            </div>
          </div>
        }
        helpPosition="right-center"
      />
      
      <ChartBody className={`${chartWidth} mx-auto w-full`}>
        <div className="flex flex-col justify-between text-right pr-2 py-1 text-xs font-semibold text-gray-500 w-14 flex-shrink-0 relative">
          <span className="text-gray-400 text-xs -rotate-90 origin-center whitespace-nowrap absolute left-3 top-1/2 -translate-y-1/2">改进率</span>
          {specialTicks.map((tick, i) => (
            <span 
              key={i} 
              className={tick.colorClass}
              style={{ position: 'absolute', top: `${mapY(tick.val)}%`, transform: 'translateY(-50%)' }}
            >
              {tick.label}
            </span>
          ))}          
        </div>
        
        <ChartArea className="border-l-2 border-b-2 border-gray-300 bg-gradient-to-b from-green-50/30 via-white to-red-50/30 pt-2">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-green-100/20 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-red-100/20 to-transparent pointer-events-none"></div>
          
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1={mapY(0)} x2="100" y2={mapY(0)} stroke={CHART_COLORS.ZERO_LINE} strokeWidth="0.5" strokeDasharray="2 2" />
            
            <rect x="0" y={mapY(stats.q3)} width="100" height={Math.max(0, mapY(stats.q1) - mapY(stats.q3))} fill={CHART_COLORS.BOX_FILL} opacity="0.5" />
            
            <line x1="0" y1={mapY(stats.median)} x2="100" y2={mapY(stats.median)} stroke={CHART_COLORS.MEDIAN_LINE} strokeWidth="0.5" strokeDasharray="3 2" />
            
            <line x1="0" y1={mapY(stats.q1)} x2="100" y2={mapY(stats.q1)} stroke={CHART_COLORS.Q1_LINE} strokeWidth="0.5" strokeDasharray="1 2" />
            <line x1="0" y1={mapY(stats.q3)} x2="100" y2={mapY(stats.q3)} stroke={CHART_COLORS.Q3_LINE} strokeWidth="0.5" strokeDasharray="1 2" />
            
            {sortedCases.map((d, i) => {
              const imp = d.imp;
              const cx = CHART_LAYOUT.X_START_OFFSET + (i / (sortedCases.length - 1 || 1)) * CHART_LAYOUT.X_SCALE;
              const cy = mapY(imp);
              const isOutlier = imp > stats.outlierUpper || imp < stats.outlierLower;
              const isHighOutlier = imp > stats.outlierUpper;
              const isLowOutlier = imp < stats.outlierLower;
              const isHovered = hoveredCase === d.Case;
              const instValue = getInstValue(d.Case);
              
              let dotColor = CHART_COLORS.NORMAL_POINT;
              if (isHighOutlier) dotColor = imp >= 0 ? CHART_COLORS.POSITIVE_OUTLIER : '#f97316';
              if (isLowOutlier) dotColor = imp >= 0 ? '#3b82f6' : CHART_COLORS.NEGATIVE_OUTLIER;
              
              const getStatusLabel = () => {
                if (!isOutlier) return imp >= 0 ? '优化' : '退化';
                if (isHighOutlier) return imp >= 0 ? '异常高优化' : '异常高退化';
                return imp >= 0 ? '异常低优化' : '异常低退化';
              };
              
              return (
                <g key={d.Case} className="cursor-pointer" onMouseEnter={(e) => {
                  setHoveredCase(d.Case);
                  const imp = d.imp;
                  setTooltipState({ 
                    visible: true, 
                    x: e.clientX, 
                    y: e.clientY, 
                    title: d.Case, 
                    lines: [
                      `#Inst: ${instValue.toLocaleString()}`,
                      `状态: ${getStatusLabel()}`, 
                      imp >= 0 ? { text: `改进: +${imp.toFixed(2)}%`, color: 'text-green-400' } : 
                      { text: `改进: ${imp.toFixed(2)}%`, color: 'text-red-400' }
                    ] 
                  });
                }}
                onMouseMove={(e) => {
                  setTooltipState(prev => ({
                    ...prev,
                    x: e.clientX,
                    y: e.clientY
                  }));
                }}
                onMouseLeave={() => { setHoveredCase(null); setTooltipState(prev => ({...prev, visible: false})); }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setHoveredCase(null);
                  setTooltipState(prev => ({...prev, visible: false}));
                  if (onCaseClick) {
                    onCaseClick(d.Case);
                  }
                }}>
                  <circle 
                    cx={cx} cy={cy} r={CHART_POINT_SIZES.HOVER_AREA_RADIUS}
                    fill="transparent"
                  />
                  <circle 
                    cx={cx} cy={cy} 
                    r={isOutlier ? CHART_POINT_SIZES.OUTLIER_RADIUS : CHART_POINT_SIZES.NORMAL_RADIUS}
                    fill={dotColor} 
                    stroke={isHovered ? "#fff" : "none"} 
                    strokeWidth={isHovered ? CHART_POINT_SIZES.HOVER_STROKE_WIDTH : "0"}
                    className={`transition-all duration-200 pointer-events-none ${isHovered ? 'animate-pulse' : ''}`}
                  />
                </g>
              );
            })}
          </svg>
          
          <AreaLabel position="top-left" variant="success">优化 ↑</AreaLabel>
          <AreaLabel position="bottom-left" variant="danger">退化 ↓</AreaLabel>
        </ChartArea>
      </ChartBody>
      
      <div className={`${chartWidth} mx-auto w-full flex justify-between items-center py-1 text-xs text-gray-500 font-medium`}>
        <div className="w-12 flex-shrink-0"></div>
        <div className="flex-1 flex justify-between items-center">
          <span className="flex items-center gap-1">
            <span className="text-gray-400">#Inst:</span>
            <span className="text-indigo-600 font-bold">{maxInst.toLocaleString()}</span>
            <span className="text-gray-400">(大)</span>
          </span>
          <span className="text-gray-400">按 #Inst 数量排序 →</span>
          <span className="flex items-center gap-1">
            <span className="text-gray-400">#Inst:</span>
            <span className="text-indigo-600 font-bold">{minInst.toLocaleString()}</span>
            <span className="text-gray-400">(小)</span>
          </span>
        </div>
      </div>
    </ChartContainer>
  );
};

BoxPlotChart.propTypes = {
  stats: PropTypes.object,
  activeMetric: PropTypes.string.isRequired,
  handleChartMouseMove: PropTypes.func.isRequired,
  hoveredCase: PropTypes.string,
  setHoveredCase: PropTypes.func.isRequired,
  setTooltipState: PropTypes.func.isRequired,
  onCaseClick: PropTypes.func,
  parsedData: PropTypes.array,
  metaColumns: PropTypes.array
};

export default BoxPlotChart;
