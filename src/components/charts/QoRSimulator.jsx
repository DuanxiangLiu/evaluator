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

  // 计算综合得分
  const calculateScore = (algo) => {
    if (!allMetricsStats || allMetricsStats.length === 0) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    allMetricsStats.forEach(m => {
      if (m.stats && m.stats.validCases) {
        const config = getMetricConfig(m.metric);
        const weight = qorWeights[m.metric] || 0;
        
        // 计算该算法相对于基线的改进
        let improvement = 0;
        if (algo === baseAlgo) {
          improvement = 0; // 基线得分为0
        } else {
          // 从统计数据中获取改进率
          const validCase = m.stats.validCases.find(v => v);
          if (validCase) {
            improvement = m.stats.geomeanImp || 0;
          }
        }
        
        // 根据指标的评估标准调整得分
        // 如果指标是"越小越好"，改进为正数表示得分增加
        // 如果指标是"越大越好"，改进为负数表示得分增加
        const adjustedImprovement = config.better === 'lower' ? improvement : -improvement;
        
        totalScore += adjustedImprovement * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };

  // 计算所有算法的综合得分
  const algoScores = useMemo(() => {
    const scores = {};
    availableAlgos.forEach(algo => {
      scores[algo] = calculateScore(algo);
    });
    return scores;
  }, [allMetricsStats, qorWeights, availableAlgos]);

  // 处理权重变化
  const handleWeightChange = (metric, value) => {
    const newWeights = { ...qorWeights };
    newWeights[metric] = parseFloat(value) || 0;
    setQorWeights(newWeights);
  };

  // 均衡权重
  const equalizeWeights = () => {
    const newWeights = {};
    const avgWeight = 100 / availableMetrics.length;
    availableMetrics.forEach(m => {
      newWeights[m] = avgWeight;
    });
    setQorWeights(newWeights);
  };

  // 切换算法选择
  const toggleAlgoSelection = (algo) => {
    if (algo === baseAlgo) return; // 基线不能取消选择
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
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-gray-400 font-bold">请先加载数据以使用 QoR 综合模拟器</div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 标题和说明 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                QoR 综合评估模拟器
                <HelpIcon 
                  content={
                    <div className="space-y-3">
                      <p className="font-bold text-indigo-400 text-lg">QoR (Quality of Results) 综合评估</p>
                      <div className="space-y-2 text-sm">
                        <p>通过调整不同指标的权重，综合评估算法的整体性能。</p>
                        <p><b>权重设置：</b>为每个指标分配权重（总和应为100%）</p>
                        <p><b>得分计算：</b>根据权重和改进率计算综合得分</p>
                        <p><b>评估标准：</b>考虑指标是"越小越好"还是"越大越好"</p>
                      </div>
                    </div>
                  }
                  position="right-center"
                  tooltipWidth="w-[40rem]"
                />
              </h3>
              <p className="text-sm text-gray-500 mt-1">基于多指标加权综合评估算法性能</p>
            </div>
            <button
              onClick={equalizeWeights}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold transition-colors border border-indigo-200"
            >
              均衡权重
            </button>
          </div>
        </div>

        {/* 权重设置 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-gray-400" />
            指标权重配置
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableMetrics.map(metric => {
              const config = getMetricConfig(metric);
              const weight = qorWeights[metric] || 0;
              
              return (
                <div key={metric} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">{metric}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      config.better === 'lower' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {config.better === 'lower' ? '↓ 越小越好' : '↑ 越大越好'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={weight}
                      onChange={(e) => handleWeightChange(metric, e.target.value)}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={weight.toFixed(1)}
                      onChange={(e) => handleWeightChange(metric, e.target.value)}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-gray-600">权重总和:</span>
              <span className={`font-bold ${
                Math.abs(availableMetrics.reduce((sum, m) => sum + (qorWeights[m] || 0), 0) - 100) < 1
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {availableMetrics.reduce((sum, m) => sum + (qorWeights[m] || 0), 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* 算法选择 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-bold text-gray-700 mb-4">算法选择</h4>
          <div className="flex flex-wrap gap-3">
            {availableAlgos.map(algo => {
              const isSelected = algo === baseAlgo || selectedAlgos.includes(algo);
              const score = algoScores[algo] || 0;
              
              return (
                <button
                  key={algo}
                  onClick={() => toggleAlgoSelection(algo)}
                  disabled={algo === baseAlgo}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    isSelected
                      ? algo === baseAlgo
                        ? 'bg-gray-200 text-gray-700 cursor-not-allowed'
                        : 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {algo}
                  {isSelected && (
                    <span className="ml-2 text-xs">
                      ({score > 0 ? '+' : ''}{score.toFixed(2)}%)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 综合得分排名 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-bold text-gray-700 mb-4">综合得分排名</h4>
          <div className="space-y-3">
            {[...availableAlgos]
              .filter(algo => algo === baseAlgo || selectedAlgos.includes(algo))
              .sort((a, b) => (algoScores[b] || 0) - (algoScores[a] || 0))
              .map((algo, index) => {
                const score = algoScores[algo] || 0;
                const isBaseline = algo === baseAlgo;
                
                return (
                  <div
                    key={algo}
                    className={`p-4 rounded-lg border ${
                      isBaseline 
                        ? 'bg-gray-50 border-gray-300' 
                        : 'bg-indigo-50 border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-black ${
                          index === 0 && !isBaseline ? 'text-yellow-500' : 'text-gray-400'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="font-bold text-gray-800">{algo}</span>
                        {isBaseline && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                            基线
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {score > 0 ? (
                          <TrendingUp className="w-5 h-5 text-green-500" />
                        ) : score < 0 ? (
                          <TrendingDown className="w-5 h-5 text-red-500" />
                        ) : (
                          <Minus className="w-5 h-5 text-gray-400" />
                        )}
                        <span className={`text-xl font-black ${
                          score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {score > 0 ? '+' : ''}{score.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 指标详细得分 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="font-bold text-gray-700 mb-4">各指标详细得分</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-bold text-gray-600">指标</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">权重</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600">评估标准</th>
                  {availableAlgos
                    .filter(algo => algo === baseAlgo || selectedAlgos.includes(algo))
                    .map(algo => (
                      <th key={algo} className="px-4 py-3 text-center font-bold text-gray-600">
                        {algo} 改进率
                      </th>
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
                      <td className="px-4 py-3 font-bold text-gray-800">{metric}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{weight.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          config.better === 'lower' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {config.better === 'lower' ? '↓ 越小越好' : '↑ 越大越好'}
                        </span>
                      </td>
                      {availableAlgos
                        .filter(algo => algo === baseAlgo || selectedAlgos.includes(algo))
                        .map(algo => {
                          const imp = metricStat?.stats?.geomeanImp || 0;
                          return (
                            <td key={algo} className="px-4 py-3 text-center">
                              <span className={`font-bold ${
                                imp > 0 ? 'text-green-600' : imp < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {imp > 0 ? '+' : ''}{imp.toFixed(2)}%
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
  );
};

export default QoRSimulator;
