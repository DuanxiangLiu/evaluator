import React from 'react';
import HelpIcon from '../common/HelpIcon';
import { Square } from 'lucide-react';

const ParetoChart = ({ 
  parsedData, selectedCases, availableMetrics, 
  paretoX, paretoY, paretoZ, setParetoX, setParetoY, setParetoZ, 
  handleChartMouseMove, hoveredCase, setHoveredCase, setTooltipState, 
  baseAlgo, compareAlgo,
  onCaseClick
}) => {
  if (parsedData.length === 0) return null;

  return (
    <div className="p-4 h-full flex flex-col justify-center max-w-5xl mx-auto w-full" onMouseMove={handleChartMouseMove}>
      <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 bg-white p-4 rounded-xl border border-gray-200 flex-shrink-0 shadow-sm gap-3">
        <div>
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-1">
            Pareto Front 多维气泡分析
            <HelpIcon content={
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
            } tooltipWidth="w-[36rem]" position="right-center"/>
          </h3>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
          <span className="text-xs font-bold text-gray-600">X轴:</span>
          <select value={paretoX} onChange={(e) => setParetoX(e.target.value)} className="text-xs font-semibold border-gray-300 rounded py-1 focus:ring-indigo-500 max-w-[90px]">
            <option value="">--</option>
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-xs font-bold text-gray-600">Y轴:</span>
          <select value={paretoY} onChange={(e) => setParetoY(e.target.value)} className="text-xs font-semibold border-gray-300 rounded py-1 focus:ring-indigo-500 max-w-[90px]">
            <option value="">--</option>
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
            <Square className="w-3 h-3"/>Z:
          </span>
          <select value={paretoZ} onChange={(e) => setParetoZ(e.target.value)} className="text-xs font-semibold border-indigo-300 bg-indigo-50 text-indigo-700 rounded py-1 focus:ring-indigo-500 max-w-[90px]">
            <option value="">关闭</option>
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flex">
        <div className="flex flex-col justify-between text-right pr-2 py-1 text-[10px] font-bold text-gray-500 w-10">
          <span className="text-green-600">+20%</span>
          <span className="text-gray-600">0%</span>
          <span className="text-red-500">-20%</span>
        </div>
        
        <div className="relative flex-1 h-72 border-l-2 border-b-2 border-gray-300 bg-gradient-to-br from-green-50/30 via-white to-red-50/30">
          {paretoX && paretoY ? (
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              {(() => {
                const validPoints = parsedData.filter(d => selectedCases.has(d.Case)).map(d => {
                  const bx = d.raw[paretoX]?.[baseAlgo], cx = d.raw[paretoX]?.[compareAlgo];
                  const by = d.raw[paretoY]?.[baseAlgo], cy = d.raw[paretoY]?.[compareAlgo];
                  
                  let bz = 1, cz = 1;
                  if (paretoZ) { bz = d.raw[paretoZ]?.[baseAlgo]; cz = d.raw[paretoZ]?.[compareAlgo]; }

                  if(bx==null || cx==null || by==null || cy==null || (paretoZ && (bz==null||cz==null))) return null;
                  
                  let impX = bx===0 ? (cx===0?0:-100) : ((bx-cx)/bx)*100;
                  let impY = by===0 ? (cy===0?0:-100) : ((by-cy)/by)*100;
                  let impZ = 0;
                  if (paretoZ) impZ = bz===0 ? (cz===0?0:-100) : ((bz-cz)/bz)*100;

                  return { case: d.Case, impX, impY, impZ, raw: d };
                }).filter(p => p !== null);

                let minZ = 0, maxZ = 0;
                if (paretoZ) {
                  const zVals = validPoints.map(p => p.impZ);
                  minZ = Math.min(...zVals); maxZ = Math.max(...zVals);
                }

                validPoints.sort((a,b) => (paretoZ ? Math.abs(b.impZ) - Math.abs(a.impZ) : 0));

                const maxImp = 25;
                const mapX = (val) => 50 + (val / maxImp) * 50;
                const mapY = (val) => 50 - (val / maxImp) * 50;

                const xTicks = [-20, -10, 0, 10, 20];
                const yTicks = [-20, -10, 0, 10, 20];

                return (
                  <>
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
                    
                    <rect x="50" y="0" width="50" height="50" fill="#10b981" opacity="0.08" />
                    <rect x="0" y="50" width="50" height="50" fill="#ef4444" opacity="0.05" />
                    
                    {xTicks.map(tick => (
                      <g key={`xtick-${tick}`}>
                        <line x1={mapX(tick)} y1="0" x2={mapX(tick)} y2="100" stroke="#e5e7eb" strokeWidth="0.3" strokeDasharray="1 3" />
                        <text x={mapX(tick)} y="105" fontSize="3.5" fill="#6b7280" textAnchor="middle">{tick}%</text>
                      </g>
                    ))}
                    
                    {yTicks.map(tick => (
                      <text key={`ytick-${tick}`} x="-3" y={mapY(tick) + 1.5} fontSize="3.5" fill="#6b7280" textAnchor="end">{tick}%</text>
                    ))}
                    
                    <text x="50" y="112" fontSize="4" fill="#4b5563" textAnchor="middle" fontWeight="bold">{paretoX} 改进率 (%)</text>
                    <text x="-50" y="-8" fontSize="4" fill="#4b5563" textAnchor="middle" fontWeight="bold" transform="rotate(-90)">{paretoY} 改进率 (%)</text>

                    {validPoints.map((p) => {
                      const isHovered = hoveredCase === p.case;
                      const scx = Math.max(0, Math.min(100, mapX(p.impX)));
                      const scy = Math.max(0, Math.min(100, mapY(p.impY)));
                      
                      let color = '#6366f1';
                      if (p.impX > 0 && p.impY > 0) color = '#059669';
                      else if (p.impX < 0 && p.impY < 0) color = '#dc2626';

                      let radius = 1.2;
                      if (paretoZ) {
                        const zAbs = Math.abs(p.impZ);
                        const maxZAbs = Math.max(Math.abs(minZ), Math.abs(maxZ)) || 1;
                        radius = 1 + (zAbs / maxZAbs) * 4;
                      }
                      
                      let tooltipLines = [`${paretoX}: ${p.impX > 0 ? '+' : ''}${p.impX.toFixed(2)}%`, `${paretoY}: ${p.impY > 0 ? '+' : ''}${p.impY.toFixed(2)}%`];
                      if (paretoZ) tooltipLines.push(`${paretoZ}: ${p.impZ > 0 ? '+' : ''}${p.impZ.toFixed(2)}% (气泡)`);

                      return (
                        <circle
                          key={`pareto-${p.case}`} cx={scx} cy={scy} r={isHovered ? radius + 1.5 : radius} fill={color} stroke="#fff" strokeWidth={isHovered ? "0.3" : "0.1"} fillOpacity={paretoZ ? 0.7 : 1}
                          className={`transition-all duration-200 cursor-pointer ${isHovered ? 'animate-pulse' : ''}`}
                          onMouseEnter={() => {
                            setHoveredCase(p.case);
                            setTooltipState({ visible: true, x: 0, y: 0, title: p.case, lines: tooltipLines });
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
          
          <div className="absolute top-1 right-2 text-[9px] text-green-600 font-bold bg-green-50/80 px-1 rounded">双赢区域 ↑</div>
          <div className="absolute bottom-1 left-2 text-[9px] text-red-500 font-bold bg-red-50/80 px-1 rounded">双输区域 ↓</div>
        </div>
      </div>
    </div>
  );
};

export default ParetoChart;
