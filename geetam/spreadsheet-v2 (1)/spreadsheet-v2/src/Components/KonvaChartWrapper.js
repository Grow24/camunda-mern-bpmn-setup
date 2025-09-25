// Components/KonvaChartWrapper.js
import React, { useRef, useState, useCallback } from 'react';
import KonvaChartLayer from './KonvaChartLayer';

const KonvaChartWrapper = (props) => {
  const wrapperRef = useRef(null);
  const [isDraggingChart, setIsDraggingChart] = useState(false);

  // Manage scroll locking
  const handlePointerDown = useCallback((e) => {
    const target = e.target;

    // If clicked on a chart group, block scroll while dragging
    const chartGroup = target?.className === 'Group' && target.getParent();
    if (chartGroup && chartGroup?.className === 'Group') {
      setIsDraggingChart(true);
    }
  }, []);

  const stopDragging = useCallback(() => {
    setIsDraggingChart(false);
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        touchAction: isDraggingChart ? 'none' : 'auto', // important!
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onPointerLeave={stopDragging}
    >
      <KonvaChartLayer {...props} />
    </div>
  );
};

export default KonvaChartWrapper;
