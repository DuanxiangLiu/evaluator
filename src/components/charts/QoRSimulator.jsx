import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Scale, TrendingUp, TrendingDown, Minus, Target, Award, Settings2, Check, AlertCircle, Info, Sparkles, Lightbulb, Clock, Zap, Square, Timer } from 'lucide-react';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartLegend } from '../common/ChartContainer';
import HelpIcon from '../common/HelpIcon';
import { getMetricConfig, computeStatistics } from '../../services/dataService';
import { recommendWeights, analyzeWeightSensitivity, optimizeWeights, WEIGHT_PRESETS, getWeightPresetList } from '../../services/weightRecommendation';
import { CHART_HEADER_STYLES } from '../../utils/constants';

const PRESET_ICONS = {
  Scale: Settings2,
  Clock: Clock,
  Zap: Zap,
  Square: Square,
  Timer: Timer
};

const QoRSimulator = ({ 
  allMetricsStats, 
  availableMetrics, 
  availableAlgos, 
  baseAlgo, 
  compareAlgo,
  qorWeights,
  setQorWeights,
  parsedData,
  selectedCases
}) => {
  const [showWeightHelp, setShowWeightHelp] = useState(false);
  const [showSensitivity, setShowSensitivity] = useState(false);
  const [activePreset, setActivePreset] = useState('balanced');

  const algoMetricsStats = useMemo(() => {
    if (!parsedData || parsedData.length === 0 || !baseAlgo) return {};

    const statsMap = {};
    availableAlgos.forEach(algo => {
      if (algo === baseAlgo) {
        statsMap[algo] = availableMetrics.map(m => ({
          metric: m,
          stats: { geomeanImp: 0, validCases: [] }
        }));
      } else {
        statsMap[algo] = availableMetrics.map(m => ({
          metric: m,
          stats: computeStatistics(m, baseAlgo, algo, parsedData, selectedCases)
        }));
      }
    });
    return statsMap;
  }, [parsedData, selectedCases, availableMetrics, availableAlgos, baseAlgo]);

  const getMetricScore = (algo, metric) => {
    const statsForAlgo = algoMetricsStats[algo];
    if (!statsForAlgo) return { imp: 0, weighted: 0 };
    
    const metricStat = statsForAlgo.find(m => m.metric === metric);
    const config = getMetricConfig(metric);
    const weight = qorWeights[metric] || 0;
    
    let imp = 0;
    if (algo === baseAlgo) {
      imp = 0;
    } else {
      imp = metricStat?.stats?.geomeanImp || 0;
    }
    
    const adjustedImp = config.better === 'lower' ? imp : -imp;
    const weighted = (adjustedImp * weight) / 100;
    
    return { imp, adjustedImp, weighted };
  };

  const algoScores = useMemo(() => {
    const scores = {};
    
    availableAlgos.forEach(algo => {
      let totalScore = 0;
      let totalWeight = 0;
      
      availableMetrics.forEach(metric => {
        const { adjustedImp } = getMetricScore(algo, metric);
        const weight = qorWeights[metric] || 0;
        totalScore += adjustedImp * weight;
        totalWeight += weight;
      });
      
      scores[algo] = totalWeight > 0 ? totalScore / totalWeight : 0;
    });
    
    return scores;
  }, [algoMetricsStats, qorWeights, availableAlgos, baseAlgo, availableMetrics]);

  const sensitivityAnalysis = useMemo(() => {
    if (!allMetricsStats || allMetricsStats.length === 0) return [];
    return analyzeWeightSensitivity(availableMetrics, allMetricsStats, baseAlgo, qorWeights);
  }, [availableMetrics, allMetricsStats, baseAlgo, qorWeights]);

  const handleWeightChange = (metric, value) => {
    const numValue = Math.max(0, Math.min(100, parseFloat(value) || 0));
    setQorWeights(prev => ({ ...prev, [metric]: numValue }));
    setActivePreset('custom');
  };

  const applyPreset = useCallback((presetId) => {
    if (presetId === 'auto') {
      const recommended = recommendWeights(availableMetrics, allMetricsStats, baseAlgo, 'auto');
      setQorWeights(recommended);
      setActivePreset('auto');
    } else if (WEIGHT_PRESETS[presetId]) {
      const weights = WEIGHT_PRESETS[presetId].getWeights(availableMetrics);
      setQorWeights(weights);
      setActivePreset(presetId);
    }
  }, [availableMetrics, allMetricsStats, baseAlgo, setQorWeights]);

  const applyOptimizedWeights = useCallback(() => {
    const result = optimizeWeights(availableMetrics, allMetricsStats, baseAlgo, compareAlgo);
    setQorWeights(result.weights);
    setActivePreset('optimized');
  }, [availableMetrics, allMetricsStats, baseAlgo, compareAlgo, setQorWeights]);

  const equalizeWeights = () => {
    applyPreset('balanced');
  };

  if (!parsedData || parsedData.length === 0 || Object.keys(algoMetricsStats).length === 0) {
    return (
      <ChartContainer>
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <Scale className="w-8 h-8 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-500">请先加载数据</p>
            <p className="text-sm text-gray-400 mt-1">以使用 QoR 多目标权重评估</p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  const weightSum = availableMetrics.reduce((sum, m) => sum + (qorWeights[m] || 0), 0);
  const isWeightValid = Math.abs(weightSum - 100) < 1;
  const rankedAlgos = [...availableAlgos].sort((a, b) => (algoScores[b] || 0) - (algoScores[a] || 0));
  const presetList = getWeightPresetList();

  return (
    <ChartContainer>
      <ChartHeader
        title="QoR 多目标权重评估"
        variant="primary"
        icon={Scale}
        helpContent={
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-indigo-400 text-sm mb-2">QoR 多目标权重评估</h3>
              <p className="text-gray-300 text-xs mb-2">
                QoR（Quality of Results）综合评估帮助您根据实际需求，对不同指标赋予不同权重，得出算法的综合得分排名。
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-emerald-300 text-xs">智能权重推荐</h4>
              <ul className="text-gray-300 text-xs space-y-1.5">
                <li>• <strong>自动推荐</strong>：基于数据特征智能推荐权重</li>
                <li>• <strong>场景预设</strong>：时序优先、功耗优先等场景化配置</li>
                <li>• <strong>优化权重</strong>：自动优化以最大化综合得分</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-300 text-xs">得分计算</h4>
              <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-300 font-mono">
                综合得分 = Σ(指标得分 × 权重%) / 100
              </div>
              <p className="text-gray-400 text-xs mt-1">
                正分表示整体优化，负分表示整体退化
              </p>
            </div>
            
            <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
              💡 <strong>提示</strong>：点击预设按钮可快速应用场景化权重配置
            </div>
          </div>
        }
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-help ${isWeightValid ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'}`}
              onMouseEnter={() => setShowWeightHelp(true)}
              onMouseLeave={() => setShowWeightHelp(false)}
            >
              {isWeightValid ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              <span>{weightSum.toFixed(2)}%</span>
              <Info className="w-3 h-3 opacity-60" />
            </div>
            {showWeightHelp && (
              <div className="absolute top-full right-0 mt-2 w-72 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50 border border-slate-700">
                <p className="font-semibold mb-2 text-amber-300">权重计算说明</p>
                <div className="space-y-1.5 text-slate-300">
                  <p><span className="text-white font-medium">综合得分</span> = Σ(指标得分 × 权重%) / 100</p>
                  <p>• 指标得分：相对于基线的改进百分比</p>
                  <p>• 权重：各指标的重要程度占比</p>
                  {!isWeightValid && (
                    <p className="text-red-300 pt-1 border-t border-slate-600 mt-2">
                      ⚠️ 当前权重总和为 {weightSum.toFixed(2)}%，建议调整为 100%
                    </p>
                  )}
                </div>
                <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 border-l border-t border-slate-700 transform -rotate-45" />
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowSensitivity(!showSensitivity)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border flex items-center gap-1 ${showSensitivity ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/50' : 'bg-white/10 text-white/90 border-white/10 hover:border-white/20'}`}
          >
            <Lightbulb className="w-3 h-3" />
            敏感性分析
          </button>
        </div>
      </ChartHeader>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 overflow-hidden">
          <div className="px-3 py-2 border-b border-indigo-100 bg-indigo-50/50 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-700">智能权重推荐</span>
          </div>
          <div className="p-3">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => applyPreset('auto')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activePreset === 'auto'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                    : 'bg-white text-indigo-600 border border-indigo-200 hover:border-indigo-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                自动推荐
              </button>
              <button
                onClick={applyOptimizedWeights}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activePreset === 'optimized'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                    : 'bg-white text-indigo-600 border border-indigo-200 hover:border-indigo-400'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                优化权重
              </button>
              {presetList.map(preset => {
                const IconComponent = PRESET_ICONS[preset.icon] || Settings2;
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activePreset === preset.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                    }`}
                    title={preset.description}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    {preset.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500">
              💡 <strong>自动推荐</strong>：基于改进幅度、显著性、稳定性智能计算权重；
              <strong>优化权重</strong>：自动调整以最大化综合得分
            </p>
          </div>
        </div>

        {showSensitivity && sensitivityAnalysis.length > 0 && (
          <div className="bg-white rounded-lg border border-amber-200 shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-amber-100 bg-amber-50/50 flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">权重敏感性分析</span>
            </div>
            <div className="p-3">
              <div className="flex flex-wrap gap-2">
                {sensitivityAnalysis.map(item => (
                  <div
                    key={item.metric}
                    className={`px-3 py-2 rounded-lg border ${
                      item.sensitivity === 'high' 
                        ? 'bg-red-50 border-red-200' 
                        : item.sensitivity === 'medium'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">{item.metric}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        item.sensitivity === 'high' 
                          ? 'bg-red-100 text-red-700' 
                          : item.sensitivity === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.sensitivity === 'high' ? '高敏感' : item.sensitivity === 'medium' ? '中敏感' : '低敏感'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      影响: {item.impact.toFixed(2)} | {item.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs font-semibold text-slate-600">指标权重配置</span>
            {activePreset === 'custom' && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">已手动调整</span>
            )}
          </div>
          <div className="p-3">
            <div className="flex flex-wrap gap-2">
              {availableMetrics.map(metric => {
                const weight = qorWeights[metric] || 0;
                const sensitivity = sensitivityAnalysis.find(s => s.metric === metric);
                
                return (
                  <div key={metric} className="inline-flex items-center gap-2 bg-slate-50 rounded-md px-3 py-1.5 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700">{metric}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={weight.toFixed(2)}
                      onChange={(e) => handleWeightChange(metric, e.target.value)}
                      className="w-16 px-2 py-1 text-xs font-semibold text-center border border-slate-300 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs text-slate-500">%</span>
                    {sensitivity && sensitivity.sensitivity === 'high' && (
                      <span className="w-2 h-2 rounded-full bg-red-400" title="高敏感指标" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-slate-600">综合排名</span>
          </div>
          
          <div className="p-3">
            <div className="space-y-2.5">
              {rankedAlgos.map((algo, index) => {
                const score = algoScores[algo] || 0;
                const isBaseline = algo === baseAlgo;
                const isFirst = index === 0 && !isBaseline;
                
                const metricDetails = availableMetrics.map(metric => {
                  const { imp, adjustedImp, weighted } = getMetricScore(algo, metric);
                  const weight = qorWeights[metric] || 0;
                  return { metric, weight, imp, adjustedImp, weighted };
                });
                
                return (
                  <div 
                    key={algo} 
                    className={`relative overflow-hidden rounded-lg transition-all duration-200 ${
                      isFirst 
                        ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200' 
                        : isBaseline 
                          ? 'bg-slate-50/50 border border-slate-100' 
                          : 'bg-white border border-slate-100'
                    }`}
                  >
                    <div className="px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <div className={`w-7 h-7 rounded flex items-center justify-center font-bold text-sm shrink-0 ${
                          isFirst 
                            ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white' 
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-bold text-base text-slate-800">{algo}</span>
                        {isBaseline && (
                          <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-500 rounded font-medium">基线</span>
                        )}
                        {isFirst && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded font-medium flex items-center gap-0.5">
                            <Award className="w-3 h-3" />最优
                          </span>
                        )}
                        
                        <span className="text-slate-300 font-bold mx-1">=</span>
                        
                        {score > 0 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        ) : score < 0 ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : (
                          <Minus className="w-4 h-4 text-slate-400" />
                        )}
                        <span className={`font-bold text-lg ${score > 0 ? 'text-emerald-600' : score < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                          {score > 0 ? '+' : ''}{score.toFixed(2)}%
                        </span>
                        
                        <span className="text-slate-300 font-bold mx-1">=</span>
                        
                        {metricDetails.map((m, i) => (
                          <span key={m.metric} className="text-slate-600 text-xs">
                            <span className="font-semibold">{m.metric}</span>:<span className="text-indigo-600 font-semibold">{m.weight.toFixed(0)}%</span>×<span className={`font-semibold ${m.adjustedImp > 0 ? 'text-emerald-600' : m.adjustedImp < 0 ? 'text-red-500' : 'text-slate-400'}`}>{m.adjustedImp > 0 ? '+' : ''}{m.adjustedImp.toFixed(1)}%</span>=<span className={`font-bold ${m.weighted > 0 ? 'text-emerald-600' : m.weighted < 0 ? 'text-red-500' : 'text-slate-400'}`}>{m.weighted > 0 ? '+' : ''}{m.weighted.toFixed(2)}%</span>
                            {i < metricDetails.length - 1 && <span className="text-slate-300 font-bold"> + </span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ChartLegend items={[
        { label: '优化', color: '#10b981' },
        { label: '退化', color: '#ef4444' }
      ]} />
    </ChartContainer>
  );
};

QoRSimulator.propTypes = {
  allMetricsStats: PropTypes.arrayOf(PropTypes.shape({
    metric: PropTypes.string.isRequired,
    stats: PropTypes.object
  })).isRequired,
  availableMetrics: PropTypes.arrayOf(PropTypes.string).isRequired,
  availableAlgos: PropTypes.arrayOf(PropTypes.string).isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string,
  qorWeights: PropTypes.objectOf(PropTypes.number).isRequired,
  setQorWeights: PropTypes.func.isRequired,
  parsedData: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedCases: PropTypes.object.isRequired
};

export default QoRSimulator;
