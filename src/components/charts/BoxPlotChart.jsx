import React from 'react';
import PropTypes from 'prop-types';
import ChartHeader from '../common/ChartHeader';
import { calculateImprovement } from '../../utils/statistics';
import { CHART_Y_PADDING } from '../../utils/constants';

const BoxPlotChart = ({ stats, activeMetric, handleChartMouseMove, hoveredCase, setHoveredCase, setTooltipState, onCaseClick, parsedData }) => {
  if (!stats) return null;

  const yMax = Math.max(Math.abs(stats.maxImp), Math.abs(stats.minImp)) + CHART_Y_PADDING;
  const mapY = (val) => 50 - (val / yMax) * 50;

  const legendItems = [
    { color: '#f87171', label: '严重退化' },
    { color: '#a855f7', label: '显著优化' },
    { color: '#a5b4fc', label: '正常范围' }
  ];

  return (
    <div className="p-4 h-full flex flex-col justify-center" onMouseMove={handleChartMouseMove}>
      <div className="bg-white p-5 rounded-xl border border-gray-200 max-w-4xl mx-auto w-full shadow-sm">
        <ChartHeader
          title="改进率分布箱线图"
          metric={activeMetric}
          legendItems={legendItems}
          helpContent={
            <div className="space-y-2">
              <p className="font-bold text-indigo-400">改进率分布箱线图</p>
              <div className="text-xs space-y-1">
                <p>箱线图直观展示了单个指标在所有 Case 中的宏观分布情况。</p>
                <p><b>蓝色阴影区 (IQR)：</b>覆盖 50% 的核心密集区，从 Q1 到 Q3</p>
                <p><b>虚线 (中位数)：</b>所有 Case 改进率的中位数</p>
                <p><b>零线：</b>改进率为 0% 的基准线</p>
                <p><b>紫色点：</b>显著优化离群点</p>
                <p><b>红色点：</b>严重退化离群点</p>
                <p><b>双击数据点：</b>打开深度分析模态框</p>
              </div>
            </div>
          }
          helpWidth="w-[36rem]"
          helpPosition="right-center"
        />

        <div className="flex">
          <div className="flex flex-col justify-between text-right pr-2 py-1 text-[10px] font-bold text-gray-500 w-10">
            <span>+{yMax.toFixed(0)}%</span>
            <span className="text-green-600">+{(stats.q3).toFixed(1)}%</span>
            <span className="text-indigo-600">中位数</span>
            <span className="text-amber-600">{(stats.q1).toFixed(1)}%</span>
            <span>0%</span>
            <span className="text-red-500">-{yMax.toFixed(0)}%</span>
          </div>
          
          <div className="relative flex-1 h-64 border-l-2 border-b-2 border-gray-300 bg-gradient-to-b from-green-50/30 via-white to-red-50/30">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-green-100/20 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-red-100/20 to-transparent pointer-events-none"></div>
            
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="50" x2="100" y2="50" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" />
              
              <rect x="0" y={mapY(stats.q3)} width="100" height={Math.max(0, mapY(stats.q1) - mapY(stats.q3))} fill="#c7d2fe" opacity="0.5" />
              
              <line x1="0" y1={mapY(stats.median)} x2="100" y2={mapY(stats.median)} stroke="#4f46e5" strokeWidth="1" strokeDasharray="3 2" />
              
              <line x1="0" y1={mapY(stats.q1)} x2="100" y2={mapY(stats.q1)} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="1 2" />
              <line x1="0" y1={mapY(stats.q3)} x2="100" y2={mapY(stats.q3)} stroke="#22c55e" strokeWidth="0.5" strokeDasharray="1 2" />
              
              {stats.validCases.map((d, i) => {
                const imp = d.imp;
                const cx = 5 + (i / (stats.nValid - 1 || 1)) * 90;
                const cy = mapY(imp);
                const isOutlier = imp > stats.outlierUpper || imp < stats.outlierLower;
                const isHovered = hoveredCase === d.Case;
                
                let dotColor = "#6366f1";
                if (imp > stats.outlierUpper) dotColor = "#9333ea";
                if (imp < stats.outlierLower) dotColor = "#dc2626";
                
                return (
                  <circle key={d.Case} cx={cx} cy={cy} r={isHovered ? "3" : (isOutlier ? "1.8" : "1")}
                    fill={dotColor} stroke={isHovered ? "#fff" : "none"} strokeWidth={isHovered ? "0.3" : "0"}
                    className={`transition-all duration-200 cursor-pointer ${isHovered ? 'animate-pulse' : ''}`}
                    onMouseEnter={() => {
                      setHoveredCase(d.Case);
                      setTooltipState({ visible: true, x: 0, y: 0, title: d.Case, lines: [`状态: ${isOutlier ? (imp > 0 ? '显著优化(异常)' : '严重退化(异常)') : (imp > 0 ? '优化' : '退化')}`, `改进: ${imp > 0 ? '+' : ''}${imp.toFixed(2)}%`, `Base: ${d.bVal} | Comp: ${d.cVal}`] });
                    }}
                    onMouseLeave={() => { setHoveredCase(null); setTooltipState(prev => ({...prev, visible: false})); }}
                    onDoubleClick={() => {
                      if (onCaseClick && parsedData) {
                        const caseData = parsedData.find(p => p.Case === d.Case);
                        if (caseData) onCaseClick(caseData);
                      }
                    }}
                  />
                );
              })}
            </svg>
            
            <div className="absolute top-1 left-2 text-[9px] text-green-600 font-bold bg-green-50/80 px-1 rounded">优化区域 ↑</div>
            <div className="absolute bottom-1 left-2 text-[9px] text-red-500 font-bold bg-red-50/80 px-1 rounded">退化区域 ↓</div>
          </div>
        </div>

        <div className="mt-3 flex justify-center gap-6 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-6 h-0.5 bg-indigo-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #4f46e5 0, #4f46e5 3px, transparent 3px, transparent 6px)' }}></span>
            中位数线
          </span>
          <span className="flex items-center gap-1">
            <span className="w-6 h-2 bg-indigo-200/50 rounded"></span>
            IQR 区域 (Q1-Q3)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-6 h-0.5 bg-gray-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #9ca3af 0, #9ca3af 2px, transparent 2px, transparent 4px)' }}></span>
            零线 (0%)
          </span>
        </div>
      </div>
    </div>
  );
};

BoxPlotChart.propTypes = {
  stats: PropTypes.object,
  activeMetric: PropTypes.string.isRequired,
  handleChartMouseMove: PropTypes.func.isRequired,
  hoveredCase: PropTypes.string,
  setHoveredCase: PropTypes.func.isRequired,
  setTooltipState: PropTypes.func.isRequired,
  onCaseClick: PropTypes.func,
  parsedData: PropTypes.array
};

export default BoxPlotChart;
