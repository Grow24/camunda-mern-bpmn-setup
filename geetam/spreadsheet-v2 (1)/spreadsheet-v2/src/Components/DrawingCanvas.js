// Components/DrawingCanvas.js (New File)
import React, { useState, useRef, useCallback } from 'react';

const DrawingCanvas = ({ onFinalizeDrawing, gridScrollLeft, gridScrollTop, gridDisplayWidth, gridDisplayHeight,color='black',strokeWidth=3,mode='draw' }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  const getRelativeCoordinates = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  }, []);

  const handleMouseDown = useCallback((e) => {
    setIsDrawing(true);
    const { x, y } = getRelativeCoordinates(e);
    setStartPoint({ x, y });
    setCurrentPath(`M${x},${y}`);
  }, [getRelativeCoordinates]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing) return;
    const { x, y } = getRelativeCoordinates(e);
    setCurrentPath(prev => `${prev} L${x},${y}`);
  }, [isDrawing, getRelativeCoordinates]);

 const handleMouseUp = useCallback(() => {
  if (isDrawing) {
    setIsDrawing(false);
    if (currentPath && mode === 'draw') {
      onFinalizeDrawing(currentPath);
    }
    setCurrentPath('');
  }
}, [isDrawing, currentPath, onFinalizeDrawing, mode]);


  return (
    <div
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full z-40 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        pointerEvents: 'auto',
        background: 'transparent'
      }}
    >
      <svg
        className="absolute top-0 left-0"
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
        viewBox={`0 0 ${gridDisplayWidth} ${gridDisplayHeight}`}
      >
        <path
          d={currentPath}
          fill="none"
          stroke={mode === 'erase' ? 'white' : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default DrawingCanvas;