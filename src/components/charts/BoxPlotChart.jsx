import React from 'react';
import PropTypes from 'prop-types';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartBody, ChartArea, ChartLegend, AreaLabel } from '../common/ChartContainer';
import { calculateImprovement } from '../../utils/statistics';
import { CHART_Y_PADDING } from '../../utils/constants';

const BoxPlotChart = ({ stats, activeMetric, handleChartMouseMove, hoveredCase, setHoveredCase, setTooltipState, onCaseClick, parsedData }) => {
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
    if (val === stats.median) return '中位';
    if (val === yMax) return `+${val.toFixed(0)}%`;
    if (val === -yMax) return `-${yMax.toFixed(0)}%`;
    if (val === 0) return '0%';
    return `${val > 0 ? '+' : ''}${val.toFixed(0)}%`;
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
              <p><b>蓝色阴影区 (IQR)：</b>覆盖 50% 的核心密集区</p>
              <p><b>紫色点：</b>显著优化离群点</p>
              <p><b>红色点：</b>严重退化离群点</p>
            </div>
          </div>
        }
        helpWidth="w-72"
        helpPosition="right-center"
      />
      
      <ChartBody>
        <div className="relative w-12 flex-shrink-0">
          {yTicks.map((tick, i) => {
            const yPercent = mapY(tick.val);
            return (
              <span
                key={i} 
                className={`absolute right-2 text-[10px] font-semibold transform -translate-y-1/2
                  ${tick.val === stats.median ? 'text-indigo-600' : ''}
                  ${tick.val === 0 ? 'text-gray-400' : ''}
                  ${tick.val === yMax ? 'text-green-600' : ''}
                  ${tick.val === -yMax ? 'text-red-500' : ''}
                `}
                style={{ top: `${yPercent}%` }}
              >
                {formatYTick(tick.val)}
              </span>
            );
          })}
        </div>
        
        <ChartArea className="border-l-2 border-b-2 border-gray-300 bg-gradient-to-b from-green-50/30 via-white to-red-50/30">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-green-100/20 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-red-100/20 to-transparent pointer-events-none"></div>
          
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1={mapY(0)} x2="100" y2={mapY(0)} stroke="#9ca3af" strokeWidth="0.8" strokeDasharray="4 2" />
            
            <rect x="0" y={mapY(stats.q3)} width="100" height={Math.max(0, mapY(stats.q1) - mapY(stats.q3))} fill="#c7d2fe" opacity="0.5" />
            
            <line x1="0" y1={mapY(stats.median)} x2="100" y2={mapY(stats.median)} stroke="#4f46e5" strokeWidth="1" strokeDasharray="3 2" />
            
            <line x1="0" y1={mapY(stats.q1)} x2="100" y2={mapY(stats.q1)} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="1 2" />
            <line x1="0" y1={mapY(stats.q3)} x2="100" y2={mapY(stats.q3)} stroke="#22c55e" strokeWidth="0.5" strokeDasharray="1 2" />
            
            {stats.validCases.map((d, i) => {
              const imp = d.imp;
              const cx = 5 + (i / (stats.nValid - 1 || 1)) * 90;
              const cy = mapY(imp);
              const isOutlier = imp > stats.outlierUpper || imp < stats.outlierLower;
              const isHovered = hoveredCase === d.Case;
              
              let dotColor = "#6366f1";
              if (imp > stats.outlierUpper) dotColor = "#9333ea";
              if (imp < stats.outlierLower) dotColor = "#dc2626";
              
              return (
                <circle key={d.Case} cx={cx} cy={cy} r={isHovered ? "2.5" : (isOutlier ? "1.5" : "1")}
                  fill={dotColor} stroke={isHovered ? "#fff" : "none"} strokeWidth={isHovered ? "0.3" : "0"}
                  className={`transition-all duration-200 cursor-pointer ${isHovered ? 'animate-pulse' : ''}`}
                  onMouseEnter={() => {
                    setHoveredCase(d.Case);
                    setTooltipState({ visible: true, x: 0, y: 0, title: d.Case, lines: [`状态: ${isOutlier ? (imp > 0 ? '显著优化' : '严重退化') : (imp > 0 ? '优化' : '退化')}`, `改进: ${imp > 0 ? '+' : ''}${imp.toFixed(2)}%`] });
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
  parsedData: PropTypes.array
};

export default BoxPlotChart;
