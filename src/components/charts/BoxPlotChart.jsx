import React from 'react';
import HelpIcon from '../common/HelpIcon';

const BoxPlotChart = ({ stats, activeMetric, handleChartMouseMove, hoveredCase, setHoveredCase, setTooltipState }) => {
  if (!stats) return null;

  return (
    <div className="p-6 h-full flex flex-col justify-center" onMouseMove={handleChartMouseMove}>
      <div className="bg-gray-50/50 p-8 rounded-xl border border-gray-200 max-w-4xl mx-auto w-full shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-1">
            改进率分布箱线图 ({activeMetric})
            <HelpIcon content="箱线图直观展示了单个指标在所有 Case 中的宏观分布情况。长条阴影覆盖了 50% 的核心密集区(IQR)，散落在阴影远端的散点即为异常离群点，研发工程师需要重点排查这些点是否引入了特定的 Bug。悬浮数据点可联动表格高亮。" tooltipWidth="w-[40rem]" position="right-center"/>
          </h3>
          <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-lg border shadow-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span> 异常离群点
            <span className="w-3 h-3 rounded-full bg-indigo-500 ml-2"></span> 核心密集区
          </span>
        </div>
        <div className="relative w-full h-80 border-l-2 border-b-2 border-gray-400 mt-2">
          <div className="absolute -left-14 top-0 text-xs font-bold text-gray-500 text-right w-12">{Math.ceil(stats.maxImp + 2)}%</div>
          <div className="absolute -left-14 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 text-right w-12">0%</div>
          <div className="absolute -left-14 bottom-0 text-xs font-bold text-gray-500 text-right w-12">{Math.floor(stats.minImp - 2)}%</div>
          
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            {(() => {
              const yMax = Math.max(Math.abs(stats.maxImp), Math.abs(stats.minImp)) + 5;
              const mapY = (val) => 50 - (val / yMax) * 50;
              return (
                <>
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
                  <rect x="0" y={mapY(stats.q3)} width="100" height={Math.max(0, mapY(stats.q1) - mapY(stats.q3))} fill="#e0e7ff" opacity="0.6" />
                  <line x1="0" y1={mapY(stats.median)} x2="100" y2={mapY(stats.median)} stroke="#4f46e5" strokeWidth="0.8" strokeDasharray="1 1" />
                  
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
                      <circle key={d.Case} cx={cx} cy={cy} r={isHovered ? "4" : (isOutlier ? "2.5" : "1.5")}
                        fill={dotColor} stroke={isHovered ? "#fff" : "none"} strokeWidth={isHovered ? "0.5" : "0"}
                        className={`transition-all duration-200 cursor-pointer ${isHovered ? 'animate-pulse' : 'hover:r-3'}`}
                        onMouseEnter={() => {
                          setHoveredCase(d.Case);
                          setTooltipState({ visible: true, x: 0, y: 0, title: d.Case, lines: [`状态: ${isOutlier ? (imp > 0 ? '显著优化(异常)' : '严重退化(异常)') : (imp > 0 ? '优化' : '退化')}`, `改进: ${imp > 0 ? '+' : ''}${imp.toFixed(2)}%`, `Base: ${d.bVal} | Comp: ${d.cVal}`] });
                        }}
                        onMouseLeave={() => { setHoveredCase(null); setTooltipState(prev => ({...prev, visible: false})); }}
                      />
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default BoxPlotChart;
