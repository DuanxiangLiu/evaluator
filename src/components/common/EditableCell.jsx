import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, Edit3, AlertCircle } from 'lucide-react';

const EditableCell = ({ 
  value, 
  rowId, 
  columnId, 
  metric, 
  algorithm,
  valueType = 'number',
  onSave,
  disabled = false,
  className = '',
  displayFormatter = (v) => v
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const originalValue = useRef(value);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = useCallback(() => {
    if (disabled) return;
    originalValue.current = value;
    setEditValue(value?.toString() || '');
    setError(null);
    setIsEditing(true);
  }, [disabled, value]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
    setError(null);
  }, []);

  const handleSave = useCallback(() => {
    if (valueType === 'number') {
      const trimmed = editValue.trim();
      if (trimmed === '' || trimmed.toUpperCase() === 'NAN' || trimmed.toUpperCase() === 'NA') {
        onSave(rowId, columnId, metric, algorithm, null);
        setIsEditing(false);
        return;
      }
      
      const parsed = parseFloat(trimmed);
      if (isNaN(parsed)) {
        setError('请输入有效的数字');
        return;
      }
      
      if (parsed === value) {
        setIsEditing(false);
        return;
      }
      
      onSave(rowId, columnId, metric, algorithm, parsed);
    } else {
      if (editValue === value) {
        setIsEditing(false);
        return;
      }
      onSave(rowId, columnId, metric, algorithm, editValue);
    }
    
    setIsEditing(false);
  }, [editValue, valueType, value, rowId, columnId, metric, algorithm, onSave]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Tab') {
      handleSave();
    }
  }, [handleSave, handleCancel]);

  if (isEditing) {
    return (
      <div className="relative">
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`
              w-full px-2 py-1 font-mono text-inherit border rounded-lg
              focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              ${error ? 'border-red-300 bg-red-50' : 'border-indigo-300 bg-white'}
            `}
            placeholder={valueType === 'number' ? '输入数字或NaN' : '输入值...'}
          />
          <button
            onClick={handleSave}
            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors flex-shrink-0"
            title="保存"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            title="取消"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {error && (
          <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-100 border border-red-200 rounded text-xs text-red-600 whitespace-nowrap z-20 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        )}
      </div>
    );
  }

  const isNull = value === null || value === undefined;
  
  return (
    <div 
      className={`
        group relative cursor-pointer transition-all
        ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-indigo-100/50'}
        ${className}
      `}
      onClick={handleStartEdit}
      title={disabled ? '' : '点击编辑'}
    >
      <div className="flex items-center justify-end gap-1">
        <span className={`font-mono inherit ${isNull ? 'text-gray-300 italic' : ''}`}>
          {isNull ? 'NaN' : displayFormatter(value)}
        </span>
        {!disabled && (
          <Edit3 className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        )}
      </div>
    </div>
  );
};

export default EditableCell;
