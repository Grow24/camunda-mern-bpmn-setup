import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ExcelGrid.css';

function ExcelGrid({ rows = 20, cols = 10 }) {
  const [data, setData] = useState(
    Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''))
  );
  
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [formulaValue, setFormulaValue] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [formatting, setFormatting] = useState({
    bold: false,
    italic: false,
    underline: false
  });

  const inputRefs = useRef([]);
  const containerRef = useRef(null);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, rows * cols);
  }, [rows, cols]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleChange = (r, c, val) => {
    const updated = [...data];
    updated[r][c] = val;
    setData(updated);
    setFormulaValue(val);
  };

  const focusCell = (r, c) => {
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      const index = r * cols + c;
      setSelectedCell({ row: r, col: c });
      setFormulaValue(data[r][c]);
      inputRefs.current[index]?.focus();
    }
  };

  const handleKeyDown = (e, r, c) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (e.shiftKey && r - 1 >= 0) focusCell(r - 1, c);
        else if (r + 1 < rows) focusCell(r + 1, c);
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey && c - 1 >= 0) focusCell(r, c - 1);
        else if (c + 1 < cols) focusCell(r, c + 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (r + 1 < rows) focusCell(r + 1, c);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (r - 1 >= 0) focusCell(r - 1, c);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (c + 1 < cols) focusCell(r, c + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (c - 1 >= 0) focusCell(r, c - 1);
        break;
      case 'Delete':
        handleChange(r, c, '');
        break;
      case 'F2':
        e.preventDefault();
        inputRefs.current[r * cols + c]?.select();
        break;
      default:
        break;
    }
  };

  const handleCellClick = (r, c) => {
    focusCell(r, c);
  };

  const handleContextMenu = (e, r, c) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      row: r,
      col: c
    });
  };

  const handleCopy = () => {
    const { row, col } = selectedCell;
    setClipboard({ value: data[row][col], row, col });
    setContextMenu(null);
  };

  const handlePaste = () => {
    if (clipboard) {
      const { row, col } = selectedCell;
      handleChange(row, col, clipboard.value);
    }
    setContextMenu(null);
  };

  const handleCut = () => {
    const { row, col } = selectedCell;
    setClipboard({ value: data[row][col], row, col });
    handleChange(row, col, '');
    setContextMenu(null);
  };

  const handleClear = () => {
    const { row, col } = selectedCell;
    handleChange(row, col, '');
    setContextMenu(null);
  };

  const handleFormulaChange = (e) => {
    const value = e.target.value;
    setFormulaValue(value);
    const { row, col } = selectedCell;
    handleChange(row, col, value);
  };

  const toggleFormatting = (type) => {
    setFormatting(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getColumnLabel = (i) => {
    let label = '';
    while (i >= 0) {
      label = String.fromCharCode((i % 26) + 65) + label;
      i = Math.floor(i / 26) - 1;
    }
    return label;
  };

  const getCellReference = (row, col) => {
    return `${getColumnLabel(col)}${row + 1}`;
  };

  const getSelectedCellsCount = () => {
    return 1; // For now, single cell selection
  };

  const getSum = () => {
    const { row, col } = selectedCell;
    const value = parseFloat(data[row][col]);
    return isNaN(value) ? 0 : value;
  };

  return (
    <div className="excel-container" ref={containerRef}>
      {/* Toolbar */}
      <div className="excel-toolbar">
        <div className="toolbar-group">
          <button className="toolbar-button">📁</button>
          <button className="toolbar-button">💾</button>
          <button className="toolbar-button">📋</button>
        </div>
        
        <div className="toolbar-group">
          <button 
            className={`toolbar-button ${formatting.bold ? 'active' : ''}`}
            onClick={() => toggleFormatting('bold')}
          >
            <strong>B</strong>
          </button>
          <button 
            className={`toolbar-button ${formatting.italic ? 'active' : ''}`}
            onClick={() => toggleFormatting('italic')}
          >
            <em>I</em>
          </button>
          <button 
            className={`toolbar-button ${formatting.underline ? 'active' : ''}`}
            onClick={() => toggleFormatting('underline')}
          >
            <u>U</u>
          </button>
        </div>

        <div className="toolbar-group">
          <button className="toolbar-button">🔢</button>
          <button className="toolbar-button">%</button>
          <button className="toolbar-button">💰</button>
        </div>

        <div className="toolbar-group">
          <button className="toolbar-button">📊</button>
          <button className="toolbar-button">🎨</button>
          <button className="toolbar-button">🔍</button>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="formula-bar-container">
        <div className="cell-reference">
          {getCellReference(selectedCell.row, selectedCell.col)}
        </div>
        <input
          type="text"
          className="formula-bar"
          value={formulaValue}
          onChange={handleFormulaChange}
          placeholder="Enter formula or value..."
        />
      </div>

      {/* Grid */}
      <div className="excel-grid-container">
        <div className="excel-table">
          <div className="excel-row">
            <div className="excel-cell header-cell corner" />
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="excel-cell header-cell">
                {getColumnLabel(i)}
              </div>
            ))}
          </div>

          {data.map((row, r) => (
            <div key={r} className="excel-row">
              <div className="excel-cell header-cell corner">{r + 1}</div>
              {row.map((cell, c) => {
                const index = r * cols + c;
                const isSelected = selectedCell.row === r && selectedCell.col === c;
                return (
                  <div
                    key={c}
                    className={`excel-cell ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCellClick(r, c)}
                    onContextMenu={(e) => handleContextMenu(e, r, c)}
                  >
                    <input
                      value={cell}
                      onChange={(e) => handleChange(r, c, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, r, c)}
                      onFocus={() => setSelectedCell({ row: r, col: c })}
                      ref={(el) => (inputRefs.current[index] = el)}
                      className="input-cell"
                      style={{
                        fontWeight: formatting.bold ? 'bold' : 'normal',
                        fontStyle: formatting.italic ? 'italic' : 'normal',
                        textDecoration: formatting.underline ? 'underline' : 'none'
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className="context-menu-item" onClick={handleCut}>
            Cut
          </button>
          <button className="context-menu-item" onClick={handleCopy}>
            Copy
          </button>
          <button 
            className="context-menu-item" 
            onClick={handlePaste}
            disabled={!clipboard}
          >
            Paste
          </button>
          <div className="context-menu-separator" />
          <button className="context-menu-item" onClick={handleClear}>
            Clear Contents
          </button>
          <button className="context-menu-item">
            Insert Row
          </button>
          <button className="context-menu-item">
            Insert Column
          </button>
          <div className="context-menu-separator" />
          <button className="context-menu-item">
            Format Cells...
          </button>
        </div>
      )}

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-info">
          <span>Ready</span>
          <span>Cells: {getSelectedCellsCount()}</span>
          <span>Sum: {getSum()}</span>
        </div>
        <div className="zoom-controls">
          <button className="zoom-button">-</button>
          <span>100%</span>
          <button className="zoom-button">+</button>
        </div>
      </div>
    </div>
  );
}

export default ExcelGrid;