import React from 'react';
import PropTypes from 'prop-types';
import ChartHeader from '../common/ChartHeader';
import { Circle } from 'lucide-react';
import { calculateImprovement } from '../../utils/statistics';

const ParetoChart = ({ 
  parsedData, selectedCases, availableMetrics, 
  paretoX, paretoY, paretoZ, setParetoX, setParetoY, setParetoZ, 
  handleChartMouseMove, hoveredCase, setHoveredCase, setTooltipState, 
  baseAlgo, compareAlgo,
  onCaseClick
}) => {
  if (parsedData.length === 0 || !paretoX || !paretoY) {
    return (
      <div className="p-4 h-full flex flex-col" onMouseMove={handleChartMouseMove}>
        <ChartHeader
          title="Pareto Front 多维气泡分析"
          helpContent={
            <div className="space-y-2">
              <p className="font-bold text-indigo-400">Pareto Front 多维气泡分析</p>
              <div className="text-xs space-y-1">
                <p>帕累托图揭示了目标之间的竞争关系 (Trade-off)。</p>
                <p><b>右上角 (绿色)：</b>双赢点，两个指标同时优化</p>
                <p><b>左下角 (红色)：</b>双输点，两个指标同时退化</p>
                <p><b>气泡大小：</b>可选择第三个指标映射为气泡大小</p>
                <p><b>双击数据点：</b>打开深度分析模态框</p>
              </div>
            </div>
          }
          helpWidth="w-[32rem]"
          helpPosition="right-center"
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-white/80">X:</span>
            <select value={paretoX} onChange={(e) => setParetoX(e.target.value)} className="font-semibold border-0 rounded py-0.5 px-1.5 focus:ring-2 focus:ring-white/50 bg-white/90 text-gray-800 text-xs">
              <option value="">--</option>
              {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="font-semibold text-white/80 ml-1">Y:</span>
            <select value={paretoY} onChange={(e) => setParetoY(e.target.value)} className="font-semibold border-0 rounded py-0.5 px-1.5 focus:ring-2 focus:ring-white/50 bg-white/90 text-gray-800 text-xs">
              <option value="">--</option>
              {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="font-semibold text-amber-200 ml-1 flex items-center gap-0.5">
              <Circle className="w-2.5 h-2.5"/>Z:
            </span>
            <select value={paretoZ} onChange={(e) => setParetoZ(e.target.value)} className="font-semibold border-0 rounded py-0.5 px-1.5 focus:ring-2 focus:ring-white/50 bg-amber-100 text-amber-800 text-xs">
              <option value="">关闭</option>
              {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </ChartHeader>
        <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-3 min-h-[300px] flex items-center justify-center text-gray-400 font-medium text-sm">
          请选择 X 轴与 Y 轴进行分析
        </div>
      </div>
    );
  }

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

  return (
    <div className="p-4 h-full flex flex-col" onMouseMove={handleChartMouseMove}>
      <ChartHeader
        title="Pareto Front 多维气泡分析"
        helpContent={
          <div className="space-y-2">
            <p className="font-bold text-indigo-400">Pareto Front 多维气泡分析</p>
            <div className="text-xs space-y-1">
              <p>帕累托图揭示了目标之间的竞争关系 (Trade-off)。</p>
              <p><b>右上角 (绿色)：</b>双赢点，两个指标同时优化</p>
              <p><b>左下角 (红色)：</b>双输点，两个指标同时退化</p>
              <p><b>气泡大小：</b>可选择第三个指标映射为气泡大小</p>
              <p><b>双击数据点：</b>打开深度分析模态框</p>
            </div>
          </div>
        }
        helpWidth="w-[32rem]"
        helpPosition="right-center"
      >
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-white/80">X:</span>
          <select value={paretoX} onChange={(e) => setParetoX(e.target.value)} className="font-semibold border-0 rounded py-0.5 px-1.5 focus:ring-2 focus:ring-white/50 bg-white/90 text-gray-800 text-xs">
            <option value="">--</option>
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="font-semibold text-white/80 ml-1">Y:</span>
          <select value={paretoY} onChange={(e) => setParetoY(e.target.value)} className="font-semibold border-0 rounded py-0.5 px-1.5 focus:ring-2 focus:ring-white/50 bg-white/90 text-gray-800 text-xs">
            <option value="">--</option>
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="font-semibold text-amber-200 ml-1 flex items-center gap-0.5">
            <Circle className="w-2.5 h-2.5"/>Z:
          </span>
          <select value={paretoZ} onChange={(e) => setParetoZ(e.target.value)} className="font-semibold border-0 rounded py-0.5 px-1.5 focus:ring-2 focus:ring-white/50 bg-amber-100 text-amber-800 text-xs">
            <option value="">关闭</option>
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </ChartHeader>

      <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-3 min-h-[300px]">
        {paretoX && paretoY && sortedPoints.length > 0 ? (
          <div className="w-full h-full flex">
            <div className="flex flex-col justify-between text-right pr-2 text-[10px] font-bold text-gray-400 w-8">
              {ticks.slice().reverse().map((tick, i) => (
                <span key={i} className={tick.val > 0 ? 'text-green-600' : tick.val < 0 ? 'text-red-500' : ''}>
                  {tick.val > 0 ? '+' : ''}{tick.val.toFixed(0)}%
                </span>
              ))}
            </div>
            
            <div className="flex-1 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="paretoBg" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.06" />
                    <stop offset="50%" stopColor="white" stopOpacity="0" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.06" />
                  </linearGradient>
                </defs>
                
                <rect x="5" y="5" width="90" height="90" fill="url(#paretoBg)" />
                
                <line x1="5" y1="50" x2="95" y2="50" stroke="#d1d5db" strokeWidth="0.3" strokeDasharray="2 2" />
                <line x1="50" y1="5" x2="50" y2="95" stroke="#d1d5db" strokeWidth="0.3" strokeDasharray="2 2" />
                
                {ticks.map((tick, i) => (
                  <g key={`tick-${i}`}>
                    <line x1={tick.pos} y1="5" x2={tick.pos} y2="95" stroke="#e5e7eb" strokeWidth="0.2" strokeDasharray="1 2" />
                    <line x1="5" y1={tick.pos} x2="95" y2={tick.pos} stroke="#e5e7eb" strokeWidth="0.2" strokeDasharray="1 2" />
                    <text x={tick.pos} y="98" fontSize="2.5" fill="#6b7280" textAnchor="middle">{tick.val.toFixed(0)}%</text>
                  </g>
                ))}
                
                <text x="50" y="103" fontSize="3" fill="#374151" textAnchor="middle" fontWeight="bold">{paretoX}</text>

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
                    radius = 0.8 + (zAbs / maxZAbs) * 3;
                  }
                  
                  let tooltipLines = [`${paretoX}: ${p.impX > 0 ? '+' : ''}${p.impX.toFixed(2)}%`, `${paretoY}: ${p.impY > 0 ? '+' : ''}${p.impY.toFixed(2)}%`];
                  if (paretoZ) tooltipLines.push(`${paretoZ}: ${p.impZ > 0 ? '+' : ''}${p.impZ.toFixed(2)}% (气泡)`);

                  return (
                    <circle
                      key={`pareto-${p.case}`} 
                      cx={scx} cy={scy} 
                      r={isHovered ? radius + 1 : radius} 
                      fill={color} 
                      stroke={isHovered ? "#fff" : "none"} 
                      strokeWidth="0.2"
                      fillOpacity={paretoZ ? 0.7 : 1}
                      className="transition-all duration-150 cursor-pointer"
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
              
              <div className="absolute top-2 right-2 text-[9px] text-green-600 font-bold bg-green-50/90 px-1.5 py-0.5 rounded">双赢 ↑</div>
              <div className="absolute bottom-2 left-2 text-[9px] text-red-500 font-bold bg-red-50/90 px-1.5 py-0.5 rounded">双输 ↓</div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium text-sm">请选择 X 轴与 Y 轴进行分析</div>
        )}
      </div>
    </div>
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
