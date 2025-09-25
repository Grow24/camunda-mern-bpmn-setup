// src/Components/HTMLLayer.jsx
import React from 'react';
import Draggable from 'react-draggable';
import ReactECharts from './ReactECharts'; // Import our ECharts wrapper

const HTMLLayer = ({ chart, isSelected, onSelectChart, onDragChartEnd, gridScrollLeft, gridScrollTop, zIndex, isLocked }) => {
  const initialX = chart.x - gridScrollLeft;
  const initialY = chart.y - gridScrollTop;

  return (
    <Draggable
      handle=".chart-handle" // Make a specific part of the chart draggable
      position={{ x: initialX, y: initialY }} // Managed position by Draggable
      onStop={(e, data) => {
        // Update the chart's absolute position, accounting for scroll
        onDragChartEnd(chart.id, data.x + gridScrollLeft, data.y + gridScrollTop);
      }}
      onStart={(e, data) => {
        onSelectChart(chart.id); // Select chart when dragging starts
      }}
      disabled={isLocked} // Disable dragging if the layer is locked
    >
      <div
        className={`absolute bg-white border shadow-md flex flex-col overflow-hidden ${isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'}`}
        style={{
          width: chart.size.width,
          height: chart.size.height,
          zIndex: zIndex, // Apply the z-index directly here for visual stacking
          cursor: isLocked ? 'not-allowed' : 'grab',
          // Ensure the chart content is clickable but the handle is for dragging
          pointerEvents: isLocked ? 'none' : 'auto',
        }}
        onClick={(e) => {
            // Prevent event from bubbling up to the grid's onMouseDown if clicking on the chart area
            e.stopPropagation();
            onSelectChart(chart.id);
        }}
      >
        <div className="chart-handle p-2 bg-gray-100 border-b flex justify-between items-center text-sm font-semibold cursor-grab">
          {chart.title}
          {isLocked && <span className="text-gray-500 ml-2">🔒</span>}
        </div>
        <div className="flex-grow p-2">
          {/* Render ECharts chart using the ReactECharts component */}
          <ReactECharts
            option={chart.option}
            style={{ width: '100%', height: '100%' }}
            // Add any ECharts settings, loading, or theme props if needed
          />
        </div>
      </div>
    </Draggable>
  );
};

export default HTMLLayer;