import React from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const AllMetricsOverview = ({ allMetricsStats, baseAlgo, compareAlgo }) => {
  if (!allMetricsStats || allMetricsStats.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500">暂无指标数据</p>
      </div>
    );
  }

  const formatValue = (value, isPercentage = true) => {
    if (value === null || isNaN(value)) return '-';
    if (isPercentage) {
      return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
    }
    return value.toFixed(3);
  };

  const getTrendIcon = (value) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getValueColor = (value) => {
    if (value > 0) return 'text-emerald-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPValueColor = (pValue) => {
    if (pValue === null || isNaN(pValue)) return 'text-gray-600';
    if (pValue < 0.05) return 'text-emerald-600 font-semibold';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">所有指标统计概览</h3>
        <span className="text-xs text-gray-500">{baseAlgo} vs {compareAlgo}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                指标
              </th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                几何平均改进
              </th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                算术平均
              </th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                显著性
              </th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                95% 置信区间
              </th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                退化案例
              </th>
              <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                极值范围
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allMetricsStats.map((item, index) => {
              const stats = item.stats;
              if (!stats) return null;

              const degradedRate = stats.nValid > 0 ? (stats.degradedCount / stats.nValid * 100) : 0;

              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.metric}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                    <div className="flex items-center justify-end gap-1">
                      {getTrendIcon(stats.geomeanImp)}
                      <span className={getValueColor(stats.geomeanImp)}>
                        {formatValue(stats.geomeanImp)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                    <div className="flex items-center justify-end gap-1">
                      {getTrendIcon(stats.meanImp)}
                      <span className={getValueColor(stats.meanImp)}>
                        {formatValue(stats.meanImp)}
                      </span>
                    </div>
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-sm text-right ${getPValueColor(stats.pValue)}`}>
                    {formatValue(stats.pValue, false)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                    <span className={stats.ciLower > 0 ? 'text-emerald-600' : stats.ciUpper < 0 ? 'text-red-600' : 'text-gray-600'}>
                      [{formatValue(stats.ciLower)}, {formatValue(stats.ciUpper)}]
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                    <span className={stats.degradedCount === 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {stats.degradedCount}/{stats.nValid}
                      <span className="text-xs text-gray-500 ml-1">({degradedRate.toFixed(2)}%)</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                    <span className="text-gray-600">
                      {formatValue(stats.minImp)} ~ {formatValue(stats.maxImp)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

AllMetricsOverview.propTypes = {
  allMetricsStats: PropTypes.arrayOf(
    PropTypes.shape({
      metric: PropTypes.string.isRequired,
      stats: PropTypes.shape({
        geomeanImp: PropTypes.number,
        meanImp: PropTypes.number,
        pValue: PropTypes.number,
        ciLower: PropTypes.number,
        ciUpper: PropTypes.number,
        degradedCount: PropTypes.number,
        nValid: PropTypes.number,
        maxImp: PropTypes.number,
        minImp: PropTypes.number
      })
    })
  ).isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string.isRequired
};

export default AllMetricsOverview;