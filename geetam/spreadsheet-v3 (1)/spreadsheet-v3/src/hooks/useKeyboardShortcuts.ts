import { useEffect } from 'react';
import { useSpreadsheetStore } from '../stores/spreadsheetStore';

export const useKeyboardShortcuts = () => {
  const { 
    undo, 
    redo, 
    pushToUndoStack, 
    selection, 
    sheets, 
    activeSheet, 
    updateCell,
    setClipboardData,
    clipboardData
  } = useSpreadsheetStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
      
      // Ctrl+S - Save (prevent default browser save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        // Auto-save to localStorage
        const state = useSpreadsheetStore.getState();
        const saveData = {
          sheets: state.sheets,
          activeSheet: state.activeSheet,
          namedRanges: state.namedRanges,
          charts: state.charts,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('spreadsheet-data', JSON.stringify(saveData));
      }

      // Ctrl+C - Copy
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        if (selection?.current?.range) {
          const { x, y, width, height } = selection.current.range;
          const data = [];
          
          for (let row = y; row < y + height; row++) {
            for (let col = x; col < x + width; col++) {
              data.push({
                row,
                col,
                data: sheets[activeSheet][row]?.[col] || { value: '' }
              });
            }
          }
          
          setClipboardData({ type: 'copy', data });
        }
      }

      // Ctrl+X - Cut
      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        if (selection?.current?.range) {
          const { x, y, width, height } = selection.current.range;
          const data = [];
          
          pushToUndoStack();
          
          for (let row = y; row < y + height; row++) {
            for (let col = x; col < x + width; col++) {
              const cellData = sheets[activeSheet][row]?.[col] || { value: '' };
              data.push({ row, col, data: cellData });
              updateCell(row, col, { value: '', formula: undefined });
            }
          }
          
          setClipboardData({ type: 'cut', data });
        }
      }

      // Ctrl+V - Paste
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        if (clipboardData && selection?.current?.cell) {
          const [startCol, startRow] = selection.current.cell;
          
          pushToUndoStack();
          
          clipboardData.data.forEach((item: any) => {
            const targetRow = startRow + (item.row - clipboardData.data[0].row);
            const targetCol = startCol + (item.col - clipboardData.data[0].col);
            
            if (sheets[activeSheet][targetRow] && sheets[activeSheet][targetRow][targetCol] !== undefined) {
              updateCell(targetRow, targetCol, item.data);
            }
          });
        }
      }

      // Delete - Clear selected cells
      if (e.key === 'Delete') {
        e.preventDefault();
        if (selection?.current?.range) {
          const { x, y, width, height } = selection.current.range;
          
          pushToUndoStack();
          
          for (let row = y; row < y + height; row++) {
            for (let col = x; col < x + width; col++) {
              updateCell(row, col, { value: '', formula: undefined });
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selection, sheets, activeSheet, updateCell, setClipboardData, clipboardData, pushToUndoStack]);
};