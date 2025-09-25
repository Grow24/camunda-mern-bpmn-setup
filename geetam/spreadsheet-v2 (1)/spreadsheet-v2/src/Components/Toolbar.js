// Components/Toolbar.js
import React, { useState } from 'react';

const Toolbar = ({
  onFileAction,
  onInsertChart,
  onViewAction,
  onToggleDrawMode,
  showLayerPanel,
  isDrawingMode,
  onMergeCells,
  onUnmergeCells,
  drawColor,
  setDrawColor,
  drawStrokeWidth,
  setDrawStrokeWidth,
  drawMode,
  setDrawMode,
  selectedLabel
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const handleFileAction = (action) => {
    onFileAction(action);
    setActiveDropdown(null);
  };

  const handleInsertChart = (chartType) => {
    onInsertChart(chartType);
    setActiveDropdown(null);
  };

  const handleViewAction = (action) => {
    onViewAction(action);
    if (action !== 'layers') {
      setActiveDropdown(null);
    }
  };

  return (
    <div className="bg-gray-800 text-white p-2 flex items-center space-x-4 shadow-lg">
      {/* File Menu */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown('file')}
          className="px-4 py-2 hover:bg-gray-700 rounded transition-colors"
        >
          File
        </button>
        {activeDropdown === 'file' && (
          <div className="absolute top-full left-0 mt-1 bg-white text-gray-800 rounded shadow-lg z-50 min-w-[150px]">
            <button onClick={() => handleFileAction('new')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">New</button>
            <button onClick={() => handleFileAction('open')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Open</button>
            <button onClick={() => handleFileAction('save')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Save</button>
            <button onClick={() => handleFileAction('saveAs')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Save As</button>
            <hr className="my-1" />
            <button onClick={() => handleFileAction('export')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Export</button>
          </div>
        )}
      </div>

      {/* Insert Menu */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown('insert')}
          className="px-4 py-2 hover:bg-gray-700 rounded transition-colors"
        >
          Insert
        </button>
        {activeDropdown === 'insert' && (
          <div className="absolute top-full left-0 mt-1 bg-white text-gray-800 rounded shadow-lg z-50 min-w-[150px]">
            <div className="px-4 py-2 font-semibold text-sm text-gray-600">Charts</div>
            <button onClick={() => handleInsertChart('bar')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">📊 Bar Chart</button>
            <button onClick={() => handleInsertChart('line')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">📈 Line Chart</button>
            <button onClick={() => handleInsertChart('pie')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">🥧 Pie Chart</button>
            <button onClick={() => handleInsertChart('scatter')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">⚪ Scatter Plot</button>
          </div>
        )}
      </div>

      {/* Tools Menu */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown('tools')}
          className="px-4 py-2 hover:bg-gray-700 rounded transition-colors"
        >
          Tools
        </button>
        {activeDropdown === 'tools' && (
          <div className="absolute top-full left-0 mt-1 bg-white text-gray-800 rounded shadow-lg z-50 min-w-[150px]">
            <button onClick={() => { onMergeCells(); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Merge Cells</button>
            <button onClick={() => { onUnmergeCells(); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Unmerge Cells</button>
          </div>
        )}
      </div>

      {/* View Menu */}
      <div className="relative">
        <button
          onClick={() => toggleDropdown('view')}
          className="px-4 py-2 hover:bg-gray-700 rounded transition-colors"
        >
          View
        </button>
        {activeDropdown === 'view' && (
          <div className="absolute top-full left-0 mt-1 bg-white text-gray-800 rounded shadow-lg z-50 min-w-[150px]">
            <button
              onClick={() => handleViewAction('layers')}
              className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${showLayerPanel ? 'bg-blue-100' : ''}`}
            >
              {showLayerPanel ? '✓ ' : ''}Layers Panel
            </button>
            <hr className="my-1" />
            <button onClick={() => handleViewAction('zoomIn')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Zoom In</button>
            <button onClick={() => handleViewAction('zoomOut')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Zoom Out</button>
            <button onClick={() => handleViewAction('zoomReset')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Reset Zoom</button>
            <hr className="my-1" />
            <button onClick={() => handleViewAction('gridlines')} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Toggle Gridlines</button>
          </div>
        )}
      </div>

      {/* Drawing Mode Toggle */}
      <button
        onClick={onToggleDrawMode}
        className={`px-4 py-2 rounded transition-colors flex items-center space-x-2 ${isDrawingMode ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-700'}`}
      >
        <span>✏️</span>
        <span>Draw Mode</span>
      </button>

      {/* Drawing Controls */}
      {isDrawingMode && (
        <div className="flex items-center space-x-2 ml-4">
          <label className="text-sm">Color:</label>
          <input
            type="color"
            value={drawColor}
            onChange={(e) => setDrawColor(e.target.value)}
          />
          <label className="text-sm">Size:</label>
          <input
            type="range"
            min="1"
            max="10"
            value={drawStrokeWidth}
            onChange={(e) => setDrawStrokeWidth(parseInt(e.target.value))}
          />
          <button
            className={`px-2 py-1 rounded ${drawMode === 'erase' ? 'bg-red-600 text-white' : 'bg-gray-200 text-black'}`}
            onClick={() => setDrawMode(drawMode === 'draw' ? 'erase' : 'draw')}
          >
            {drawMode === 'erase' ? '🧹 Erasing' : '✏️ Draw'}
          </button>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-grow"></div>
    </div>
  );
};

export default Toolbar;
