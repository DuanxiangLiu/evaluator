import React from 'react';
import PropTypes from 'prop-types';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartBody, ChartArea, ChartLegend, AreaLabel, EmptyState } from '../common/ChartContainer';
import { Circle } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import { calculateImprovementWithDirection } from '../../utils/statistics';
import { getMetricConfig } from '../../services/csvParser';
import { ImprovementFormulaHelp } from '../common/HelpContents';
import { CHART_HEADER_STYLES } from '../../utils/constants';
import { useChartWidth } from '../../hooks/useChartWidth';

const ParetoChart = ({ 
  parsedData, selectedCases, availableMetrics, 
  paretoX, paretoY, paretoZ, setParetoX, setParetoY, setParetoZ, 
  handleChartMouseMove, hoveredCase, setHoveredCase, setTooltipState, 
  baseAlgo, compareAlgo,
  onCaseClick
}) => {
  const chartWidth = useChartWidth();
  
  const validPoints = parsedData.filter(d => selectedCases.has(d.Case)).map(d => {
    const bx = d.raw[paretoX]?.[baseAlgo], cx = d.raw[paretoX]?.[compareAlgo];
    const by = d.raw[paretoY]?.[baseAlgo], cy = d.raw[paretoY]?.[compareAlgo];
    
    let bz = 1, cz = 1;
    if (paretoZ) { bz = d.raw[paretoZ]?.[baseAlgo]; cz = d.raw[paretoZ]?.[compareAlgo]; }

    if(bx==null || cx==null || by==null || cy==null || (paretoZ && (bz==null||cz==null))) return null;
    
    const configX = getMetricConfig(paretoX);
    const configY = getMetricConfig(paretoY);
    const configZ = paretoZ ? getMetricConfig(paretoZ) : null;
    
    const impX = calculateImprovementWithDirection(bx, cx, configX.better === 'higher');
    const impY = calculateImprovementWithDirection(by, cy, configY.better === 'higher');
    const impZ = paretoZ ? calculateImprovementWithDirection(bz, cz, configZ.better === 'higher') : 0;

    if (impX === null || impY === null || (paretoZ && impZ === null)) return null;

    return { case: d.Case, impX, impY, impZ, raw: d };
  }).filter(p => p !== null);

  const xVals = validPoints.map(p => p.impX);
  const yVals = validPoints.map(p => p.impY);
  
  const maxAbsX = xVals.length > 0 ? Math.max(...xVals.map(v => Math.abs(v)), 5) * 1.15 : 6;
  const maxAbsY = yVals.length > 0 ? Math.max(...yVals.map(v => Math.abs(v)), 5) * 1.15 : 6;

  let minZ = 0, maxZ = 0;
  if (paretoZ && validPoints.length > 0) {
    const zVals = validPoints.map(p => p.impZ);
    minZ = Math.min(...zVals); 
    maxZ = Math.max(...zVals);
  }

  const sortedPoints = [...validPoints].sort((a,b) => (paretoZ ? Math.abs(b.impZ) - Math.abs(a.impZ) : 0));

  const mapX = (val) => 50 + (val / maxAbsX) * 45;
  const mapY = (val) => 50 - (val / maxAbsY) * 45;

  const xTicks = [];
  const yTicks = [];
  const tickCount = 4;
  for (let i = 0; i <= tickCount; i++) {
    const xVal = -maxAbsX + (2 * maxAbsX) * (i / tickCount);
    const yVal = -maxAbsY + (2 * maxAbsY) * (i / tickCount);
    xTicks.push({ val: xVal, pos: mapX(xVal) });
    yTicks.push({ val: yVal, yPos: mapY(yVal) });
  }

  const formatTickValue = (val) => {
    if (Math.abs(val) >= 10) return `${val > 0 ? '+' : ''}${val.toFixed(0)}%`;
    if (Math.abs(val) >= 1) return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  const renderContent = () => {
    if (!paretoX || !paretoY || sortedPoints.length === 0) {
      return <EmptyState message="请选择 X 轴与 Y 轴进行分析" />;
    }

    return (
      <ChartBody className={`${chartWidth} mx-auto w-full`}>
        <div className="flex flex-col justify-between text-right pr-2 py-1 text-xs font-semibold text-gray-500 w-14 flex-shrink-0 relative">
          {yTicks.slice().reverse().map((tick, i) => (
            <span 
              key={i} 
              className={`
                absolute right-2 text-xs font-medium tabular-nums
                ${tick.val > 0 ? 'text-green-600' : ''} 
                ${tick.val < 0 ? 'text-red-500' : ''}
              `}
              style={{ top: `${tick.yPos}%`, transform: 'translateY(-50%)' }}
            >
              {formatTickValue(tick.val)}
            </span>
          ))}
          {yTicks.find(tick => tick.val === 0) && (
            <span 
              className="absolute right-2 text-xs font-medium tabular-nums text-gray-400"
              style={{ top: `${yTicks.find(tick => tick.val === 0).yPos - 5}%`, transform: 'translateY(-50%)' }}
            >
              {paretoY || 'Y'}
            </span>
          )}
        </div>
        
        <ChartArea className="border-l-2 border-b-2 border-gray-300 flex-1 bg-gradient-to-br from-green-50/30 via-white to-red-50/30">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-green-100/20 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-red-100/20 to-transparent pointer-events-none"></div>
            
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              {yTicks.map((tick, i) => (
                <line 
                  key={`ytick-${i}`}
                  x1="0" 
                  y1={tick.yPos} 
                  x2="100" 
                  y2={tick.yPos} 
                  stroke={tick.val === 0 ? "#9ca3af" : "#e5e7eb"} 
                  strokeWidth={tick.val === 0 ? "0.5" : "0.3"} 
                  strokeDasharray={tick.val === 0 ? "2 2" : "1 2"}
                />
              ))}
              {xTicks.map((tick, i) => (
                <line 
                  key={`xtick-${i}`}
                  x1={tick.pos} 
                  y1="0" 
                  x2={tick.pos} 
                  y2="100" 
                  stroke={tick.val === 0 ? "#9ca3af" : "#e5e7eb"} 
                  strokeWidth={tick.val === 0 ? "0.5" : "0.3"} 
                  strokeDasharray={tick.val === 0 ? "2 2" : "1 2"}
                />
              ))}
              
              {sortedPoints.map((p) => {
                const isHovered = hoveredCase === p.case;
                const scx = Math.max(5, Math.min(95, mapX(p.impX)));
                const scy = Math.max(5, Math.min(95, mapY(p.impY)));
                
                let color = '#6366f1';
                if (p.impX > 0 && p.impY > 0) color = '#059669';
                else if (p.impX < 0 && p.impY < 0) color = '#dc2626';

                let baseRadius = 1;
                if (paretoZ) {
                  const zAbs = Math.abs(p.impZ);
                  const maxZAbs = Math.max(Math.abs(minZ), Math.abs(maxZ)) || 1;
                  baseRadius = 0.6 + (zAbs / maxZAbs) * 1.4;
                }
                
                const radius = isHovered ? 2 : baseRadius;
                
                const tooltipLines = [];
                if (p.impX > 0) {
                  tooltipLines.push({ text: `${paretoX}: +${p.impX.toFixed(2)}%`, color: 'text-green-400' });
                } else if (p.impX < 0) {
                  tooltipLines.push({ text: `${paretoX}: ${p.impX.toFixed(2)}%`, color: 'text-red-400' });
                } else {
                  tooltipLines.push(`${paretoX}: 0.00%`);
                }
                if (p.impY > 0) {
                  tooltipLines.push({ text: `${paretoY}: +${p.impY.toFixed(2)}%`, color: 'text-green-400' });
                } else if (p.impY < 0) {
                  tooltipLines.push({ text: `${paretoY}: ${p.impY.toFixed(2)}%`, color: 'text-red-400' });
                } else {
                  tooltipLines.push(`${paretoY}: 0.00%`);
                }
                if (paretoZ) {
                  if (p.impZ > 0) {
                    tooltipLines.push({ text: `${paretoZ}: +${p.impZ.toFixed(2)}%`, color: 'text-green-400' });
                  } else if (p.impZ < 0) {
                    tooltipLines.push({ text: `${paretoZ}: ${p.impZ.toFixed(2)}%`, color: 'text-red-400' });
                  } else {
                    tooltipLines.push(`${paretoZ}: 0.00%`);
                  }
                }

                return (
                  <g key={`pareto-${p.case}`} className="cursor-pointer" onMouseEnter={(e) => {
                    setHoveredCase(p.case);
                    setTooltipState({ visible: true, x: e.clientX, y: e.clientY, title: p.case, lines: tooltipLines });
                  }}
                  onMouseMove={(e) => {
                    setTooltipState(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
                  }}
                  onMouseLeave={() => { setHoveredCase(null); setTooltipState(prev => ({...prev, visible: false})); }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setHoveredCase(null);
                    setTooltipState(prev => ({...prev, visible: false}));
                    if (onCaseClick) onCaseClick(p.case);
                  }}>
                    <circle
                      cx={scx} cy={scy} r="6"
                      fill="transparent"
                    />
                    <circle
                      cx={scx} cy={scy} 
                      r={radius} 
                      fill={color} 
                      stroke={isHovered ? "#fff" : "none"} 
                      strokeWidth="0.3"
                      className={`transition-all duration-200 pointer-events-none ${isHovered ? 'animate-pulse' : ''}`}
                    />
                  </g>
                );
              })}
            </svg>
            
            <AreaLabel position="top-right" variant="success">双赢 ↑</AreaLabel>
            <AreaLabel position="bottom-left" variant="danger">双输 ↓</AreaLabel>
          </ChartArea>
      </ChartBody>
    );
  };

  return (
    <ChartContainer onMouseMove={handleChartMouseMove}>
      <ChartHeader
        title="Pareto Front 多维气泡分析"
        helpContent={
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-indigo-400 text-sm mb-2">Pareto Front 多维气泡分析</h3>
              <p className="text-gray-300 text-xs mb-2">
                同时观察两个或三个指标的改进情况，识别「双赢」或「Trade-off」的用例。
              </p>
            </div>
            
            <ImprovementFormulaHelp />
            
            <div className="space-y-2">
              <h4 className="font-semibold text-emerald-300 text-xs">象限解读</h4>
              <ul className="text-gray-300 text-xs space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span><strong>右上（绿色）</strong>：双赢区域，两个指标同时优化</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span><strong>左下（红色）</strong>：双输区域，两个指标同时退化</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>对角区域</strong>：Trade-off，一个优化一个退化</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
              💡 <strong>提示</strong>：气泡大小表示第三指标的改进幅度（可选）
            </div>
          </div>
        }
        helpPosition="right-center"
      >
        <div className="flex items-center gap-2 text-xs">
          <span className={CHART_HEADER_STYLES.LABEL}>X:</span>
          <select value={paretoX} onChange={(e) => setParetoX(e.target.value)} className={CHART_HEADER_STYLES.SELECT}>
            <option value="">--</option>
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className={`${CHART_HEADER_STYLES.LABEL} ml-1`}>Y:</span>
          <select value={paretoY} onChange={(e) => setParetoY(e.target.value)} className={CHART_HEADER_STYLES.SELECT}>
            <option value="">--</option>
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className={`${CHART_HEADER_STYLES.LABEL_ACCENT} ml-1 flex items-center gap-0.5`}>
            <Circle className="w-2.5 h-2.5"/>Z:
            <HelpIcon 
              content={
                <div className="space-y-2">
                  <h4 className="font-semibold text-indigo-300 text-xs">Z 轴 - 气泡大小</h4>
                  <p className="text-gray-300 text-xs">
                    Z 轴控制气泡的大小，表示第三个指标的改进幅度。
                  </p>
                  <ul className="text-gray-300 text-xs space-y-1">
                    <li>• <strong>气泡越大</strong>：该指标改进幅度越大</li>
                    <li>• <strong>气泡越小</strong>：该指标改进幅度越小或退化</li>
                    <li>• <strong>关闭 Z 轴</strong>：所有气泡大小相同</li>
                  </ul>
                  <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
                    💡 适合同时观察三个指标的综合表现
                  </div>
                </div>
              }
              className="w-3 h-3"
            />
          </span>
          <select value={paretoZ} onChange={(e) => setParetoZ(e.target.value)} className={CHART_HEADER_STYLES.SELECT_ACCENT}>
            <option value="">关</option>
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </ChartHeader>

      {(() => {
        if (!paretoX || !paretoY || validPoints.length === 0) return null;
        
        if (paretoZ) {
          const tripleWin = validPoints.filter(p => p.impX > 0 && p.impY > 0 && p.impZ > 0).length;
          const tripleLose = validPoints.filter(p => p.impX < 0 && p.impY < 0 && p.impZ < 0).length;
          const doubleWin = validPoints.filter(p => {
            const positives = [p.impX > 0, p.impY > 0, p.impZ > 0].filter(Boolean).length;
            return positives === 2;
          }).length;
          const doubleLose = validPoints.filter(p => {
            const negatives = [p.impX < 0, p.impY < 0, p.impZ < 0].filter(Boolean).length;
            return negatives === 2;
          }).length;
          
          return (
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-gray-200 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-gray-500">三赢:</span>
                <span className="font-semibold text-emerald-600">{tripleWin}</span>
                <span className="text-gray-400">({((tripleWin / validPoints.length) * 100).toFixed(2)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-gray-500">两赢一输:</span>
                <span className="font-semibold text-emerald-500">{doubleWin}</span>
                <span className="text-gray-400">({((doubleWin / validPoints.length) * 100).toFixed(2)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-gray-500">一赢两输:</span>
                <span className="font-semibold text-amber-600">{doubleLose}</span>
                <span className="text-gray-400">({((doubleLose / validPoints.length) * 100).toFixed(2)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span className="text-gray-500">三输:</span>
                <span className="font-semibold text-red-500">{tripleLose}</span>
                <span className="text-gray-400">({((tripleLose / validPoints.length) * 100).toFixed(2)}%)</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-gray-500">样本数:</span>
                <span className="font-semibold text-gray-700">{validPoints.length}</span>
              </div>
            </div>
          );
        }
        
        const winWin = validPoints.filter(p => p.impX > 0 && p.impY > 0).length;
        const loseLose = validPoints.filter(p => p.impX < 0 && p.impY < 0).length;
        const tradeOff = validPoints.length - winWin - loseLose;
        
        return (
          <div className="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-gray-200 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-gray-500">双赢:</span>
              <span className="font-semibold text-emerald-600">{winWin}</span>
              <span className="text-gray-400">({((winWin / validPoints.length) * 100).toFixed(2)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-gray-500">双输:</span>
              <span className="font-semibold text-red-500">{loseLose}</span>
              <span className="text-gray-400">({((loseLose / validPoints.length) * 100).toFixed(2)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span className="text-gray-500">Trade-off:</span>
              <span className="font-semibold text-indigo-600">{tradeOff}</span>
              <span className="text-gray-400">({((tradeOff / validPoints.length) * 100).toFixed(2)}%)</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-gray-500">样本数:</span>
              <span className="font-semibold text-gray-700">{validPoints.length}</span>
            </div>
          </div>
        );
      })()}

      {renderContent()}

      <div className={`${chartWidth} mx-auto w-full flex justify-between items-center py-1 text-xs text-gray-500 font-medium`}>
        <div className="w-14 flex-shrink-0"></div>
        <div className="flex-1 relative h-6">
          {xTicks.map((tick, i) => (
            <span 
              key={i} 
              className={`
                absolute text-xs
                ${tick.val > 0 ? 'text-green-600' : ''} 
                ${tick.val < 0 ? 'text-red-500' : ''}
              `}
              style={{ 
                left: `${tick.pos}%`, 
                transform: 'translateX(-50%)' 
              }}
            >
              {formatTickValue(tick.val)}
            </span>
          ))}
          <div className="text-center mt-3 text-gray-400">{paretoX || 'X'}</div>
        </div>
      </div>

      <ChartLegend items={[
        { color: '#059669', label: '双赢', shape: 'circle' },
        { color: '#dc2626', label: '双输', shape: 'circle' },
        { color: '#6366f1', label: 'Trade-off', shape: 'circle' }
      ]} />
    </ChartContainer>
  );
};

ParetoChart.propTypes = {
  parsedData: PropTypes.array.isRequired,
  selectedCases: PropTypes.instanceOf(Set).isRequired,
  availableMetrics: PropTypes.array.isRequired,
  paretoX: PropTypes.string,
  paretoY: PropTypes.string,
  paretoZ: PropTypes.string,
  setParetoX: PropTypes.func.isRequired,
  setParetoY: PropTypes.func.isRequired,
  setParetoZ: PropTypes.func.isRequired,
  handleChartMouseMove: PropTypes.func.isRequired,
  hoveredCase: PropTypes.string,
  setHoveredCase: PropTypes.func.isRequired,
  setTooltipState: PropTypes.func.isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string.isRequired,
  onCaseClick: PropTypes.func
};

export default ParetoChart;
