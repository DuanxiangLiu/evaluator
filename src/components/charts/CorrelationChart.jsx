import React from 'react';
import PropTypes from 'prop-types';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartBody, ChartArea, ChartLegend, AreaLabel, EmptyState } from '../common/ChartContainer';
import { formatIndustrialNumber } from '../../utils/formatters';
import { calculateImprovement } from '../../utils/statistics';
import { CHART_WIDTH, CHART_HEADER_STYLES } from '../../utils/constants';

const CorrelationChart = ({ 
  parsedData, selectedCases, metaColumns, availableMetrics, 
  corrX, corrY, setCorrX, setCorrY, handleChartMouseMove, 
  hoveredCase, setHoveredCase, setTooltipState, baseAlgo, compareAlgo,
  onCaseClick
}) => {
  if (parsedData.length === 0) return null;

  const isMetricX = availableMetrics.includes(corrX);
  const isInstX = !isMetricX && (corrX?.toLowerCase() === 'inst' || 
    corrX?.toLowerCase() === 'instance' || 
    corrX?.toLowerCase() === 'instances' || 
    corrX?.toLowerCase() === '#inst');
  
  const points = parsedData.filter(d => selectedCases.has(d.Case)).map(d => {
    let xValRaw;
    if (isMetricX) {
      const bxX = d.raw[corrX]?.[baseAlgo];
      const cxX = d.raw[corrX]?.[compareAlgo];
      if (bxX == null || cxX == null) return null;
      xValRaw = calculateImprovement(bxX, cxX);
    } else {
      xValRaw = d.meta[corrX];
    }
    if (xValRaw === undefined || xValRaw === null) return null;
    const xVal = parseFloat(xValRaw);
    if (isNaN(xVal)) return null;

    const bx = d.raw[corrY]?.[baseAlgo], cx = d.raw[corrY]?.[compareAlgo];
    if(bx==null || cx==null) return null;
    
    const impY = calculateImprovement(bx, cx);
    if (impY === null) return null;
    return { case: d.Case, xVal, impY, bx, cx, raw: d };
  }).filter(p => p !== null);

  if (isInstX) {
    points.sort((a, b) => b.xVal - a.xVal);
  }

  const xVals = points.map(p => p.xVal);
  const yVals = points.map(p => p.impY);
  
  const minX = xVals.length > 0 ? Math.min(...xVals) : 0;
  const maxX = xVals.length > 0 ? Math.max(...xVals) : 1;
  const xRange = maxX - minX || 1;
  
  const maxAbsY = yVals.length > 0 ? Math.max(...yVals.map(v => Math.abs(v)), 10) * 1.2 : 12;

  const mapX = (val) => ((val - minX) / xRange) * 90 + 5;
  const mapY = (val) => 50 - (val / maxAbsY) * 45;

  const yTickCount = 5;
  const yMax = maxAbsY;
  const yTicks = [];
  for (let i = 0; i <= yTickCount; i++) {
    const val = yMax - (2 * yMax) * (i / yTickCount);
    yTicks.push({ val });
  }

  const renderContent = () => {
    if (!corrX || !corrY || points.length === 0) {
      return <EmptyState message="请选择 X 轴与 Y 轴进行分析" />;
    }

    return (
      <ChartBody className={`${CHART_WIDTH.COMPACT} mx-auto w-full`}>
        <div className="flex flex-col justify-between text-right pr-2 py-1 text-[10px] font-semibold text-gray-500 w-12 flex-shrink-0">
          {yTicks.map((tick, i) => (
            <span 
              key={i} 
              className={`
                ${tick.val > 0 ? 'text-green-600' : ''} 
                ${tick.val < 0 ? 'text-red-500' : ''}
              `}
            >
              {tick.val > 0 ? '+' : ''}{tick.val.toFixed(0)}%
            </span>
          ))}
        </div>
        
        <ChartArea className="border-l-2 border-b-2 border-gray-300 bg-gradient-to-b from-green-50/30 via-white to-red-50/30">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-green-100/20 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-red-100/20 to-transparent pointer-events-none"></div>
          
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="50" x2="100" y2="50" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
            
            {points.map((p, i) => {
              const isHovered = hoveredCase === p.case;
              const cx = isInstX ? (5 + (i / (points.length - 1 || 1)) * 90) : mapX(p.xVal);
              const cy = mapY(p.impY);
              
              let color = '#6366f1';
              if (p.impY > 0) color = '#059669';
              if (p.impY < 0) color = '#dc2626';

              return (
                <circle
                  key={`corr-${p.case}`} 
                  cx={cx} cy={cy} 
                  r={isHovered ? "2" : "1"} 
                  fill={color} 
                  stroke={isHovered ? "#fff" : "none"} 
                  strokeWidth="0.3"
                  className={`transition-all duration-200 cursor-pointer ${isHovered ? 'animate-pulse' : ''}`}
                  onMouseEnter={() => {
                    setHoveredCase(p.case);
                    setTooltipState({ visible: true, x: 0, y: 0, title: p.case, lines: [`${corrX}: ${isMetricX ? `${p.xVal > 0 ? '+' : ''}${p.xVal.toFixed(2)}%` : formatIndustrialNumber(p.xVal)}`, `${corrY}: ${p.impY > 0 ? '+' : ''}${p.impY.toFixed(2)}%`] });
                  }}
                  onMouseLeave={() => { setHoveredCase(null); setTooltipState(prev => ({...prev, visible: false})); }}
                  onDoubleClick={() => {
                    if (onCaseClick && p.raw) onCaseClick(p.raw);
                  }}
                />
              );
            })}
          </svg>
          
          <AreaLabel position="top-left" variant="success">优化 ↑</AreaLabel>
          <AreaLabel position="bottom-left" variant="danger">退化 ↓</AreaLabel>
        </ChartArea>
      </ChartBody>
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
              <h4 className="font-semibold text-amber-300 text-xs">颜色含义</h4>
              <ul className="text-gray-300 text-xs space-y-1">
                <li>• <span className="text-emerald-400">绿色点</span>：该用例有优化效果</li>
                <li>• <span className="text-red-400">红色点</span>：该用例出现退化</li>
              </ul>
            </div>
            
            <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
              💡 <strong>提示</strong>：使用下拉菜单选择不同的 X/Y 轴变量进行探索
            </div>
          </div>
        }
        helpPosition="right-center"
      >
        <div className="flex items-center gap-2 text-xs">
          <span className={CHART_HEADER_STYLES.LABEL}>X:</span>
          <select value={corrX} onChange={(e) => setCorrX(e.target.value)} className={CHART_HEADER_STYLES.SELECT}>
            <optgroup label="属性">
              {metaColumns.map(m => <option key={`mx-${m}`} value={m}>{m}</option>)}
            </optgroup>
            <optgroup label="指标">
              {availableMetrics.map(m => <option key={`tx-${m}`} value={m}>{m}</option>)}
            </optgroup>
          </select>
          <span className={`${CHART_HEADER_STYLES.LABEL} ml-1`}>Y:</span>
          <select value={corrY} onChange={(e) => setCorrY(e.target.value)} className={CHART_HEADER_STYLES.SELECT}>
            {availableMetrics.map(m => <option key={`ty-${m}`} value={m}>{m}</option>)}
          </select>
        </div>
      </ChartHeader>

      {renderContent()}

      <ChartLegend items={[
        { color: '#059669', label: '优化', shape: 'circle' },
        { color: '#dc2626', label: '退化', shape: 'circle' },
        { color: '#9ca3af', label: '零线' }
      ]} />
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
