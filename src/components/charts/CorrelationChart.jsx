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

  return (
    <div className="p-4 h-full flex flex-col justify-center max-w-5xl mx-auto w-full" onMouseMove={handleChartMouseMove}>
      <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 bg-white p-4 rounded-xl border border-gray-200 flex-shrink-0 shadow-sm gap-3">
        <div>
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-1">
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
            } tooltipWidth="w-[36rem]" position="right-center"/>
          </h3>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
          <span className="text-xs font-bold text-gray-600">X轴:</span>
          <select value={corrX} onChange={(e) => setCorrX(e.target.value)} className="text-xs font-semibold border-gray-300 rounded py-1 focus:ring-indigo-500 max-w-[100px]">
            <optgroup label="属性特征">
              {metaColumns.map(m => <option key={`mx-${m}`} value={m}>{m}</option>)}
            </optgroup>
            <optgroup label="指标改进率">
              {availableMetrics.map(m => <option key={`tx-${m}`} value={m}>{m}</option>)}
            </optgroup>
          </select>
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-xs font-bold text-gray-600">Y轴:</span>
          <select value={corrY} onChange={(e) => setCorrY(e.target.value)} className="text-xs font-semibold border-gray-300 rounded py-1 focus:ring-indigo-500 max-w-[100px]">
            {availableMetrics.map(m => <option key={`ty-${m}`} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flex">
        <div className="flex flex-col justify-between text-right pr-2 py-1 text-[10px] font-bold text-gray-500 w-10">
          <span id="y-max-label">-</span>
          <span className="text-green-600">+10%</span>
          <span className="text-gray-600">0%</span>
          <span className="text-red-500">-10%</span>
          <span id="y-min-label">-</span>
        </div>
        
        <div className="relative flex-1 h-72 border-l-2 border-b-2 border-gray-300 bg-gradient-to-b from-green-50/30 via-white to-red-50/30">
          {corrX && corrY ? (
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              {(() => {
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

                if (points.length === 0) return null;

                const xVals = points.map(p => p.xVal);
                const minX = Math.min(...xVals); 
                const maxX = Math.max(...xVals);
                const xRange = maxX - minX || 1;
                const xPadding = xRange * 0.1;

                const yVals = points.map(p => p.impY);
                const maxAbsY = Math.max(...yVals.map(v => Math.abs(v))) * 1.2 || 20;

                const mapX = (val) => ((val - minX + xPadding) / (xRange + 2 * xPadding)) * 100;
                const mapY = (val) => 50 - (val / maxAbsY) * 50;

                const xTicks = [];
                const xTickCount = 5;
                for (let i = 0; i <= xTickCount; i++) {
                  const val = minX - xPadding + (xRange + 2 * xPadding) * (i / xTickCount);
                  xTicks.push({ val, x: mapX(val) });
                }

                return (
                  <>
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
                    
                    <rect x="0" y="0" width="100" height="50" fill="#10b981" opacity="0.03" />
                    <rect x="0" y="50" width="100" height="50" fill="#ef4444" opacity="0.03" />
                    
                    {xTicks.map((tick, i) => (
                      <g key={`xtick-${i}`}>
                        <line x1={tick.x} y1="0" x2={tick.x} y2="100" stroke="#e5e7eb" strokeWidth="0.3" strokeDasharray="1 3" />
                        <text x={tick.x} y="105" fontSize="3.5" fill="#6b7280" textAnchor="middle">
                          {isMetricX ? `${tick.val.toFixed(1)}%` : formatIndustrialNumber(tick.val)}
                        </text>
                      </g>
                    ))}
                    
                    <text x="50" y="112" fontSize="4" fill="#4b5563" textAnchor="middle" fontWeight="bold">
                      {corrX} {isMetricX ? '(改进率 %)' : ''}
                    </text>

                    <text x="-50" y="-8" fontSize="4" fill="#4b5563" textAnchor="middle" fontWeight="bold" transform="rotate(-90)">
                      {corrY} (改进率 %)
                    </text>

                    <div className="absolute top-1 left-2 text-[9px] text-green-600 font-bold bg-green-50/80 px-1 rounded">优化区域</div>
                    <div className="absolute bottom-1 left-2 text-[9px] text-red-500 font-bold bg-red-50/80 px-1 rounded">退化区域</div>

                    {points.map((p) => {
                      const isHovered = hoveredCase === p.case;
                      const scx = mapX(p.xVal);
                      const scy = mapY(p.impY);
                      
                      let color = '#6366f1';
                      if (p.impY > 0) color = '#059669';
                      if (p.impY < 0) color = '#dc2626';

                      return (
                        <circle
                          key={`corr-${p.case}`} cx={scx} cy={scy} r={isHovered ? "2.5" : "1.2"} fill={color} stroke="#fff" strokeWidth={isHovered ? "0.3" : "0.1"}
                          className={`transition-all duration-200 cursor-pointer ${isHovered ? 'animate-pulse' : ''}`}
                          onMouseEnter={() => {
                            setHoveredCase(p.case);
                            setTooltipState({ visible: true, x: 0, y: 0, title: p.case, lines: [`${corrX}: ${isMetricX ? `${p.xVal > 0 ? '+' : ''}${p.xVal.toFixed(2)}%` : formatIndustrialNumber(p.xVal)}`, `${corrY} 改进率: ${p.impY > 0 ? '+' : ''}${p.impY.toFixed(2)}%`] });
                          }}
                          onMouseLeave={() => { setHoveredCase(null); setTooltipState(prev => ({...prev, visible: false})); }}
                          onDoubleClick={() => {
                            if (onCaseClick && p.raw) {
                              onCaseClick(p.raw);
                            }
                          }}
                        />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm">请选择 X 轴与 Y 轴进行分析</div>
          )}
          
          <div className="absolute top-1 left-2 text-[9px] text-green-600 font-bold bg-green-50/80 px-1 rounded">优化区域 ↑</div>
          <div className="absolute bottom-1 left-2 text-[9px] text-red-500 font-bold bg-red-50/80 px-1 rounded">退化区域 ↓</div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationChart;
