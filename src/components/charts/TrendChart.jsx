import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ChartHeader from '../common/ChartHeader';
import ChartContainer, { ChartBody, ChartArea, AreaLabel } from '../common/ChartContainer';
import { useChartWidth } from '../../hooks/useChartWidth';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

const TrendChart = ({
  dataPoints,
  title = '算法迭代改进曲线',
  metricLabel = '几何平均改进率',
  onPointClick,
  showRegressionWarning = false
}) => {
  const chartWidth = useChartWidth();
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const chartData = useMemo(() => {
    if (!dataPoints || dataPoints.length === 0) return null;

    const values = dataPoints.map(d => d.geomeanImp);
    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values, 0);
    const range = maxVal - minVal || 1;
    const padding = range * 0.15;

    return {
      points: dataPoints.map((d, i) => ({
        ...d,
        index: i,
        x: i,
        y: d.geomeanImp
      })),
      yMin: minVal - padding,
      yMax: maxVal + padding,
      yRange: range + padding * 2
    };
  }, [dataPoints]);

  const mapY = (value) => {
    if (!chartData) return 50;
    const { yMin, yRange } = chartData;
    return ((chartData.yMax - value) / yRange) * 85 + 5;
  };

  const mapX = (index) => {
    if (!chartData || chartData.points.length === 1) return 50;
    return 5 + (index / (chartData.points.length - 1)) * 90;
  };

  const getTrendIcon = () => {
    if (!chartData || chartData.points.length < 2) return <Minus className="w-4 h-4" />;
    
    const first = chartData.points[0].geomeanImp;
    const last = chartData.points[chartData.points.length - 1].geomeanImp;
    
    if (last > first + 0.5) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (last < first - 0.5) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatYTick = (val) => {
    if (Math.abs(val) < 0.001) return '0%';
    return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  const generateTicks = () => {
    if (!chartData) return [];
    const { yMin, yMax } = chartData;
    const ticks = [];
    const step = chartData.yRange / 5;
    
    for (let i = 0; i <= 5; i++) {
      const val = yMax - i * step;
      ticks.push({ val, label: formatYTick(val) });
    }
    
    if (yMin < 0 && yMax > 0) {
      const zeroExists = ticks.some(t => Math.abs(t.val) < 0.001);
      if (!zeroExists) {
        ticks.push({ val: 0, label: '0%' });
      }
    }
    
    return ticks.sort((a, b) => b.val - a.val);
  };

  if (!chartData || chartData.points.length === 0) {
    return (
      <ChartContainer>
        <ChartHeader title={title} />
        <ChartBody className={`${chartWidth} mx-auto w-full`}>
          <div className="flex-1 flex items-center justify-center text-gray-400">
            暂无历史数据
          </div>
        </ChartBody>
      </ChartContainer>
    );
  }

  const ticks = generateTicks();
  const pathData = chartData.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.index)} ${mapY(p.geomeanImp)}`)
    .join(' ');

  return (
    <ChartContainer>
      <ChartHeader
        title={title}
        icon={TrendingUp}
        rightContent={
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            {showRegressionWarning && (
              <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                检测到回归
              </span>
            )}
          </div>
        }
        helpContent={
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-indigo-400 text-sm mb-2">{title}</h3>
              <p className="text-gray-300 text-xs mb-2">
                展示算法随版本迭代的性能变化趋势，帮助追踪改进效果和识别性能回归。
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-emerald-300 text-xs">图表说明</h4>
              <ul className="text-gray-300 text-xs space-y-1.5">
                <li>• <strong>X 轴</strong>：按时间顺序排列的版本快照</li>
                <li>• <strong>Y 轴</strong>：几何平均改进率</li>
                <li>• <strong>绿色区域</strong>：改进区间</li>
                <li>• <strong>红色区域</strong>：退化的区间</li>
              </ul>
            </div>
            
            <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
              💡 点击数据点可查看该版本的详细信息
            </div>
          </div>
        }
      />
      
      <ChartBody className={`${chartWidth} mx-auto w-full`}>
        <div className="flex flex-col justify-between text-right pr-2 py-1 text-xs font-semibold text-gray-500 w-16 flex-shrink-0 relative">
          <span className="text-gray-400 text-xs -rotate-90 origin-center whitespace-nowrap absolute left-2 top-1/2 -translate-y-1/2">{metricLabel}</span>
          {ticks.map((tick, i) => (
            <span
              key={i}
              className={`absolute ${tick.val > 0 ? 'text-green-600' : tick.val < 0 ? 'text-red-500' : 'text-gray-400'}`}
              style={{ top: `${mapY(tick.val)}%`, transform: 'translateY(-50%)' }}
            >
              {tick.label}
            </span>
          ))}
        </div>
        
        <ChartArea className="border-l-2 border-b-2 border-gray-300 bg-gradient-to-b from-green-50/30 via-white to-red-50/30">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-green-100/20 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-red-100/20 to-transparent pointer-events-none"></div>
          
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            {ticks.filter(t => Math.abs(t.val) < 0.001).map((tick, i) => (
              <line
                key={i}
                x1="0"
                y1={mapY(tick.val)}
                x2="100"
                y2={mapY(tick.val)}
                stroke="#9ca3af"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
            ))}
            
            {chartData.points.length > 1 && (
              <path
                d={pathData}
                fill="none"
                stroke="#6366f1"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {chartData.points.map((point, i) => {
              const isHovered = hoveredPoint?.index === i;
              const cx = mapX(point.index);
              const cy = mapY(point.geomeanImp);
              
              let dotColor = '#6366f1';
              if (point.geomeanImp > 5) dotColor = '#10b981';
              else if (point.geomeanImp < -5) dotColor = '#dc2626';
              
              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  onMouseEnter={(e) => {
                    setHoveredPoint(point);
                  }}
                  onMouseMove={(e) => {}}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => onPointClick && onPointClick(point)}
                >
                  <circle cx={cx} cy={cy} r="4" fill="transparent" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? '2' : '1.2'}
                    fill={dotColor}
                    stroke={isHovered ? '#fff' : 'none'}
                    strokeWidth={isHovered ? '0.3' : '0'}
                    className={`transition-all duration-200 ${isHovered ? 'animate-pulse' : ''}`}
                  />
                </g>
              );
            })}
          </svg>
          
          <AreaLabel position="top-left" variant="success">改进 ↑</AreaLabel>
          <AreaLabel position="bottom-left" variant="danger">退化 ↓</AreaLabel>
        </ChartArea>
      </ChartBody>
      
      {hoveredPoint && (
        <div className={`${chartWidth} mx-auto w-full px-4 py-2 bg-gray-50 border-t border-gray-100`}>
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-gray-700">{hoveredPoint.versionTag || `版本 ${hoveredPoint.index + 1}`}</span>
              <span className="text-gray-400 ml-2">
                {new Date(hoveredPoint.timestamp).toLocaleString('zh-CN')}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className={hoveredPoint.geomeanImp >= 0 ? 'text-green-600' : 'text-red-600'}>
                改进: {hoveredPoint.geomeanImp >= 0 ? '+' : ''}{hoveredPoint.geomeanImp.toFixed(2)}%
              </span>
              <span className="text-gray-500">
                P: {hoveredPoint.pValue.toFixed(3)}
              </span>
              <span className="text-gray-500">
                样本: {hoveredPoint.nValid}
              </span>
            </div>
          </div>
        </div>
      )}
    </ChartContainer>
  );
};

TrendChart.propTypes = {
  dataPoints: PropTypes.arrayOf(PropTypes.shape({
    timestamp: PropTypes.string.isRequired,
    versionTag: PropTypes.string,
    geomeanImp: PropTypes.number.isRequired,
    pValue: PropTypes.number.isRequired,
    nValid: PropTypes.number,
    degradedCount: PropTypes.number
  })),
  title: PropTypes.string,
  metricLabel: PropTypes.string,
  onPointClick: PropTypes.func,
  showRegressionWarning: PropTypes.bool
};

export default TrendChart;
