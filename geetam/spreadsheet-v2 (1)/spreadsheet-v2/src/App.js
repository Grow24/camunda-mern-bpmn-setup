
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Grid, AutoSizer } from 'react-virtualized';
import 'react-virtualized/styles.css';
import * as F from '@formulajs/formulajs';

import Toolbar from './Components/Toolbar';
import HTMLLayer from './Components/HTMLLayer';
import LayerPanel from './Components/LayerPanel';
import FormulaBar, { evaluateFormula } from './Components/FormulaBar'; // Import evaluateFormula
import UndoRedoToolbar from './Components/UndoRedoToolbar';
import CellFormattingToolbar from './Components/CellFormattingToolbar'; // Import the new component
import DrawingCanvas from './Components/DrawingCanvas';
import DrawingLayer from './Components/DrawingLayer';
import io from 'socket.io-client';

function getCellLabel(row, col) {
  const colLabel = String.fromCharCode(65 + col); // 0 → A, 1 → B, etc.
  return `${colLabel}${row + 1}`; // 0-indexed row → 1-indexed display
}

const socket = io('https://8j8wxlqj-4000.inc1.devtunnels.ms');

const App = () => {
  const numRows = 7000;
  const numCols = 300;
  const cellWidth = 100;
  const cellHeight = 35;

  const [gridDisplayWidth, setGridDisplayWidth] = useState(0);
  const [gridDisplayHeight, setGridDisplayHeight] = useState(0);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const [data, setData] = useState(() =>
    Array.from({ length: numRows }, () =>
      Array.from({ length: numCols }, () => "")
    )
  );
  // New state for cell styles
  const [cellStyles, setCellStyles] = useState({}); // Stores styles as { 'row-col': { styleKey: value } }

  const [activeCell, setActiveCell] = useState({ row: 1, col: 1 });
  const [originalCellValue, setOriginalCellValue] = useState("");
  const inputRefs = useRef({});

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [functionSuggestions, setFunctionSuggestions] = useState([]);
  const [showCellSuggestions, setShowCellSuggestions] = useState(false);
  const suggestionBoxRef = useRef(null);

  // Range selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [drawColor, setDrawColor] = useState('red');
  const [drawStrokeWidth, setDrawStrokeWidth] = useState(3);
  const [drawMode, setDrawMode] = useState('draw'); // or 'erase'
const [otherUserSelection, setOtherUserSelection] = useState(null);

  const [charts, setCharts] = useState([]);
  const [selectedChartId, setSelectedChartId] = useState(null);

  const [drawings, setDrawings] = useState([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState(null);

  const [scrollToColumnIndex, setScrollToColumnIndex] = useState(0);
  const [scrollToRowIndex, setScrollToRowIndex] = useState(0);

  const [gridScrollLeft, setGridScrollLeft] = useState(0);
  const [gridScrollTop, setGridScrollTop] = useState(0);

  // State for the formula bar
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 }); // A1 by default

  // New state for read-only mode, default to true
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  // Z-index constant for grid
  const GRID_Z_INDEX = 1;

  // New state for merged cells
  const [mergedCells, setMergedCells] = useState([]);

  // State for directly editing a cell (double-click or direct type)
  const [isEditingCell, setIsEditingCell] = useState(false);

  // State for fill handle
  const [isFilling, setIsFilling] = useState(false);
  const [fillEnd, setFillEnd] = useState(null);


  const [layers, setLayers] = useState([
    {
      id: 'grid-layer',
      name: 'Grid',
      type: 'grid',
      visible: true,
      locked: false, // Grid layer can be locked
      order: 0,
      zIndex: GRID_Z_INDEX
    }
  ]);
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  // Function to re-calculate order and zIndex for all layers
  const updateLayerOrderAndZIndex = useCallback((currentLayers) => {
    // Separate grid layer
    const gridLayer = currentLayers.find(l => l.type === 'grid');
    const nonGridLayers = currentLayers.filter(l => l.type !== 'grid');

    // Sort non-grid layers by their current 'order' to maintain relative stacking
    nonGridLayers.sort((a, b) => a.order - b.order);

    let newLayers = [];
    // Always add grid layer first with fixed order and zIndex
    if (gridLayer) {
      newLayers.push({ ...gridLayer, order: 0, zIndex: GRID_Z_INDEX });
    }

    // Assign new sequential order and zIndex to non-grid layers
    nonGridLayers.forEach((layer, index) => {
      newLayers.push({
        ...layer,
        order: index + 1, // Order starts from 1 for non-grid layers
        zIndex: GRID_Z_INDEX + index + 1 // Z-index starts from GRID_Z_INDEX + 1 (i.e., 2)
      });
    });

    return newLayers;
  }, []);

  const pushCurrentStateToUndoStack = useCallback(() => {
    setUndoStack((stack) => [...stack, {
      data: data.map(row => [...row]), // Deep copy of data
      mergedCells: [...mergedCells], // Shallow copy of mergedCells
      cellStyles: { ...cellStyles } // Shallow copy of cellStyles
    }]);
    setRedoStack([]); // Clear redo stack on new action
  }, [data, mergedCells, cellStyles]);

  const handleCellChange = useCallback((e, row, col, emit = true) => { // Added emit parameter
    // Check for readOnlyMode and gridLock before allowing cell content change
    const gridLayer = layers.find(l => l.type === 'grid');
    const isGridLocked = gridLayer ? gridLayer.locked : false;
    if (readOnlyMode || isGridLocked) return;

    const newValue = e.target.value;

    setData((prev) => {
      // Create a shallow copy of the previous data array
      const updated = [...prev];
      // Ensure the row exists before attempting to update it
      if (updated[row - 1]) {
        // Create a shallow copy of the specific row
        updated[row - 1] = [...updated[row - 1]];
        // Update the value in the copied row
        updated[row - 1][col - 1] = newValue;
      } else {
        // This case should ideally not happen if data is correctly initialized,
        // but it's a safeguard.
        console.warn(`Attempted to update non-existent row: ${row - 1}`);
      }
      return updated;
    });
    setFormulaBarValue(newValue);

    if (emit) { // Emit change only if it's from local user input
      socket.emit('cellChange', { row, col, value: newValue });
    }
  }, [setData, setFormulaBarValue, readOnlyMode, layers]);


  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1]; // This is { data, mergedCells, cellStyles }
    setUndoStack((stack) => stack.slice(0, -1));
    // Store the current state (before undoing) to the redo stack
    setRedoStack((stack) => [...stack, { data: data.map(r => [...r]), mergedCells: [...mergedCells], cellStyles: { ...cellStyles } }]);
    setData(lastState.data);
    setMergedCells(lastState.mergedCells);
    setCellStyles(lastState.cellStyles); // Restore cell styles
    socket.emit('undoRedo', { type: 'undo', state: lastState }); // Emit undo
  }, [undoStack, redoStack, data, mergedCells, cellStyles]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1]; // This is { data, mergedCells, cellStyles }
    setRedoStack((stack) => stack.slice(0, -1));
    // Store the current state (before redoing) to the undo stack
    setUndoStack((stack) => [...stack, { data: data.map(r => [...r]), mergedCells: [...mergedCells], cellStyles: { ...cellStyles } }]);
    setData(nextState.data);
    setMergedCells(nextState.mergedCells);
    setCellStyles(nextState.cellStyles); // Restore cell styles
    socket.emit('undoRedo', { type: 'redo', state: nextState }); // Emit redo
  }, [undoStack, redoStack, data, mergedCells, cellStyles]);


  const focusCell = useCallback((row, col) => {
    let newRow = Math.min(Math.max(1, row), numRows);
    let newCol = Math.min(Math.max(1, col), numCols);

    // If the target cell is part of a merged cell, focus the top-left cell of that merged range
    const mergedCellInfo = mergedCells.find(m =>
      newRow >= m.startRow && newRow <= m.endRow &&
      newCol >= m.startCol && newCol <= m.endCol
    );

    if (mergedCellInfo) {
      newRow = mergedCellInfo.startRow;
      newCol = mergedCellInfo.startCol;
    }

    // *** FIX: Explicitly blur the previously active input if it exists and is currently focused ***
    const prevKey = `${activeCell.row}-${activeCell.col}`;
    const prevInputElement = inputRefs.current[prevKey];
    if (prevInputElement && document.activeElement === prevInputElement) {
      prevInputElement.blur();
    }
    // **********************************************************************************************

    setActiveCell({ row: newRow, col: newCol });
socket.emit('selectionRangeUpdate', null);

    setScrollToRowIndex(newRow - 1);
    setScrollToColumnIndex(newCol - 1);

    if (selectedChartId) {
      setSelectedChartId(null);
      setCharts(prev => prev.map(c => ({ ...c, isSelected: false })));
    }
    if (selectedDrawingId) {
      setSelectedDrawingId(null);
      setDrawings(prev => prev.map(d => ({ ...d, isSelected: false })));
    }
    // Safely access cell value
    const cellValue = (data[newRow - 1] && data[newRow - 1][newCol - 1]) !== undefined ? data[newRow - 1][newCol - 1] : '';
    setFormulaBarValue(cellValue);
    setIsEditingCell(false); // Exit editing mode when navigating to a new cell

  }, [numRows, numCols, selectedChartId, selectedDrawingId, data, setFormulaBarValue, mergedCells, activeCell]); // Added activeCell to dependencies


  const isInSelectedRange = useCallback((row, col) => {
    if (!selectedRange) return false;
    const { startRow, endRow, startCol, endCol } = selectedRange;
    return row >= startRow && row <= endRow && col >= startCol && col <= endCol;
  }, [selectedRange]);

  const updateSelectedRange = useCallback((start, end) => {
  if (!start || !end) {
    setSelectedRange(null);
    socket.emit('selectionRangeUpdate', null); // 👈 THIS is important
    return;
  }

  const startRow = Math.min(start.row, end.row);
  const endRow = Math.max(start.row, end.row);
  const startCol = Math.min(start.col, end.col);
  const endCol = Math.max(start.col, end.col);

  const newRange = { startRow, endRow, startCol, endCol };
  setSelectedRange(newRange);
  socket.emit('selectionRangeUpdate', newRange); // 👈 Emit to others
}, []);


  const handleCellMouseDown = useCallback((row, col, e) => {
    // If the click is on the fill handle, start fill operation
    if (e.target.classList.contains('fill-handle')) {
      setIsFilling(true);
      setSelectionStart(activeCell); // Fill handle starts from the active cell
      setFillEnd({ row, col });
      setSelectedRange(null); // Clear any existing selection
      e.preventDefault();
      return;
    }

    // Reset editing mode if clicking on a different cell or starting a new selection
    // This is crucial for fixing the "cursor remains active on previous cell" bug.
    if (activeCell.row !== row || activeCell.col !== col) {
      setIsEditingCell(false);
    }


    // Allow selection even in read-only mode. Editing is blocked separately.
    const gridLayer = layers.find(l => l.type === 'grid');
    const isGridLocked = gridLayer ? gridLayer.locked : false;
    if (isGridLocked && !e.shiftKey) return; // Prevent new selection if grid is locked AND not shift-clicking to extend

    if (selectedChartId) {
      setSelectedChartId(null);
      setCharts(prev => prev.map(c => ({ ...c, isSelected: false })));
    }
    if (selectedDrawingId) {
      setSelectedDrawingId(null);
      setDrawings(prev => prev.map(d => ({ ...d, isSelected: false })));
    }

    if (e.shiftKey) {
      // If shift is pressed, extend selection from active cell
      if (!selectionStart) { // If no selection started, begin from active cell
        setSelectionStart(activeCell);
      }
      setSelectionEnd({ row, col });
      setIsSelecting(true);
      updateSelectedRange(selectionStart || activeCell, { row, col });
    } else {
      // Start a new selection or move active cell
      setSelectionStart({ row, col });
      setSelectionEnd({ row, col });
      setIsSelecting(true);
      setSelectedRange(null); // Clear previous range selection
      focusCell(row, col);
    }
    // Prevent default to avoid blurring input if it was active
    e.preventDefault();
  }, [activeCell, focusCell, updateSelectedRange, selectedChartId, selectedDrawingId, layers, selectionStart]);


  const handleCellMouseEnter = useCallback((row, col) => {
    // Mouse enter is for extending selection during drag, always allowed for selection
    const gridLayer = layers.find(l => l.type === 'grid');
    const isGridLocked = gridLayer ? gridLayer.locked : false;
    if (isGridLocked && !isSelecting && !isFilling) return; // Only allow hover selection if already selecting (e.g. shift+click drag)

    if (isSelecting && selectionStart) {
      setSelectionEnd({ row, col });
      updateSelectedRange(selectionStart, { row, col });
    } else if (isFilling && selectionStart) {
      setFillEnd({ row, col });
      // The fill range is from selectionStart (active cell) to fillEnd
      const fillRange = {
        startRow: Math.min(selectionStart.row, row),
        endRow: Math.max(selectionStart.row, row),
        startCol: Math.min(selectionStart.col, col),
        endCol: Math.max(selectionStart.col, col),
      };
      setSelectedRange(fillRange); // Highlight the fill range
    }
  }, [isSelecting, selectionStart, updateSelectedRange, layers, isFilling]);


  const handleCellMouseUp = useCallback(() => {
    // Mouse up finalizes selection, always allowed
    setIsSelecting(false);

    if (isFilling && selectedRange) {
      // Safely access sourceValue
      const sourceRow = activeCell.row - 1;
      const sourceCol = activeCell.col - 1;
      const sourceValue = (data[sourceRow] && data[sourceRow][sourceCol]) !== undefined ? data[sourceRow][sourceCol] : '';
      const sourceStyle = cellStyles[`${activeCell.row}-${activeCell.col}`] || {};


      pushCurrentStateToUndoStack();

      const updatedCells = []; // To store changes for socket.emit

      setData(prevData => {
        const newData = prevData.map(row => [...row]);

        for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
          for (let c = selectedRange.startCol; c <= selectedRange.endCol; c++) {
            // Only fill if it's not the original active cell
            if (r !== activeCell.row || c !== activeCell.col) {
              // Ensure the target row exists before updating
              if (newData[r - 1]) {
                newData[r - 1] = [...newData[r - 1]]; // Deep copy the target row
                newData[r - 1][c - 1] = sourceValue;
                updatedCells.push({ row: r, col: c, value: sourceValue });
              }
            }
          }
        }
        return newData;
      });

      setCellStyles(prevStyles => {
        const newStyles = { ...prevStyles };
        const updatedStyles = []; // To store style changes for socket.emit
        for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
          for (let c = selectedRange.startCol; c <= selectedRange.endCol; c++) {
            if (r !== activeCell.row || c !== activeCell.col) {
              newStyles[`${r}-${c}`] = { ...sourceStyle };
              updatedStyles.push({ row: r, col: c, style: { ...sourceStyle } });
            }
          }
        }
        socket.emit('fillOperation', { updatedCells, updatedStyles }); // Emit fill operation
        return newStyles;
      });

      setSelectedRange(null); // Clear fill selection
    }
    setIsFilling(false);
    setFillEnd(null);
  }, [isFilling, selectedRange, activeCell, data, cellStyles, pushCurrentStateToUndoStack]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsSelecting(false);
      if (isFilling) {
        handleCellMouseUp(); // Finalize fill operation
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [handleCellMouseUp, isFilling]);


  useEffect(() => {
    const key = `${activeCell.row}-${activeCell.col}`;
    const inputElement = inputRefs.current[key];
    const currentActiveInput = document.activeElement;
    const gridLayer = layers.find(l => l.type === 'grid');
    const isGridLocked = gridLayer ? gridLayer.locked : false;

    // Logic to handle focusing the input when activeCell changes OR when isEditingCell becomes true
    if (inputElement) {
      if (isEditingCell && !readOnlyMode && !isGridLocked && currentActiveInput !== inputElement) {
        inputElement.focus();

      } else if (!isEditingCell) { // If not in editing mode
        if (currentActiveInput === inputElement) { // And it's currently focused
          inputElement.blur(); // Blur it
        }
      }
    }
  }, [activeCell, isDrawingMode, readOnlyMode, layers, isEditingCell]);


  useEffect(() => {
    focusCell(1, 1);
  }, []);


  const handleKeyDown = useCallback((e) => {
    // Grid layer lock check
    const gridLayer = layers.find(l => l.type === 'grid');
    const isGridLocked = gridLayer ? gridLayer.locked : false;

    // Prevent direct editing/modification if readOnlyMode or grid is locked,
    // but allow navigation and copy operations.
    if (readOnlyMode || isGridLocked) {
      // Allow navigation keys
      const allowedNavigationKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "Enter", "Escape"];
      if (allowedNavigationKeys.includes(e.key)) {
        // Navigation is allowed
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        // Allow Ctrl+C (copy)
      } else if (e.key === "Delete" || e.key === "Backspace") {
        // Prevent Delete/Backspace if in read-only or locked mode
        e.preventDefault();
        return;
      }
      else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        // Prevent other non-modifier keys from affecting cell content
        e.preventDefault();
        return;
      }
      // If it's not an allowed navigation key, Ctrl+C, or a modifier, prevent default.
      // This catches typing, Ctrl+V, etc.
      if (!allowedNavigationKeys.includes(e.key) && !(e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      }
    }


    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          if (!readOnlyMode && !isGridLocked) { // Only allow undo if not in readOnlyMode or locked
            handleUndo();
            e.preventDefault();
          }
          return;
        case 'y':
          if (!readOnlyMode && !isGridLocked) { // Only allow redo if not in readOnlyMode or locked
            handleRedo();
            e.preventDefault();
          }
          return;
        case 'c':
          if (selectedRange) {
            let copyText = '';
            let copiedStyles = {};
            for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
              let rowText = '';
              for (let c = selectedRange.startCol; c <= selectedRange.endCol; c++) {
                const cellKey = `${r}-${c}`;
                // Safely access data
                rowText += ((data[r - 1] && data[r - 1][c - 1]) || '') + '\t';
                if (cellStyles[cellKey]) {
                  copiedStyles[cellKey] = { ...cellStyles[cellKey] };
                }
              }
              copyText += rowText.trimEnd() + '\n';
            }
            // Store both text and styles in clipboard (though styles won't paste directly to external apps)
            navigator.clipboard.writeText(copyText.trim()).catch(console.error);
            // In a real app, you might serialize copiedStyles to a custom clipboard format
            // For this app, we'll just rely on the internal state for paste.
            // For now, we'll assume paste only handles text.
          }
          e.preventDefault(); // Always prevent default for Ctrl+C
          return;
        case 'v':
          if (!readOnlyMode && !isGridLocked) { // Only allow paste if not in readOnlyMode or locked
            navigator.clipboard.readText().then(text => {
              const rows = text.trim().split('\n').map(row => row.split('\t'));
              const { row: startRow, col: startCol } = activeCell;

              pushCurrentStateToUndoStack();

              const pastedCells = []; // To store changes for socket.emit

              setData(prev => {
                const updated = [...prev];
                for (let r = 0; r < rows.length; r++) {
                  for (let c = 0; c < rows[r].length; c++) {
                    const targetRow = startRow - 1 + r;
                    const targetCol = startCol - 1 + c;
                    // Ensure target row and column are within bounds
                    if (targetRow >= 0 && targetCol < prev.length && targetCol >= 0 && targetCol < prev[0].length) {
                      updated[targetRow] = [...updated[targetRow]];
                      updated[targetRow][targetCol] = rows[r][c];
                      pastedCells.push({ row: targetRow + 1, col: targetCol + 1, value: rows[r][c] });
                    }
                  }
                }
                return updated;
              });
              socket.emit('pasteOperation', { pastedCells }); // Emit paste operation

              // For styles, we'd need a more sophisticated clipboard handling
              // that allows copying and pasting custom data types.
              // For now, pasting only affects cell content, not styles.

            }).catch(console.error);
          }
          e.preventDefault();
          return;

        default:
          break;
      }
    }

    if (isDrawingMode) {
      if (e.key === "Escape") {
        setIsDrawingMode(false);
        e.preventDefault();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
      }
      return;
    }

    const { row, col } = activeCell;
    let newRow = row;
    let newCol = col;
    let preventDefault = true;

    switch (e.key) {
      case "ArrowUp":
        if (e.shiftKey && selectedRange) {
          const newEnd = { row: Math.max(1, selectedRange.endRow - 1), col: selectedRange.endCol };
          updateSelectedRange(selectionStart || { row: selectedRange.startRow, col: selectedRange.startCol }, newEnd);
        } else {
          newRow = Math.max(1, row - 1);
          setSelectedRange(null);
        }
        setIsEditingCell(false); // Exit editing mode on navigation
        break;
      case "ArrowDown":
        if (e.shiftKey && selectedRange) {
          const newEnd = { row: Math.min(numRows, selectedRange.endRow + 1), col: selectedRange.endCol };
          updateSelectedRange(selectionStart || { row: selectedRange.startRow, col: selectedRange.startCol }, newEnd);
        } else {
          newRow = Math.min(numRows, row + 1);
          setSelectedRange(null);
        }
        setIsEditingCell(false); // Exit editing mode on navigation
        break;
      case "ArrowLeft":
        if (e.shiftKey && selectedRange) {
          const newEnd = { row: selectedRange.endRow, col: Math.max(1, selectedRange.endCol - 1) };
          updateSelectedRange(selectionStart || { row: selectedRange.startRow, col: selectedRange.startCol }, newEnd);
        } else {
          newCol = Math.max(1, col - 1);
          setSelectedRange(null);
        }
        setIsEditingCell(false); // Exit editing mode on navigation
        break;
      case "ArrowRight":
        if (e.shiftKey && selectedRange) {
          const newEnd = { row: selectedRange.endRow, col: Math.min(numCols, selectedRange.endCol + 1) };
          updateSelectedRange(selectionStart || { row: selectedRange.startRow, col: selectedRange.startCol }, newEnd);
        } else {
          newCol = Math.min(numCols, col + 1);
          setSelectedRange(null);
        }
        setIsEditingCell(false); // Exit editing mode on navigation
        break;
      case "Enter":
        inputRefs.current[`${row}-${col}`]?.blur(); // Blur the input
        setIsEditingCell(false); // Exit editing mode
        newRow = Math.min(numRows, row + 1); // Move to next row
        setSelectedRange(null);
        break;
      case "Tab":
        inputRefs.current[`${row}-${col}`]?.blur(); // Blur the input
        setIsEditingCell(false); // Exit editing mode
        newCol = col + 1;
        if (newCol > numCols) {
          newCol = 1;
          newRow = Math.min(numRows, row + 1);
        }
        setSelectedRange(null);
        break;
      case "Escape":
        // Only revert and blur if not in read-only mode or grid is locked
        if (!readOnlyMode && !isGridLocked) {
          setData((prev) => {
            const updated = [...prev];
            // Safely update the cell value
            if (updated[row - 1]) {
              updated[row - 1] = [...updated[row - 1]];
              updated[row - 1][col - 1] = originalCellValue;
            }
            return updated;
          });
          setFormulaBarValue(originalCellValue);
          inputRefs.current[`${row}-${col}`]?.blur();
          socket.emit('cellChange', { row, col, value: originalCellValue }); // Emit the revert
        }
        setIsEditingCell(false); // Always exit editing mode on Escape
        setSelectedRange(null);
        preventDefault = false;
        return;
      case "Delete":
      case "Backspace":
        // If we are currently editing the cell, let the input's default behavior handle it.
        // Otherwise, clear the entire cell content.
        if (isEditingCell) {
          preventDefault = false; // Allow default backspace/delete behavior in the input
          return;
        }

        if (!readOnlyMode && !isGridLocked) { // Only allow if not in readOnlyMode and grid not locked
          if (selectedRange) {
            pushCurrentStateToUndoStack(); // Save state before deleting
            const clearedCells = [];
            const clearedStyles = [];
            setData((prev) => {
              const updated = [...prev];
              for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
                for (let c = selectedRange.startCol; c <= selectedRange.endCol; c++) {
                  // Safely update data
                  if (updated[r - 1]) {
                    updated[r - 1] = [...updated[r - 1]];
                    updated[r - 1][c - 1] = "";
                    clearedCells.push({ row: r, col: c, value: "" });
                  }
                }
              }
              return updated;
            });
            setCellStyles(prevStyles => {
              const newStyles = { ...prevStyles };
              for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
                for (let c = selectedRange.startCol; c <= selectedRange.endCol; c++) {
                  delete newStyles[`${r}-${c}`]; // Clear styles for deleted cells
                  clearedStyles.push({ row: r, col: c });
                }
              }
              return newStyles;
            });
            setFormulaBarValue("");
            socket.emit('clearCells', { cells: clearedCells, styles: clearedStyles }); // Emit clear operation
          } else {
            // This now only happens when not in editing mode (i.e., you press backspace on a selected cell, not actively typing in it)
            pushCurrentStateToUndoStack(); // Save state before deleting
            setData((prev) => {
              const updated = [...prev];
              // Safely update data for the active cell
              if (updated[row - 1]) {
                updated[row - 1] = [...updated[row - 1]];
                updated[row - 1][col - 1] = "";
              }
              return updated;
            });
            setCellStyles(prevStyles => {
              const newStyles = { ...prevStyles };
              delete newStyles[`${row}-${col}`]; // Clear styles for active cell
              return newStyles;
            });
            setFormulaBarValue("");
            socket.emit('clearCells', { cells: [{ row, col, value: "" }], styles: [{ row, col }] }); // Emit clear active cell
          }
        }
        setIsEditingCell(false); // Exit editing mode after clearing if not already editing
        preventDefault = true; // Prevent default action *if* we handled it (cleared the cell)
        return;
      default:
        // If a character key is pressed, and we're not in read-only/locked mode,
        // and we're not currently in an editing session, start one and clear cell content.
        if (!readOnlyMode && !isGridLocked && !isDrawingMode && e.key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey) {
          if (!isEditingCell) { // Only initiate editing if not already in editing mode
            setIsEditingCell(true);
            pushCurrentStateToUndoStack(); // Save state before clearing/typing
            // *** FIX: Removed direct setData(e.key) here. The input's onChange will handle it. ***
            setData(prev => {
              const updated = [...prev];
              // Safely update data
              if (updated[row - 1]) {
                updated[row - 1] = [...updated[row - 1]];
                updated[row - 1][col - 1] = ""; // Clear content to prepare for new input
              }
              return updated;
            });
            setFormulaBarValue(""); // Clear formula bar to show new input
            // No socket emit here, as handleCellChange will be called on input change
          }
          // If already in editing mode (from double-click or previous type),
          // the character will be handled by the input's onChange.
        }
        preventDefault = false; // Allow default behavior for typing
        break;
    }

    if (preventDefault) e.preventDefault();

    if (newRow !== row || newCol !== col) {
      focusCell(newRow, newCol);
    }
  }, [activeCell, originalCellValue, numRows, numCols, focusCell, setData, isDrawingMode, selectedRange, selectionStart, updateSelectedRange, setFormulaBarValue, data, handleUndo, handleRedo, pushCurrentStateToUndoStack, readOnlyMode, layers, isEditingCell, cellStyles]);


  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const getColumnLetter = (colIndex) => {
    let letter = "";
    let temp = colIndex;
    while (temp >= 0) {
      letter = String.fromCharCode(65 + (temp % 26)) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  const getColumnWidth = ({ index }) => (index === 0 ? 50 : cellWidth);
  const getRowHeight = ({ index }) => (index === 0 ? 35 : cellHeight);

  const handleApplyFormat = useCallback((format, emit = true) => { // Added emit parameter
    if (readOnlyMode) return;
    const gridLayer = layers.find(l => l.type === 'grid');
    const isGridLocked = gridLayer ? gridLayer.locked : false;
    if (isGridLocked) return;

    pushCurrentStateToUndoStack();

    const formattedCells = []; // To store changes for socket.emit

    setCellStyles(prevStyles => {
      const newStyles = { ...prevStyles };
      const cellsToFormat = selectedRange
        ? Array.from({ length: selectedRange.endRow - selectedRange.startRow + 1 }, (_, rIdx) =>
            Array.from({ length: selectedRange.endCol - selectedRange.startCol + 1 }, (_, cIdx) =>
              `${selectedRange.startRow + rIdx}-${selectedRange.startCol + cIdx}`
            )
          ).flat()
        : [`${activeCell.row}-${activeCell.col}`];

      cellsToFormat.forEach(cellKey => {
        const [r, c] = cellKey.split('-').map(Number);
        const currentCellFormat = { ...(newStyles[cellKey] || {}), ...format };

        // Special handling for textDecoration to correctly combine/remove
        

        // Remove style if it's set to its default/off state
        if (currentCellFormat.fontWeight === 'normal') delete currentCellFormat.fontWeight;
        if (currentCellFormat.fontStyle === 'normal') delete currentCellFormat.fontStyle;
        if (currentCellFormat.textDecoration === 'none') delete currentCellFormat.textDecoration;
        if (currentCellFormat.color === '#000000') delete currentCellFormat.color;
        if (currentCellFormat.backgroundColor === '#FFFFFF') delete currentCellFormat.backgroundColor;
        if (currentCellFormat.borderColor === '#E2E8F0') delete currentCellFormat.borderColor;

        // If all styles for a cell are default, remove the cellKey entirely
        if (Object.keys(currentCellFormat).length === 0) {
          delete newStyles[cellKey];
          formattedCells.push({ row: r, col: c, style: {} }); // Emit empty style to clear
        } else {
          newStyles[cellKey] = currentCellFormat;
          formattedCells.push({ row: r, col: c, style: currentCellFormat });
        }
      });
      if (emit) {
        socket.emit('applyFormat', { formattedCells });
      }
      return newStyles;
    });
  }, [activeCell, selectedRange, pushCurrentStateToUndoStack, readOnlyMode, layers]);


  const cellRenderer = useCallback(({ columnIndex, rowIndex, key, style }) => {
    const isHeaderRow = rowIndex === 0;
    const isHeaderCol = columnIndex === 0;
    const cellStylesOverride = cellStyles[`${rowIndex}-${columnIndex}`] || {}; // Get styles for this cell
    const inputCellKey = `${rowIndex}-${columnIndex}`;
    const isActive = rowIndex === activeCell.row && columnIndex === activeCell.col;
    const isInRange = isInSelectedRange(rowIndex, columnIndex);
    const isFillingRange = isFilling && isInRange; // Highlight during fill operation

    const gridLayer = layers.find(l => l.type === 'grid');
    const isGridLocked = gridLayer ? gridLayer.locked : false;

 const isInOtherUserRange = otherUserSelection &&
  rowIndex >= otherUserSelection.startRow &&
  rowIndex <= otherUserSelection.endRow &&
  columnIndex >= otherUserSelection.startCol &&
  columnIndex <= otherUserSelection.endCol;

    if (isHeaderRow && isHeaderCol) {
      return <div key={key} style={{ ...style, backgroundColor: "#e2e8f0" }} />;
    }

    if (isHeaderRow || isHeaderCol) {
      return (
        <div key={key} style={{
          ...style,
          backgroundColor: "#e2e8f0",
          fontWeight: "bold",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          userSelect: "none"
        }}>
          {isHeaderRow ? getColumnLetter(columnIndex - 1) : rowIndex}
        </div>
      );
    }

    // Check if the current cell is part of a merged range
    const mergedCell = mergedCells.find(m =>
      rowIndex >= m.startRow && rowIndex <= m.endRow &&
      columnIndex >= m.startCol && columnIndex <= m.endCol
    );

    let finalStyle = { ...style };

if (mergedCell) {
  // If it's not the top-left cell of a merged range, don't render the cell
  if (rowIndex !== mergedCell.startRow || columnIndex !== mergedCell.startCol) {
    return <div key={key} style={{ ...finalStyle, display: 'none' }} />;
  }

  // Adjust style for the merged top-left cell
  const mergedWidth = (mergedCell.endCol - mergedCell.startCol + 1) * cellWidth;
  const mergedHeight = (mergedCell.endRow - mergedCell.startRow + 1) * cellHeight;

  finalStyle = {
    ...finalStyle,
    width: mergedWidth,
    height: mergedHeight,
    zIndex: isActive ? 20 : 10,
    pointerEvents: 'auto',
  };
}

    // Safely access cell value
    const rawCellValue = (data[rowIndex - 1] && data[rowIndex - 1][columnIndex - 1]) !== undefined ? data[rowIndex - 1][columnIndex - 1] : "";
    let displayValue = rawCellValue;

    if (typeof rawCellValue === 'string' && rawCellValue.startsWith('=')) {
      try {
        const evaluatedResult = evaluateFormula(rawCellValue, data);
        displayValue = evaluatedResult;
        console.log("Data being passed to evaluateFormula:", data);
      } catch (e) {
        console.error("Error evaluating formula in cell:", rawCellValue, e);
        displayValue = "#ERROR!";
      }
    }
    const isInputDisabled = isDrawingMode || readOnlyMode || isGridLocked ||
                            (mergedCell && (rowIndex !== mergedCell.startRow || columnIndex !== mergedCell.startCol));


    return (
      <div
        key={key}
        style={finalStyle}
        onMouseDown={(e) => {
          handleCellMouseDown(rowIndex, columnIndex, e);
        }}
        onMouseEnter={() => {
          handleCellMouseEnter(rowIndex, columnIndex);
        }}
        onMouseUp={() => {
          handleCellMouseUp();
        }}
        onDoubleClick={() => {
          // Allow editing on double-click only if not in read-only mode, grid not locked, and not drawing mode
          if (!readOnlyMode && !isGridLocked && !isDrawingMode) {
            setIsEditingCell(true);
            const inputElement = inputRefs.current[inputCellKey];
            if (inputElement) {
              inputElement.focus();
              // Move cursor to the end when double-clicking
              inputElement.selectionStart = inputElement.selectionEnd = inputElement.value.length;
            }
          }
        }}
      >
        <input
          ref={(el) => { inputRefs.current[inputCellKey] = el; }}
          value={isActive && isEditingCell ? rawCellValue : displayValue}
          onChange={(e) => {
            const val = e.target.value;
            handleCellChange(e, rowIndex, columnIndex, true); // Emit change

            if (val.startsWith('=')) {
              const functionPart = val.substring(1).split('(')[0].toUpperCase();
              const matched = Object.keys(F).filter(f => f.startsWith(functionPart)).slice(0, 10);
              setFunctionSuggestions(matched);
              setShowCellSuggestions(true);
            } else {
              setShowCellSuggestions(false);
            }
          }}
          onFocus={(e) => {
            if (!readOnlyMode && !isGridLocked) {
              // Safely get original cell value
              setOriginalCellValue((data[rowIndex - 1] && data[rowIndex - 1][columnIndex - 1]) !== undefined ? data[rowIndex - 1][columnIndex - 1] : "");
              if (rowIndex !== activeCell.row || columnIndex !== activeCell.col) {
                setActiveCell({ row: rowIndex, col: columnIndex });
              }
              setFormulaBarValue(rawCellValue);
              // Only select text if we are explicitly editing (via double-click or direct type)
              if (isActive && isEditingCell) {
                e.target.select();
              }
            } else {
              e.target.blur(); // Prevent focus if in read-only mode or grid is locked
            }
          }}
          onBlur={() => {
            // Safely get current raw value
            const currentRawValue = (data[rowIndex - 1] && data[rowIndex - 1][columnIndex - 1]) !== undefined ? data[rowIndex - 1][columnIndex - 1] : "";
            if (currentRawValue.startsWith('=')) {
              setData((prev) => {
                const updated = [...prev];
                // Deep copy the row if it exists
                if (updated[rowIndex - 1]) {
                  updated[rowIndex - 1] = [...updated[rowIndex - 1]];
                }
                return updated;
              });
            }
            setIsEditingCell(false); // Exit editing mode when blurred
          }}
          disabled={isInputDisabled}
          className={`w-full h-full px-2 py-1 text-sm outline-none border ${
  isActive
    ? "border-blue-500 ring-2 ring-blue-300 z-10 relative bg-white"
    : isFillingRange
      ? "border-green-500 bg-green-100"
      : isInRange
        ? "border-blue-300 bg-blue-50"
        : isInOtherUserRange
          ? "border-pink-500 bg-pink-100"
          : "border-gray-300 bg-white"
}`}

          style={{
    ...cellStyles[`${rowIndex}-${columnIndex}`],
  }}
        />
        {isActive && isEditingCell && showCellSuggestions && functionSuggestions.length > 0 && (
  <div
    ref={suggestionBoxRef}
    className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg mt-1 text-sm overflow-y-auto"
    style={{
      top: '100%',
      left: 0,
      width: '220px', // ⬅️ Wider than before
      maxHeight: '200px' // ⬅️ Taller than before
    }}
  >
    {functionSuggestions.map((funcName) => (
      <div
        key={funcName}
        className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
        onMouseDown={(e) => {
          e.preventDefault();
          const formula = `=${funcName.toUpperCase()}()`;
          handleCellChange({ target: { value: formula } }, rowIndex, columnIndex, true); // Emit change
          setShowCellSuggestions(false);

          setTimeout(() => {
            const inputEl = inputRefs.current[`${rowIndex}-${columnIndex}`];
            if (inputEl) {
              inputEl.focus();
              inputEl.setSelectionRange(formula.length - 1, formula.length - 1);
            }
          }, 0);
        }}
      >
        <span className="font-semibold">{funcName}</span>
        <span className="text-gray-500 ml-2">({F[funcName]?.length || 0} args)</span>
      </div>
    ))}
  </div>
)}

        {/* Fill Handle */}
        {isActive && !readOnlyMode && !isGridLocked && !isDrawingMode && (
          <div
            className="fill-handle absolute bottom-0 right-0 w-2 h-2 bg-blue-600 cursor-copy border border-white"
            style={{ zIndex: 30 }}
            onMouseDown={(e) => handleCellMouseDown(rowIndex, columnIndex, e)}
          />
        )}
      </div>
    );
  }, [activeCell, data, isDrawingMode, isInSelectedRange, handleCellChange, handleCellMouseDown, handleCellMouseEnter, handleCellMouseUp, setOriginalCellValue, getColumnLetter, setFormulaBarValue, mergedCells, readOnlyMode, layers, isEditingCell, isFilling, cellStyles]); // Added cellStyles to dependencies

useEffect(() => {
  const handleClickOutside = (e) => {
    if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(e.target)) {
      setShowCellSuggestions(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
  const handleInsertChart = useCallback((chartType, emit = true) => { // Added emit parameter
    if (readOnlyMode) return; // Prevent action if in read-only mode

    let chartValues = [], chartLabels = [];
    let dataRange = null; // Initialize to null

    // Use selectedRange if available, otherwise prompt user for range
    if (selectedRange) {
      dataRange = {
        minRow: selectedRange.startRow,
        maxRow: selectedRange.endRow,
        minCol: selectedRange.startCol,
        maxCol: selectedRange.endCol
      };
    } else {
      // If no range is selected, display an alert and return
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl border border-gray-300 z-50';
      messageBox.innerHTML = `
        <p class="text-lg font-semibold mb-4">No Range Selected</p>
        <p>Please select a range of cells before inserting a chart.</p>
        <button class="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus-ring-blue-300">OK</button>
      `;
      document.body.appendChild(messageBox);
      messageBox.querySelector('button').onclick = () => messageBox.remove();
      return;
    }

    for (let r = dataRange.minRow; r <= dataRange.maxRow; r++) {
      for (let c = dataRange.minCol; c <= dataRange.maxCol; c++) {
        // Safely access cell value
        const val = (data[r - 1] && data[r - 1][c - 1]) !== undefined ? data[r - 1][c - 1] : "";
        const evaluatedVal = typeof val === 'string' && val.startsWith('=') ? evaluateFormula(val, data) : val;
        const num = parseFloat(evaluatedVal);
        if (!isNaN(num) && String(evaluatedVal).trim() !== '') {
          chartValues.push(num);
          chartLabels.push(`${getColumnLetter(c - 1)}${r}`);
        }
      }
    }

    if (chartValues.length === 0) {
      const rangeText = `${getColumnLetter(dataRange.minCol - 1)}${dataRange.minRow}:${getColumnLetter(dataRange.maxCol - 1)}${dataRange.maxRow}`;
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl border border-gray-300 z-50';
      messageBox.innerHTML = `
        <p class="text-lg font-semibold mb-4">No Data Found</p>
        <p>No numeric data found in ${rangeText}. Please select a range with numbers.</p>
        <button class="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus-ring-blue-300">OK</button>
      `;
      document.body.appendChild(messageBox);
      messageBox.querySelector('button').onclick = () => messageBox.remove();
      return;
    }

    const chartWidth = 500, chartHeight = 350;
    const centerX = (gridDisplayWidth - chartWidth) / 2 + gridScrollLeft;
    const centerY = (gridDisplayHeight - chartHeight) / 2 + gridScrollTop;

    const echartsOption = {
      title: {
        text: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['Values'],
        bottom: '0%'
      },
      xAxis: {
        type: 'category',
        data: chartLabels,
      },
      yAxis: {
        type: 'value',
      },
      series: [{
        name: 'Values',
        type: chartType === 'bar' ? 'bar' : 'line',
        data: chartValues,
        itemStyle: {
          color: 'rgba(75, 192, 192, 0.6)',
        },
      }]
    };

    if (chartType === 'pie') {
      echartsOption.series = [{
        name: 'Values',
        type: 'pie',
        radius: '50%',
        center: ['50%', '50%'],
        data: chartValues.map((value, index) => ({
          value: value,
          name: chartLabels[index]
        })),
        itemStyle: {
          borderRadius: 5,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c} ({d}%)'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }];
      delete echartsOption.xAxis;
      delete echartsOption.yAxis;
    }

    const newChart = {
      id: Date.now(),
      type: 'chart',
      title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
      option: echartsOption,
      x: centerX,
      y: centerY,
      size: { width: chartWidth, height: chartHeight },
      isSelected: false
    };

    setCharts(prev => [...prev, newChart]);

    setLayers(prev => {
      const newLayer = {
        id: `chart-${newChart.id}`,
        name: newChart.title,
        type: 'chart',
        chartId: newChart.id,
        visible: true,
        locked: false,
        order: prev.length,
        zIndex: 0
      };
      const updatedLayers = updateLayerOrderAndZIndex([...prev, newLayer]);
      if (emit) {
        socket.emit('addLayer', newLayer);
        socket.emit('addChart', newChart);
      }
      return updatedLayers;
    });

    setSelectedRange(null);
  }, [data, selectedRange, gridScrollLeft, gridScrollTop, gridDisplayWidth, gridDisplayHeight, getColumnLetter, updateLayerOrderAndZIndex, readOnlyMode]);


  const handleViewAction = (action) => {
    if (action === 'layers') {
      setShowLayerPanel(prev => !prev);
    }
  };

  const handleToggleDrawMode = useCallback((emit = true) => {
    if (readOnlyMode) return; // Prevent action if in read-only mode

    setIsDrawingMode(prev => !prev);
    setSelectedChartId(null);
    setCharts(prev => prev.map(c => ({ ...c, isSelected: false })));
    setSelectedDrawingId(null);
    setDrawings(prev => prev.map(d => ({ ...d, isSelected: false })));
    if (emit) {
      socket.emit('toggleDrawMode');
    }
  }, [readOnlyMode]);

  const handleSelectChart = useCallback((id, emit = true) => {
    if (readOnlyMode) return; // Prevent selection if in readOnlyMode

    setSelectedChartId(id);
    setSelectedDrawingId(null);
    setCharts((prev) => prev.map(c => ({ ...c, isSelected: c.id === id })));
    setDrawings(prev => prev.map(d => ({ ...d, isSelected: false })));
    if (emit) {
      socket.emit('selectChart', id);
    }
    // setLayers(prevLayers => {
    //   const selectedLayer = prevLayers.find(layer => layer.chartId === id);
    //   if (!selectedLayer || selectedLayer.locked) {
    //     return prevLayers;
    //   }
    //   const newOrder = Math.max(...prevLayers.map(l => l.order)) + 1;
    //   const updatedLayers = prevLayers.map(layer =>
    //     layer.id === selectedLayer.id ? { ...layer, order: newOrder } : layer
    //   );
    //   return updateLayerOrderAndZIndex(updatedLayers);
    // });
  }, [readOnlyMode]);


  const handleDragChartEnd = useCallback((id, x, y, emit = true) => {
    if (readOnlyMode) return; // Prevent drag if in readOnlyMode

    setCharts(prev => prev.map(c => c.id === id ? { ...c, x, y } : c));
    if (emit) {
      socket.emit('dragChartEnd', { id, x, y });
    }
  }, [readOnlyMode]);

  const finalizeDrawingLayer = useCallback((pathData, emit = true) => {
    // Only finalize drawing if not in read-only mode AND not in erase mode
    const gridLayer = layers.find(l => l.type === 'grid');
    const isGridLocked = gridLayer ? gridLayer.locked : false;
    if (readOnlyMode || isGridLocked || drawMode === 'erase') return;


    const newDrawing = {
      id: Date.now(),
      type: 'drawing',
      name: `Drawing ${drawings.length + 1}`,
      pathData,
      x: gridScrollLeft,
      y: gridScrollTop,
      color: drawColor,
      strokeWidth: drawStrokeWidth,
      isSelected: false,
      visible: true,
      locked: false
    };

    setDrawings(prev => [...prev, newDrawing]);

    setLayers(prev => {
      const newLayer = {
        id: `drawing-${newDrawing.id}`,
        name: newDrawing.name,
        type: 'drawing',
        drawingId: newDrawing.id,
        visible: true,
        locked: false,
        order: prev.length,
        zIndex: 0
      };
      const updatedLayers = updateLayerOrderAndZIndex([...prev, newLayer]);
      if (emit) {
        socket.emit('addLayer', newLayer);
        socket.emit('addDrawing', newDrawing);
      }
      return updatedLayers;
    });

    setSelectedDrawingId(newDrawing.id);
    setSelectedChartId(null);
    setCharts(prev => prev.map(c => ({ ...c, isSelected: false })));

  }, [drawings.length, gridScrollLeft, gridScrollTop, drawColor, drawStrokeWidth, drawMode, updateLayerOrderAndZIndex, readOnlyMode, layers]);


  const handleSelectDrawing = useCallback((id, emit = true) => {
    if (readOnlyMode) return; // Prevent selection if in readOnlyMode

    setSelectedDrawingId(id);
    setSelectedChartId(null);
    setDrawings((prev) => prev.map(d => ({ ...d, isSelected: d.id === id })));
    setCharts(prev => prev.map(c => ({ ...c, isSelected: false })));
    if (emit) {
      socket.emit('selectDrawing', id);
    }
  }, [readOnlyMode]);

  const handleDragDrawingEnd = useCallback((id, newX, newY, emit = true) => {
    if (readOnlyMode) return; // Prevent drag if in readOnlyMode

    setDrawings(prev =>
      prev.map(d =>
        d.id === id ? { ...d, x: newX, y: newY } : d
      )
    );
    if (emit) {
      socket.emit('dragDrawingEnd', { id, newX, newY });
    }
  }, [readOnlyMode]);

  const handleGridScroll = useCallback(({ scrollLeft, scrollTop }) => {
    setGridScrollLeft(scrollLeft);
    setGridScrollTop(scrollTop);
  }, []);

  const visibleCharts = charts.filter(chart => {
    const chartLayer = layers.find(layer => layer.chartId === chart.id);
    return chartLayer ? chartLayer.visible : true;
  });

  const visibleDrawings = drawings.filter(drawing => {
    const drawingLayer = layers.find(layer => layer.drawingId === drawing.id);
    return drawingLayer ? drawingLayer.visible : true;
  });

  const handleLayerVisibilityToggle = useCallback((layerId, emit = true) => {
    setLayers(prev => {
      const updatedLayers = prev.map(layer =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      );
      if (emit) {
        socket.emit('toggleLayerVisibility', layerId);
      }
      return updatedLayers;
    });
  }, []);

  const handleLayerLockToggle = useCallback((layerId, emit = true) => {
    setLayers(prev => {
      const updatedLayers = prev.map(layer =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      );
      if (emit) {
        socket.emit('toggleLayerLock', layerId);
      }
      return updatedLayers;
    });
  }, []);

  const handleLayerReorder = useCallback((oldIndex, newIndex, emit = true) => {
    if (readOnlyMode) return; // Prevent action if in read-only mode
    setLayers(prev => {
      const sortedByOrder = [...prev].sort((a, b) => a.order - b.order);
      const [movedLayer] = sortedByOrder.splice(oldIndex, 1);
      sortedByOrder.splice(newIndex, 0, movedLayer);

      const updatedOrders = sortedByOrder.map((layer, index) => ({
        ...layer,
        order: index
      }));

      const finalLayers = updateLayerOrderAndZIndex(updatedOrders);
      if (emit) {
        socket.emit('reorderLayers', { oldIndex, newIndex, finalLayers });
      }
      return finalLayers;
    });
  }, [updateLayerOrderAndZIndex, readOnlyMode]);


  const handleLayerDelete = useCallback((layerId, emit = true) => {
    if (readOnlyMode) return; // Prevent action if in read-only mode

    setLayers(prev => {
      const remainingLayers = prev.filter(layer => {
        if (layer.type === 'chart' && layer.id === layerId) {
          setCharts(prevCharts => prevCharts.filter(chart => `chart-${chart.id}` !== layerId));
          if (selectedChartId === layer.chartId) setSelectedChartId(null);
          if (emit) {
            socket.emit('deleteChart', layer.chartId);
          }
        } else if (layer.type === 'drawing' && layer.id === layerId) {
          setDrawings(prevDrawings => prevDrawings.filter(drawing => `drawing-${drawing.id}` !== layerId));
          if (selectedDrawingId === layer.drawingId) setSelectedDrawingId(null);
          if (emit) {
            socket.emit('deleteDrawing', layer.drawingId);
          }
        }
        return layer.id !== layerId;
      });

      const finalLayers = updateLayerOrderAndZIndex(remainingLayers);
      if (emit) {
        socket.emit('deleteLayer', layerId);
      }
      return finalLayers;
    });
  }, [selectedChartId, selectedDrawingId, updateLayerOrderAndZIndex, readOnlyMode]);

  const handleLayerRename = useCallback((layerId, newName, emit = true) => {
    if (readOnlyMode) return; // Prevent action if in read-only mode

    setLayers(prev => {
      const updatedLayers = prev.map(layer =>
        layer.id === layerId ? { ...layer, name: newName } : layer
      );
      if (emit) {
        socket.emit('renameLayer', { layerId, newName });
      }
      return updatedLayers;
    });
    setCharts(prev => prev.map(chart =>
      `chart-${chart.id}` === layerId ? { ...chart, title: newName, option: { ...chart.option, title: { ...chart.option.title, text: newName } } } : chart
    ));
    setDrawings(prev => prev.map(drawing =>
      `drawing-${drawing.id}` === layerId ? { ...drawing, name: newName } : drawing
    ));
  }, [readOnlyMode]);

  // Handle merging cells
  const handleMergeCells = useCallback((emit = true) => {
    if (readOnlyMode) {
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl border border-gray-300 z-50';
      messageBox.innerHTML = `
        <p class="text-lg font-semibold mb-4">Read-Only Mode</p>
        <p>Cannot merge cells in read-only mode.</p>
        <button class="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus-ring-blue-300">OK</button>
      `;
      document.body.appendChild(messageBox);
      messageBox.querySelector('button').onclick = () => messageBox.remove();
      return;
    }
    const gridLayer = layers.find(l => l.type === 'grid');
    const isGridLocked = gridLayer ? gridLayer.locked : false;
    if (isGridLocked) {
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl border border-gray-300 z-50';
      messageBox.innerHTML = `
        <p class="text-lg font-semibold mb-4">Grid Locked</p>
        <p>Cannot merge cells when the grid layer is locked.</p>
        <button class="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus-ring-blue-300">OK</button>
      `;
      document.body.appendChild(messageBox);
      messageBox.querySelector('button').onclick = () => messageBox.remove();
      return;
    }


    if (!selectedRange) {
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl border border-gray-300 z-50';
      messageBox.innerHTML = `
        <p class="text-lg font-semibold mb-4">No Selection</p>
        <p>Please select a range of cells to merge.</p>
        <button class="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus-ring-blue-300">OK</button>
      `;
      document.body.appendChild(messageBox);
      messageBox.querySelector('button').onclick = () => messageBox.remove();
      return;
    }

    if (selectedRange.startRow === selectedRange.endRow && selectedRange.startCol === selectedRange.endCol) {
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl border border-gray-300 z-50';
      messageBox.innerHTML = `
        <p class="text-lg font-semibold mb-4">Invalid Selection</p>
        <p>Please select more than one cell to merge.</p>
        <button class="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus-ring-blue-300">OK</button>
      `;
      document.body.appendChild(messageBox);
      messageBox.querySelector('button').onclick = () => messageBox.remove();
      return;
    }

    pushCurrentStateToUndoStack();

    let newMergedCells = [...mergedCells];
    let newMergeCandidate = { ...selectedRange, id: Date.now() };
    let foundOverlaps = [];

    // Identify all overlaps with existing merged cells
    for (let i = 0; i < newMergedCells.length; i++) {
      const existingMerged = newMergedCells[i];

      if (
        selectedRange.startRow <= existingMerged.endRow &&
        selectedRange.endRow >= existingMerged.startRow &&
        selectedRange.startCol <= existingMerged.endCol &&
        selectedRange.endCol >= existingMerged.startCol
      ) {
        foundOverlaps.push(existingMerged);
      }
    }

    // If there are overlaps, combine the selected range with all overlapping merged cells
    if (foundOverlaps.length > 0) {
      let combinedStartRow = selectedRange.startRow;
      let combinedEndRow = selectedRange.endRow;
      let combinedStartCol = selectedRange.startCol;
      let combinedEndCol = selectedRange.endCol;
      let originalMergedCellContent = ""; // Content from the top-left of the first overlapping merged cell
      let originalMergedCellStyles = {}; // Styles from the top-left of the first overlapping merged cell

      // Find the extreme boundaries and collect original content
      foundOverlaps.forEach(overlap => {
        combinedStartRow = Math.min(combinedStartRow, overlap.startRow);
        combinedEndRow = Math.max(combinedEndRow, overlap.endRow);
        combinedStartCol = Math.min(combinedStartCol, overlap.startCol);
        combinedEndCol = Math.max(combinedEndCol, overlap.endCol);

        // Take content from the top-left of the *first* overlapping existing merged cell
        // Safely access data here
        if (originalMergedCellContent === "" && (data[overlap.startRow - 1] && data[overlap.startRow - 1][overlap.startCol - 1]) !== undefined) {
          originalMergedCellContent = data[overlap.startRow - 1][overlap.startCol - 1];
          originalMergedCellStyles = cellStyles[`${overlap.startRow}-${overlap.startCol}`] || {};
        }
      });

      const newCombinedMergedCell = {
        id: Date.now(),
        startRow: combinedStartRow,
        endRow: combinedEndRow,
        startCol: combinedStartCol,
        endCol: combinedEndCol
      };

      // Remove all old overlapping merged cells
      newMergedCells = newMergedCells.filter(existing => !foundOverlaps.includes(existing));
      // Add the newly combined merged cell
      newMergedCells.push(newCombinedMergedCell);

      const updatedCells = [];
      const updatedCellStyles = {};

      // Update data: clear all cells in the new combined range except its new top-left
      setData(prevData => {
        const newData = prevData.map(row => [...row]);
        for (let r = combinedStartRow; r <= combinedEndRow; r++) {
          for (let c = combinedStartCol; c <= combinedEndCol; c++) {
            // Safely update data
            if (newData[r - 1]) {
              newData[r - 1] = [...newData[r - 1]];
              if (r !== combinedStartRow || c !== combinedStartCol) {
                newData[r - 1][c - 1] = ""; // Clear content
                updatedCells.push({ row: r, col: c, value: "" });
              }
            }
          }
        }
        // Ensure the content is in the new top-left cell
        if (newData[combinedStartRow - 1]) { // Safely set
          newData[combinedStartRow - 1][combinedStartCol - 1] = originalMergedCellContent;
          updatedCells.push({ row: combinedStartRow, col: combinedStartCol, value: originalMergedCellContent });
        }
        return newData;
      });

      // Update styles: clear all cells in the new combined range except its new top-left
      setCellStyles(prevStyles => {
        const newStyles = { ...prevStyles };
        for (let r = combinedStartRow; r <= combinedEndRow; r++) {
          for (let c = combinedStartCol; c <= combinedEndCol; c++) {
            delete newStyles[`${r}-${c}`]; // Clear styles for all cells in the new merged range
            updatedCellStyles[`${r}-${c}`] = {}; // Clear styles for emit
          }
        }
        // Apply styles to the new top-left cell
        newStyles[`${combinedStartRow}-${combinedStartCol}`] = { ...originalMergedCellStyles };
        updatedCellStyles[`${combinedStartRow}-${combinedStartCol}`] = { ...originalMergedCellStyles };
        return newStyles;
      });
      if (emit) {
        socket.emit('mergeCells', { newMergedCells: [newCombinedMergedCell], updatedCells, updatedCellStyles });
      }

    } else {
      // If no overlap, just add the new selected range as a merged cell
      newMergedCells.push(newMergeCandidate);
      const updatedCells = [];
      const updatedCellStyles = {};
      // Move content to the top-left cell and clear others in the merged range
      setData(prevData => {
        const newData = prevData.map(row => [...row]);
        // Safely get topLeftValue
        const topLeftValue = (newData[selectedRange.startRow - 1] && newData[selectedRange.startRow - 1][selectedRange.startCol - 1]) !== undefined
          ? newData[selectedRange.startRow - 1][selectedRange.startCol - 1]
          : "";

        for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
          for (let c = selectedRange.startCol; c <= selectedRange.endCol; c++) {
            // Safely update data
            if (newData[r - 1]) {
              newData[r - 1] = [...newData[r - 1]];
              if (r !== selectedRange.startRow || c !== selectedRange.startCol) {
                newData[r - 1][c - 1] = ""; // Clear content of other cells
                updatedCells.push({ row: r, col: c, value: "" });
              }
            }
          }
        }
        // Ensure top-left keeps its value
        if (newData[selectedRange.startRow - 1]) { // Safely set
          newData[selectedRange.startRow - 1][selectedRange.startCol - 1] = topLeftValue;
          updatedCells.push({ row: selectedRange.startRow, col: selectedRange.startCol, value: topLeftValue });
        }
        return newData;
      });

      // Clear styles for all cells in the merged range except the top-left
      setCellStyles(prevStyles => {
        const newStyles = { ...prevStyles };
        const topLeftStyle = newStyles[`${selectedRange.startRow}-${selectedRange.startCol}`] || {};
        for (let r = selectedRange.startRow; r <= selectedRange.endRow; r++) {
          for (let c = selectedRange.startCol; c <= selectedRange.endCol; c++) {
            delete newStyles[`${r}-${c}`];
            updatedCellStyles[`${r}-${c}`] = {};
          }
        }
        newStyles[`${selectedRange.startRow}-${selectedRange.startCol}`] = { ...topLeftStyle };
        updatedCellStyles[`${selectedRange.startRow}-${selectedRange.startCol}`] = { ...topLeftStyle };
        return newStyles;
      });
      if (emit) {
        socket.emit('mergeCells', { newMergedCells: [newMergeCandidate], updatedCells, updatedCellStyles });
      }
    }

    setMergedCells(newMergedCells);
    setSelectedRange(null); // Clear selected range after merge
  }, [selectedRange, data, pushCurrentStateToUndoStack, mergedCells, readOnlyMode, layers, cellStyles]);


  // Handle unmerging cells
  const handleUnmergeCells = useCallback((emit = true) => {
    if (readOnlyMode) {
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl border border-gray-300 z-50';
      messageBox.innerHTML = `
        <p class="text-lg font-semibold mb-4">Read-Only Mode</p>
        <p>Cannot unmerge cells in read-only mode.</p>
        <button class="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus-ring-blue-300">OK</button>
      `;
      document.body.appendChild(messageBox);
      messageBox.querySelector('button').onclick = () => messageBox.remove();
      return;
    }
    const gridLayer = layers.find(l => l.type === 'grid');
    const isGridLocked = gridLayer ? gridLayer.locked : false;
    if (isGridLocked) {
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl border border-gray-300 z-50';
      messageBox.innerHTML = `
        <p class="text-lg font-semibold mb-4">Grid Locked</p>
        <p>Cannot unmerge cells when the grid layer is locked.</p>
        <button class="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus-ring-blue-300">OK</button>
      `;
      document.body.appendChild(messageBox);
      messageBox.querySelector('button').onclick = () => messageBox.remove();
      return;
    }

    let unmergedAny = false;
    pushCurrentStateToUndoStack();

    setMergedCells(prev => {
      const unmergedRanges = []; // To store which merged cells were unmerged
      const newMergedCells = prev.filter(merged => {
        // Condition to identify merged cells to unmerge:
        // 1. If a range is selected and it overlaps with the merged cell
        // 2. If no range is selected, and the active cell is within the merged cell
        const isTargeted =
          (selectedRange &&
            selectedRange.startRow <= merged.endRow && selectedRange.endRow >= merged.startRow &&
            selectedRange.startCol <= merged.endCol && selectedRange.endCol >= merged.startCol) ||
          (!selectedRange && activeCell.row >= merged.startRow && activeCell.row <= merged.endRow &&
            activeCell.col >= merged.startCol && activeCell.col <= merged.endCol);

        if (isTargeted) {
          unmergedAny = true;
          unmergedRanges.push(merged);
          // No need to clear cells here; they will be rendered individually once unmerged.
          // The data remains as it was, and the top-left cell will retain its content.
          return false; // Remove this merged cell
        }
        return true;
      });
      if (emit) {
        socket.emit('unmergeCells', { unmergedRanges });
      }
      return newMergedCells;
    });

    if (!unmergedAny) {
      const messageBox = document.createElement('div');
      messageBox.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl border border-gray-300 z-50';
      messageBox.innerHTML = `
        <p class="text-lg font-semibold mb-4">No Merged Cells</p>
        <p>No merged cells found in the selected range or at the active cell to unmerge.</p>
        <button class="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus-ring-blue-300">OK</button>
      `;
      document.body.appendChild(messageBox);
      messageBox.querySelector('button').onclick = () => messageBox.remove();
    }
    setSelectedRange(null);
  }, [selectedRange, activeCell, pushCurrentStateToUndoStack, mergedCells, readOnlyMode, layers]);

  // Collaborative Editing Socket.IO Listeners
  useEffect(() => {
    socket.on('initialState', (state) => {
      // Clear all content on refresh for this specific tab
      setData(() =>
        Array.from({ length: numRows }, () =>
          Array.from({ length: numCols }, () => "")
        )
      );
      setCellStyles({});
      setMergedCells([]);
      setCharts([]);
      setDrawings([]);
      setLayers([
        {
          id: 'grid-layer',
          name: 'Grid',
          type: 'grid',
          visible: true,
          locked: false,
          order: 0,
          zIndex: GRID_Z_INDEX
        }
      ]);
    });
 socket.on('selectionRangeUpdate', (range) => {
    setOtherUserSelection(range); // 👈 this should be declared with useState
  });

    socket.on('cellChange', ({ row, col, value }) => {
      setData(prev => {
        const updated = [...prev];
        if (updated[row - 1]) {
          updated[row - 1] = [...updated[row - 1]];
          updated[row - 1][col - 1] = value;
        }
        return updated;
      });
      // If the changed cell is the active cell, update formula bar to reflect external change
      if (row === activeCell.row && col === activeCell.col && !isEditingCell) {
        setFormulaBarValue(value);
      }
    });

    socket.on('applyFormat', ({ formattedCells }) => {
      setCellStyles(prevStyles => {
        const newStyles = { ...prevStyles };
        formattedCells.forEach(({ row, col, style }) => {
          const key = `${row}-${col}`;
          if (Object.keys(style).length === 0) {
            delete newStyles[key]; // Clear style if empty object is sent
          } else {
            newStyles[key] = { ...(newStyles[key] || {}), ...style };
          }
        });
        return newStyles;
      });
    });

    socket.on('fillOperation', ({ updatedCells, updatedStyles }) => {
      setData(prevData => {
        const newData = prevData.map(row => [...row]);
        updatedCells.forEach(({ row, col, value }) => {
          if (newData[row - 1]) {
            newData[row - 1] = [...newData[row - 1]];
            newData[row - 1][col - 1] = value;
          }
        });
        return newData;
      });

      setCellStyles(prevStyles => {
        const newStyles = { ...prevStyles };
        updatedStyles.forEach(({ row, col, style }) => {
          const key = `${row}-${col}`;
          newStyles[key] = { ...style };
        });
        return newStyles;
      });
    });
  socket.on('pasteOperation', ({ pastedCells }) => {
    setData(prev => {
      const updated = [...prev];
      pastedCells.forEach(({ row, col, value }) => {
        const targetRow = row - 1;
        const targetCol = col - 1;
        if (updated[targetRow]) {
          updated[targetRow] = [...updated[targetRow]];
          updated[targetRow][targetCol] = value;
        }
      });
      return updated;
    });
  });
    socket.on('clearCells', ({ cells, styles }) => {
      setData(prev => {
        const updated = [...prev];
        cells.forEach(({ row, col }) => {
          if (updated[row - 1]) {
            updated[row - 1] = [...updated[row - 1]];
            updated[row - 1][col - 1] = "";
          }
        });
        return updated;
      });
      setCellStyles(prevStyles => {
        const newStyles = { ...prevStyles };
        styles.forEach(({ row, col }) => {
          delete newStyles[`${row}-${col}`];
        });
        return newStyles;
      });
    });

    socket.on('undoRedo', ({ type, state }) => {
      setData(state.data);
      setMergedCells(state.mergedCells);
      setCellStyles(state.cellStyles);
      // Note: For collaborative undo/redo, you might need more sophisticated state management
      // to ensure consistency if multiple users are undoing/redoing concurrently.
      // This simple approach might lead to divergences in complex scenarios.
    });

    socket.on('addLayer', (newLayer) => {
      setLayers(prev => updateLayerOrderAndZIndex([...prev, newLayer]));
    });

    socket.on('addChart', (newChart) => {
      setCharts(prev => [...prev, newChart]);
    });

    socket.on('addDrawing', (newDrawing) => {
      setDrawings(prev => [...prev, newDrawing]);
    });

    socket.on('toggleLayerVisibility', (layerId) => {
      setLayers(prev => prev.map(layer =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      ));
    });

    socket.on('toggleLayerLock', (layerId) => {
      setLayers(prev => prev.map(layer =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      ));
    });

    socket.on('reorderLayers', ({ oldIndex, newIndex, finalLayers }) => {
      setLayers(finalLayers); // Directly set the final layers from the server
    });

    socket.on('deleteLayer', (layerId) => {
      setLayers(prev => {
        const remainingLayers = prev.filter(layer => layer.id !== layerId);
        return updateLayerOrderAndZIndex(remainingLayers);
      });
    });

    socket.on('deleteChart', (chartId) => {
      setCharts(prevCharts => prevCharts.filter(chart => chart.id !== chartId));
    });

    socket.on('deleteDrawing', (drawingId) => {
      setDrawings(prevDrawings => prevDrawings.filter(drawing => drawing.id !== drawingId));
    });

    socket.on('renameLayer', ({ layerId, newName }) => {
      setLayers(prev => prev.map(layer =>
        layer.id === layerId ? { ...layer, name: newName } : layer
      ));
      setCharts(prev => prev.map(chart =>
        `chart-${chart.id}` === layerId ? { ...chart, title: newName, option: { ...chart.option, title: { ...chart.option.title, text: newName } } } : chart
      ));
      setDrawings(prev => prev.map(drawing =>
        `drawing-${drawing.id}` === layerId ? { ...drawing, name: newName } : drawing
      ));
    });

    socket.on('mergeCells', ({ newMergedCells, updatedCells, updatedCellStyles }) => {
      setMergedCells(prev => [...prev, ...newMergedCells]);
      setData(prevData => {
        const newData = prevData.map(row => [...row]);
        updatedCells.forEach(({ row, col, value }) => {
          if (newData[row - 1]) {
            newData[row - 1] = [...newData[row - 1]];
            newData[row - 1][col - 1] = value;
          }
        });
        return newData;
      });
      setCellStyles(prevStyles => {
        const newStyles = { ...prevStyles };
        for (const cellKey in updatedCellStyles) {
          if (Object.keys(updatedCellStyles[cellKey]).length === 0) {
            delete newStyles[cellKey];
          } else {
            newStyles[cellKey] = updatedCellStyles[cellKey];
          }
        }
        return newStyles;
      });
    });

    socket.on('unmergeCells', ({ unmergedRanges }) => {
      setMergedCells(prev => {
        const unmergedIds = new Set(unmergedRanges.map(m => m.id));
        return prev.filter(merged => !unmergedIds.has(merged.id));
      });
    });

    // Clean up socket listeners on unmount
    return () => {
      socket.off('initialState');
      socket.off('cellChange');
      socket.off('applyFormat');
      socket.off('fillOperation');
      socket.off('pasteOperation');
      socket.off('clearCells');
      socket.off('undoRedo');
      socket.off('addLayer');
      socket.off('addChart');
      socket.off('addDrawing');
      socket.off('toggleLayerVisibility');
      socket.off('toggleLayerLock');
      socket.off('reorderLayers');
      socket.off('deleteLayer');
      socket.off('deleteChart');
      socket.off('deleteDrawing');
      socket.off('renameLayer');
      socket.off('mergeCells');
      socket.off('unmergeCells');
      socket.off('selectionRangeUpdate');
    };
  }, [activeCell.col, activeCell.row, isEditingCell, updateLayerOrderAndZIndex, numRows, numCols]); // Added numRows, numCols to dependencies to ensure they are available for setData reset

  // Initial state emission on mount for new connections
  useEffect(() => {
    socket.emit('requestInitialState');
  }, []);


  // Sort layers by zIndex for rendering order
  const orderedLayers = [...layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  const currentCellStyles = cellStyles[`${activeCell.row}-${activeCell.col}`] || {};

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-100">
      <Toolbar
        onFileAction={() => { }}
        onInsertChart={handleInsertChart}
        onViewAction={handleViewAction}
        onToggleDrawMode={handleToggleDrawMode}
        showLayerPanel={showLayerPanel}
        isDrawingMode={isDrawingMode}
        onMergeCells={handleMergeCells}
        onUnmergeCells={handleUnmergeCells}
        drawColor={drawColor}
        setDrawColor={setDrawColor}
        drawStrokeWidth={drawStrokeWidth}
        setDrawStrokeWidth={setDrawStrokeWidth}
        drawMode={drawMode}
        setDrawMode={setDrawMode}
        selectedLabel={getCellLabel(selectedCell.row, selectedCell.col)}
        readOnlyMode={readOnlyMode} // Pass readOnlyMode
        setReadOnlyMode={setReadOnlyMode} // Pass setter to allow toggling
      />
      <div className="flex items-center"> {/* Container for toolbars */}
        <UndoRedoToolbar
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={undoStack.length > 0 && !readOnlyMode} // Disable if readOnlyMode is true
          canRedo={redoStack.length > 0 && !readOnlyMode} // Disable if readOnlyMode is true
        />
        <CellFormattingToolbar
          onApplyFormat={(newStyle) => {
            // This function now internally calls handleApplyFormat, which handles the emit
            handleApplyFormat(newStyle, true);
          }}
          readOnlyMode={readOnlyMode}
          initialStyles={cellStyles[`${activeCell.row}-${activeCell.col}`] || {}} // Pass current cell's styles to initialize toolbar state
        />
      </div>


      <FormulaBar
        activeCell={activeCell}
        data={data}
        setData={setData} // This setData should be fine as it will trigger cellRenderer update
        formulaBarValue={formulaBarValue}
        setFormulaBarValue={setFormulaBarValue}
        inputRefs={inputRefs}
        readOnlyMode={readOnlyMode}
        isEditingFormulaBar={true}// Pass readOnlyMode to FormulaBar
      />

      <div className="flex-grow flex relative">
        <div className="flex-grow flex relative items-center justify-center overflow-hidden">
          <div className="border border-gray-300 shadow-lg relative w-full h-full">
            {orderedLayers.map(layer => {
              if (layer.visible === false) return null;

              if (layer.type === 'grid') {
                return (
                  <div
                    key={layer.id}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      zIndex: layer.zIndex,
                      pointerEvents: layer.locked ? 'none' : 'auto', // Grid pointer events
                    }}
                  >
                    <AutoSizer>
                      {({ height, width }) => {
                        if (width !== gridDisplayWidth) {
                          setGridDisplayWidth(width);
                        }
                        if (height !== gridDisplayHeight) {
                          setGridDisplayHeight(height);
                        }

                        return (
                          <Grid
                            columnCount={numCols + 1}
                            rowCount={numRows + 1}
                            columnWidth={getColumnWidth}
                            rowHeight={getRowHeight}
                            width={width}
                            height={height}
                            cellRenderer={cellRenderer}
                            scrollToColumn={scrollToColumnIndex}
                            scrollToRow={scrollToRowIndex}
                            scrollToAlignment="auto"
                            onScroll={handleGridScroll}
                          />
                        );
                      }}
                    </AutoSizer>
                  </div>
                );
              } else if (layer.type === 'chart') {
                const chart = visibleCharts.find(c => c.id === layer.chartId);
                if (!chart) return null;

                return (
                  <HTMLLayer
                    key={layer.id}
                    chart={chart}
                    isSelected={chart.isSelected}
                    onSelectChart={handleSelectChart}
                    onDragChartEnd={handleDragChartEnd}
                    gridScrollLeft={gridScrollLeft}
                    gridScrollTop={gridScrollTop}
                    zIndex={layer.zIndex}
                    isLocked={layer.locked} // Pass isLocked prop
                  />
                );
              } else if (layer.type === 'drawing') {
                const drawing = visibleDrawings.find(d => d.id === layer.drawingId);
                if (!drawing) return null;

                return (
                  <DrawingLayer
                    key={layer.id}
                    drawing={drawing}
                    isSelected={drawing.isSelected}
                    onSelectDrawing={handleSelectDrawing}
                    onDragDrawingEnd={handleDragDrawingEnd}
                    gridScrollLeft={gridScrollLeft}
                    gridScrollTop={gridScrollTop}
                    zIndex={layer.zIndex}
                    isLocked={layer.locked} // Pass isLocked prop
                  />
                );
              }
              return null;
            })}
            {isDrawingMode && (
              <DrawingCanvas
                onFinalizeDrawing={finalizeDrawingLayer}
                gridScrollLeft={gridScrollLeft}
                gridScrollTop={gridScrollTop}
                gridDisplayWidth={gridDisplayWidth}
                gridDisplayHeight={gridDisplayHeight}
                color={drawColor}
                strokeWidth={drawStrokeWidth}
                mode={drawMode}
              />
            )}
          </div>
        </div>

        {showLayerPanel && (
          <LayerPanel
            layers={layers}
            onVisibilityToggle={handleLayerVisibilityToggle}
            onLockToggle={handleLayerLockToggle}
            onReorder={readOnlyMode ? () => { } : handleLayerReorder} // Disable if readOnlyMode
            onDelete={readOnlyMode ? () => { } : handleLayerDelete}   // Disable if readOnlyMode
            onRename={readOnlyMode ? () => { } : handleLayerRename}   // Disable if readOnlyMode
            readOnlyMode={readOnlyMode} // Pass readOnlyMode
          />
        )}
      </div>

      {(selectedRange && !isFilling) && ( // Only show if not in fill mode
        <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded shadow-md text-sm border">
          Selected: {getColumnLetter(selectedRange.startCol - 1)}{selectedRange.startRow}:
          {getColumnLetter(selectedRange.endCol - 1)}{selectedRange.endRow}
        </div>
      )}
      {isFilling && selectedRange && ( // Show fill range
        <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded shadow-md text-sm border bg-green-100 border-green-500">
          Fill Range: {getColumnLetter(selectedRange.startCol - 1)}{selectedRange.startRow}:
          {getColumnLetter(selectedRange.endCol - 1)}{selectedRange.endRow}
        </div>
      )}
    </div>
  );
};

export default App;





