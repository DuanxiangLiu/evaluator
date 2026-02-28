export const TABLE_STYLES = {
  wrapper: 'overflow-x-auto overflow-y-auto flex-1 custom-scrollbar',
  table: 'min-w-full text-sm text-left relative',
  thead: 'bg-gray-100 text-gray-700 text-sm sticky top-0 z-10 shadow-sm border-b border-gray-200',
  theadCell: 'px-4 py-2.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors',
  theadCellRight: 'px-4 py-2.5 font-medium text-right border-l border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors text-gray-600',
  tbody: 'divide-y divide-gray-100',
  row: 'transition-all duration-150 hover:bg-indigo-50/30',
  rowHovered: 'bg-indigo-100/50 outline outline-2 outline-indigo-400 z-10 relative',
  rowDisabled: 'bg-gray-50/50 opacity-40 grayscale',
  cell: 'px-4 py-2 text-gray-800',
  cellRight: 'px-4 py-2 text-right font-mono text-sm text-gray-600 border-l border-gray-100',
  cellMono: 'px-4 py-2 font-mono text-sm text-gray-600',
};

export const PREVIEW_TABLE_STYLES = {
  wrapper: 'overflow-x-auto max-h-[250px]',
  table: 'min-w-full text-xs',
  thead: 'bg-indigo-50 text-indigo-900 sticky top-0',
  theadCell: 'px-2 py-1.5 whitespace-nowrap border-r border-indigo-100 last:border-r-0',
  tbody: 'divide-y divide-gray-100',
  row: 'hover:bg-indigo-50/30',
  rowEditing: 'group',
  cell: 'px-2 py-1.5 font-mono text-gray-600 border-r border-gray-100 last:border-r-0',
  cellEditable: 'cursor-pointer hover:bg-indigo-100',
  pagination: 'bg-gray-50 px-3 py-1.5 border-t border-gray-200 flex items-center justify-between',
  toolbar: 'bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between',
  editToolbar: 'bg-indigo-50 px-3 py-1.5 border-b border-indigo-100 flex items-center gap-2',
};

export const getPreviewRowStyle = (isEditingMode, isHovered) => {
  let classes = PREVIEW_TABLE_STYLES.row;
  if (isEditingMode) classes += ' group';
  return classes;
};

export const getDetailRowStyle = (isChecked, isHovered, isNull) => {
  if (!isChecked) return TABLE_STYLES.rowDisabled;
  if (isHovered) return TABLE_STYLES.rowHovered;
  return TABLE_STYLES.row;
};

export const getImpColorClass = (imp) => {
  if (imp == null) return 'text-gray-500';
  if (imp > 0) return 'text-emerald-600 font-medium';
  if (imp < 0) return 'text-red-600 font-medium';
  return 'text-gray-500';
};
