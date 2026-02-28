import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartBody, ChartArea, ChartLegend, AreaLabel } from '../common/ChartContainer';
import { calculateImprovement } from '../../utils/statistics';
import { CHART_Y_PADDING } from '../../utils/constants';

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
          <div className="space-y-1">
            <p className="font-bold text-indigo-400">改进率分布箱线图</p>
            <div className="text-xs space-y-0.5">
              <p>箱线图直观展示了单个指标在所有 Case 中的宏观分布情况。</p>
              <p><b>X轴：</b>按 INST 数量从大到小排序</p>
              <p><b>蓝色阴影区 (IQR)：</b>覆盖 50% 的核心密集区</p>
              <p><b>紫色点：</b>显著优化离群点</p>
              <p><b>红色点：</b>严重退化离群点</p>
            </div>
          </div>
        }
        helpWidth="w-72"
        helpPosition="right-center"
      />
      
      <ChartBody className="max-w-5xl mx-auto w-full">
        <div className="relative w-12 flex-shrink-0">
          {yTicks.map((tick, i) => {
            const yPercent = mapY(tick.val);
            const isMedian = tick.val === stats.median;
            const isQ3 = tick.val === stats.q3;
            const isQ1 = tick.val === stats.q1;
            
            return (
              <div
                key={i} 
                className={`absolute right-2 text-[10px] font-semibold transform -translate-y-1/2 text-right
                  ${isMedian ? 'text-indigo-600 font-bold' : ''}
                  ${isQ3 ? 'text-emerald-600' : ''}
                  ${isQ1 ? 'text-amber-600' : ''}
                  ${tick.val === 0 ? 'text-gray-400' : ''}
                  ${tick.val === yMax ? 'text-green-600' : ''}
                  ${tick.val === -yMax ? 'text-red-500' : ''}
                `}
                style={{ top: `${yPercent}%` }}
              >
                {isMedian ? (
                  <div className="flex flex-col items-end leading-tight">
                    <span>中位</span>
                    <span className="text-[9px]">{stats.median > 0 ? '+' : ''}{stats.median.toFixed(1)}%</span>
                  </div>
                ) : isQ3 ? (
                  <div className="flex flex-col items-end leading-tight">
                    <span>Q3</span>
                    <span className="text-[9px]">+{stats.q3.toFixed(1)}%</span>
                  </div>
                ) : isQ1 ? (
                  <div className="flex flex-col items-end leading-tight">
                    <span>Q1</span>
                    <span className="text-[9px]">{stats.q1 > 0 ? '+' : ''}{stats.q1.toFixed(1)}%</span>
                  </div>
                ) : (
                  <span>{formatYTick(tick.val)}</span>
                )}
              </div>
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
                <circle key={d.Case} cx={cx} cy={cy} r={isHovered ? "2.5" : (isOutlier ? "1.5" : "1")}
                  fill={dotColor} stroke={isHovered ? "#fff" : "none"} strokeWidth={isHovered ? "0.3" : "0"}
                  className={`transition-all duration-200 cursor-pointer ${isHovered ? 'animate-pulse' : ''}`}
                  onMouseEnter={() => {
                    setHoveredCase(d.Case);
                    setTooltipState({ 
                      visible: true, 
                      x: 0, 
                      y: 0, 
                      title: d.Case, 
                      lines: [
                        `INST: ${instValue.toLocaleString()}`,
                        `状态: ${isOutlier ? (imp > 0 ? '显著优化' : '严重退化') : (imp > 0 ? '优化' : '退化')}`, 
                        `改进: ${imp > 0 ? '+' : ''}${imp.toFixed(2)}%`
                      ] 
                    });
                  }}
                  onMouseLeave={() => { setHoveredCase(null); setTooltipState(prev => ({...prev, visible: false})); }}
                  onDoubleClick={() => {
                    if (onCaseClick && parsedData) {
                      const caseData = parsedData.find(p => p.Case === d.Case);
                      if (caseData) onCaseClick(caseData);
                    }
                  }}
                />
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
