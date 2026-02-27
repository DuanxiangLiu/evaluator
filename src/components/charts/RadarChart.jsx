import React, { useState, useMemo } from 'react';
import { CheckSquare, Square, HelpCircle } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';

const RadarChart = ({ allMetricsStats, availableAlgos, baseAlgo, compareAlgo }) => {
  if (!allMetricsStats || allMetricsStats.length === 0) return null;

  // 定义算法颜色映射
  const algoColors = {
    'Base': { fill: 'none', stroke: '#9ca3af', strokeDasharray: '4 4', strokeWidth: 2, fillOpacity: 0, label: '基线' },
    'Algo1': { fill: '#818cf8', fillOpacity: 0.15, stroke: '#4f46e5', strokeWidth: 2, label: '算法1' },
    'Algo2': { fill: '#a7f3d0', fillOpacity: 0.15, stroke: '#059669', strokeWidth: 2, label: '算法2' },
    'Algo3': { fill: '#fca5a5', fillOpacity: 0.15, stroke: '#dc2626', strokeWidth: 2, label: '算法3' },
    'Algo4': { fill: '#fcd34d', fillOpacity: 0.15, stroke: '#d97706', strokeWidth: 2, label: '算法4' },
    'Algo5': { fill: '#c4b5fd', fillOpacity: 0.15, stroke: '#7c3aed', strokeWidth: 2, label: '算法5' },
  };

  // 获取算法的颜色配置
  const getAlgoColor = (algoName) => {
    const shortName = algoName.replace('m_', '');
    return algoColors[shortName] || { 
      fill: '#cbd5e1', 
      fillOpacity: 0.15, 
      stroke: '#64748b', 
      strokeWidth: 2, 
      label: algoName 
    };
  };

  // 初始化选中的算法（默认选中基线和当前对比算法）
  const [selectedAlgos, setSelectedAlgos] = useState(() => {
    const initial = new Set([baseAlgo]);
    if (compareAlgo) initial.add(compareAlgo);
    return initial;
  });

  // 切换算法选择
  const toggleAlgoSelection = (algo) => {
    setSelectedAlgos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(algo)) {
        // 至少保留一个算法
        if (newSet.size > 1) {
          newSet.delete(algo);
        }
      } else {
        newSet.add(algo);
      }
      return newSet;
    });
  };

  // 计算每个算法的统计数据
  const algoStats = useMemo(() => {
    const stats = {};
    // 这里我们使用 allMetricsStats 中的数据
    // 由于当前数据结构只包含 baseAlgo 和 compareAlgo 的对比
    // 我们需要从现有数据中提取信息
    return stats;
  }, [allMetricsStats, availableAlgos]);

  return (
    <div className="p-6 max-w-5xl mx-auto h-full flex flex-col w-full">
      <div className="flex justify-between items-center mb-6 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex-shrink-0">
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

      {/* 算法选择器 */}
      <div className="mb-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-bold text-gray-600">选择要显示的算法：</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableAlgos.map(algo => {
            const isSelected = selectedAlgos.has(algo);
            const color = getAlgoColor(algo);
            
            return (
              <button
                key={algo}
                onClick={() => toggleAlgoSelection(algo)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
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

            // 绘制网格环
            const renderRings = () => ringPolygons.map((pts, i) => (
              <polygon key={`ring-${i}`} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray={i===2 ? "" : "2 2"} />
            ));

            // 绘制坐标轴和标签
            const renderAxes = () => validMetrics.map((m, i) => {
              const angle = (Math.PI * 2 * i) / N;
              const ptEnd = getPoint(angle, 140);
              const labelPt = getPoint(angle, 160);
              const imp = m.stats.geomeanImp;
              return (
                <g key={`axis-${i}`}>
                  <line x1="0" y1="0" x2={ptEnd.x} y2={ptEnd.y} stroke="#d1d5db" strokeWidth="1" />
                  <text x={labelPt.x} y={labelPt.y} fontSize="8" fontWeight="bold" fill="#4b5563" textAnchor="middle" dominantBaseline="middle">{m.metric}</text>
                  <text x={labelPt.x} y={labelPt.y + 12} fontSize="7" fontWeight="bold" fill={imp >= 0 ? '#059669' : '#dc2626'} textAnchor="middle">{imp > 0 ? '+' : ''}{imp.toFixed(2)}%</text>
                </g>
              );
            });

            // 绘制算法多边形
            const renderAlgoPolygons = () => {
              const elements = [];
              const selectedAlgosArray = Array.from(selectedAlgos);
              
              selectedAlgosArray.forEach((algo, algoIndex) => {
                const color = getAlgoColor(algo);
                const isBaseline = algo === baseAlgo;
                
                if (isBaseline) {
                  // 绘制基线算法（正多边形）
                  const basePolygon = Array.from({length: N}).map((_, i) => {
                    const pt = getPoint((Math.PI * 2 * i) / N, baseRadius); 
                    return `${pt.x},${pt.y}`;
                  }).join(' ');
                  
                  elements.push(
                    <g key={`algo-${algo}`}>
                      <polygon 
                        points={basePolygon}
                        fill="none" 
                        stroke={color.stroke} 
                        strokeWidth={color.strokeWidth}
                        strokeDasharray={color.strokeDasharray}
                      />
                    </g>
                  );
                } else {
                  // 绘制评估算法（根据改进率绘制）
                  const algoPolygon = validMetrics.map((m, i) => {
                    const r = getRadius(m.stats.geomeanImp);
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
        
        {/* 图例 */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 text-xs font-bold text-gray-600 bg-white/80 p-3 rounded-lg backdrop-blur-md border border-gray-200 shadow-sm">
          {Array.from(selectedAlgos).map(algo => {
            const color = getAlgoColor(algo);
            const isBaseline = algo === baseAlgo;
            
            return (
              <div key={algo} className="flex items-center gap-2">
                <span 
                  className="w-4 h-3 rounded-sm"
                  style={{
                    backgroundColor: isBaseline ? 'transparent' : color.fill,
                    borderColor: color.stroke,
                    borderWidth: 2,
                    borderStyle: isBaseline ? 'dashed' : 'solid'
                  }}
                ></span>
                <span>{algo} {isBaseline ? '(基准)' : ''}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RadarChart;
