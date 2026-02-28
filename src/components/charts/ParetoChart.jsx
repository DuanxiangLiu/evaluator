import React from 'react';
import PropTypes from 'prop-types';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartBody, ChartArea, ChartLegend, AreaLabel, EmptyState } from '../common/ChartContainer';
import { Circle } from 'lucide-react';
import { calculateImprovement } from '../../utils/statistics';
import { CHART_WIDTH, CHART_HEADER_STYLES } from '../../utils/constants';

const ParetoChart = ({ 
  parsedData, selectedCases, availableMetrics, 
  paretoX, paretoY, paretoZ, setParetoX, setParetoY, setParetoZ, 
  handleChartMouseMove, hoveredCase, setHoveredCase, setTooltipState, 
  baseAlgo, compareAlgo,
  onCaseClick
}) => {
  const validPoints = parsedData.filter(d => selectedCases.has(d.Case)).map(d => {
    const bx = d.raw[paretoX]?.[baseAlgo], cx = d.raw[paretoX]?.[compareAlgo];
    const by = d.raw[paretoY]?.[baseAlgo], cy = d.raw[paretoY]?.[compareAlgo];
    
    let bz = 1, cz = 1;
    if (paretoZ) { bz = d.raw[paretoZ]?.[baseAlgo]; cz = d.raw[paretoZ]?.[compareAlgo]; }

    if(bx==null || cx==null || by==null || cy==null || (paretoZ && (bz==null||cz==null))) return null;
    
    const impX = calculateImprovement(bx, cx);
    const impY = calculateImprovement(by, cy);
    const impZ = paretoZ ? calculateImprovement(bz, cz) : 0;

    if (impX === null || impY === null || (paretoZ && impZ === null)) return null;

    return { case: d.Case, impX, impY, impZ, raw: d };
  }).filter(p => p !== null);

  const xVals = validPoints.map(p => p.impX);
  const yVals = validPoints.map(p => p.impY);
  
  const maxAbsX = xVals.length > 0 ? Math.max(...xVals.map(v => Math.abs(v)), 10) * 1.2 : 12;
  const maxAbsY = yVals.length > 0 ? Math.max(...yVals.map(v => Math.abs(v)), 10) * 1.2 : 12;
  const maxAbs = Math.max(maxAbsX, maxAbsY);

  let minZ = 0, maxZ = 0;
  if (paretoZ && validPoints.length > 0) {
    const zVals = validPoints.map(p => p.impZ);
    minZ = Math.min(...zVals); 
    maxZ = Math.max(...zVals);
  }

  const sortedPoints = [...validPoints].sort((a,b) => (paretoZ ? Math.abs(b.impZ) - Math.abs(a.impZ) : 0));

  const mapX = (val) => 50 + (val / maxAbs) * 45;
  const mapY = (val) => 50 - (val / maxAbs) * 45;

  const tickCount = 4;
  const ticks = [];
  for (let i = 0; i <= tickCount; i++) {
    const val = -maxAbs + (2 * maxAbs) * (i / tickCount);
    ticks.push({ val, pos: mapX(val) });
  }

  const renderContent = () => {
    if (!paretoX || !paretoY || sortedPoints.length === 0) {
      return <EmptyState message="请选择 X 轴与 Y 轴进行分析" />;
    }

    return (
      <ChartBody className={`${CHART_WIDTH.COMPACT} mx-auto w-full`}>
        <div className="flex flex-col justify-between text-right pr-2 py-1 text-[10px] font-semibold text-gray-500 w-12 flex-shrink-0">
          {ticks.slice().reverse().map((tick, i) => (
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
        
        <ChartArea className="border-l-2 border-b-2 border-gray-300 bg-gradient-to-br from-green-50/30 via-white to-red-50/30">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-green-100/20 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-red-100/20 to-transparent pointer-events-none"></div>
          
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="50" x2="100" y2="50" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
            
            {ticks.map((tick, i) => (
              <g key={`tick-${i}`}>
                <line x1={tick.pos} y1="0" x2={tick.pos} y2="100" stroke="#e5e7eb" strokeWidth="0.2" strokeDasharray="1 2" />
                <line x1="0" y1={tick.pos} x2="100" y2={tick.pos} stroke="#e5e7eb" strokeWidth="0.2" strokeDasharray="1 2" />
              </g>
            ))}
            
            {sortedPoints.map((p) => {
              const isHovered = hoveredCase === p.case;
              const scx = Math.max(5, Math.min(95, mapX(p.impX)));
              const scy = Math.max(5, Math.min(95, mapY(p.impY)));
              
              let color = '#6366f1';
              if (p.impX > 0 && p.impY > 0) color = '#059669';
              else if (p.impX < 0 && p.impY < 0) color = '#dc2626';

              let radius = 1;
              if (paretoZ) {
                const zAbs = Math.abs(p.impZ);
                const maxZAbs = Math.max(Math.abs(minZ), Math.abs(maxZ)) || 1;
                radius = 0.6 + (zAbs / maxZAbs) * 2;
              }
              
              let tooltipLines = [`${paretoX}: ${p.impX > 0 ? '+' : ''}${p.impX.toFixed(2)}%`, `${paretoY}: ${p.impY > 0 ? '+' : ''}${p.impY.toFixed(2)}%`];
              if (paretoZ) tooltipLines.push(`${paretoZ}: ${p.impZ > 0 ? '+' : ''}${p.impZ.toFixed(2)}%`);

              return (
                <circle
                  key={`pareto-${p.case}`} 
                  cx={scx} cy={scy} 
                  r={isHovered ? radius + 1 : radius} 
                  fill={color} 
                  stroke={isHovered ? "#fff" : "none"} 
                  strokeWidth="0.3"
                  fillOpacity={paretoZ ? 0.7 : 1}
                  className={`transition-all duration-200 cursor-pointer ${isHovered ? 'animate-pulse' : ''}`}
                  onMouseEnter={() => {
                    setHoveredCase(p.case);
                    setTooltipState({ visible: true, x: 0, y: 0, title: p.case, lines: tooltipLines });
                  }}
                  onMouseLeave={() => { setHoveredCase(null); setTooltipState(prev => ({...prev, visible: false})); }}
                  onDoubleClick={() => {
                    if (onCaseClick && p.raw) onCaseClick(p.raw);
                  }}
                />
              );
            })}
          </svg>
          
          <AreaLabel position="top-right" variant="success">双赢 ↑</AreaLabel>
          <AreaLabel position="bottom-left" variant="danger">双输 ↓</AreaLabel>
        </ChartArea>
      </ChartBody>
    );
  };

  return (
    <ChartContainer onMouseMove={handleChartMouseMove}>
      <ChartHeader
        title="Pareto Front 多维气泡分析"
        helpContent={
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-indigo-400 text-sm mb-2">Pareto Front 多维气泡分析</h3>
              <p className="text-gray-300 text-xs mb-2">
                同时观察两个或三个指标的改进情况，识别「双赢」或「Trade-off」的用例。
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-emerald-300 text-xs">象限解读</h4>
              <ul className="text-gray-300 text-xs space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span><strong>右上（绿色）</strong>：双赢区域，两个指标同时优化</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span><strong>左下（红色）</strong>：双输区域，两个指标同时退化</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>对角区域</strong>：Trade-off，一个优化一个退化</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-300 text-xs">气泡大小</h4>
              <p className="text-gray-300 text-xs">
                开启 Z 轴后，气泡大小表示第三个指标的改进幅度，越大表示改进越明显。
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
              💡 <strong>提示</strong>：Pareto Front（帕累托前沿）上的点代表最优权衡解
            </div>
          </div>
        }
        helpPosition="right-center"
      >
        <div className="flex items-center gap-2 text-xs">
          <span className={CHART_HEADER_STYLES.LABEL}>X:</span>
          <select value={paretoX} onChange={(e) => setParetoX(e.target.value)} className={CHART_HEADER_STYLES.SELECT}>
            <option value="">--</option>
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className={`${CHART_HEADER_STYLES.LABEL} ml-1`}>Y:</span>
          <select value={paretoY} onChange={(e) => setParetoY(e.target.value)} className={CHART_HEADER_STYLES.SELECT}>
            <option value="">--</option>
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className={`${CHART_HEADER_STYLES.LABEL_ACCENT} ml-1 flex items-center gap-0.5`}>
            <Circle className="w-2.5 h-2.5"/>Z:
          </span>
          <select value={paretoZ} onChange={(e) => setParetoZ(e.target.value)} className={CHART_HEADER_STYLES.SELECT_ACCENT}>
            <option value="">关</option>
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </ChartHeader>

      {renderContent()}

      <ChartLegend items={[
        { color: '#059669', label: '双赢', shape: 'circle' },
        { color: '#dc2626', label: '双输', shape: 'circle' },
        { color: '#6366f1', label: 'Trade-off', shape: 'circle' }
      ]} />
    </ChartContainer>
  );
};

ParetoChart.propTypes = {
  parsedData: PropTypes.array.isRequired,
  selectedCases: PropTypes.instanceOf(Set).isRequired,
  availableMetrics: PropTypes.array.isRequired,
  paretoX: PropTypes.string,
  paretoY: PropTypes.string,
  paretoZ: PropTypes.string,
  setParetoX: PropTypes.func.isRequired,
  setParetoY: PropTypes.func.isRequired,
  setParetoZ: PropTypes.func.isRequired,
  handleChartMouseMove: PropTypes.func.isRequired,
  hoveredCase: PropTypes.string,
  setHoveredCase: PropTypes.func.isRequired,
  setTooltipState: PropTypes.func.isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string.isRequired,
  onCaseClick: PropTypes.func
};

export default ParetoChart;
