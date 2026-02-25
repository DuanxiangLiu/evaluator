import React from 'react';
import HelpIcon from '../common/HelpIcon';

const RadarChart = ({ allMetricsStats, baseAlgo, compareAlgo }) => {
  if (!allMetricsStats || allMetricsStats.length === 0) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto h-full flex flex-col w-full">
      <div className="flex justify-between items-center mb-10 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex-shrink-0">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-1">
            全局多维雷达图 (Geomean Improvement)
            <HelpIcon content="雷达图(Spider Chart)是多目标优化(MOO)领域的标准工具。基线算法(Base)呈现为一个正多边形，新算法(Comp)的阴影面积如果完美包裹住基线，代表实现了『全面占优』；如果某个角凹陷，代表在该指标上付出了退化的代价。" tooltipWidth="w-72" position="right-center"/>
          </h3>
        </div>
      </div>
      
      <div className="relative w-full flex-1 max-h-[500px] flex items-center justify-center bg-gray-50/50 rounded-xl border border-gray-100 shadow-inner">
        <svg className="w-full h-full overflow-visible" viewBox="-150 -150 300 300" preserveAspectRatio="xMidYMid meet">
          {(() => {
            const validMetrics = allMetricsStats.filter(m => m.stats !== null);
            const N = validMetrics.length;
            if(N < 3) return <text x="0" y="0" textAnchor="middle" fill="#9ca3af" fontSize="12">生成雷达图至少需要 3 个有效的比对指标</text>;
            
            const maxImp = Math.max(...validMetrics.map(s => Math.abs(s.stats.geomeanImp))) * 1.5 || 20;
            const baseRadius = 75;
            const getRadius = (imp) => baseRadius + (imp / maxImp) * 50;
            const getPoint = (angle, r) => ({ x: r * Math.sin(angle), y: -r * Math.cos(angle) });

            const rings = [0.2, 0.6, 1.0, 1.4];
            const ringPolygons = rings.map(scale => {
              const r = baseRadius * scale;
              return Array.from({length: N}).map((_, i) => {
                const pt = getPoint((Math.PI * 2 * i) / N, r);
                return `${pt.x},${pt.y}`;
              }).join(' ');
            });

            const basePolygon = Array.from({length: N}).map((_, i) => {
              const pt = getPoint((Math.PI * 2 * i) / N, baseRadius); return `${pt.x},${pt.y}`;
            }).join(' ');

            const compPolygon = validMetrics.map((m, i) => {
              const r = getRadius(m.stats.geomeanImp);
              const pt = getPoint((Math.PI * 2 * i) / N, r); return `${pt.x},${pt.y}`;
            }).join(' ');

            return (
              <>
                {ringPolygons.map((pts, i) => (
                  <polygon key={`ring-${i}`} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray={i===2 ? "" : "2 2"} />
                ))}
                {validMetrics.map((m, i) => {
                  const angle = (Math.PI * 2 * i) / N;
                  const ptEnd = getPoint(angle, 140);
                  const labelPt = getPoint(angle, 160);
                  const imp = m.stats.geomeanImp;
                  const ptData = getPoint(angle, getRadius(imp));
                  return (
                    <g key={`axis-${i}`}>
                      <line x1="0" y1="0" x2={ptEnd.x} y2={ptEnd.y} stroke="#d1d5db" strokeWidth="1" />
                      <text x={labelPt.x} y={labelPt.y} fontSize="8" fontWeight="bold" fill="#4b5563" textAnchor="middle" dominantBaseline="middle">{m.metric}</text>
                      <text x={labelPt.x} y={labelPt.y + 12} fontSize="7" fontWeight="bold" fill={imp >= 0 ? '#059669' : '#dc2626'} textAnchor="middle">{imp > 0 ? '+' : ''}{imp.toFixed(2)}%</text>
                      <circle cx={ptData.x} cy={ptData.y} r="3" fill="#4f46e5" stroke="#fff" strokeWidth="1"/>
                    </g>
                  );
                })}
                
                <polygon points={basePolygon} fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 4" />
                <text x="-40" y="-85" fontSize="6" fill="#9ca3af" fontWeight="bold" transform="rotate(-15, -40, -85)">{baseAlgo}</text>

                <polygon points={compPolygon} fill="#818cf8" fillOpacity="0.2" stroke="#4f46e5" strokeWidth="2" />
              </>
            );
          })()}
        </svg>
        <div className="absolute top-4 left-4 flex flex-col gap-2 text-xs font-bold text-gray-600 bg-white/80 p-3 rounded-lg backdrop-blur-md border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2"><span className="w-4 h-0.5 border-t-2 border-dashed border-gray-400"></span> {baseAlgo} (基准)</div>
          <div className="flex items-center gap-2"><span className="w-4 h-3 bg-indigo-400/30 border-2 border-indigo-600 rounded-sm"></span> {compareAlgo} (评估组)</div>
        </div>
      </div>
    </div>
  );
};

export default RadarChart;
