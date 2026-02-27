import React from 'react';
import HelpIcon from '../common/HelpIcon';
import { formatIndustrialNumber } from '../../utils/formatters';

const CorrelationChart = ({ 
  parsedData, selectedCases, metaColumns, availableMetrics, 
  corrX, corrY, setCorrX, setCorrY, handleChartMouseMove, 
  hoveredCase, setHoveredCase, setTooltipState, baseAlgo, compareAlgo 
}) => {
  if (parsedData.length === 0) return null;

  return (
    <div className="p-6 h-full flex flex-col justify-center max-w-5xl mx-auto w-full" onMouseMove={handleChartMouseMove}>
      <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 bg-white p-5 rounded-xl border border-gray-200 flex-shrink-0 shadow-sm gap-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-1">
            特征相关性散点分析 
            <HelpIcon content={
              <div className="space-y-3">
                <p className="font-bold text-indigo-400 text-lg">特征相关性散点分析</p>
                <div className="space-y-2 text-sm">
                  <p>发现深层物理规律：</p>
                  <p><b>属性 vs 指标：</b>如规模越大时序是否越差？</p>
                  <p><b>指标 vs 指标：</b>如 HPWL 优化是否必然伴随功耗上升？</p>
                </div>
              </div>
            } tooltipWidth="w-[40rem]" position="right-center"/>
          </h3>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-600">X轴 (特征/指标):</span>
          <select value={corrX} onChange={(e) => setCorrX(e.target.value)} className="text-xs font-semibold border-gray-300 rounded py-1 focus:ring-indigo-500 max-w-[120px]">
            <optgroup label="属性特征 (Meta)">
              {metaColumns.map(m => <option key={`mx-${m}`} value={m}>{m}</option>)}
            </optgroup>
            <optgroup label="比对指标改进率 (Metrics)">
              {availableMetrics.map(m => <option key={`tx-${m}`} value={m}>{m} 改进率</option>)}
            </optgroup>
          </select>
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-xs font-bold text-gray-600">Y轴 (分析目标):</span>
          <select value={corrY} onChange={(e) => setCorrY(e.target.value)} className="text-xs font-semibold border-gray-300 rounded py-1 focus:ring-indigo-500 max-w-[120px]">
            {availableMetrics.map(m => <option key={`ty-${m}`} value={m}>{m} 改进率</option>)}
          </select>
        </div>
      </div>

      <div className="relative w-full max-w-4xl mx-auto flex-1 max-h-[500px] border-b-2 border-l-2 border-gray-400 mt-4 bg-white rounded-lg">
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm font-bold text-gray-600">{corrX || 'X Axis'} {availableMetrics.includes(corrX) ? '(%)' : ''} →</div>
        <div className="absolute -left-14 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-bold text-gray-600">{corrY || 'Y Axis'} 改进率 (%) → </div>
        
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
                return { case: d.Case, xVal, impY, bx, cx };
              }).filter(p => p !== null);

              if (points.length === 0) return null;

              const xVals = points.map(p => p.xVal);
              const minX = Math.min(...xVals); const maxX = Math.max(...xVals);
              const xRange = maxX - minX || 1;

              const maxImpY = Math.max(...points.map(p => Math.abs(p.impY))) * 1.2 || 20;

              return (
                <>
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="4 4" />
                  
                  <text x="0" y="105" fontSize="4" fill="#6b7280" textAnchor="start">{isMetricX ? `${minX.toFixed(1)}%` : formatIndustrialNumber(minX)}</text>
                  <text x="100" y="105" fontSize="4" fill="#6b7280" textAnchor="end">{isMetricX ? `${maxX.toFixed(1)}%` : formatIndustrialNumber(maxX)}</text>

                  {points.map((p) => {
                    const isHovered = hoveredCase === p.case;
                    const scx = ((p.xVal - minX) / xRange) * 100;
                    const scy = 50 - (p.impY / maxImpY) * 50;
                    
                    let color = '#4f46e5';
                    if (p.impY > 0) color = '#059669';
                    if (p.impY < 0) color = '#dc2626';

                    return (
                      <circle
                        key={`corr-${p.case}`} cx={scx} cy={scy} r={isHovered ? "4" : "2"} fill={color} stroke="#fff" strokeWidth={isHovered ? "0.5" : "0.2"}
                        className={`transition-all duration-200 cursor-pointer ${isHovered ? 'animate-pulse' : 'hover:r-3'}`}
                        onMouseEnter={() => {
                          setHoveredCase(p.case);
                          setTooltipState({ visible: true, x: 0, y: 0, title: p.case, lines: [`${corrX}: ${isMetricX ? `${p.xVal > 0 ? '+' : ''}${p.xVal.toFixed(2)}%` : formatIndustrialNumber(p.xVal)}`, `${corrY} 改进率: ${p.impY > 0 ? '+' : ''}${p.impY.toFixed(2)}%`] });
                        }}
                        onMouseLeave={() => { setHoveredCase(null); setTooltipState(prev => ({...prev, visible: false})); }}
                      />
                    );
                  })}
                </>
              );
            })()}
          </svg>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">请在上方选择 X 轴与 Y 轴进行相关性分析</div>
        )}
      </div>
    </div>
  );
};

export default CorrelationChart;
