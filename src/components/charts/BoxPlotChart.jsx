import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartBody, ChartArea, ChartLegend, AreaLabel } from '../common/ChartContainer';
import { ImprovementFormulaHelp } from '../common/HelpContents';
import { calculateImprovementWithDirection } from '../../utils/statistics';
import { getMetricConfig } from '../../services/csvParser';
import { CHART_Y_PADDING, CHART_WIDTH } from '../../utils/constants';

const BoxPlotChart = ({ stats, activeMetric, handleChartMouseMove, hoveredCase, setHoveredCase, setTooltipState, onCaseClick, parsedData, metaColumns }) => {
  const instColumn = useMemo(() => {
    if (!metaColumns || metaColumns.length === 0) return null;
    return metaColumns.find(c => 
      c.toLowerCase() === 'inst' || 
      c.toLowerCase() === 'instance' || 
      c.toLowerCase() === 'instances' ||
      c.toLowerCase() === '#inst'
    ) || metaColumns[0];
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

  const yMax = Math.max(Math.abs(stats.maxImp), Math.abs(stats.minImp)) + CHART_Y_PADDING;
  const mapY = (val) => 50 - (val / yMax) * 50;

  const yTicks = [
    { val: yMax },
    { val: stats.q3 },
    { val: stats.median },
    { val: stats.q1 },
    { val: 0 },
    { val: -yMax }
  ];

  const formatYTick = (val) => {
    if (val === stats.median) return `中位 ${stats.median > 0 ? '+' : ''}${stats.median.toFixed(1)}%`;
    if (val === stats.q3) return `Q3 +${stats.q3.toFixed(1)}%`;
    if (val === stats.q1) return `Q1 ${stats.q1 > 0 ? '+' : ''}${stats.q1.toFixed(1)}%`;
    if (val === yMax) return `+${val.toFixed(0)}%`;
    if (val === -yMax) return `-${yMax.toFixed(0)}%`;
    if (val === 0) return '0%';
    return `${val > 0 ? '+' : ''}${val.toFixed(0)}%`;
  };

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
      
      <ChartBody className={`${CHART_WIDTH.COMPACT} mx-auto w-full`}>
        <div className="flex flex-col justify-between text-right pr-2 py-1 text-[10px] font-semibold text-gray-500 w-12 flex-shrink-0 relative">
          <span className="text-gray-400 text-[9px] -rotate-90 origin-center whitespace-nowrap absolute left-3 top-1/2 -translate-y-1/2">改进率</span>
          {yTicks.map((tick, i) => {
            const isMedian = tick.val === stats.median;
            const isQ3 = tick.val === stats.q3;
            const isQ1 = tick.val === stats.q1;
            
            return (
              <span 
                key={i} 
                className={`
                  ${isMedian ? 'text-indigo-600 font-bold' : ''}
                  ${isQ3 ? 'text-emerald-600' : ''}
                  ${isQ1 ? 'text-amber-600' : ''}
                  ${tick.val === 0 ? 'text-gray-400' : ''}
                  ${tick.val === yMax ? 'text-green-600' : ''}
                  ${tick.val === -yMax ? 'text-red-500' : ''}
                `}
              >
                {isMedian ? (
                  <>
                    中位 <span className="text-[9px]">{stats.median > 0 ? '+' : ''}{stats.median.toFixed(1)}%</span>
                  </>
                ) : isQ3 ? (
                  <>
                    Q3 <span className="text-[9px]">+{stats.q3.toFixed(1)}%</span>
                  </>
                ) : isQ1 ? (
                  <>
                    Q1 <span className="text-[9px]">{stats.q1 > 0 ? '+' : ''}{stats.q1.toFixed(1)}%</span>
                  </>
                ) : (
                  formatYTick(tick.val)
                )}
              </span>
            );
          })}
        </div>
        
        <ChartArea className="border-l-2 border-b-2 border-gray-300 bg-gradient-to-b from-green-50/30 via-white to-red-50/30">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-green-100/20 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-red-100/20 to-transparent pointer-events-none"></div>
          
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1={mapY(0)} x2="100" y2={mapY(0)} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2 2" />
            
            <rect x="0" y={mapY(stats.q3)} width="100" height={Math.max(0, mapY(stats.q1) - mapY(stats.q3))} fill="#c7d2fe" opacity="0.5" />
            
            <line x1="0" y1={mapY(stats.median)} x2="100" y2={mapY(stats.median)} stroke="#818cf8" strokeWidth="0.5" strokeDasharray="3 2" />
            
            <line x1="0" y1={mapY(stats.q1)} x2="100" y2={mapY(stats.q1)} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="1 2" />
            <line x1="0" y1={mapY(stats.q3)} x2="100" y2={mapY(stats.q3)} stroke="#22c55e" strokeWidth="0.5" strokeDasharray="1 2" />
            
            {sortedCases.map((d, i) => {
              const imp = d.imp;
              const cx = 5 + (i / (sortedCases.length - 1 || 1)) * 90;
              const cy = mapY(imp);
              const isOutlier = imp > stats.outlierUpper || imp < stats.outlierLower;
              const isHovered = hoveredCase === d.Case;
              const instValue = getInstValue(d.Case);
              
              let dotColor = "#6366f1";
              if (imp > stats.outlierUpper) dotColor = "#9333ea";
              if (imp < stats.outlierLower) dotColor = "#dc2626";
              
              return (
                <g key={d.Case}>
                  <circle 
                    cx={cx} cy={cy} r="6"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      setHoveredCase(d.Case);
                      const rect = e.currentTarget.closest('.chart-area')?.getBoundingClientRect() || e.currentTarget.getBoundingClientRect();
                      setTooltipState({ 
                        visible: true, 
                        x: e.clientX - rect.left, 
                        y: e.clientY - rect.top, 
                        title: d.Case, 
                        lines: [
                          `#Inst: ${instValue.toLocaleString()}`,
                          `状态: ${isOutlier ? (imp > 0 ? '显著优化' : '严重退化') : (imp > 0 ? '优化' : '退化')}`, 
                          `改进: ${imp > 0 ? '+' : ''}${imp.toFixed(2)}%`
                        ] 
                      });
                    }}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.closest('.chart-area')?.getBoundingClientRect() || e.currentTarget.getBoundingClientRect();
                      setTooltipState(prev => ({
                        ...prev,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
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
                    }}
                  />
                  <circle 
                    cx={cx} cy={cy} 
                    r={isHovered ? "2.5" : (isOutlier ? "1.5" : "1")}
                    fill={dotColor} 
                    stroke={isHovered ? "#fff" : "none"} 
                    strokeWidth={isHovered ? "0.3" : "0"}
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
      
      <div className="flex justify-between items-center px-14 py-1 text-[10px] text-gray-500 font-medium">
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

      <ChartLegend items={[
        { color: '#4f46e5', label: '中位数' },
        { color: '#c7d2fe', label: 'IQR区域' },
        { color: '#9ca3af', label: '0线' },
        { color: '#9333ea', label: '显著优化' },
        { color: '#dc2626', label: '严重退化', shape: 'circle' }
      ]} />
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
