import React from 'react';
import { ChevronDown } from 'lucide-react';

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
    <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col xs:flex-row flex-wrap items-start xs:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 w-full xs:w-auto">
            <label className="text-xs sm:text-sm font-bold text-gray-600 whitespace-nowrap">焦点指标:</label>
            <select
              value={activeMetric}
              onChange={(e) => onMetricChange(e.target.value)}
              className="flex-1 xs:flex-none text-sm sm:text-base font-bold border-gray-300 rounded-lg py-1.5 px-2 sm:px-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm transition-all"
            >
              {availableMetrics.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          
          <div className="hidden xs:block h-6 w-px bg-gray-200"></div>
          
          <div className="flex items-center gap-2 w-full xs:w-auto">
            <label className="text-xs sm:text-sm font-bold text-gray-600 whitespace-nowrap">基线算法:</label>
            <select
              value={baseAlgo}
              onChange={(e) => onBaseAlgoChange(e.target.value)}
              className="flex-1 xs:flex-none text-sm sm:text-base font-bold border-gray-300 rounded-lg py-1.5 px-2 sm:px-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm transition-all"
            >
              {availableAlgos.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 w-full xs:w-auto">
            <span className="text-gray-400 font-bold text-sm">vs</span>
            <label className="text-xs sm:text-sm font-bold text-gray-600 whitespace-nowrap">对比算法:</label>
            <select
              value={compareAlgo}
              onChange={(e) => onCompareAlgoChange(e.target.value)}
              className="flex-1 xs:flex-none text-sm sm:text-base font-bold border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg py-1.5 px-2 sm:px-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
            >
              {availableAlgos.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
