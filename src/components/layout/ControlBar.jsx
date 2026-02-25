import React from 'react';

const ControlBar = ({ 
  availableMetrics, 
  activeMetric, 
  onMetricChange, 
  availableAlgos, 
  baseAlgo, 
  compareAlgo, 
  onBaseAlgoChange, 
  onCompareAlgoChange 
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-600">焦点指标:</label>
          <select
            value={activeMetric}
            onChange={(e) => onMetricChange(e.target.value)}
            className="text-sm font-bold border-gray-300 rounded-lg py-1.5 px-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          >
            {availableMetrics.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        
        <div className="h-6 w-px bg-gray-200"></div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-600">基线算法:</label>
          <select
            value={baseAlgo}
            onChange={(e) => onBaseAlgoChange(e.target.value)}
            className="text-sm font-bold border-gray-300 rounded-lg py-1.5 px-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
          >
            {availableAlgos.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        
        <span className="text-gray-400 font-bold">vs</span>
        
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-600">对比算法:</label>
          <select
            value={compareAlgo}
            onChange={(e) => onCompareAlgoChange(e.target.value)}
            className="text-sm font-bold border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg py-1.5 px-3 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
          >
            {availableAlgos.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
