import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { CheckSquare, Square, BarChart3, TrendingUp, Trophy, ChevronDown, Check } from 'lucide-react';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartArea, ChartLegend } from '../common/ChartContainer';
import { computeStatistics } from '../../services/dataService';
import { ImprovementFormulaHelp } from '../common/HelpContents';
import { CHART_HEADER_STYLES } from '../../utils/constants';
import { useChartWidth } from '../../hooks/useChartWidth';

const METRIC_OPTIONS = [
  { id: 'geomeanImp', label: '几何平均改进', icon: TrendingUp, description: '综合改进效果', unit: '%', color: '#4f46e5' },
  { id: 'meanImp', label: '算术平均改进', icon: BarChart3, description: '平均改进率', unit: '%', color: '#059669' },
  { id: 'winRate', label: '胜率', icon: Trophy, description: '改进案例占比', unit: '%', color: '#d97706' }
];

const RadarChart = ({ allMetricsStats, availableAlgos, baseAlgo, compareAlgo, parsedData, selectedCases }) => {
  const chartWidth = useChartWidth();
  const [displayMetric, setDisplayMetric] = useState('geomeanImp');
  const [selectedAlgos, setSelectedAlgos] = useState(() => new Set(availableAlgos));
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const metricButtonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMetricDropdownOpen && metricButtonRef.current && dropdownRef.current) {
        if (!metricButtonRef.current.contains(e.target) && !dropdownRef.current.contains(e.target)) {
          setIsMetricDropdownOpen(false);
        }
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMetricDropdownOpen) {
        setIsMetricDropdownOpen(false);
      }
    };
    if (isMetricDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMetricDropdownOpen]);

  const handleMetricButtonClick = () => {
    if (!isMetricDropdownOpen && metricButtonRef.current) {
      const rect = metricButtonRef.current.getBoundingClientRect();
      const dropdownWidth = 200;
      const dropdownHeight = 150;
      let left = rect.left;
      let top = rect.bottom + 8;
      
      if (left + dropdownWidth > window.innerWidth - 10) {
        left = window.innerWidth - dropdownWidth - 10;
      }
      if (left < 10) left = 10;
      if (top + dropdownHeight > window.innerHeight - 10) {
        top = rect.top - dropdownHeight - 8;
      }
      
      setDropdownPosition({ top, left });
    }
    setIsMetricDropdownOpen(!isMetricDropdownOpen);
  };

  const handleMetricSelect = (metricId) => {
    setDisplayMetric(metricId);
    setIsMetricDropdownOpen(false);
  };

  const currentMetricOption = METRIC_OPTIONS.find(m => m.id === displayMetric);

  const getAlgoColor = (algoName, index) => {
    const colors = [
      { fill: '#818cf8', fillOpacity: 0.15, stroke: '#4f46e5', strokeWidth: 2 },
      { fill: '#a7f3d0', fillOpacity: 0.15, stroke: '#059669', strokeWidth: 2 },
      { fill: '#fca5a5', fillOpacity: 0.15, stroke: '#dc2626', strokeWidth: 2 },
      { fill: '#fcd34d', fillOpacity: 0.15, stroke: '#d97706', strokeWidth: 2 },
      { fill: '#c4b5fd', fillOpacity: 0.15, stroke: '#7c3aed', strokeWidth: 2 },
    ];
    return colors[index % colors.length];
  };

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

  const selectAllAlgos = () => {
    setSelectedAlgos(new Set(availableAlgos));
  };

  const algoStatsMap = useMemo(() => {
    if (!parsedData || parsedData.length === 0 || !baseAlgo || !selectedCases) return {};
    const statsMap = {};
    const metrics = allMetricsStats.map(m => m.metric);
    
    Array.from(selectedAlgos).forEach(algo => {
      if (algo === baseAlgo) {
        statsMap[algo] = metrics.map(m => ({ metric: m, stats: { geomeanImp: 0, meanImp: 0, winRate: 0 } }));
      } else {
        statsMap[algo] = metrics.map(m => {
          const stats = computeStatistics(m, baseAlgo, algo, parsedData, selectedCases);
          return {
            metric: m,
            stats: stats ? {
              geomeanImp: stats.geomeanImp || 0,
              meanImp: stats.meanImp || 0,
              winRate: stats.nValid > 0 ? ((stats.nValid - stats.degradedCount) / stats.nValid * 100) : 0
            } : { geomeanImp: 0, meanImp: 0, winRate: 0 }
          };
        });
      }
    });
    return statsMap;
  }, [parsedData, selectedAlgos, baseAlgo, selectedCases, allMetricsStats]);

  const validMetrics = useMemo(() => allMetricsStats.filter(m => m.stats !== null), [allMetricsStats]);
  const selectedAlgosArray = useMemo(() => Array.from(selectedAlgos).filter(algo => algo !== baseAlgo), [selectedAlgos, baseAlgo]);

  if (!allMetricsStats || allMetricsStats.length === 0) return null;

  const allSelected = selectedAlgos.size === availableAlgos.length;

  const getMetricValue = (stats) => {
    if (!stats) return 0;
    return stats[displayMetric] || 0;
  };

  const formatMetricValue = (value) => {
    if (displayMetric === 'winRate') {
      return `${value.toFixed(1)}%`;
    }
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <ChartContainer>
      <ChartHeader
        title="全局多维雷达图"
        variant="primary"
        helpContent={
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-indigo-400 text-sm mb-2">全局多维雷达图</h3>
              <p className="text-gray-300 text-xs mb-2">
                雷达图将多个指标的性能同时展示在一个图形中，便于直观比较不同算法的综合表现。
              </p>
            </div>
            
            <ImprovementFormulaHelp />
            
            <div className="space-y-2">
              <h4 className="font-semibold text-emerald-300 text-xs">图表解读</h4>
              <ul className="text-gray-300 text-xs space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>基线（虚线框）</strong>：基准算法的参考线</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span><strong>向外扩展</strong>：表示该指标有优化效果</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span><strong>向内收缩</strong>：表示该指标出现退化</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-emerald-300 text-xs">显示指标</h4>
              <ul className="text-gray-300 text-xs space-y-1">
                {METRIC_OPTIONS.map(opt => (
                  <li key={opt.id} className="flex items-center gap-2">
                    <opt.icon className="w-3 h-3" style={{ color: opt.color }} />
                    <span><strong>{opt.label}</strong>：{opt.description}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
              💡 点击算法标签可显示/隐藏对应的多边形，切换显示指标查看不同维度
            </div>
          </div>
        }
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative" ref={metricButtonRef}>
            <button
              onClick={handleMetricButtonClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-white transition-all shadow-sm border border-indigo-200"
            >
              <currentMetricOption.icon className="w-3.5 h-3.5" style={{ color: currentMetricOption.color }} />
              <span>{currentMetricOption.label}</span>
              <ChevronDown className={`w-3 h-3 text-indigo-500 transition-transform ${isMetricDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isMetricDropdownOpen && createPortal(
              <div
                ref={dropdownRef}
                className="fixed bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 z-[9999] overflow-hidden animate-scaleIn"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: '200px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
                  <span className="text-xs font-semibold text-gray-600">选择显示指标</span>
                </div>
                <div className="py-1">
                  {METRIC_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleMetricSelect(opt.id)}
                      className={`w-full px-3 py-2.5 text-left text-sm hover:bg-indigo-50 flex items-center gap-2 transition-colors ${
                        displayMetric === opt.id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <opt.icon className="w-4 h-4" style={{ color: opt.color }} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{opt.label}</div>
                        <div className="text-xs text-gray-400">{opt.description}</div>
                      </div>
                      {displayMetric === opt.id && (
                        <Check className="w-4 h-4 text-indigo-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {availableAlgos.map((algo, index) => {
              const isSelected = selectedAlgos.has(algo);
              const color = getAlgoColor(algo, index);

              return (
                <button
                  key={algo}
                  onClick={() => toggleAlgoSelection(algo)}
                  className={`${CHART_HEADER_STYLES.BUTTON} ${isSelected ? CHART_HEADER_STYLES.BUTTON_SELECTED : CHART_HEADER_STYLES.BUTTON_UNSELECTED}`}
                  style={{
                    backgroundColor: isSelected ? color.stroke : 'rgba(255,255,255,0.15)',
                    borderColor: color.stroke,
                    borderWidth: 2,
                    borderStyle: 'solid',
                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.9)'
                  }}
                >
                  {isSelected ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                  {algo}
                </button>
              );
            })}
          </div>
          <button
            onClick={selectAllAlgos}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all border-2 ${allSelected ? 'bg-white text-indigo-600 border-white' : 'bg-white/15 text-white border-white/50 hover:bg-white/25'}`}
          >
            全选
          </button>
        </div>
      </ChartHeader>
      
      <ChartArea className={`bg-gradient-to-br from-indigo-50/30 to-purple-50/30 ${chartWidth} mx-auto w-full`}>
        <svg className="w-full h-full" viewBox="-200 -200 400 400" preserveAspectRatio="xMidYMid meet">
          {(() => {
            const N = validMetrics.length;
            if(N < 3) return <text x="0" y="0" textAnchor="middle" fill="#9ca3af" fontSize="10">至少需要 3 个指标</text>;
            
            const baseRadius = 100;
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
              const ptEnd = getPoint(angle, 140);
              const labelPt = getPoint(angle, 175);
              
              return (
                <g key={`axis-${i}`}>
                  <line x1="0" y1="0" x2={ptEnd.x} y2={ptEnd.y} stroke="#d1d5db" strokeWidth="0.8" />
                  <text x={labelPt.x} y={labelPt.y} fontSize="10" fontWeight="bold" fill="#4b5563" textAnchor="middle" dominantBaseline="middle">{m.metric}</text>
                  {selectedAlgosArray.map((algo, algoIdx) => {
                    const statsForAlgo = algoStatsMap[algo];
                    const metricStat = statsForAlgo?.find(s => s.metric === m.metric);
                    const value = getMetricValue(metricStat?.stats);
                    const color = getAlgoColor(algo, availableAlgos.indexOf(algo));
                    return (
                      <text key={`imp-${algo}`} x={labelPt.x} y={labelPt.y + 12 + algoIdx * 11} fontSize="9" fontWeight="bold" fill={color.stroke} textAnchor="middle">
                        {formatMetricValue(value)}
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
                    const statsForAlgo = algoStatsMap[algo];
                    const metricStat = statsForAlgo?.find(s => s.metric === m.metric);
                    const value = getMetricValue(metricStat?.stats);
                    let scale;
                    if (displayMetric === 'winRate') {
                      scale = Math.max(0.3, Math.min(1.5, value / 100 * 1.5));
                    } else {
                      scale = Math.max(0.3, Math.min(1.5, 1 + value / 20));
                    }
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
      </ChartArea>

      <ChartLegend items={[
        { label: '向外 = 优化', color: '#059669' },
        { label: '向内 = 退化', color: '#dc2626' },
        { label: `当前: ${currentMetricOption?.label}`, color: currentMetricOption?.color || '#4f46e5' }
      ]} />
    </ChartContainer>
  );
};

RadarChart.propTypes = {
  allMetricsStats: PropTypes.arrayOf(PropTypes.shape({
    metric: PropTypes.string.isRequired,
    stats: PropTypes.object
  })).isRequired,
  availableAlgos: PropTypes.arrayOf(PropTypes.string).isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string,
  parsedData: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedCases: PropTypes.object.isRequired
};

export default RadarChart;
