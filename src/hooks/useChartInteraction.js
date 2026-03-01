import { useState, useCallback, useRef, useEffect } from 'react';

export const useChartInteraction = (initialState = {}) => {
  const [zoom, setZoom] = useState(initialState.zoom || { scale: 1, offsetX: 0, offsetY: 0 });
  const [selection, setSelection] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const containerRef = useRef(null);

  const handleWheel = useCallback((e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(5, zoom.scale * delta));
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const newOffsetX = mouseX - (mouseX - zoom.offsetX) * (newScale / zoom.scale);
    const newOffsetY = mouseY - (mouseY - zoom.offsetY) * (newScale / zoom.scale);
    
    setZoom({
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    });
  }, [zoom]);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 0 && (e.shiftKey || e.altKey)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setZoom(prev => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  const handleBoxSelectionStart = useCallback((e) => {
    if (e.button === 0 && !e.shiftKey && !e.altKey) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      setSelection({
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        endX: e.clientX - rect.left,
        endY: e.clientY - rect.top,
        active: true
      });
    }
  }, []);

  const handleBoxSelectionMove = useCallback((e) => {
    if (selection?.active) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      setSelection(prev => ({
        ...prev,
        endX: e.clientX - rect.left,
        endY: e.clientY - rect.top
      }));
    }
  }, [selection]);

  const handleBoxSelectionEnd = useCallback((onSelection) => {
    if (selection?.active) {
      const minX = Math.min(selection.startX, selection.endX);
      const maxX = Math.max(selection.startX, selection.endX);
      const minY = Math.min(selection.startY, selection.endY);
      const maxY = Math.max(selection.startY, selection.endY);
      
      if (maxX - minX > 10 && maxY - minY > 10) {
        onSelection?.({
          minX,
          maxX,
          minY,
          maxY,
          width: maxX - minX,
          height: maxY - minY
        });
      }
      
      setSelection(null);
    }
  }, [selection]);

  const resetZoom = useCallback(() => {
    setZoom({ scale: 1, offsetX: 0, offsetY: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(prev => ({
      ...prev,
      scale: Math.min(5, prev.scale * 1.2)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => ({
      ...prev,
      scale: Math.max(0.5, prev.scale / 1.2)
    }));
  }, []);

  const getTransform = useCallback(() => {
    return {
      transform: `translate(${zoom.offsetX}px, ${zoom.offsetY}px) scale(${zoom.scale})`,
      transformOrigin: 'center center'
    };
  }, [zoom]);

  return {
    zoom,
    setZoom,
    selection,
    isDragging,
    containerRef,
    handlers: {
      onWheel: handleWheel,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp
    },
    boxSelection: {
      start: handleBoxSelectionStart,
      move: handleBoxSelectionMove,
      end: handleBoxSelectionEnd
    },
    controls: {
      resetZoom,
      zoomIn,
      zoomOut
    },
    getTransform
  };
};

export const useChartLinkage = (linkedCharts = []) => {
  const [sharedState, setSharedState] = useState({
    highlightedCase: null,
    selectedCases: new Set(),
    timeRange: null,
    filters: {}
  });

  const highlightCase = useCallback((caseName) => {
    setSharedState(prev => ({ ...prev, highlightedCase: caseName }));
  }, []);

  const selectCases = useCallback((cases) => {
    setSharedState(prev => ({
      ...prev,
      selectedCases: new Set(cases)
    }));
  }, []);

  const toggleCase = useCallback((caseName) => {
    setSharedState(prev => {
      const newSet = new Set(prev.selectedCases);
      if (newSet.has(caseName)) {
        newSet.delete(caseName);
      } else {
        newSet.add(caseName);
      }
      return { ...prev, selectedCases: newSet };
    });
  }, []);

  const setFilter = useCallback((filterKey, filterValue) => {
    setSharedState(prev => ({
      ...prev,
      filters: { ...prev.filters, [filterKey]: filterValue }
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSharedState(prev => ({ ...prev, filters: {} }));
  }, []);

  return {
    sharedState,
    actions: {
      highlightCase,
      selectCases,
      toggleCase,
      setFilter,
      clearFilters
    }
  };
};

export const useCrossChartSync = () => {
  const [syncedSelection, setSyncedSelection] = useState(null);
  const [syncedHighlight, setSyncedHighlight] = useState(null);
  const subscribersRef = useRef(new Set());

  const subscribe = useCallback((callback) => {
    subscribersRef.current.add(callback);
    return () => subscribersRef.current.delete(callback);
  }, []);

  const notifySelection = useCallback((selection) => {
    setSyncedSelection(selection);
    subscribersRef.current.forEach(callback => callback('selection', selection));
  }, []);

  const notifyHighlight = useCallback((highlight) => {
    setSyncedHighlight(highlight);
    subscribersRef.current.forEach(callback => callback('highlight', highlight));
  }, []);

  return {
    syncedSelection,
    syncedHighlight,
    subscribe,
    notifySelection,
    notifyHighlight
  };
};

export default useChartInteraction;
