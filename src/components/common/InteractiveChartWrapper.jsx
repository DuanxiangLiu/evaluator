import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ZoomIn, ZoomOut, Maximize2, Move, Square, X } from 'lucide-react';

const InteractiveChartWrapper = ({
  children,
  enableZoom = true,
  enablePan = true,
  enableBoxSelect = false,
  onBoxSelect,
  onZoomChange,
  className = ''
}) => {
  const [zoom, setZoom] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [boxSelection, setBoxSelection] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const containerRef = useRef(null);

  const handleWheel = useCallback((e) => {
    if (!enableZoom || (!e.ctrlKey && !e.metaKey)) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(5, zoom.scale * delta));
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const newOffsetX = mouseX - (mouseX - zoom.offsetX) * (newScale / zoom.scale);
    const newOffsetY = mouseY - (mouseY - zoom.offsetY) * (newScale / zoom.scale);
    
    const newZoom = {
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    };
    
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [enableZoom, zoom, onZoomChange]);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) {
      if (e.shiftKey && enablePan) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        e.preventDefault();
      } else if (enableBoxSelect) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        setBoxSelection({
          startX: e.clientX - rect.left,
          startY: e.clientY - rect.top,
          endX: e.clientX - rect.left,
          endY: e.clientY - rect.top
        });
        e.preventDefault();
      }
    }
  }, [enablePan, enableBoxSelect]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning && panStart) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      
      setZoom(prev => {
        const newZoom = {
          ...prev,
          offsetX: prev.offsetX + dx,
          offsetY: prev.offsetY + dy
        };
        onZoomChange?.(newZoom);
        return newZoom;
      });
      
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (boxSelection) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      setBoxSelection(prev => ({
        ...prev,
        endX: e.clientX - rect.left,
        endY: e.clientY - rect.top
      }));
    }
  }, [isPanning, panStart, boxSelection, onZoomChange]);

  const handleMouseUp = useCallback(() => {
    if (boxSelection) {
      const minX = Math.min(boxSelection.startX, boxSelection.endX);
      const maxX = Math.max(boxSelection.startX, boxSelection.endX);
      const minY = Math.min(boxSelection.startY, boxSelection.endY);
      const maxY = Math.max(boxSelection.startY, boxSelection.endY);
      
      if (maxX - minX > 10 && maxY - minY > 10) {
        onBoxSelect?.({
          minX,
          maxX,
          minY,
          maxY,
          width: maxX - minX,
          height: maxY - minY
        });
      }
      
      setBoxSelection(null);
    }
    
    setIsPanning(false);
    setPanStart(null);
  }, [boxSelection, onBoxSelect]);

  const resetZoom = useCallback(() => {
    const newZoom = { scale: 1, offsetX: 0, offsetY: 0 };
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [onZoomChange]);

  const zoomIn = useCallback(() => {
    setZoom(prev => {
      const newZoom = {
        ...prev,
        scale: Math.min(5, prev.scale * 1.2)
      };
      onZoomChange?.(newZoom);
      return newZoom;
    });
  }, [onZoomChange]);

  const zoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = {
        ...prev,
        scale: Math.max(0.5, prev.scale / 1.2)
      };
      onZoomChange?.(newZoom);
      return newZoom;
    });
  }, [onZoomChange]);

  const transformStyle = {
    transform: `translate(${zoom.offsetX}px, ${zoom.offsetY}px) scale(${zoom.scale})`,
    transformOrigin: 'center center',
    transition: isPanning ? 'none' : 'transform 0.1s ease-out'
  };

  const selectionBoxStyle = boxSelection ? {
    position: 'absolute',
    left: Math.min(boxSelection.startX, boxSelection.endX),
    top: Math.min(boxSelection.startY, boxSelection.endY),
    width: Math.abs(boxSelection.endX - boxSelection.startX),
    height: Math.abs(boxSelection.endY - boxSelection.startY),
    border: '2px dashed #6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    pointerEvents: 'none',
    zIndex: 100
  } : null;

  const isZoomed = zoom.scale !== 1 || zoom.offsetX !== 0 || zoom.offsetY !== 0;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        setShowControls(false);
        handleMouseUp();
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: isPanning ? 'grabbing' : enablePan ? 'grab' : 'default' }}
    >
      <div style={transformStyle}>
        {children}
      </div>
      
      {selectionBoxStyle && (
        <div style={selectionBoxStyle} />
      )}
      
      {showControls && (enableZoom || enableBoxSelect) && (
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-50">
          {enableZoom && (
            <>
              <button
                onClick={zoomIn}
                className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600 hover:text-indigo-600 transition-colors"
                title="放大 (Ctrl+滚轮)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={zoomOut}
                className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600 hover:text-indigo-600 transition-colors"
                title="缩小 (Ctrl+滚轮)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              {isZoomed && (
                <button
                  onClick={resetZoom}
                  className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600 hover:text-indigo-600 transition-colors"
                  title="重置视图"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      )}
      
      {showControls && isZoomed && enableZoom && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/90 rounded-lg shadow-sm border border-gray-200 text-xs text-gray-500 z-50">
          缩放: {(zoom.scale * 100).toFixed(0)}%
          {zoom.offsetX !== 0 || zoom.offsetY !== 0 ? ' | 已平移' : ''}
        </div>
      )}
      
      {showControls && enablePan && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 rounded-lg shadow-sm border border-gray-200 text-xs text-gray-500 z-50">
          <Move className="w-3 h-3 inline mr-1" />
          Shift+拖拽平移
          {enableZoom && ' | Ctrl+滚轮缩放'}
        </div>
      )}
    </div>
  );
};

InteractiveChartWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  enableZoom: PropTypes.bool,
  enablePan: PropTypes.bool,
  enableBoxSelect: PropTypes.bool,
  onBoxSelect: PropTypes.func,
  onZoomChange: PropTypes.func,
  className: PropTypes.string
};

export default InteractiveChartWrapper;
