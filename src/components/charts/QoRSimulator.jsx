import React, { useState, useMemo } from 'react';
import { Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartLegend } from '../common/ChartContainer';
import { getMetricConfig, computeStatistics } from '../../services/dataService';

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
  const [selectedAlgos, setSelectedAlgos] = useState(availableAlgos.filter(a => a !== baseAlgo));

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

  const calculateScore = (algo) => {
    const statsForAlgo = algoMetricsStats[algo];
    if (!statsForAlgo || statsForAlgo.length === 0) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    statsForAlgo.forEach(m => {
      if (m.stats && m.stats.validCases) {
        const config = getMetricConfig(m.metric);
        const weight = qorWeights[m.metric] || 0;
        
        let improvement = 0;
        if (algo === baseAlgo) {
          improvement = 0;
        } else {
          improvement = m.stats.geomeanImp || 0;
        }
        
        const adjustedImprovement = config.better === 'lower' ? improvement : -improvement;
        
        totalScore += adjustedImprovement * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };

  const algoScores = useMemo(() => {
    const scores = {};
    availableAlgos.forEach(algo => {
      scores[algo] = calculateScore(algo);
    });
    return scores;
  }, [algoMetricsStats, qorWeights, availableAlgos]);

  const handleWeightChange = (metric, value) => {
    const newWeights = { ...qorWeights };
    newWeights[metric] = parseFloat(value) || 0;
    setQorWeights(newWeights);
  };

  const equalizeWeights = () => {
    const newWeights = {};
    const avgWeight = 100 / availableMetrics.length;
    availableMetrics.forEach(m => {
      newWeights[m] = avgWeight;
    });
    setQorWeights(newWeights);
  };

  const toggleAlgoSelection = (algo) => {
    if (algo === baseAlgo) return;
    setSelectedAlgos(prev => {
      if (prev.includes(algo)) {
        return prev.filter(a => a !== algo);
      } else {
        return [...prev, algo];
      }
    });
  };

  if (!parsedData || parsedData.length === 0 || Object.keys(algoMetricsStats).length === 0) {
    return (
      <ChartContainer>
        <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-sm">
          请先加载数据以使用 QoR 模拟器
        </div>
      </ChartContainer>
    );
  }

  const weightSum = availableMetrics.reduce((sum, m) => sum + (qorWeights[m] || 0), 0);
  const isWeightValid = Math.abs(weightSum - 100) < 1;

  return (
    <ChartContainer>
      <ChartHeader
        title="QoR 综合评估模拟器"
        variant="primary"
        icon={Scale}
        helpContent={
          <div className="space-y-1">
            <p className="font-bold text-indigo-400">QoR 综合评估</p>
            <div className="text-xs space-y-0.5">
              <p>调整权重综合评估算法性能</p>
              <p><b>权重总和应为 100%</b></p>
            </div>
          </div>
        }
        helpWidth="w-56"
      >
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold ${isWeightValid ? 'text-amber-200' : 'text-red-300'}`}>
            权重: {weightSum.toFixed(0)}%
          </span>
          <button onClick={equalizeWeights} className="px-2 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded text-[10px] font-bold border border-white/30">
            均衡
          </button>
        </div>
      </ChartHeader>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
          <span className="text-[10px] font-bold text-gray-600 mb-2 block">指标权重配置</span>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {availableMetrics.map(metric => {
              const config = getMetricConfig(metric);
              const weight = qorWeights[metric] || 0;
              
              return (
                <div key={metric} className="bg-white p-2 rounded border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-700">{metric}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={weight.toFixed(0)}
                      onChange={(e) => handleWeightChange(metric, e.target.value)}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded text-center font-semibold"
                    />
                    <span className="text-[10px] text-gray-500">%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-gray-600">算法选择</span>
              <div className="flex flex-wrap gap-1">
                {availableAlgos.map(algo => {
                  const isSelected = algo === baseAlgo || selectedAlgos.includes(algo);
                  const score = algoScores[algo] || 0;

                  return (
                    <button
                      key={algo}
                      onClick={() => toggleAlgoSelection(algo)}
                      disabled={algo === baseAlgo}
                      className={`px-2 py-0.5 rounded font-bold text-[9px] transition-all ${isSelected
                        ? algo === baseAlgo
                          ? 'bg-gray-200 text-gray-700 cursor-not-allowed'
                          : 'bg-indigo-600 text-white shadow'
                        : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      {algo}
                      {isSelected && <span className="ml-0.5">({score > 0 ? '+' : ''}{score.toFixed(1)}%)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-600 mb-1 block">综合得分排名</span>
            <div className="space-y-1">
              {[...availableAlgos]
                .filter(algo => algo === baseAlgo || selectedAlgos.includes(algo))
                .sort((a, b) => (algoScores[b] || 0) - (algoScores[a] || 0))
                .map((algo, index) => {
                  const score = algoScores[algo] || 0;
                  const isBaseline = algo === baseAlgo;
                  
                  return (
                    <div key={algo} className={`p-2 rounded flex items-center justify-between ${isBaseline ? 'bg-white border border-gray-200' : 'bg-indigo-50 border border-indigo-100'}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${index === 0 && !isBaseline ? 'text-yellow-500' : 'text-gray-400'}`}>#{index + 1}</span>
                        <span className="text-[10px] font-bold text-gray-800">{algo}</span>
                        {isBaseline && <span className="text-[8px] px-1 py-0.5 bg-gray-200 text-gray-600 rounded">基线</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {score > 0 ? <TrendingUp className="w-3 h-3 text-green-500" /> : score < 0 ? <TrendingDown className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3 text-gray-400" />}
                        <span className={`text-sm font-black ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {score > 0 ? '+' : ''}{score.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
            <span className="text-[10px] font-bold text-gray-600 mb-1.5 block">各指标详细得分</span>
            <div className="overflow-x-auto max-h-[180px] custom-scrollbar">
              <table className="min-w-full text-[10px]">
                <thead className="bg-white sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left font-bold text-gray-600">指标</th>
                    <th className="px-2 py-1 text-center font-bold text-gray-600">权重</th>
                    {availableAlgos.filter(algo => algo === baseAlgo || selectedAlgos.includes(algo)).map(algo => (
                      <th key={algo} className="px-2 py-1 text-center font-bold text-gray-600">{algo}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {availableMetrics.map(metric => {
                    const weight = qorWeights[metric] || 0;
                    
                    return (
                      <tr key={metric} className="hover:bg-white/50">
                        <td className="px-2 py-1 font-bold text-gray-800">{metric}</td>
                        <td className="px-2 py-1 text-center text-gray-600">{weight.toFixed(0)}%</td>
                        {availableAlgos.filter(algo => algo === baseAlgo || selectedAlgos.includes(algo)).map(algo => {
                          const statsForAlgo = algoMetricsStats[algo];
                          const metricStat = statsForAlgo?.find(m => m.metric === metric);
                          const imp = metricStat?.stats?.geomeanImp || 0;
                          return (
                            <td key={algo} className="px-2 py-1 text-center">
                              <span className={`font-bold ${imp > 0 ? 'text-green-600' : imp < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                {imp > 0 ? '+' : ''}{imp.toFixed(1)}%
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ChartLegend items={[
        { label: '绿色 = 优化', color: '#059669' },
        { label: '红色 = 退化', color: '#dc2626' }
      ]} />
    </ChartContainer>
  );
};

export default QoRSimulator;
