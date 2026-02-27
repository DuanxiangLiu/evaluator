import React, { useState, useMemo } from 'react';
import { Scale, HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import { getMetricConfig } from '../../services/dataService';

const QoRSimulator = ({ 
  allMetricsStats, 
  availableMetrics, 
  availableAlgos, 
  baseAlgo, 
  compareAlgo,
  qorWeights,
  setQorWeights 
}) => {
  const [selectedAlgos, setSelectedAlgos] = useState(availableAlgos.filter(a => a !== baseAlgo));

  const calculateScore = (algo) => {
    if (!allMetricsStats || allMetricsStats.length === 0) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    allMetricsStats.forEach(m => {
      if (m.stats && m.stats.validCases) {
        const config = getMetricConfig(m.metric);
        const weight = qorWeights[m.metric] || 0;
        
        let improvement = 0;
        if (algo === baseAlgo) {
          improvement = 0;
        } else {
          const validCase = m.stats.validCases.find(v => v);
          if (validCase) {
            improvement = m.stats.geomeanImp || 0;
          }
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
  }, [allMetricsStats, qorWeights, availableAlgos]);

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

  if (!allMetricsStats || allMetricsStats.length === 0) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-gray-400 font-bold">请先加载数据以使用 QoR 综合模拟器</div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-gray-800">QoR 综合评估模拟器</h3>
            <HelpIcon 
              content={
                <div className="space-y-2">
                  <p className="font-bold text-indigo-400">QoR 综合评估</p>
                  <div className="text-xs space-y-1">
                    <p>通过调整不同指标的权重，综合评估算法的整体性能。</p>
                    <p><b>权重设置：</b>为每个指标分配权重（总和应为100%）</p>
                    <p><b>得分计算：</b>根据权重和改进率计算综合得分</p>
                  </div>
                </div>
              }
              position="right-center"
              tooltipWidth="w-[32rem]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${
              Math.abs(availableMetrics.reduce((sum, m) => sum + (qorWeights[m] || 0), 0) - 100) < 1
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              权重总和: {availableMetrics.reduce((sum, m) => sum + (qorWeights[m] || 0), 0).toFixed(1)}%
            </span>
            <button
              onClick={equalizeWeights}
              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-bold border border-indigo-200"
            >
              均衡权重
            </button>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-3 h-3 text-gray-400" />
            <span className="text-xs font-bold text-gray-600">指标权重配置</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {availableMetrics.map(metric => {
              const config = getMetricConfig(metric);
              const weight = qorWeights[metric] || 0;
              
              return (
                <div key={metric} className="bg-gray-50 p-2 rounded border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-700">{metric}</span>
                    <span className={`text-[10px] px-1 py-0.5 rounded ${
                      config.better === 'lower' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {config.better === 'lower' ? '↓' : '↑'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={weight}
                      onChange={(e) => handleWeightChange(metric, e.target.value)}
                      className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={weight.toFixed(0)}
                      onChange={(e) => handleWeightChange(metric, e.target.value)}
                      className="w-10 px-1 py-0.5 text-xs border border-gray-300 rounded text-center"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-600">算法选择</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableAlgos.map(algo => {
              const isSelected = algo === baseAlgo || selectedAlgos.includes(algo);
              const score = algoScores[algo] || 0;
              
              return (
                <button
                  key={algo}
                  onClick={() => toggleAlgoSelection(algo)}
                  disabled={algo === baseAlgo}
                  className={`px-3 py-1 rounded font-bold text-xs transition-all ${
                    isSelected
                      ? algo === baseAlgo
                        ? 'bg-gray-200 text-gray-700 cursor-not-allowed'
                        : 'bg-indigo-600 text-white shadow'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {algo}
                  {isSelected && (
                    <span className="ml-1 text-[10px]">
                      ({score > 0 ? '+' : ''}{score.toFixed(1)}%)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <span className="text-xs font-bold text-gray-600 mb-2 block">综合得分排名</span>
            <div className="space-y-1">
              {[...availableAlgos]
                .filter(algo => algo === baseAlgo || selectedAlgos.includes(algo))
                .sort((a, b) => (algoScores[b] || 0) - (algoScores[a] || 0))
                .map((algo, index) => {
                  const score = algoScores[algo] || 0;
                  const isBaseline = algo === baseAlgo;
                  
                  return (
                    <div
                      key={algo}
                      className={`p-2 rounded flex items-center justify-between ${
                        isBaseline 
                          ? 'bg-gray-50 border border-gray-200' 
                          : 'bg-indigo-50 border border-indigo-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${
                          index === 0 && !isBaseline ? 'text-yellow-500' : 'text-gray-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-800">{algo}</span>
                        {isBaseline && (
                          <span className="text-[10px] px-1 py-0.5 bg-gray-200 text-gray-600 rounded">基线</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {score > 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : score < 0 ? (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        ) : (
                          <Minus className="w-3 h-3 text-gray-400" />
                        )}
                        <span className={`text-sm font-black ${
                          score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {score > 0 ? '+' : ''}{score.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <span className="text-xs font-bold text-gray-600 mb-2 block">各指标详细得分</span>
            <div className="overflow-x-auto max-h-[200px]">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left font-bold text-gray-600">指标</th>
                    <th className="px-2 py-1 text-center font-bold text-gray-600">权重</th>
                    <th className="px-2 py-1 text-center font-bold text-gray-600">方向</th>
                    {availableAlgos
                      .filter(algo => algo === baseAlgo || selectedAlgos.includes(algo))
                      .map(algo => (
                        <th key={algo} className="px-2 py-1 text-center font-bold text-gray-600">{algo}</th>
                      ))
                    }
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {availableMetrics.map(metric => {
                    const config = getMetricConfig(metric);
                    const weight = qorWeights[metric] || 0;
                    const metricStat = allMetricsStats.find(m => m.metric === metric);
                    
                    return (
                      <tr key={metric} className="hover:bg-gray-50">
                        <td className="px-2 py-1 font-bold text-gray-800">{metric}</td>
                        <td className="px-2 py-1 text-center text-gray-600">{weight.toFixed(0)}%</td>
                        <td className="px-2 py-1 text-center">
                          <span className={`text-[10px] px-1 py-0.5 rounded ${
                            config.better === 'lower' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {config.better === 'lower' ? '↓' : '↑'}
                          </span>
                        </td>
                        {availableAlgos
                          .filter(algo => algo === baseAlgo || selectedAlgos.includes(algo))
                          .map(algo => {
                            const imp = metricStat?.stats?.geomeanImp || 0;
                            return (
                              <td key={algo} className="px-2 py-1 text-center">
                                <span className={`font-bold ${
                                  imp > 0 ? 'text-green-600' : imp < 0 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {imp > 0 ? '+' : ''}{imp.toFixed(1)}%
                                </span>
                              </td>
                            );
                          })
                        }
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QoRSimulator;
