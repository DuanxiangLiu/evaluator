import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const SortIcon = ({ config, columnKey }) => {
  if (config.key !== columnKey) {
    return <ArrowUpDown className="w-3 h-3 text-gray-300 inline ml-1 opacity-50" />;
  }
  
  return config.direction === 'asc' 
    ? <ArrowUp className="w-3 h-3 text-indigo-600 inline ml-1" /> 
    : <ArrowDown className="w-3 h-3 text-indigo-600 inline ml-1" />;
};

export default SortIcon;
