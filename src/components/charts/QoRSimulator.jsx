import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Scale, TrendingUp, TrendingDown, Minus, Target, Award, Settings2, Check, AlertCircle, Info } from 'lucide-react';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartLegend } from '../common/ChartContainer';
import HelpIcon from '../common/HelpIcon';
import { getMetricConfig, computeStatistics } from '../../services/dataService';
import { WEIGHT_PRESETS } from '../../services/weightRecommendation';
import { CHART_HEADER_STYLES } from '../../utils/constants';

const QoRSimulator = ({ 
  allMetricsStats, 
  availableMetrics, 
  availableAlgos, 
  baseAlgo, 
  compareAlgo,
  qorWeights,
  setQorWeights,
  parsedData,
  selectedCases,
  savedQorWeights
}) => {
  const [showWeightHelp, setShowWeightHelp] = useState(false);
  const [activePreset, setActivePreset] = useState('custom');
  const [editingMetric, setEditingMetric] = useState(null);
  const [editValue, setEditValue] = useState('');
  const initializedRef = useRef(false);

  const detectPreset = useCallback((weights) => {
    const tolerance = 0.01;
    
    for (const [presetId, preset] of Object.entries(WEIGHT_PRESETS)) {
      const presetWeights = preset.getWeights(availableMetrics);
      let matches = true;
      
      for (const metric of availableMetrics) {
        const currentWeight = weights[metric] || 0;
        const presetWeight = presetWeights[metric] || 0;
        if (Math.abs(currentWeight - presetWeight) > tolerance) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        return presetId;
      }
    }
    
    return 'custom';
  }, [availableMetrics]);

  const applyPreset = useCallback((presetId) => {
    if (WEIGHT_PRESETS[presetId]) {
      const weights = WEIGHT_PRESETS[presetId].getWeights(availableMetrics);
      setQorWeights(weights);
      setActivePreset(presetId);
    }
  }, [availableMetrics, setQorWeights]);

  useEffect(() => {
    if (availableMetrics.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      
      const savedWeightsForMetrics = {};
      let hasSavedWeights = false;
      availableMetrics.forEach(m => {
        if (savedQorWeights[m] !== undefined && savedQorWeights[m] > 0) {
          savedWeightsForMetrics[m] = savedQorWeights[m];
          hasSavedWeights = true;
        }
      });
      
      if (hasSavedWeights) {
        setQorWeights(savedWeightsForMetrics);
        setActivePreset(detectPreset(savedWeightsForMetrics));
      } else {
        applyPreset('balanced');
      }
    }
  }, [availableMetrics, savedQorWeights, applyPreset, setQorWeights, detectPreset]);

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

  const handleWeightFocus = (metric) => {
    setEditingMetric(metric);
    setEditValue(String(qorWeights[metric] || 0));
  };

  const handleWeightChange = (metric, value) => {
    setEditValue(value);
  };

  const handleWeightBlur = (metric, value) => {
    const numValue = Math.max(0, Math.min(100, parseFloat(value) || 0));
    const newWeights = { ...qorWeights, [metric]: numValue };
    setQorWeights(newWeights);
    setEditingMetric(null);
    setEditValue('');
    setActivePreset(detectPreset(newWeights));
  };

  const handleWeightKeyDown = (e, metric) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const numValue = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
      const newWeights = { ...qorWeights, [metric]: numValue };
      setQorWeights(newWeights);
      setEditingMetric(null);
      setEditValue('');
      setActivePreset(detectPreset(newWeights));
      e.target.blur();
    } else if (e.key === 'Escape') {
      setEditingMetric(null);
      setEditValue('');
      e.target.blur();
    }
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
            onClick={() => applyPreset('balanced')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activePreset === 'balanced'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
            }`}
            title="所有指标权重相等，适用于综合评估"
          >
            <Settings2 className="w-3.5 h-3.5" />
            均衡模式
          </button>
        </div>
      </ChartHeader>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5 max-w-5xl mx-auto w-full">

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
                const isEditing = editingMetric === metric;
                const displayValue = isEditing ? editValue : weight.toFixed(2);
                
                return (
                  <div key={metric} className="inline-flex items-center gap-2 bg-slate-50 rounded-md px-3 py-1.5 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700">{metric}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={displayValue}
                      onChange={(e) => handleWeightChange(metric, e.target.value)}
                      onFocus={() => handleWeightFocus(metric)}
                      onBlur={(e) => handleWeightBlur(metric, e.target.value)}
                      onKeyDown={(e) => handleWeightKeyDown(e, metric)}
                      className="w-16 px-2 py-1 text-xs font-semibold text-center border border-slate-300 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
                    />
                    <span className="text-xs text-slate-500">%</span>
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
  selectedCases: PropTypes.object.isRequired,
  savedQorWeights: PropTypes.objectOf(PropTypes.number)
};

export default QoRSimulator;
