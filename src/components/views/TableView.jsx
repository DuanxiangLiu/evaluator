import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import HelpIcon from '../common/HelpIcon';
import SortIcon from '../common/SortIcon';
import StatusBadge, { getStatusType } from '../common/StatusBadge';
import EditableCell from '../common/EditableCell';
import { useToast } from '../common/Toast';
import { exportToCSV, exportFullDataToCSV, exportToJSON, exportToExcel } from '../../services/dataService';
import { calculateImprovement } from '../../utils/statistics';
import { formatIndustrialNumber } from '../../utils/formatters';
import { CheckSquare, Square, ArrowDown, AlertTriangle, Download, Search, MoreVertical, FileSpreadsheet, FileJson } from 'lucide-react';

const TableView = ({
  activeMetric,
  baseAlgo,
  compareAlgo,
  metaColumns,
  tableFilter,
  setTableFilter,
  parsedData,
  filteredTableData,
  selectedCases,
  sortConfig,
  handleSort,
  toggleCase,
  toggleAll,
  hoveredCase,
  setHoveredCase,
  validCasesMap,
  setDeepDiveCase,
  stats
}) => {
  const toast = useToast();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportMenuPosition, setExportMenuPosition] = useState({ top: 0, left: 0 });
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showExportMenu && exportMenuRef.current) {
        const exportMenuPortal = document.getElementById('export-menu-portal');
        if (!exportMenuRef.current.contains(e.target) && 
            (!exportMenuPortal || !exportMenuPortal.contains(e.target))) {
          setShowExportMenu(false);
        }
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showExportMenu) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showExportMenu]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0 relative z-0">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-indigo-800 flex items-center gap-1">
            明细数据目标: <span className="bg-indigo-100 px-2 py-0.5 rounded text-indigo-700 shadow-inner ml-1">{activeMetric}</span>
          </span>
        </div>
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-inner text-xs">
            <button onClick={() => setTableFilter('all')} className={`px-3 py-1.5 rounded transition-colors ${tableFilter === 'all' ? 'bg-white text-indigo-700 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700 font-medium'}`}>全部</button>
            <button onClick={() => setTableFilter('degraded')} className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${tableFilter === 'degraded' ? 'bg-white text-red-700 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700 font-medium'}`}><ArrowDown className="w-3 h-3" />退化</button>
            <button onClick={() => setTableFilter('outlier')} className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${tableFilter === 'outlier' ? 'bg-white text-purple-700 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700 font-medium'}`}><AlertTriangle className="w-3 h-3" />异常</button>
            <button onClick={() => setTableFilter('filtered')} className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${tableFilter === 'filtered' ? 'bg-white text-gray-700 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700 font-medium'}`}><Square className="w-3 h-3" />已过滤</button>
          </div>
          <div className="relative" ref={exportMenuRef}>
            <button 
              onClick={() => {
                if (!showExportMenu && exportMenuRef.current) {
                  const rect = exportMenuRef.current.getBoundingClientRect();
                  const menuWidth = 220;
                  const menuHeight = 200;
                  let left = rect.right - menuWidth;
                  let top = rect.bottom + 8;
                  
                  if (left < 10) left = 10;
                  if (left + menuWidth > window.innerWidth - 10) {
                    left = window.innerWidth - menuWidth - 10;
                  }
                  if (top + menuHeight > window.innerHeight - 10) {
                    top = rect.top - menuHeight - 8;
                  }
                  
                  setExportMenuPosition({ top, left });
                }
                setShowExportMenu(!showExportMenu);
              }} 
              className="text-sm font-medium bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 hover:from-indigo-100 hover:to-violet-100 border border-indigo-200/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Download className="w-4 h-4" />导出数据
              <MoreVertical className="w-3 h-3" />
            </button>
            {showExportMenu && createPortal(
              <div 
                id="export-menu-portal"
                className="fixed bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 z-[9999] overflow-hidden animate-scaleIn"
                style={{
                  top: `${exportMenuPosition.top}px`,
                  left: `${exportMenuPosition.left}px`,
                  minWidth: '220px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
                  <span className="text-xs font-semibold text-gray-600">选择导出格式</span>
                </div>
                <div className="py-1">
                  <button 
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        if (!filteredTableData || filteredTableData.length === 0) {
                          toast.warning('导出失败', '没有数据可导出');
                          return;
                        }
                        exportToCSV(filteredTableData, activeMetric, baseAlgo, compareAlgo, metaColumns, stats); 
                        setShowExportMenu(false); 
                        toast.success('导出成功', 'CSV文件已下载'); 
                      } catch (err) {
                        console.error('Export CSV error:', err);
                        toast.error('导出失败', err.message);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-indigo-50 flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4 text-indigo-500" />
                    导出当前视图 (CSV)
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        if (!parsedData || parsedData.length === 0) {
                          toast.warning('导出失败', '没有数据可导出');
                          return;
                        }
                        exportFullDataToCSV(parsedData, [], [], metaColumns); 
                        setShowExportMenu(false); 
                        toast.success('导出成功', '完整CSV文件已下载'); 
                      } catch (err) {
                        console.error('Export full CSV error:', err);
                        toast.error('导出失败', err.message);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-indigo-50 flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-500" />
                    导出完整数据 (CSV)
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        if (!filteredTableData || filteredTableData.length === 0) {
                          toast.warning('导出失败', '没有数据可导出');
                          return;
                        }
                        exportToExcel(filteredTableData, [], [], metaColumns, activeMetric, baseAlgo, compareAlgo, stats); 
                        setShowExportMenu(false); 
                        toast.success('导出成功', 'TSV文件已下载'); 
                      } catch (err) {
                        console.error('Export Excel error:', err);
                        toast.error('导出失败', err.message);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-indigo-50 flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    导出为Excel格式 (TSV)
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        if (!parsedData || parsedData.length === 0) {
                          toast.warning('导出失败', '没有数据可导出');
                          return;
                        }
                        exportToJSON(parsedData, [], [], metaColumns); 
                        setShowExportMenu(false); 
                        toast.success('导出成功', 'JSON文件已下载'); 
                      } catch (err) {
                        console.error('Export JSON error:', err);
                        toast.error('导出失败', err.message);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-indigo-50 flex items-center gap-2 transition-colors"
                  >
                    <FileJson className="w-4 h-4 text-amber-500" />
                    导出为JSON格式
                  </button>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar pb-10 relative z-0">
        <table className="min-w-full text-sm text-left relative">
          <thead className="bg-gray-100 text-gray-700 text-sm sticky top-0 z-10 shadow-sm border-b border-gray-200">
            <tr>
              <th className="px-4 py-2.5 w-10 text-center cursor-pointer hover:bg-gray-200" onClick={toggleAll} title="全选/反选">
                {selectedCases.size === parsedData.length ? <CheckSquare className="w-4 h-4 text-indigo-600 mx-auto" /> : <Square className="w-4 h-4 text-gray-400 mx-auto" />}
              </th>
              <th className="px-4 py-2.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSort('Case')}><div className="flex items-center justify-between">Case Name <SortIcon config={sortConfig} columnKey="Case" /></div></th>
              {metaColumns.map(mc => (
                <th key={mc} className="px-4 py-2.5 font-medium text-right border-l border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors text-gray-600" onClick={() => handleSort(mc)}>
                  <div className="flex items-center justify-end">{mc} <SortIcon config={sortConfig} columnKey={mc} /></div>
                </th>
              ))}
              <th className="px-4 py-2.5 font-medium text-right border-l border-gray-300 cursor-pointer hover:bg-gray-200 bg-gray-50" onClick={() => handleSort(baseAlgo)}><div className="flex justify-end items-center">{baseAlgo} <SortIcon config={sortConfig} columnKey={baseAlgo} /></div></th>
              <th className="px-4 py-2.5 font-medium text-right cursor-pointer hover:bg-gray-200 bg-gray-50" onClick={() => handleSort(compareAlgo)}><div className="flex justify-end items-center">{compareAlgo} <SortIcon config={sortConfig} columnKey={compareAlgo} /></div></th>
              <th className="px-4 py-2.5 font-medium text-right border-l border-gray-300 cursor-pointer hover:bg-indigo-100 bg-indigo-50/60" onClick={() => handleSort('imp')}>
                <div className="flex justify-end items-center text-indigo-900">
                  改进率 %
                  <HelpIcon
                    content={
                      <div className="space-y-3">
                        <p className="font-bold text-indigo-400 text-lg">改进率计算</p>
                        <div className="space-y-2 text-sm">
                          <p><b>计算公式：</b>((Base - Compare) / Base) × 100</p>
                          <p><b>正值(绿色)：</b>新算法优化，性能提升</p>
                          <p><b>负值(红色)：</b>新算法退化，性能下降</p>
                          <p><b>零值：</b>两种算法表现相同</p>
                        </div>
                      </div>
                    }
                    position="bottom-left"
                    tooltipWidth="w-[32rem]"
                  />
                  <SortIcon config={sortConfig} columnKey="imp" />
                </div>
              </th>
              <th className="px-4 py-2.5 font-medium text-center w-36 bg-indigo-50/60 border-l border-indigo-100">
                状态与透视
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTableData.map((d) => {
              const isChecked = selectedCases.has(d.Case);
              const bVal = d.raw[activeMetric]?.[baseAlgo];
              const cVal = d.raw[activeMetric]?.[compareAlgo];
              const isNull = bVal == null || cVal == null;

              const imp = calculateImprovement(bVal, cVal);
              const validMatch = validCasesMap.get(d.Case);
              const outlierType = validMatch?.outlierType || 'normal';

              const isHovered = hoveredCase === d.Case;
              let rowBg = !isChecked ? 'bg-gray-50/50 opacity-40 grayscale' : (isHovered ? 'bg-indigo-100/50 outline outline-2 outline-indigo-400 z-10 relative' : 'hover:bg-indigo-50/30');
              let impColor = 'text-gray-500';
              
              const statusType = getStatusType(isChecked, isNull, outlierType, imp);
              
              if (imp != null) {
                if (imp > 0) impColor = 'text-emerald-600 font-medium';
                else if (imp < 0) impColor = 'text-red-600 font-medium';
              }

              return (
                <tr key={d.Case} className={`transition-all duration-150 ${rowBg}`} onMouseEnter={() => { if (isChecked && !isNull) setHoveredCase(d.Case); }} onMouseLeave={() => setHoveredCase(null)}>
                  <td className="px-4 py-2 text-center cursor-pointer" onClick={() => toggleCase(d.Case)}><input type="checkbox" checked={isChecked} onChange={() => { }} className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4" /></td>
                  <td className="px-4 py-2 font-medium text-gray-800 max-w-[200px] truncate" title={d.Case}>{d.Case}</td>
                  {metaColumns.map(mc => (
                    <td key={mc} className="px-4 py-2 text-right font-mono text-sm text-gray-600 border-l border-gray-100" title={d.meta[mc]}>{formatIndustrialNumber(d.meta[mc]) || '-'}</td>
                  ))}
                  <td className="px-4 py-2 text-right font-mono text-sm text-gray-600 border-l border-gray-200 bg-gray-50/50">
                    {bVal == null ? <span className="text-gray-300">NaN</span> : bVal}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-sm text-gray-600 bg-gray-50/50">
                    {cVal == null ? <span className="text-gray-300">NaN</span> : cVal}
                  </td>
                  <td className={`px-4 py-2 text-right font-mono text-sm tracking-tight border-l border-gray-200 ${impColor} bg-indigo-50/40`}>{isNull ? '-' : (imp != null ? `${imp > 0 ? '+' : ''}${imp.toFixed(2)}%` : '-')}</td>
                  <td className="px-4 py-2 text-center bg-indigo-50/40 border-l border-indigo-100/50">
                    <div className="flex justify-center items-center gap-2">
                      <StatusBadge type={statusType} />
                      {isChecked && !isNull && (
                        <button onClick={() => setDeepDiveCase(d.Case)} className="text-indigo-400 hover:text-indigo-700 bg-white p-1 rounded border border-indigo-200 shadow-sm" title="单点多维深度透视">
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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

TableView.propTypes = {
  activeMetric: PropTypes.string.isRequired,
  baseAlgo: PropTypes.string.isRequired,
  compareAlgo: PropTypes.string.isRequired,
  metaColumns: PropTypes.array.isRequired,
  tableFilter: PropTypes.string.isRequired,
  setTableFilter: PropTypes.func.isRequired,
  parsedData: PropTypes.array.isRequired,
  filteredTableData: PropTypes.array.isRequired,
  selectedCases: PropTypes.instanceOf(Set).isRequired,
  sortConfig: PropTypes.object.isRequired,
  handleSort: PropTypes.func.isRequired,
  toggleCase: PropTypes.func.isRequired,
  toggleAll: PropTypes.func.isRequired,
  hoveredCase: PropTypes.string,
  setHoveredCase: PropTypes.func.isRequired,
  validCasesMap: PropTypes.instanceOf(Map).isRequired,
  setDeepDiveCase: PropTypes.func.isRequired,
  stats: PropTypes.object
};

export default TableView;
