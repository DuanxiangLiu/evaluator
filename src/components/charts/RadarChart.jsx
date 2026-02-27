import React, { useState, useMemo } from 'react';
import { CheckSquare, Square, HelpCircle } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import { getMetricConfig, computeStatistics } from '../../services/dataService';

const RadarChart = ({ allMetricsStats, availableAlgos, baseAlgo, compareAlgo, parsedData, selectedCases }) => {
  const algoColors = {
    'Base': { fill: 'none', stroke: '#9ca3af', strokeDasharray: '4 4', strokeWidth: 2, fillOpacity: 0, label: '基线' },
    'Algo1': { fill: '#818cf8', fillOpacity: 0.15, stroke: '#4f46e5', strokeWidth: 2, label: '算法1' },
    'Algo2': { fill: '#a7f3d0', fillOpacity: 0.15, stroke: '#059669', strokeWidth: 2, label: '算法2' },
    'Algo3': { fill: '#fca5a5', fillOpacity: 0.15, stroke: '#dc2626', strokeWidth: 2, label: '算法3' },
    'Algo4': { fill: '#fcd34d', fillOpacity: 0.15, stroke: '#d97706', strokeWidth: 2, label: '算法4' },
    'Algo5': { fill: '#c4b5fd', fillOpacity: 0.15, stroke: '#7c3aed', strokeWidth: 2, label: '算法5' },
  };

  const getAlgoColor = (algoName, index) => {
    const shortName = algoName.replace('m_', '');
    if (algoColors[shortName]) {
      return algoColors[shortName];
    }
    const colors = [
      { fill: '#818cf8', fillOpacity: 0.15, stroke: '#4f46e5', strokeWidth: 2 },
      { fill: '#a7f3d0', fillOpacity: 0.15, stroke: '#059669', strokeWidth: 2 },
      { fill: '#fca5a5', fillOpacity: 0.15, stroke: '#dc2626', strokeWidth: 2 },
      { fill: '#fcd34d', fillOpacity: 0.15, stroke: '#d97706', strokeWidth: 2 },
      { fill: '#c4b5fd', fillOpacity: 0.15, stroke: '#7c3aed', strokeWidth: 2 },
      { fill: '#93c5fd', fillOpacity: 0.15, stroke: '#2563eb', strokeWidth: 2 },
      { fill: '#f9a8d4', fillOpacity: 0.15, stroke: '#db2777', strokeWidth: 2 },
    ];
    return colors[index % colors.length];
  };

  const [selectedAlgos, setSelectedAlgos] = useState(() => {
    const initial = new Set([baseAlgo]);
    if (compareAlgo) initial.add(compareAlgo);
    return initial;
  });

  const toggleAlgoSelection = (algo) => {
    setSelectedAlgos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(algo)) {
        if (newSet.size > 1) {
          newSet.delete(algo);
        }
      } else {
        newSet.add(algo);
      }
      return newSet;
    });
  };

  const algoStatsMap = useMemo(() => {
    if (!parsedData || parsedData.length === 0 || !baseAlgo || !selectedCases) {
      return {};
    }

    const statsMap = {};
    const metrics = allMetricsStats.map(m => m.metric);
    
    Array.from(selectedAlgos).forEach(algo => {
      if (algo === baseAlgo) {
        statsMap[algo] = metrics.map(m => ({
          metric: m,
          stats: { geomeanImp: 0 }
        }));
      } else {
        statsMap[algo] = metrics.map(m => ({
          metric: m,
          stats: computeStatistics(m, baseAlgo, algo, parsedData, selectedCases)
        }));
      }
    });

    return statsMap;
  }, [parsedData, selectedAlgos, baseAlgo, selectedCases, allMetricsStats]);

  const validMetrics = useMemo(() => {
    return allMetricsStats.filter(m => m.stats !== null);
  }, [allMetricsStats]);

  const selectedAlgosArray = useMemo(() => {
    return Array.from(selectedAlgos).filter(algo => algo !== baseAlgo);
  }, [selectedAlgos, baseAlgo]);

  if (!allMetricsStats || allMetricsStats.length === 0) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto h-full flex flex-col w-full">
      <div className="flex justify-between items-center mb-6 bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-gray-200/50 shadow-lg flex-shrink-0">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            全局多维雷达图 (Geomean Improvement)
            <HelpIcon 
              content={
                <div className="space-y-3">
                  <p className="font-bold text-indigo-400 text-lg">全局多维雷达图</p>
                  <div className="space-y-2 text-sm">
                    <p>雷达图 (Spider Chart) 是多目标优化 (MOO) 领域的标准工具。</p>
                    <p><b>基线算法：</b>呈现为一个正多边形虚线框</p>
                    <p><b>评估算法：</b>阴影面积如果包裹住基线，代表全面占优</p>
                    <p><b>凹陷区域：</b>代表在该指标上付出了退化的代价</p>
                    <p><b>方向说明：</b>向外扩展表示优化，向内收缩表示退化</p>
                    <p><b>勾选算法：</b>点击下方算法标签可显示/隐藏对应算法</p>
                  </div>
                </div>
              }
              tooltipWidth="w-[40rem]"
              position="right-center"
            />
          </h3>
        </div>
      </div>

      <div className="mb-4 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/50 shadow-lg flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">选择要显示的算法：</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableAlgos.map((algo, index) => {
            const isSelected = selectedAlgos.has(algo);
            const color = getAlgoColor(algo, index);
            
            return (
              <button
                key={algo}
                onClick={() => toggleAlgoSelection(algo)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  isSelected 
                    ? 'shadow-md' 
                    : 'opacity-50 hover:opacity-75'
                }`}
                style={{
                  backgroundColor: isSelected ? color.fill : '#f3f4f6',
                  borderColor: color.stroke,
                  borderWidth: 2,
                  borderStyle: 'solid',
                  color: isSelected ? color.stroke : '#6b7280'
                }}
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {algo}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="relative w-full flex-1 max-h-[500px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl border border-gray-200/50 shadow-inner">
        <svg className="w-full h-full overflow-visible" viewBox="-180 -150 360 300" preserveAspectRatio="xMidYMid meet">
          {(() => {
            const N = validMetrics.length;
            if(N < 3) return <text x="0" y="0" textAnchor="middle" fill="#9ca3af" fontSize="12">生成雷达图至少需要 3 个有效的比对指标</text>;
            
            const baseRadius = 75;
            
            const getPoint = (angle, r) => ({ x: r * Math.sin(angle), y: -r * Math.cos(angle) });

            const rings = [0.33, 0.67, 1.0, 1.33];
            const ringPolygons = rings.map(scale => {
              const r = baseRadius * scale;
              return Array.from({length: N}).map((_, i) => {
                const pt = getPoint((Math.PI * 2 * i) / N, r);
                return `${pt.x},${pt.y}`;
              }).join(' ');
            });

            const renderRings = () => ringPolygons.map((pts, i) => (
              <polygon key={`ring-${i}`} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray={i===2 ? "" : "2 2"} />
            ));

            const renderAxes = () => validMetrics.map((m, i) => {
              const angle = (Math.PI * 2 * i) / N;
              const ptEnd = getPoint(angle, 140);
              const labelPt = getPoint(angle, 170);
              const config = getMetricConfig(m.metric);
              
              return (
                <g key={`axis-${i}`}>
                  <line x1="0" y1="0" x2={ptEnd.x} y2={ptEnd.y} stroke="#d1d5db" strokeWidth="1" />
                  <text x={labelPt.x} y={labelPt.y} fontSize="9" fontWeight="bold" fill="#4b5563" textAnchor="middle" dominantBaseline="middle">{m.metric}</text>
                  {selectedAlgosArray.map((algo, algoIdx) => {
                    const statsForAlgo = algoStatsMap[algo];
                    const metricStat = statsForAlgo?.find(s => s.metric === m.metric);
                    const imp = metricStat?.stats?.geomeanImp || 0;
                    const color = getAlgoColor(algo, availableAlgos.indexOf(algo));
                    
                    return (
                      <text 
                        key={`imp-${algo}`}
                        x={labelPt.x} 
                        y={labelPt.y + 12 + algoIdx * 11} 
                        fontSize="7" 
                        fontWeight="bold" 
                        fill={color.stroke}
                        textAnchor="middle"
                      >
                        {algo}: {imp > 0 ? '+' : ''}{imp.toFixed(1)}%
                      </text>
                    );
                  })}
                </g>
              );
            });

            const renderAlgoPolygons = () => {
              const elements = [];
              const allSelectedAlgos = Array.from(selectedAlgos);
              
              allSelectedAlgos.forEach((algo, algoIndex) => {
                const color = getAlgoColor(algo, availableAlgos.indexOf(algo));
                const isBaseline = algo === baseAlgo;
                
                if (isBaseline) {
                  const basePolygon = Array.from({length: N}).map((_, i) => {
                    const pt = getPoint((Math.PI * 2 * i) / N, baseRadius); 
                    return `${pt.x},${pt.y}`;
                  }).join(' ');
                  
                  elements.push(
                    <g key={`algo-${algo}`}>
                      <polygon 
                        points={basePolygon}
                        fill="none" 
                        stroke="#9ca3af" 
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                    </g>
                  );
                } else {
                  const algoPolygon = validMetrics.map((m, i) => {
                    const config = getMetricConfig(m.metric);
                    const statsForAlgo = algoStatsMap[algo];
                    const metricStat = statsForAlgo?.find(s => s.metric === m.metric);
                    const imp = metricStat?.stats?.geomeanImp || 0;
                    
                    let normalizedImp = imp;
                    if (config.better === 'higher') {
                      normalizedImp = -imp;
                    }
                    
                    const maxImp = 20;
                    const scale = Math.max(0.3, Math.min(1.5, 1 + normalizedImp / maxImp));
                    const r = baseRadius * scale;
                    const pt = getPoint((Math.PI * 2 * i) / N, r); 
                    return `${pt.x},${pt.y}`;
                  }).join(' ');
                  
                  elements.push(
                    <g key={`algo-${algo}`}>
                      <polygon 
                        points={algoPolygon}
                        fill={color.fill} 
                        fillOpacity={color.fillOpacity}
                        stroke={color.stroke} 
                        strokeWidth={color.strokeWidth}
                      />
                    </g>
                  );
                }
              });
              
              return elements;
            };

            return (
              <>
                {renderRings()}
                {renderAxes()}
                {renderAlgoPolygons()}
              </>
            );
          })()}
        </svg>
        
        <div className="absolute top-4 left-4 flex flex-col gap-2 text-xs font-medium text-gray-600 bg-white/90 p-3 rounded-xl backdrop-blur-md border border-gray-200/50 shadow-lg">
          <div className="text-[10px] text-gray-400 mb-1">图例说明</div>
          {Array.from(selectedAlgos).map(algo => {
            const color = getAlgoColor(algo, availableAlgos.indexOf(algo));
            const isBaseline = algo === baseAlgo;
            
            return (
              <div key={algo} className="flex items-center gap-2">
                <span 
                  className="w-4 h-3 rounded-sm"
                  style={{
                    backgroundColor: isBaseline ? 'transparent' : color.fill,
                    borderColor: isBaseline ? '#9ca3af' : color.stroke,
                    borderWidth: 2,
                    borderStyle: isBaseline ? 'dashed' : 'solid'
                  }}
                ></span>
                <span>{algo} {isBaseline ? '(基准)' : ''}</span>
              </div>
            );
          })}
          <div className="border-t border-gray-200 pt-2 mt-1 text-[10px] text-gray-400">
            <div>向外 = 优化 | 向内 = 退化</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadarChart;
