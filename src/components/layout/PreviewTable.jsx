import React from 'react';
import PropTypes from 'prop-types';
import { 
  ChevronLeft, ChevronRight, Loader2, CheckCircle, Play, 
  Pencil, Copy, Check, Plus, Trash2, Search, X, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { PREVIEW_TABLE_STYLES, getPreviewRowStyle } from '../../utils/tableStyles';

const PreviewTable = ({
  headers,
  displayRows,
  currentPage,
  totalPages,
  searchTerm,
  rows,
  filteredAndSortedRows,
  isEditingMode,
  editingCell,
  editValue,
  setEditValue,
  editInputRef,
  searchInputRef,
  sortConfig,
  copied,
  isAnalyzing,
  dataChanged,
  isValidData,
  onSort,
  onSearchChange,
  onClearSearch,
  onCopy,
  onRunAnalysis,
  onToggleEditMode,
  onCellDoubleClick,
  onCellEditKeyDown,
  onCellEditSave,
  onAddRow,
  onDeleteRow,
  onPageChange,
  ROWS_PER_PAGE
}) => {
  const getSortIcon = (columnIdx) => {
    if (sortConfig.key !== columnIdx) {
      return <ArrowUpDown className="w-3 h-3 text-gray-300 inline ml-1 opacity-50 cursor-pointer hover:opacity-100" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600 inline ml-1" /> 
      : <ArrowDown className="w-3 h-3 text-indigo-600 inline ml-1" />;
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className={PREVIEW_TABLE_STYLES.toolbar}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">预览 第{currentPage}/{totalPages || 1}页</span>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-xs text-gray-500">
            {searchTerm ? `搜索结果: ${filteredAndSortedRows.length}/${rows.length} 条` : `共 ${rows.length} 条`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="text-xs pl-5 pr-4 py-0.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 w-20"
            />
            {searchTerm && (
              <button
                onClick={onClearSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          <button 
            onClick={onRunAnalysis} 
            disabled={!isValidData || isAnalyzing} 
            className={`text-xs px-4 py-1.5 rounded-lg font-bold shadow-md flex items-center gap-1.5 transition-all duration-200 ${
              isAnalyzing 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-blue-200 cursor-wait' 
                : dataChanged 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 animate-pulse shadow-orange-200' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200'
            } disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:animate-none`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                数据分析中
              </>
            ) : dataChanged ? (
              <>
                <Play className="w-3.5 h-3.5" />
                数据待分析
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                数据已分析
              </>
            )}
          </button>
          <button onClick={onToggleEditMode} className={`text-xs px-2 py-0.5 rounded ${isEditingMode ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'}`}>
            <Pencil className="w-3 h-3 inline mr-1" />{isEditingMode ? '完成' : '编辑'}
          </button>
          <button onClick={onCopy} className="text-xs text-indigo-600 hover:text-indigo-800">
            {copied ? <Check className="w-3 h-3 inline mr-0.5" /> : <Copy className="w-3 h-3 inline mr-0.5" />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>
      {isEditingMode && (
        <div className={PREVIEW_TABLE_STYLES.editToolbar}>
          <button onClick={() => onAddRow('start')} className="text-xs px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 rounded hover:bg-indigo-100"><Plus className="w-3 h-3 inline" /> 开头添加</button>
          <button onClick={() => onAddRow('end')} className="text-xs px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 rounded hover:bg-indigo-100"><Plus className="w-3 h-3 inline" /> 末尾添加</button>
          <span className="text-[10px] text-indigo-500">双击编辑 | Enter保存 | Esc取消</span>
        </div>
      )}
      <div className={PREVIEW_TABLE_STYLES.wrapper}>
        <table className={PREVIEW_TABLE_STYLES.table}>
          <thead className={PREVIEW_TABLE_STYLES.thead}>
            <tr>
              {isEditingMode && <th className="px-2 py-1.5 w-8 border-r border-indigo-100">操作</th>}
              {headers.map((h, i) => (
                <th 
                  key={i} 
                  className={`${PREVIEW_TABLE_STYLES.theadCell} cursor-pointer select-none hover:bg-indigo-100`}
                  onClick={() => onSort(i)}
                >
                  {h} {getSortIcon(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={PREVIEW_TABLE_STYLES.tbody}>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + (isEditingMode ? 1 : 0)} className="px-4 py-8 text-center text-gray-400 text-xs">
                  {searchTerm ? '没有找到匹配的数据' : '暂无数据'}
                </td>
              </tr>
            ) : (
              displayRows.map(({ row, originalIdx }, rowIdx) => (
                <tr key={rowIdx} className={getPreviewRowStyle(isEditingMode)}>
                  {isEditingMode && (
                    <td className="px-2 py-1.5 border-r border-gray-100">
                      <button onClick={() => onDeleteRow(originalIdx)} className="p-0.5 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
                    </td>
                  )}
                  {row.map((cell, cellIdx) => {
                    const isEditing = editingCell?.rowIdx === originalIdx && editingCell?.cellIdx === cellIdx;
                    return (
                      <td key={cellIdx} className={`${PREVIEW_TABLE_STYLES.cell} ${isEditingMode ? PREVIEW_TABLE_STYLES.cellEditable : ''}`} onDoubleClick={() => isEditingMode && onCellDoubleClick(originalIdx, cellIdx, cell)}>
                        {isEditing ? <input ref={editInputRef} type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={onCellEditKeyDown} onBlur={onCellEditSave} className="w-full px-1 py-0.5 text-xs font-mono border border-indigo-400 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" /> : cell}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className={PREVIEW_TABLE_STYLES.pagination}>
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded disabled:opacity-50"><ChevronLeft className="w-3 h-3" /></button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
              return <button key={page} onClick={() => onPageChange(page)} className={`px-2 py-1 text-xs rounded ${currentPage === page ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200'}`}>{page}</button>;
            })}
          </div>
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded disabled:opacity-50"><ChevronRight className="w-3 h-3" /></button>
        </div>
      )}
    </div>
  );
};

PreviewTable.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  displayRows: PropTypes.arrayOf(PropTypes.shape({
    row: PropTypes.arrayOf(PropTypes.string).isRequired,
    originalIdx: PropTypes.number.isRequired
  })).isRequired,
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  searchTerm: PropTypes.string.isRequired,
  rows: PropTypes.arrayOf(PropTypes.array).isRequired,
  filteredAndSortedRows: PropTypes.array.isRequired,
  isEditingMode: PropTypes.bool.isRequired,
  editingCell: PropTypes.object,
  editValue: PropTypes.string.isRequired,
  setEditValue: PropTypes.func.isRequired,
  editInputRef: PropTypes.object,
  searchInputRef: PropTypes.object,
  sortConfig: PropTypes.object.isRequired,
  copied: PropTypes.bool.isRequired,
  isAnalyzing: PropTypes.bool.isRequired,
  dataChanged: PropTypes.bool.isRequired,
  isValidData: PropTypes.bool.isRequired,
  onSort: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onClearSearch: PropTypes.func.isRequired,
  onCopy: PropTypes.func.isRequired,
  onRunAnalysis: PropTypes.func.isRequired,
  onToggleEditMode: PropTypes.func.isRequired,
  onCellDoubleClick: PropTypes.func.isRequired,
  onCellEditKeyDown: PropTypes.func.isRequired,
  onCellEditSave: PropTypes.func.isRequired,
  onAddRow: PropTypes.func.isRequired,
  onDeleteRow: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  ROWS_PER_PAGE: PropTypes.number
};

export default PreviewTable;
