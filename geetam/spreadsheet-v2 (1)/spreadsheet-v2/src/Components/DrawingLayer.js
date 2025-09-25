import React, { useCallback } from 'react';
import Draggable from 'react-draggable';

const DrawingLayer = ({
  drawing,
  isSelected,
  onSelectDrawing,
  onDragDrawingEnd,
  gridScrollLeft,
  gridScrollTop,
  zIndex,
  isLocked
}) => {
  const handleStart = useCallback((e, data) => {
    if (isLocked) {
      e.preventDefault();
    }
    onSelectDrawing(drawing.id);
  }, [drawing.id, onSelectDrawing, isLocked]);

  const handleStop = useCallback((e, data) => {
    if (isLocked) return;
    onDragDrawingEnd(drawing.id, data.x + gridScrollLeft, data.y + gridScrollTop);
  }, [drawing.id, onDragDrawingEnd, gridScrollLeft, gridScrollTop, isLocked]);

  const initialX = drawing.x - gridScrollLeft;
  const initialY = drawing.y - gridScrollTop;

  return (
    <Draggable
      position={{ x: initialX, y: initialY }}
      onStart={handleStart}
      onStop={handleStop}
      disabled={isLocked}
      bounds="parent"
    >
      <svg
        style={{
          position: 'absolute',
          overflow: 'visible',
          zIndex: zIndex,
          pointerEvents: 'none', // let grid interact freely
        }}
        viewBox="0 0 1525 1525" // large enough to fit most lines
      >
        <path
          d={drawing.pathData}
          fill="none"
          stroke={drawing.color || 'black'}
          strokeWidth={drawing.strokeWidth || 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            pointerEvents: isLocked ? 'none' : 'stroke',
            cursor: isLocked ? 'not-allowed' : 'move',
          }}
          onClick={() => onSelectDrawing(drawing.id)}
        />
      </svg>
    </Draggable>
  );
};

export default DrawingLayer;
