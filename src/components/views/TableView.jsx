import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import ChartHeader from '../common/ChartHeader';
import SortIcon from '../common/SortIcon';
import StatusBadge, { getStatusType } from '../common/StatusBadge';
import { useToast } from '../common/Toast';
import { exportToCSV, exportFullDataToCSV, exportToJSON, exportToExcel } from '../../services/dataService';
import { calculateImprovementWithDirection } from '../../utils/statistics';
import { getMetricConfig } from '../../services/csvParser';
import { formatIndustrialNumber } from '../../utils/formatters';
import { TABLE_STYLES, getDetailRowStyle, getImpColorClass } from '../../utils/tableStyles';
import { logger } from '../../utils/logger';
import { CheckSquare, Square, ArrowDown, AlertTriangle, Download, Search, MoreVertical, FileSpreadsheet, FileJson, X } from 'lucide-react';
import HelpIcon from '../common/HelpIcon';
import { ImprovementFormulaHelp } from '../common/HelpContents';

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
  stats,
  tableSearchTerm,
  setTableSearchTerm
}) => {
  const toast = useToast();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportMenuPosition, setExportMenuPosition] = useState({ top: 0, left: 0 });
  const exportMenuRef = useRef(null);
  const searchInputRef = useRef(null);

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

  const clearSearch = () => {
    setTableSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const filterButtons = (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="搜索 Case 或数据..."
          value={tableSearchTerm || ''}
          onChange={(e) => setTableSearchTerm(e.target.value)}
          className="text-xs pl-8 pr-7 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 w-44"
        />
        {tableSearchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-inner text-xs">
        <button onClick={() => setTableFilter('all')} className={`px-3 py-1.5 rounded transition-colors ${tableFilter === 'all' ? 'bg-white text-indigo-700 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700 font-medium'}`}>全部</button>
        <button onClick={() => setTableFilter('degraded')} className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${tableFilter === 'degraded' ? 'bg-white text-red-700 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700 font-medium'}`}><ArrowDown className="w-3 h-3" />退化</button>
        <button onClick={() => setTableFilter('outlier')} className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${tableFilter === 'outlier' ? 'bg-white text-purple-700 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700 font-medium'}`}><AlertTriangle className="w-3 h-3" />异常</button>
        <button onClick={() => setTableFilter('filtered')} className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${tableFilter === 'filtered' ? 'bg-white text-gray-700 font-medium shadow-sm' : 'text-gray-500 hover:text-gray-700 font-medium'}`}><Square className="w-3 h-3" />已过滤</button>
      </div>
    </div>
  );

  const exportButton = (
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
                  logger.error('导出CSV失败:', err);
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
                  logger.error('导出完整CSV失败:', err);
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
                  logger.error('导出Excel失败:', err);
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
                  logger.error('导出JSON失败:', err);
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
  );

  return (
    <div className="flex flex-col h-full">
      <ChartHeader
        title="明细数据目标"
        metric={activeMetric}
        variant="table"
        helpContent={
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-indigo-400 text-sm mb-2">明细数据表格</h3>
              <p className="text-gray-300 text-xs mb-2">
                展示所有测试用例的详细数据，包括基准算法和对比算法的原始指标值及计算得出的改进率。
              </p>
            </div>
            
            <ImprovementFormulaHelp />
            
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-300 text-xs">筛选功能</h4>
              <ul className="text-gray-300 text-xs space-y-1">
                <li>• <strong>全部</strong>：显示所有用例</li>
                <li>• <strong>退化</strong>：仅显示改进率为负的用例</li>
                <li>• <strong>异常</strong>：仅显示数据异常的用例</li>
              </ul>
            </div>
            
            <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400">
              💡 <strong>提示</strong>：勾选用例可将其纳入图表分析范围
            </div>
          </div>
        }
        rightContent={
          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            {filterButtons}
            {exportButton}
          </div>
        }
      />

      <div className={`${TABLE_STYLES.wrapper} pb-10 relative z-0`}>
        <table className={TABLE_STYLES.table}>
          <thead className={TABLE_STYLES.thead}>
            <tr>
              <th className="px-4 py-2.5 w-10 text-center cursor-pointer hover:bg-gray-200" onClick={toggleAll} title="全选/反选">
                {selectedCases.size === parsedData.length ? <CheckSquare className="w-4 h-4 text-indigo-600 mx-auto" /> : <Square className="w-4 h-4 text-gray-400 mx-auto" />}
              </th>
              <th className={TABLE_STYLES.theadCell} onClick={() => handleSort('Case')}><div className="flex items-center justify-between">Case Name <SortIcon config={sortConfig} columnKey="Case" /></div></th>
              {metaColumns.map(mc => (
                <th key={mc} className={TABLE_STYLES.theadCellRight} onClick={() => handleSort(mc)}>
                  <div className="flex items-center justify-end">{mc} <SortIcon config={sortConfig} columnKey={mc} /></div>
                </th>
              ))}
              <th className="px-4 py-2.5 font-medium text-right border-l border-gray-300 cursor-pointer hover:bg-gray-200 bg-gray-50" onClick={() => handleSort(baseAlgo)}><div className="flex justify-end items-center">{baseAlgo} <SortIcon config={sortConfig} columnKey={baseAlgo} /></div></th>
              <th className="px-4 py-2.5 font-medium text-right cursor-pointer hover:bg-gray-200 bg-gray-50" onClick={() => handleSort(compareAlgo)}><div className="flex justify-end items-center">{compareAlgo} <SortIcon config={sortConfig} columnKey={compareAlgo} /></div></th>
              <th className="px-4 py-2.5 font-medium text-right border-l border-gray-300 cursor-pointer hover:bg-indigo-100 bg-indigo-50/60" onClick={() => handleSort('imp')}>
                <div className="flex justify-end items-center text-indigo-900">
                  改进率 %
                  <HelpIcon 
                    content={<ImprovementFormulaHelp />}
                    className="w-3 h-3 text-indigo-600"
                  />
                  <SortIcon config={sortConfig} columnKey="imp" />
                </div>
              </th>
              <th className="px-4 py-2.5 font-medium text-center w-36 bg-indigo-50/60 border-l border-indigo-100">
                <div className="flex justify-center items-center gap-1">
                  状态与透视
                  <HelpIcon 
                    content={
                      <div className="space-y-2">
                        <h4 className="font-semibold text-indigo-300 text-xs">状态标识说明</h4>
                        <ul className="text-gray-300 text-xs space-y-1">
                          <li>• <strong>已选</strong>：当前选中用于图表分析的用例</li>
                          <li>• <strong>退化</strong>：改进率为负的用例</li>
                          <li>• <strong>异常</strong>：数据存在缺失或异常值</li>
                        </ul>
                        <div className="bg-slate-800/50 rounded p-2 text-xs text-gray-400 mt-2">
                          💡 点击放大镜按钮可查看该用例的多维深度分析
                        </div>
                      </div>
                    }
                    className="w-3 h-3 text-indigo-600"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className={TABLE_STYLES.tbody}>
            {filteredTableData.map((d) => {
              const isChecked = selectedCases.has(d.Case);
              const bVal = d.raw[activeMetric]?.[baseAlgo];
              const cVal = d.raw[activeMetric]?.[compareAlgo];
              const isNull = bVal == null || cVal == null;

              const metricConfig = getMetricConfig(activeMetric);
              const imp = calculateImprovementWithDirection(bVal, cVal, metricConfig.better === 'higher');
              const validMatch = validCasesMap.get(d.Case);
              const outlierType = validMatch?.outlierType || 'normal';

              const isHovered = hoveredCase === d.Case;
              const rowBg = getDetailRowStyle(isChecked, isHovered, isNull);
              const impColor = getImpColorClass(imp);
              
              const statusType = getStatusType(isChecked, isNull, outlierType, imp);

              return (
                <tr key={d.Case} className={rowBg} onMouseEnter={() => { if (isChecked && !isNull) setHoveredCase(d.Case); }} onMouseLeave={() => setHoveredCase(null)}>
                  <td className="px-4 py-2 text-center cursor-pointer" onClick={() => toggleCase(d.Case)}><input type="checkbox" checked={isChecked} onChange={() => { }} className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4" /></td>
                  <td className={`${TABLE_STYLES.cell} font-medium max-w-[200px] truncate`} title={d.Case}>{d.Case}</td>
                  {metaColumns.map(mc => (
                    <td key={mc} className={TABLE_STYLES.cellRight} title={d.meta[mc]}>{formatIndustrialNumber(d.meta[mc]) || '-'}</td>
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
  stats: PropTypes.object,
  tableSearchTerm: PropTypes.string,
  setTableSearchTerm: PropTypes.func.isRequired
};

export default TableView;
