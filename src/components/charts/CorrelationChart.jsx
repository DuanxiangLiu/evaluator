import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartBody, ChartArea, ChartLegend, AreaLabel, EmptyState } from '../common/ChartContainer';
import { formatIndustrialNumber } from '../../utils/formatters';
import { calculateImprovement, calculatePearsonCorrelation, calculateSpearmanCorrelation, calculateLinearRegression, detectOutliers, interpretCorrelation } from '../../utils/statistics';
import { CHART_WIDTH, CHART_HEADER_STYLES } from '../../utils/constants';
import { generateCorrelationInsight, renderMarkdownText } from '../../services/aiService';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../common/Toast';

const CorrelationChart = ({ 
  parsedData, selectedCases, metaColumns, availableMetrics, 
  corrX, corrY, setCorrX, setCorrY, handleChartMouseMove, 
  hoveredCase, setHoveredCase, setTooltipState, baseAlgo, compareAlgo,
  onCaseClick
}) => {
  const { llmConfig, setShowAiConfig } = useAppContext();
  const toast = useToast();
  const [aiInsight, setAiInsight] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  if (parsedData.length === 0) return null;

  const isMetricX = availableMetrics.includes(corrX);
  const isInstX = !isMetricX && (corrX?.toLowerCase() === 'inst' || 
    corrX?.toLowerCase() === 'instance' || 
    corrX?.toLowerCase() === 'instances' || 
    corrX?.toLowerCase() === '#inst');
  
  const points = parsedData.filter(d => selectedCases.has(d.Case)).map(d => {
    let xValRaw;
    if (isMetricX) {
      const bxX = d.raw[corrX]?.[baseAlgo];
      const cxX = d.raw[corrX]?.[compareAlgo];
      if (bxX == null || cxX == null) return null;
      xValRaw = calculateImprovement(bxX, cxX);
    } else {
      xValRaw = d.meta[corrX];
    }
    if (xValRaw === undefined || xValRaw === null) return null;
    const xVal = parseFloat(xValRaw);
    if (isNaN(xVal)) return null;

    const bx = d.raw[corrY]?.[baseAlgo], cx = d.raw[corrY]?.[compareAlgo];
    if(bx==null || cx==null) return null;
    
    const impY = calculateImprovement(bx, cx);
    if (impY === null) return null;
    return { case: d.Case, xVal, impY, bx, cx, raw: d };
  }).filter(p => p !== null);

  if (isInstX) {
    points.sort((a, b) => b.xVal - a.xVal);
  }

  const xVals = points.map(p => p.xVal);
  const yVals = points.map(p => p.impY);
  
  const stats = useMemo(() => {
    if (xVals.length < 2) return null;
    
    const pearsonR = calculatePearsonCorrelation(xVals, yVals);
    const spearmanR = calculateSpearmanCorrelation(xVals, yVals);
    const regression = calculateLinearRegression(xVals, yVals);
    const outliers = detectOutliers(yVals);
    
    return {
      pearsonR,
      spearmanR,
      slope: regression?.slope,
      intercept: regression?.intercept,
      rSquared: regression?.rSquared,
      outlierCount: outliers.length,
      pearsonInterpretation: pearsonR !== null ? interpretCorrelation(pearsonR) : null
    };
  }, [xVals, yVals]);

  const minX = xVals.length > 0 ? Math.min(...xVals) : 0;
  const maxX = xVals.length > 0 ? Math.max(...xVals) : 1;
  const xRange = maxX - minX || 1;
  
  const maxAbsY = yVals.length > 0 ? Math.max(...yVals.map(v => Math.abs(v)), 10) * 1.2 : 12;

  const mapX = (val) => ((val - minX) / xRange) * 90 + 5;
  const mapY = (val) => 50 - (val / maxAbsY) * 45;

  const yTickCount = 5;
  const yMax = maxAbsY;
  const yTicks = [];
  for (let i = 0; i <= yTickCount; i++) {
    const val = yMax - (2 * yMax) * (i / yTickCount);
    yTicks.push({ val });
  }

  const handleAIAnalysis = useCallback(async () => {
    if (!llmConfig?.apiKey) {
      setShowAiConfig(true);
      return;
    }
    
    if (!stats || !corrX || !corrY) {
      toast.error('数据不足', '请先选择有效的分析维度');
      return;
    }
    
    setIsAnalyzing(true);
    setAiInsight('');
    
    try {
      const distributionInfo = `X轴范围: [${minX.toFixed(2)}, ${maxX.toFixed(2)}], Y轴范围: [${(-yMax).toFixed(1)}%, ${yMax.toFixed(1)}%]`;
      
      const result = await generateCorrelationInsight(llmConfig, {
        corrX: corrX,
        corrY: corrY,
        pearsonR: stats.pearsonR,
        spearmanR: stats.spearmanR,
        slope: stats.slope,
        rSquared: stats.rSquared,
        outlierCount: stats.outlierCount,
        dataPoints: points.length,
        distributionInfo
      });
      
      setAiInsight(result);
    } catch (error) {
      toast.error('AI 分析失败', error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [llmConfig, stats, corrX, corrY, minX, maxX, yMax, points.length, toast, setShowAiConfig]);

  const renderContent = () => {
    if (!corrX || !corrY || points.length === 0) {
      return <EmptyState message="请选择 X 轴与 Y 轴进行分析" />;
    }

    return (
      <ChartBody className={`${CHART_WIDTH.COMPACT} mx-auto w-full`}>
        <div className="flex flex-col justify-between text-right pr-2 py-1 text-[10px] font-semibold text-gray-500 w-12 flex-shrink-0">
          {yTicks.map((tick, i) => (
            <span 
              key={i} 
              className={`
                ${tick.val > 0 ? 'text-green-600' : ''} 
                ${tick.val < 0 ? 'text-red-500' : ''}
              `}
            >
              {tick.val > 0 ? '+' : ''}{tick.val.toFixed(0)}%
            </span>
          ))}
        </div>
        
        <ChartArea className="border-l-2 border-b-2 border-gray-300 bg-gradient-to-b from-green-50/30 via-white to-red-50/30">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-green-100/20 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-red-100/20 to-transparent pointer-events-none"></div>
          
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="50" x2="100" y2="50" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
            
            {stats && stats.slope != null && !isInstX && (
              <line 
                x1={mapX(minX)} 
                y1={mapY(stats.slope * minX + stats.intercept)} 
                x2={mapX(maxX)} 
                y2={mapY(stats.slope * maxX + stats.intercept)} 
                stroke="#6366f1" 
                strokeWidth="0.5" 
                strokeDasharray="1 1"
                opacity="0.6"
              />
            )}
            
            {points.map((p, i) => {
              const isHovered = hoveredCase === p.case;
              const cx = isInstX ? (5 + (i / (points.length - 1 || 1)) * 90) : mapX(p.xVal);
              const cy = mapY(p.impY);
              
              let color = '#6366f1';
              if (p.impY > 0) color = '#059669';
              if (p.impY < 0) color = '#dc2626';

              return (
                <circle
                  key={`corr-${p.case}`} 
                  cx={cx} cy={cy} 
                  r={isHovered ? "2" : "1"} 
                  fill={color} 
                  stroke={isHovered ? "#fff" : "none"} 
                  strokeWidth="0.3"
                  className={`transition-all duration-200 cursor-pointer ${isHovered ? 'animate-pulse' : ''}`}
                  onMouseEnter={() => {
                    setHoveredCase(p.case);
                    setTooltipState({ visible: true, x: 0, y: 0, title: p.case, lines: [`${corrX}: ${isMetricX ? `${p.xVal > 0 ? '+' : ''}${p.xVal.toFixed(2)}%` : formatIndustrialNumber(p.xVal)}`, `${corrY}: ${p.impY > 0 ? '+' : ''}${p.impY.toFixed(2)}%`] });
                  }}
                  onMouseLeave={() => { setHoveredCase(null); setTooltipState(prev => ({...prev, visible: false})); }}
                  onDoubleClick={() => {
                    if (onCaseClick && p.raw) onCaseClick(p.raw);
                  }}
                />
              );
            })}
          </svg>
          
          <AreaLabel position="top-left" variant="success">优化 ↑</AreaLabel>
          <AreaLabel position="bottom-left" variant="danger">退化 ↓</AreaLabel>
        </ChartArea>
      </ChartBody>
    );
  };

  const renderStats = () => {
    if (!stats || !corrX || !corrY || points.length === 0) return null;
    
    const TrendIcon = stats.pearsonR > 0.1 ? TrendingUp : stats.pearsonR < -0.1 ? TrendingDown : Minus;
    const trendColor = stats.pearsonR > 0.1 ? 'text-green-600' : stats.pearsonR < -0.1 ? 'text-red-500' : 'text-gray-500';
    
    return (
      <div className="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-gray-200 text-xs">
        <div className="flex items-center gap-1.5 group relative">
          <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
          <div className="absolute left-0 top-full mt-1 p-2 bg-gray-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 w-48 pointer-events-none">
            统计指标由前端 JavaScript 实时计算，基于当前选中的数据点
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
          <span className="text-gray-500">Pearson:</span>
          <span className={`font-semibold ${trendColor}`}>
            {stats.pearsonR !== null ? stats.pearsonR.toFixed(3) : 'N/A'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Spearman:</span>
          <span className="font-semibold text-gray-700">
            {stats.spearmanR !== null ? stats.spearmanR.toFixed(3) : 'N/A'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">R²:</span>
          <span className="font-semibold text-gray-700">
            {stats.rSquared !== null ? stats.rSquared.toFixed(3) : 'N/A'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">样本数:</span>
          <span className="font-semibold text-gray-700">{points.length}</span>
        </div>
        {stats.pearsonInterpretation && (
          <div className="ml-auto px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-medium">
            {stats.pearsonInterpretation.strength}{stats.pearsonInterpretation.direction}
          </div>
        )}
      </div>
    );
  };

  const renderAIInsight = () => {
    if (!aiInsight) return null;
    
    return (
      <div className="mt-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
        <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI 相关性解读
        </h4>
        <div className="text-sm text-gray-700 prose prose-sm prose-indigo max-w-none">
          {renderMarkdownText(aiInsight)}
        </div>
      </div>
    );
  };

  return (
    <ChartContainer onMouseMove={handleChartMouseMove}>
      <ChartHeader
        title="特征相关性散点分析"
        helpContent={
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-indigo-400 text-sm mb-2">特征相关性散点分析</h3>
              <p className="text-gray-300 text-xs mb-2">
                通过散点图探索不同变量之间的关系，发现潜在的规律和异常。
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-emerald-300 text-xs">分析维度</h4>
              <ul className="text-gray-300 text-xs space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>属性 vs 指标</strong>：探索设计规模与性能的关系，如实例数对时序的影响</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>指标 vs 指标</strong>：探索不同性能指标间的关联，如功耗与线长的关系</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-300 text-xs">统计指标</h4>
              <ul className="text-gray-300 text-xs space-y-1">
                <li>• <strong>Pearson</strong>：线性相关系数 (-1 到 1)</li>
                <li>• <strong>Spearman</strong>：秩相关系数 (单调关系)</li>
                <li>• <strong>R²</strong>：决定系数 (拟合优度)</li>
              </ul>
            </div>
            
            <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
              💡 <strong>提示</strong>：点击「AI 解读」获取智能分析
            </div>
          </div>
        }
        helpPosition="right-center"
      >
        <div className="flex items-center gap-2 text-xs">
          <span className={CHART_HEADER_STYLES.LABEL}>X:</span>
          <select value={corrX} onChange={(e) => { setCorrX(e.target.value); setAiInsight(''); }} className={CHART_HEADER_STYLES.SELECT}>
            <optgroup label="属性">
              {metaColumns.map(m => <option key={`mx-${m}`} value={m}>{m}</option>)}
            </optgroup>
            <optgroup label="指标">
              {availableMetrics.map(m => <option key={`tx-${m}`} value={m}>{m}</option>)}
            </optgroup>
          </select>
          <span className={`${CHART_HEADER_STYLES.LABEL} ml-1`}>Y:</span>
          <select value={corrY} onChange={(e) => { setCorrY(e.target.value); setAiInsight(''); }} className={CHART_HEADER_STYLES.SELECT}>
            {availableMetrics.map(m => <option key={`ty-${m}`} value={m}>{m}</option>)}
          </select>
          <button
            onClick={handleAIAnalysis}
            disabled={isAnalyzing || !stats}
            className={`
              ml-2 px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5
              ${isAnalyzing || !stats
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-sm'
              }
            `}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                分析中
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                AI 解读
              </>
            )}
          </button>
        </div>
      </ChartHeader>

      {renderStats()}
      {renderContent()}

      <ChartLegend items={[
        { color: '#059669', label: '优化', shape: 'circle' },
        { color: '#dc2626', label: '退化', shape: 'circle' },
        { color: '#6366f1', label: '趋势线', shape: 'line' }
      ]} />
      
      {renderAIInsight()}
    </ChartContainer>
  );
};

CorrelationChart.propTypes = {
  parsedData: PropTypes.array.isRequired,
  selectedCases: PropTypes.instanceOf(Set).isRequired,
  metaColumns: PropTypes.array.isRequired,
  availableMetrics: PropTypes.array.isRequired,
  corrX: PropTypes.string,
  corrY: PropTypes.string,
  setCorrX: PropTypes.func.isRequired,
  setCorrY: PropTypes.func.isRequired,
  handleChartMouseMove: PropTypes.func.isRequired,
  hoveredCase: PropTypes.string,
  setHoveredCase: PropTypes.func.isRequired,
  setTooltipState: PropTypes.func.isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string.isRequired,
  onCaseClick: PropTypes.func
};

export default CorrelationChart;
