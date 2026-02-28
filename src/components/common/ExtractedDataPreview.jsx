import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Download, Table, BarChart2, PieChart, Filter, Search,
  ChevronLeft, ChevronRight, SortAsc, SortDesc, X, Eye,
  FileJson, FileSpreadsheet, Check, AlertTriangle
} from 'lucide-react';
import { convertToCSVFormat } from '../../services/logParser';
import { formatIndustrialNumber } from '../../utils/formatters';
import { useToast } from '../common/Toast';

const ExtractedDataPreview = ({
  parseResults = [],
  extractionStats = null,
  onExportCSV,
  onExportJSON,
  onImport,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [filterAlgo, setFilterAlgo] = useState('all');
  const [filterMetric, setFilterMetric] = useState('all');
  const [selectedRow, setSelectedRow] = useState(null);
  const rowsPerPage = 15;

  const toast = useToast();

  const { csvData, metrics, algorithms, caseData } = useMemo(() => {
    if (parseResults.length === 0) {
      return { csvData: null, metrics: [], algorithms: [], caseData: {} };
    }
    return convertToCSVFormat(parseResults);
  }, [parseResults]);

  const tableData = useMemo(() => {
    if (!csvData) return [];

    const lines = csvData.split('\n');
    const headers = lines[0]?.split(',') || [];
    const rows = lines.slice(1).map(line => {
      const values = line.split(',');
      const row = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });
      return row;
    });

    return { headers, rows };
  }, [csvData]);

  const filteredAndSortedRows = useMemo(() => {
    if (!tableData.rows) return [];

    let result = tableData.rows.map((row, idx) => ({ ...row, _idx: idx }));

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(v =>
          String(v).toLowerCase().includes(term)
        )
      );
    }

    if (filterAlgo !== 'all') {
      result = result.filter(row => {
        const algoResult = parseResults.find(r => r.caseName === row.Case);
        return algoResult?.algorithm?.id === filterAlgo;
      });
    }

    if (filterMetric !== 'all' && metrics.includes(filterMetric)) {
      result = result.filter(row => {
        const hasValue = algorithms.some(algo => {
          const key = `m_${algo}_${filterMetric}`;
          const val = parseFloat(row[key]);
          return !isNaN(val);
        });
        return hasValue;
      });
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);

        let comparison = 0;
        if (!isNaN(aNum) && !isNaN(bNum)) {
          comparison = aNum - bNum;
        } else {
          comparison = String(aVal).localeCompare(String(bVal), 'zh-CN');
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [tableData.rows, searchTerm, filterAlgo, filterMetric, sortConfig, parseResults, metrics, algorithms]);

  const totalPages = Math.ceil(filteredAndSortedRows.length / rowsPerPage);
  const paginatedRows = filteredAndSortedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = useCallback((key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const handleExportCSVClick = useCallback(() => {
    if (onExportCSV) {
      onExportCSV();
    } else if (csvData) {
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extracted_data_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('导出成功', 'CSV文件已下载');
    }
  }, [csvData, onExportCSV, toast]);

  const handleExportJSONClick = useCallback(() => {
    if (onExportJSON) {
      onExportJSON();
    } else if (parseResults.length > 0) {
      const exportData = {
        extractedAt: new Date().toISOString(),
        stats: extractionStats,
        results: parseResults
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extracted_data_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('导出成功', 'JSON文件已下载');
    }
  }, [parseResults, extractionStats, onExportJSON, toast]);

  const handleImportClick = useCallback(() => {
    if (onImport) {
      onImport(csvData);
    }
  }, [csvData, onImport]);

  const getAlgorithmForCase = useCallback((caseName) => {
    const result = parseResults.find(r => r.caseName === caseName);
    return result?.algorithm;
  }, [parseResults]);

  const uniqueAlgorithms = useMemo(() => {
    const algos = new Map();
    parseResults.forEach(r => {
      if (!algos.has(r.algorithm.id)) {
        algos.set(r.algorithm.id, r.algorithm);
      }
    });
    return Array.from(algos.values());
  }, [parseResults]);

  if (parseResults.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-8 ${className}`}>
        <div className="text-center text-gray-400">
          <Table className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">暂无提取数据</p>
          <p className="text-xs mt-1">请先扫描并提取日志文件</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                表格
              </button>
              <button
                onClick={() => setViewMode('stats')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  viewMode === 'stats' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                统计
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-6 pr-3 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 w-40"
                />
              </div>

              <select
                value={filterAlgo}
                onChange={(e) => {
                  setFilterAlgo(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="all">全部算法</option>
                {uniqueAlgorithms.map(algo => (
                  <option key={algo.id} value={algo.id}>{algo.name}</option>
                ))}
              </select>

              <select
                value={filterMetric}
                onChange={(e) => {
                  setFilterMetric(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="all">全部指标</option>
                {metrics.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSVClick}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={handleExportJSONClick}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              <FileJson className="w-3.5 h-3.5" />
              JSON
            </button>
            {onImport && (
              <button
                onClick={handleImportClick}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded hover:from-emerald-600 hover:to-teal-600"
              >
                <Check className="w-3.5 h-3.5" />
                导入分析
              </button>
            )}
          </div>
        </div>

        {extractionStats && (
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>共 {filteredAndSortedRows.length} 条记录</span>
            <span>|</span>
            <span>{extractionStats.totalAlgorithms} 个算法</span>
            <span>|</span>
            <span>{extractionStats.totalMetrics} 个指标</span>
            <span>|</span>
            <span className="text-emerald-600">提取率 {extractionStats.extractionRate}%</span>
          </div>
        )}
      </div>

      <div className="overflow-hidden">
        {viewMode === 'table' && (
          <>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {tableData.headers?.map((header, idx) => (
                      <th
                        key={idx}
                        className="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort(header)}
                      >
                        <div className="flex items-center gap-1">
                          {header}
                          {sortConfig.key === header && (
                            sortConfig.direction === 'asc' 
                              ? <SortAsc className="w-3 h-3 text-indigo-500" />
                              : <SortDesc className="w-3 h-3 text-indigo-500" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, rowIdx) => {
                    const algo = getAlgorithmForCase(row.Case);
                    return (
                      <tr
                        key={row._idx}
                        className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                          selectedRow === row._idx ? 'bg-indigo-50' : ''
                        }`}
                        onClick={() => setSelectedRow(selectedRow === row._idx ? null : row._idx)}
                      >
                        {tableData.headers?.map((header, cellIdx) => {
                          const value = row[header];
                          const isNumeric = !isNaN(parseFloat(value)) && value !== '';

                          return (
                            <td
                              key={cellIdx}
                              className={`px-3 py-2 whitespace-nowrap ${
                                header === 'Case' ? 'font-medium text-gray-700' :
                                isNumeric ? 'text-right font-mono text-gray-600' : 'text-gray-500'
                              }`}
                            >
                              {header === 'Case' && algo && (
                                <span
                                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                                  style={{ backgroundColor: algo.color }}
                                  title={algo.name}
                                />
                              )}
                              {isNumeric && !header.startsWith('m_') 
                                ? formatIndustrialNumber(parseFloat(value))
                                : value
                              }
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-500">
                  第 {currentPage} / {totalPages} 页
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page = totalPages <= 5 ? i + 1 :
                      currentPage <= 3 ? i + 1 :
                      currentPage >= totalPages - 2 ? totalPages - 4 + i :
                      currentPage - 2 + i;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 py-0.5 text-xs rounded ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {viewMode === 'stats' && extractionStats && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                <div className="text-2xl font-bold text-indigo-600">{extractionStats.totalFiles}</div>
                <div className="text-xs text-gray-500">总文件数</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-100">
                <div className="text-2xl font-bold text-emerald-600">{extractionStats.totalCases}</div>
                <div className="text-xs text-gray-500">用例数</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
                <div className="text-2xl font-bold text-orange-600">{extractionStats.totalAlgorithms}</div>
                <div className="text-xs text-gray-500">算法数</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">{extractionStats.totalMetrics}</div>
                <div className="text-xs text-gray-500">指标数</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">按算法统计</h4>
                <div className="space-y-2">
                  {Object.entries(extractionStats.byAlgorithm).map(([id, data]) => (
                    <div key={id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{data.name}</span>
                      <span className="font-medium text-gray-800">{data.count} 个文件</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">按指标统计</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {Object.entries(extractionStats.byMetric).map(([metric, data]) => (
                    <div key={metric} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{metric}</span>
                      <span className="font-medium text-gray-800">{data.count} 次提取</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ExtractedDataPreview.propTypes = {
  parseResults: PropTypes.array,
  extractionStats: PropTypes.object,
  onExportCSV: PropTypes.func,
  onExportJSON: PropTypes.func,
  onImport: PropTypes.func,
  className: PropTypes.string
};

export default ExtractedDataPreview;
