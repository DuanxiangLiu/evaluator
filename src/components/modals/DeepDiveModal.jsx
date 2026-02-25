import React from 'react';
import { X, Search, Box } from 'lucide-react';

const DeepDiveModal = ({ isOpen, caseData, baseAlgo, compareAlgo, availableMetrics, onClose }) => {
  if (!isOpen || !caseData) return null;

  const radarData = availableMetrics.map(m => {
    const bVal = caseData.raw[m]?.[baseAlgo];
    const cVal = caseData.raw[m]?.[compareAlgo];
    if (bVal == null || cVal == null) return null;
    const imp = bVal === 0 ? (cVal === 0 ? 0 : -100) : ((bVal - cVal) / bVal) * 100;
    return { metric: m, bVal, cVal, imp };
  }).filter(d => d !== null);

  const maxAbsImp = Math.max(...radarData.map(d => Math.abs(d.imp)), 1);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-600" />
              单例深度透视
            </h3>
            <p className="text-sm text-gray-500 mt-1">Case: <span className="font-bold text-indigo-700">{caseData.Case}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Box className="w-4 h-4 text-indigo-500" />
                属性信息
              </h4>
              <div className="space-y-2">
                {Object.entries(caseData.meta).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm py-1 border-b border-gray-100">
                    <span className="text-gray-500">{key}</span>
                    <span className="font-mono text-gray-700">{value || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-700 mb-3">多维雷达图</h4>
              <div className="aspect-square relative bg-gray-50 rounded-lg border border-gray-200">
                <svg className="w-full h-full overflow-visible" viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet">
                  {(() => {
                    const N = radarData.length;
                    if (N < 3) return <text x="0" y="0" textAnchor="middle" fill="#9ca3af" fontSize="10">需要至少3个指标</text>;
                    
                    const baseRadius = 60;
                    const getRadius = (imp) => baseRadius + (imp / maxAbsImp) * 30;
                    const getPoint = (angle, r) => ({ x: r * Math.sin(angle), y: -r * Math.cos(angle) });

                    const basePolygon = Array.from({length: N}).map((_, i) => {
                      const pt = getPoint((Math.PI * 2 * i) / N, baseRadius);
                      return `${pt.x},${pt.y}`;
                    }).join(' ');

                    const dataPolygon = radarData.map((d, i) => {
                      const r = getRadius(d.imp);
                      const pt = getPoint((Math.PI * 2 * i) / N, r);
                      return `${pt.x},${pt.y}`;
                    }).join(' ');

                    return (
                      <>
                        <polygon points={basePolygon} fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2 2" />
                        <polygon points={dataPolygon} fill="#818cf8" fillOpacity="0.3" stroke="#4f46e5" strokeWidth="2" />
                        
                        {radarData.map((d, i) => {
                          const angle = (Math.PI * 2 * i) / N;
                          const ptEnd = getPoint(angle, 85);
                          const labelPt = getPoint(angle, 95);
                          return (
                            <g key={i}>
                              <line x1="0" y1="0" x2={ptEnd.x} y2={ptEnd.y} stroke="#d1d5db" strokeWidth="0.5" />
                              <text x={labelPt.x} y={labelPt.y} fontSize="5" fontWeight="bold" fill="#4b5563" textAnchor="middle" dominantBaseline="middle">{d.metric}</text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-bold text-gray-700 mb-3">指标详情</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold text-gray-600">指标</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-600">{baseAlgo}</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-600">{compareAlgo}</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-600">改进率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {radarData.map(d => (
                    <tr key={d.metric} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-bold text-gray-800">{d.metric}</td>
                      <td className="px-4 py-2 text-right font-mono text-gray-600">{d.bVal}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-indigo-700">{d.cVal}</td>
                      <td className={`px-4 py-2 text-right font-mono font-bold ${d.imp > 0 ? 'text-emerald-600' : (d.imp < 0 ? 'text-red-600' : 'text-gray-600')}`}>
                        {d.imp > 0 ? '+' : ''}{d.imp.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepDiveModal;
