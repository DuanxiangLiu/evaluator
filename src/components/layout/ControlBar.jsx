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
    <div className="bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 rounded-xl shadow-sm border border-gray-200/50">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-gray-500">指标:</label>
          <select
            value={activeMetric}
            onChange={(e) => onMetricChange(e.target.value)}
            className="text-sm font-semibold border-gray-200 rounded-lg py-1 px-2 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
          >
            {availableMetrics.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        
        <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
        
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-gray-500">基线:</label>
          <select
            value={baseAlgo}
            onChange={(e) => onBaseAlgoChange(e.target.value)}
            className="text-sm font-semibold border-gray-200 rounded-lg py-1 px-2 focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
          >
            {availableAlgos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        
        <span className="text-gray-300 font-bold text-xs">vs</span>
        
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-gray-500">对比:</label>
          <select
            value={compareAlgo}
            onChange={(e) => onCompareAlgoChange(e.target.value)}
            className="text-sm font-semibold border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg py-1 px-2 focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            {availableAlgos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
