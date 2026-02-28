import React, { useState, useMemo } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartArea, ChartLegend } from '../common/ChartContainer';
import { getMetricConfig, computeStatistics } from '../../services/dataService';

const RadarChart = ({ allMetricsStats, availableAlgos, baseAlgo, compareAlgo, parsedData, selectedCases }) => {
  const algoColors = {
    'Base': { fill: 'none', stroke: '#9ca3af', strokeDasharray: '4 4', strokeWidth: 2, fillOpacity: 0, label: '基线' },
    'Algo1': { fill: '#818cf8', fillOpacity: 0.15, stroke: '#4f46e5', strokeWidth: 2, label: '算法1' },
    'Algo2': { fill: '#a7f3d0', fillOpacity: 0.15, stroke: '#059669', strokeWidth: 2, label: '算法2' },
    'Algo3': { fill: '#fca5a5', fillOpacity: 0.15, stroke: '#dc2626', strokeWidth: 2, label: '算法3' },
  };

  const getAlgoColor = (algoName, index) => {
    const shortName = algoName.replace('m_', '');
    if (algoColors[shortName]) return algoColors[shortName];
    const colors = [
      { fill: '#818cf8', fillOpacity: 0.15, stroke: '#4f46e5', strokeWidth: 2 },
      { fill: '#a7f3d0', fillOpacity: 0.15, stroke: '#059669', strokeWidth: 2 },
      { fill: '#fca5a5', fillOpacity: 0.15, stroke: '#dc2626', strokeWidth: 2 },
      { fill: '#fcd34d', fillOpacity: 0.15, stroke: '#d97706', strokeWidth: 2 },
      { fill: '#c4b5fd', fillOpacity: 0.15, stroke: '#7c3aed', strokeWidth: 2 },
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
        if (newSet.size > 1) newSet.delete(algo);
      } else {
        newSet.add(algo);
      }
      return newSet;
    });
  };

  const algoStatsMap = useMemo(() => {
    if (!parsedData || parsedData.length === 0 || !baseAlgo || !selectedCases) return {};
    const statsMap = {};
    const metrics = allMetricsStats.map(m => m.metric);
    
    Array.from(selectedAlgos).forEach(algo => {
      if (algo === baseAlgo) {
        statsMap[algo] = metrics.map(m => ({ metric: m, stats: { geomeanImp: 0 } }));
      } else {
        statsMap[algo] = metrics.map(m => ({
          metric: m,
          stats: computeStatistics(m, baseAlgo, algo, parsedData, selectedCases)
        }));
      }
    });
    return statsMap;
  }, [parsedData, selectedAlgos, baseAlgo, selectedCases, allMetricsStats]);

  const validMetrics = useMemo(() => allMetricsStats.filter(m => m.stats !== null), [allMetricsStats]);
  const selectedAlgosArray = useMemo(() => Array.from(selectedAlgos).filter(algo => algo !== baseAlgo), [selectedAlgos, baseAlgo]);

  if (!allMetricsStats || allMetricsStats.length === 0) return null;

  return (
    <ChartContainer>
      <ChartHeader
        title="全局多维雷达图"
        variant="primary"
        helpContent={
          <div className="space-y-1">
            <p className="font-bold text-indigo-400">全局多维雷达图</p>
            <div className="text-xs space-y-0.5">
              <p><b>基线：</b>正多边形虚线框</p>
              <p><b>向外：</b>优化 | <b>向内：</b>退化</p>
            </div>
          </div>
        }
        helpWidth="w-56"
      />

      <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap gap-1.5 flex-shrink-0">
        {availableAlgos.map((algo, index) => {
          const isSelected = selectedAlgos.has(algo);
          const color = getAlgoColor(algo, index);
          
          return (
            <button
              key={algo}
              onClick={() => toggleAlgoSelection(algo)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                isSelected ? 'shadow-sm' : 'opacity-50 hover:opacity-75'
              }`}
              style={{
                backgroundColor: isSelected ? color.fill : '#f3f4f6',
                borderColor: color.stroke,
                borderWidth: 1.5,
                borderStyle: 'solid',
                color: isSelected ? color.stroke : '#6b7280'
              }}
            >
              {isSelected ? <CheckSquare className="w-2.5 h-2.5" /> : <Square className="w-2.5 h-2.5" />}
              {algo}
            </button>
          );
        })}
      </div>
      
      <ChartArea className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30">
        <svg className="w-full h-full" viewBox="-200 -180 400 360" preserveAspectRatio="xMidYMid meet">
          {(() => {
            const N = validMetrics.length;
            if(N < 3) return <text x="0" y="0" textAnchor="middle" fill="#9ca3af" fontSize="10">至少需要 3 个指标</text>;
            
            const baseRadius = 70;
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
              <polygon key={`ring-${i}`} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="0.8" strokeDasharray={i===2 ? "" : "2 2"} />
            ));

            const renderAxes = () => validMetrics.map((m, i) => {
              const angle = (Math.PI * 2 * i) / N;
              const ptEnd = getPoint(angle, 100);
              const labelPt = getPoint(angle, 120);
              
              return (
                <g key={`axis-${i}`}>
                  <line x1="0" y1="0" x2={ptEnd.x} y2={ptEnd.y} stroke="#d1d5db" strokeWidth="0.8" />
                  <text x={labelPt.x} y={labelPt.y} fontSize="7" fontWeight="bold" fill="#4b5563" textAnchor="middle" dominantBaseline="middle">{m.metric}</text>
                  {selectedAlgosArray.map((algo, algoIdx) => {
                    const statsForAlgo = algoStatsMap[algo];
                    const metricStat = statsForAlgo?.find(s => s.metric === m.metric);
                    const imp = metricStat?.stats?.geomeanImp || 0;
                    const color = getAlgoColor(algo, availableAlgos.indexOf(algo));
                    return (
                      <text key={`imp-${algo}`} x={labelPt.x} y={labelPt.y + 9 + algoIdx * 8} fontSize="5" fontWeight="bold" fill={color.stroke} textAnchor="middle">
                        {imp > 0 ? '+' : ''}{imp.toFixed(1)}%
                      </text>
                    );
                  })}
                </g>
              );
            });

            const renderAlgoPolygons = () => {
              const elements = [];
              Array.from(selectedAlgos).forEach((algo) => {
                const color = getAlgoColor(algo, availableAlgos.indexOf(algo));
                const isBaseline = algo === baseAlgo;
                
                if (isBaseline) {
                  const basePolygon = Array.from({length: N}).map((_, i) => {
                    const pt = getPoint((Math.PI * 2 * i) / N, baseRadius); 
                    return `${pt.x},${pt.y}`;
                  }).join(' ');
                  elements.push(<polygon key={`algo-${algo}`} points={basePolygon} fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="3 3" />);
                } else {
                  const algoPolygon = validMetrics.map((m, i) => {
                    const config = getMetricConfig(m.metric);
                    const statsForAlgo = algoStatsMap[algo];
                    const metricStat = statsForAlgo?.find(s => s.metric === m.metric);
                    const imp = metricStat?.stats?.geomeanImp || 0;
                    let normalizedImp = config.better === 'higher' ? -imp : imp;
                    const scale = Math.max(0.3, Math.min(1.5, 1 + normalizedImp / 20));
                    const pt = getPoint((Math.PI * 2 * i) / N, baseRadius * scale); 
                    return `${pt.x},${pt.y}`;
                  }).join(' ');
                  elements.push(<polygon key={`algo-${algo}`} points={algoPolygon} fill={color.fill} fillOpacity={color.fillOpacity} stroke={color.stroke} strokeWidth={color.strokeWidth} />);
                }
              });
              return elements;
            };

            return (<>{renderRings()}{renderAxes()}{renderAlgoPolygons()}</>);
          })()}
        </svg>
        
        <div className="absolute top-2 left-2 flex flex-col gap-0.5 text-[9px] font-medium text-gray-600 bg-white/90 p-1.5 rounded border border-gray-200/50 shadow-sm">
          <div className="text-[8px] text-gray-400 font-semibold">图例</div>
          {Array.from(selectedAlgos).map(algo => {
            const color = getAlgoColor(algo, availableAlgos.indexOf(algo));
            const isBaseline = algo === baseAlgo;
            return (
              <div key={algo} className="flex items-center gap-1">
                <span className="w-2.5 h-1.5 rounded-sm" style={{ backgroundColor: isBaseline ? 'transparent' : color.fill, borderColor: isBaseline ? '#9ca3af' : color.stroke, borderWidth: 1.5, borderStyle: isBaseline ? 'dashed' : 'solid' }}></span>
                <span>{algo}{isBaseline ? '(基准)' : ''}</span>
              </div>
            );
          })}
        </div>
      </ChartArea>

      <ChartLegend items={[
        { label: '向外 = 优化', color: '#059669' },
        { label: '向内 = 退化', color: '#dc2626' }
      ]} />
    </ChartContainer>
  );
};

export default RadarChart;
