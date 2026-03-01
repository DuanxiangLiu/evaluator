import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { CHART_SIZE_OPTIONS } from '../utils/constants';

export const useChartWidth = () => {
  const { chartSize } = useAppContext();
  
  const width = useMemo(() => {
    const option = CHART_SIZE_OPTIONS.find(opt => opt.id === chartSize);
    return option ? option.width : 'max-w-lg';
  }, [chartSize]);
  
  return width;
};
