import React from 'react';
import HelpIcon from '../common/HelpIcon';
import { formatIndustrialNumber } from '../../utils/formatters';

const CorrelationChart = ({ 
  parsedData, selectedCases, metaColumns, availableMetrics, 
  corrX, corrY, setCorrX, setCorrY, handleChartMouseMove, 
  hoveredCase, setHoveredCase, setTooltipState, baseAlgo, compareAlgo,
  onCaseClick
}) => {
  if (parsedData.length === 0) return null;

  const isMetricX = availableMetrics.includes(corrX);
  
  const points = parsedData.filter(d => selectedCases.has(d.Case)).map(d => {
    let xValRaw;
    if (isMetricX) {
      const bxX = d.raw[corrX]?.[baseAlgo];
      const cxX = d.raw[corrX]?.[compareAlgo];
      if (bxX == null || cxX == null) return null;
      xValRaw = bxX === 0 ? (cxX === 0 ? 0 : -100) : ((bxX - cxX) / bxX) * 100;
    } else {
      xValRaw = d.meta[corrX];
    }
    if (xValRaw === undefined || xValRaw === null) return null;
    const xVal = parseFloat(xValRaw);
    if (isNaN(xVal)) return null;

    const bx = d.raw[corrY]?.[baseAlgo], cx = d.raw[corrY]?.[compareAlgo];
    if(bx==null || cx==null) return null;
    
    let impY = bx===0 ? (cx===0?0:-100) : ((bx-cx)/bx)*100;
    return { case: d.Case, xVal, impY, bx, cx, raw: d };
  }).filter(p => p !== null);

  const xVals = points.map(p => p.xVal);
  const yVals = points.map(p => p.impY);
  
  const minX = Math.min(...xVals);
  const maxX = Math.max(...xVals);
  const xRange = maxX - minX || 1;
  
  const maxAbsY = Math.max(...yVals.map(v => Math.abs(v)), 10) * 1.2;

  const mapX = (val) => ((val - minX) / xRange) * 90 + 5;
  const mapY = (val) => 50 - (val / maxAbsY) * 45;

  const xTickCount = 5;
  const xTicks = [];
  for (let i = 0; i <= xTickCount; i++) {
    const val = minX + xRange * (i / xTickCount);
    xTicks.push({ val, x: mapX(val) });
  }

  const yTickCount = 5;
  const yMax = maxAbsY;
  const yTicks = [];
  for (let i = 0; i <= yTickCount; i++) {
    const val = yMax - (2 * yMax) * (i / yTickCount);
    yTicks.push({ val, y: mapY(val) });
  }

  return (
    <div className="p-4 h-full flex flex-col" onMouseMove={handleChartMouseMove}>
      <div className="flex justify-between items-center mb-3 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 rounded-lg shadow-md">
        <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
          特征相关性散点分析
          <HelpIcon content={
            <div className="space-y-2">
              <p className="font-bold text-indigo-400">特征相关性散点分析</p>
              <div className="text-xs space-y-1">
                <p>发现深层物理规律：</p>
                <p><b>属性 vs 指标：</b>如规模越大时序是否越差？</p>
                <p><b>指标 vs 指标：</b>如 HPWL 优化是否必然伴随功耗上升？</p>
                <p><b>双击数据点：</b>打开深度分析模态框</p>
              </div>
            </div>
          } tooltipWidth="w-[32rem]" position="right-center" className="w-3.5 h-3.5 text-white/70 hover:text-white"/>
        </h3>
        
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-white/80">X:</span>
          <select value={corrX} onChange={(e) => setCorrX(e.target.value)} className="font-semibold border-0 rounded py-0.5 px-1.5 focus:ring-2 focus:ring-white/50 bg-white/90 text-gray-800 text-xs">
            <optgroup label="属性特征">
              {metaColumns.map(m => <option key={`mx-${m}`} value={m}>{m}</option>)}
            </optgroup>
            <optgroup label="指标改进率">
              {availableMetrics.map(m => <option key={`tx-${m}`} value={m}>{m}</option>)}
            </optgroup>
          </select>
          <span className="font-semibold text-white/80 ml-2">Y:</span>
          <select value={corrY} onChange={(e) => setCorrY(e.target.value)} className="font-semibold border-0 rounded py-0.5 px-1.5 focus:ring-2 focus:ring-white/50 bg-white/90 text-gray-800 text-xs">
            {availableMetrics.map(m => <option key={`ty-${m}`} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-3 min-h-[300px]">
        {corrX && corrY && points.length > 0 ? (
          <div className="w-full h-full flex">
            <div className="flex flex-col justify-between text-right pr-2 text-[10px] font-bold text-gray-400 w-12">
              {yTicks.map((tick, i) => (
                <span key={i} className={tick.val > 0 ? 'text-green-600' : tick.val < 0 ? 'text-red-500' : ''}>
                  {tick.val > 0 ? '+' : ''}{tick.val.toFixed(0)}%
                </span>
              ))}
            </div>
            
            <div className="flex-1 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
                    <stop offset="50%" stopColor="white" stopOpacity="0" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.08" />
                  </linearGradient>
                </defs>
                
                <rect x="5" y="5" width="90" height="90" fill="url(#bgGradient)" />
                
                <line x1="5" y1="50" x2="95" y2="50" stroke="#d1d5db" strokeWidth="0.3" strokeDasharray="2 2" />
                
                {xTicks.map((tick, i) => (
                  <g key={`xtick-${i}`}>
                    <line x1={tick.x} y1="5" x2={tick.x} y2="95" stroke="#e5e7eb" strokeWidth="0.2" strokeDasharray="1 2" />
                    <text x={tick.x} y="98" fontSize="3" fill="#6b7280" textAnchor="middle">
                      {isMetricX ? `${tick.val.toFixed(0)}%` : formatIndustrialNumber(tick.val)}
                    </text>
                  </g>
                ))}
                
                <text x="50" y="102" fontSize="3.5" fill="#374151" textAnchor="middle" fontWeight="bold">
                  {corrX} {isMetricX ? '(改进率)' : ''}
                </text>

                {points.map((p) => {
                  const isHovered = hoveredCase === p.case;
                  const scx = mapX(p.xVal);
                  const scy = mapY(p.impY);
                  
                  let color = '#6366f1';
                  if (p.impY > 0) color = '#059669';
                  if (p.impY < 0) color = '#dc2626';

                  return (
                    <circle
                      key={`corr-${p.case}`} 
                      cx={scx} cy={scy} 
                      r={isHovered ? "2" : "1"} 
                      fill={color} 
                      stroke={isHovered ? "#fff" : "none"} 
                      strokeWidth="0.2"
                      className="transition-all duration-150 cursor-pointer"
                      onMouseEnter={() => {
                        setHoveredCase(p.case);
                        setTooltipState({ visible: true, x: 0, y: 0, title: p.case, lines: [`${corrX}: ${isMetricX ? `${p.xVal > 0 ? '+' : ''}${p.xVal.toFixed(2)}%` : formatIndustrialNumber(p.xVal)}`, `${corrY} 改进率: ${p.impY > 0 ? '+' : ''}${p.impY.toFixed(2)}%`] });
                      }}
                      onMouseLeave={() => { setHoveredCase(null); setTooltipState(prev => ({...prev, visible: false})); }}
                      onDoubleClick={() => {
                        if (onCaseClick && p.raw) onCaseClick(p.raw);
                      }}
                    />
                  );
                })}
              </svg>
              
              <div className="absolute top-2 right-2 text-[9px] text-green-600 font-bold bg-green-50/90 px-1.5 py-0.5 rounded">优化 ↑</div>
              <div className="absolute bottom-2 right-2 text-[9px] text-red-500 font-bold bg-red-50/90 px-1.5 py-0.5 rounded">退化 ↓</div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium text-sm">请选择 X 轴与 Y 轴进行分析</div>
        )}
      </div>
    </div>
  );
};

export default CorrelationChart;
