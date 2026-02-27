import React from 'react';
import HelpIcon from '../common/HelpIcon';
import { Square } from 'lucide-react';

const ParetoChart = ({ 
  parsedData, selectedCases, availableMetrics, 
  paretoX, paretoY, paretoZ, setParetoX, setParetoY, setParetoZ, 
  handleChartMouseMove, hoveredCase, setHoveredCase, setTooltipState, 
  baseAlgo, compareAlgo 
}) => {
  if (parsedData.length === 0) return null;

  return (
    <div className="p-6 h-full flex flex-col justify-center max-w-5xl mx-auto w-full" onMouseMove={handleChartMouseMove}>
      <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 bg-white p-5 rounded-xl border border-gray-200 flex-shrink-0 shadow-sm gap-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-1">
            Pareto Front 多维气泡分析
            <HelpIcon content={
              <div className="space-y-3">
                <p className="font-bold text-indigo-400 text-lg">Pareto Front 多维气泡分析</p>
                <div className="space-y-2 text-sm">
                  <p>帕累托图揭示了目标之间的竞争关系 (Trade-off)。</p>
                  <p><b>右上角：</b>双赢点，两个指标同时优化</p>
                  <p><b>左下角：</b>双输点，两个指标同时退化</p>
                  <p><b>气泡大小：</b>可选择第三个指标映射为气泡大小，在 2D 平面内直观对比 3 个目标</p>
                </div>
              </div>
            } tooltipWidth="w-[40rem]" position="right-center"/>
          </h3>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-xs font-bold text-gray-600">X轴:</span>
          <select value={paretoX} onChange={(e) => setParetoX(e.target.value)} className="text-xs font-semibold border-gray-300 rounded py-1 focus:ring-indigo-500 max-w-[100px]"><option value="">--</option>{availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}</select>
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-xs font-bold text-gray-600">Y轴:</span>
          <select value={paretoY} onChange={(e) => setParetoY(e.target.value)} className="text-xs font-semibold border-gray-300 rounded py-1 focus:ring-indigo-500 max-w-[100px]"><option value="">--</option>{availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}</select>
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Square className="w-3 h-3"/>气泡大小(Z):</span>
          <select value={paretoZ} onChange={(e) => setParetoZ(e.target.value)} className="text-xs font-semibold border-indigo-300 bg-indigo-50 text-indigo-700 rounded py-1 focus:ring-indigo-500 max-w-[100px]"><option value="">-- (关闭)</option>{availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}</select>
        </div>
      </div>

      <div className="relative w-full max-w-4xl mx-auto flex-1 max-h-[500px] border-b-2 border-l-2 border-gray-400 mt-4 bg-white rounded-lg">
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm font-bold text-gray-600">{paretoX} 改进率 (%) → </div>
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-bold text-gray-600">{paretoY} 改进率 (%) → </div>
        
        {paretoX && paretoY ? (
          <svg className="w-full h-full overflow-visible" viewBox="-100 -100 200 200" preserveAspectRatio="none">
            <line x1="-100" y1="0" x2="100" y2="0" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="0" y1="-100" x2="0" y2="100" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="4 4" />
            <rect x="0" y="-100" width="100" height="100" fill="#10b981" opacity="0.08" />
            <rect x="-100" y="0" width="100" height="100" fill="#ef4444" opacity="0.05" />

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

                return { case: d.Case, impX, impY, impZ };
              }).filter(p => p !== null);

              let minZ = 0, maxZ = 0;
              if (paretoZ) {
                const zVals = validPoints.map(p => p.impZ);
                minZ = Math.min(...zVals); maxZ = Math.max(...zVals);
              }

              validPoints.sort((a,b) => (paretoZ ? Math.abs(b.impZ) - Math.abs(a.impZ) : 0));

              return validPoints.map((p) => {
                const isHovered = hoveredCase === p.case;
                const scale = 4;
                const scx = Math.max(-100, Math.min(100, p.impX * scale));
                const scy = -Math.max(-100, Math.min(100, p.impY * scale));
                
                let color = '#4f46e5';
                if (p.impX > 0 && p.impY > 0) color = '#059669';
                else if (p.impX < 0 && p.impY < 0) color = '#dc2626';

                let radius = 2.5;
                if (paretoZ) {
                  const zAbs = Math.abs(p.impZ);
                  const maxZAbs = Math.max(Math.abs(minZ), Math.abs(maxZ)) || 1;
                  radius = 2 + (zAbs / maxZAbs) * 8;
                }
                
                let tooltipLines = [`${paretoX}: ${p.impX > 0 ? '+' : ''}${p.impX.toFixed(2)}%`, `${paretoY}: ${p.impY > 0 ? '+' : ''}${p.impY.toFixed(2)}%`];
                if (paretoZ) tooltipLines.push(`${paretoZ}: ${p.impZ > 0 ? '+' : ''}${p.impZ.toFixed(2)}% (气泡大小)`);

                return (
                  <circle
                    key={`pareto-${p.case}`} cx={scx} cy={scy} r={isHovered ? radius + 2 : radius} fill={color} stroke="#fff" strokeWidth={isHovered ? "1" : "0.5"} fillOpacity={paretoZ ? 0.75 : 1}
                    className={`transition-all duration-200 cursor-pointer ${isHovered ? 'animate-pulse' : 'hover:stroke-gray-300'}`}
                    onMouseEnter={() => {
                      setHoveredCase(p.case);
                      setTooltipState({ visible: true, x: 0, y: 0, title: p.case, lines: tooltipLines });
                    }}
                    onMouseLeave={() => { setHoveredCase(null); setTooltipState(prev => ({...prev, visible: false})); }}
                  />
                );
              });
            })()}
          </svg>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">请在上方选择 X 轴与 Y 轴进行帕累托分析</div>
        )}
      </div>
    </div>
  );
};

export default ParetoChart;
