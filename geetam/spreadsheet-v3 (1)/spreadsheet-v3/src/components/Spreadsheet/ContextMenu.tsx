import React from 'react';
import { useSpreadsheetStore } from '../../stores/spreadsheetStore';
import { 
  Scissors, Copy, Clipboard, Plus, Trash2, Link, MessageSquare,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight
} from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  selectedCells?: { row: number; col: number }[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, selectedCells }) => {
  const { 
    sheets, 
    activeSheet, 
    updateCell, 
    pushToUndoStack,
    clipboardData,
    setClipboardData,
    theme,
    insertRow,
    insertColumn,
    deleteRow,
    deleteColumn
  } = useSpreadsheetStore();

  const handleCut = () => {
    if (!selectedCells || selectedCells.length === 0) return;
    
    const data = selectedCells.map(({ row, col }) => ({
      row,
      col,
      data: sheets[activeSheet][row][col]
    }));
    
    setClipboardData({ type: 'cut', data });
    
    // Clear the cells
    pushToUndoStack();
    selectedCells.forEach(({ row, col }) => {
      updateCell(row, col, { value: '', formula: undefined });
    });
    
    onClose();
  };

  const handleCopy = () => {
    if (!selectedCells || selectedCells.length === 0) return;
    
    const data = selectedCells.map(({ row, col }) => ({
      row,
      col,
      data: sheets[activeSheet][row][col]
    }));
    
    setClipboardData({ type: 'copy', data });
    onClose();
  };

  const handlePaste = () => {
    if (!clipboardData || !selectedCells || selectedCells.length === 0) return;
    
    pushToUndoStack();
    const startCell = selectedCells[0];
    
    clipboardData.data.forEach((item: any, index: number) => {
      const targetRow = startCell.row + Math.floor(index / 1);
      const targetCol = startCell.col + (index % 1);
      
      if (sheets[activeSheet][targetRow] && sheets[activeSheet][targetRow][targetCol] !== undefined) {
        updateCell(targetRow, targetCol, item.data);
      }
    });
    
    onClose();
  };

  const handleInsertRowAbove = () => {
    if (!selectedCells || selectedCells.length === 0) return;
    pushToUndoStack();
    insertRow(selectedCells[0].row);
    onClose();
  };

  const handleInsertRowBelow = () => {
    if (!selectedCells || selectedCells.length === 0) return;
    pushToUndoStack();
    insertRow(selectedCells[0].row + 1);
    onClose();
  };

  const handleInsertColumnLeft = () => {
    if (!selectedCells || selectedCells.length === 0) return;
    pushToUndoStack();
    insertColumn(selectedCells[0].col);
    onClose();
  };

  const handleInsertColumnRight = () => {
    if (!selectedCells || selectedCells.length === 0) return;
    pushToUndoStack();
    insertColumn(selectedCells[0].col + 1);
    onClose();
  };

  const handleDeleteRow = () => {
    if (!selectedCells || selectedCells.length === 0) return;
    pushToUndoStack();
    deleteRow(selectedCells[0].row);
    onClose();
  };

  const handleDeleteColumn = () => {
    if (!selectedCells || selectedCells.length === 0) return;
    pushToUndoStack();
    deleteColumn(selectedCells[0].col);
    onClose();
  };

  const handleInsertLink = () => {
    if (!selectedCells || selectedCells.length === 0) return;
    const url = prompt('Enter URL:');
    if (url) {
      pushToUndoStack();
      selectedCells.forEach(({ row, col }) => {
        updateCell(row, col, { link: url });
      });
    }
    onClose();
  };

  const handleInsertComment = () => {
    if (!selectedCells || selectedCells.length === 0) return;
    const comment = prompt('Enter comment:');
    if (comment) {
      pushToUndoStack();
      selectedCells.forEach(({ row, col }) => {
        updateCell(row, col, { comment });
      });
    }
    onClose();
  };

  const menuItems = [
    { icon: Scissors, label: 'Cut', action: handleCut, shortcut: 'Ctrl+X' },
    { icon: Copy, label: 'Copy', action: handleCopy, shortcut: 'Ctrl+C' },
    { icon: Clipboard, label: 'Paste', action: handlePaste, shortcut: 'Ctrl+V', disabled: !clipboardData },
    { type: 'separator' },
    { icon: ArrowUp, label: 'Insert row above', action: handleInsertRowAbove },
    { icon: ArrowDown, label: 'Insert row below', action: handleInsertRowBelow },
    { icon: ArrowLeft, label: 'Insert column left', action: handleInsertColumnLeft },
    { icon: ArrowRight, label: 'Insert column right', action: handleInsertColumnRight },
    { type: 'separator' },
    { icon: Trash2, label: 'Delete row', action: handleDeleteRow },
    { icon: Trash2, label: 'Delete column', action: handleDeleteColumn },
    { type: 'separator' },
    { icon: Link, label: 'Insert link', action: handleInsertLink },
    { icon: MessageSquare, label: 'Insert comment', action: handleInsertComment }
  ];

  return (
    <div
      className={`fixed z-50 min-w-48 rounded-md shadow-lg border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        {menuItems.map((item, index) => {
          if (item.type === 'separator') {
            return (
              <div 
                key={index} 
                className={`border-t my-1 ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                }`} 
              />
            );
          }

          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.action}
              disabled={item.disabled}
              className={`w-full px-3 py-2 text-sm text-left flex items-center gap-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'dark' 
                  ? 'text-white hover:bg-gray-700' 
                  : 'text-gray-700'
              }`}
            >
              <Icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};