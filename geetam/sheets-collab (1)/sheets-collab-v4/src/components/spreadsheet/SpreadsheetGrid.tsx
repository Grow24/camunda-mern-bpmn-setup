import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setSelectedCell, updateCell } from '../../store/slices/spreadsheetSlice';
import { wsService } from '../../services/websocket';
import { SpreadsheetCell } from './SpreadsheetCell';
import { CollaborativeCursor } from './CollaborativeCursor';

interface SpreadsheetGridProps {
  spreadsheet: {
    id: string;
    content: {
      cells: Record<string, any>;
      rows: number;
      columns: number;
    };
    version: number;
  };
}

export function SpreadsheetGrid({ spreadsheet }: SpreadsheetGridProps) {
  const dispatch = useDispatch();
  const { selectedCell } = useSelector((state: RootState) => state.spreadsheet);
  const { activeUsers } = useSelector((state: RootState) => state.collaboration);
  
  const [gridSize] = useState({ rows: 100, columns: 26 });

  // Generate column headers (A, B, C, ..., Z, AA, AB, ...)
  const getColumnLabel = (index: number): string => {
    let result = '';
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  };

  // Generate cell ID from row and column
  const getCellId = (row: number, col: number): string => {
    return `${getColumnLabel(col)}${row + 1}`;
  };

  const handleCellClick = useCallback((cellId: string) => {
    dispatch(setSelectedCell(cellId));
    
    // Update cursor position for collaboration
    const [col, row] = parseCellId(cellId);
    wsService.updateCursor(spreadsheet.id, {
      x: col * 120, // Approximate cell width
      y: row * 32,  // Approximate cell height
      cellId
    });
  }, [dispatch, spreadsheet.id]);

  const handleCellChange = useCallback((cellId: string, value: any, formula?: string) => {
    dispatch(updateCell({ cellId, value, formula }));
    
    // Send changes to other users
    const updatedContent = {
      ...spreadsheet.content,
      cells: {
        ...spreadsheet.content.cells,
        [cellId]: { id: cellId, value, formula }
      }
    };
    
    wsService.sendSpreadsheetChange(spreadsheet.id, updatedContent, spreadsheet.version + 1);
  }, [dispatch, spreadsheet]);

  // Parse cell ID to get row and column indices
  const parseCellId = (cellId: string): [number, number] => {
    const match = cellId.match(/^([A-Z]+)(\d+)$/);
    if (!match) return [0, 0];
    
    const colStr = match[1];
    const row = parseInt(match[2]) - 1;
    
    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 64);
    }
    col -= 1;
    
    return [col, row];
  };

  return (
    <div className="flex-1 overflow-auto relative">
      {/* Collaborative cursors */}
      {activeUsers.map(user => (
        user.cursor && (
          <CollaborativeCursor
            key={user.userId}
            user={user}
            position={user.cursor}
          />
        )
      ))}

      <div className="inline-block min-w-full">
        {/* Header row */}
        <div className="flex sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
          <div className="w-12 h-8 border-r border-gray-200 bg-gray-100" />
          {Array.from({ length: gridSize.columns }, (_, colIndex) => (
            <div
              key={colIndex}
              className="w-30 h-8 border-r border-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 bg-gray-50"
            >
              {getColumnLabel(colIndex)}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {Array.from({ length: gridSize.rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex">
            {/* Row header */}
            <div className="w-12 h-8 border-r border-b border-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 bg-gray-50 sticky left-0 z-10">
              {rowIndex + 1}
            </div>
            
            {/* Cells */}
            {Array.from({ length: gridSize.columns }, (_, colIndex) => {
              const cellId = getCellId(rowIndex, colIndex);
              const cellData = spreadsheet.content.cells[cellId];
              
              return (
                <SpreadsheetCell
                  key={cellId}
                  cellId={cellId}
                  value={cellData?.value || ''}
                  formula={cellData?.formula}
                  style={cellData?.style}
                  isSelected={selectedCell === cellId}
                  onClick={() => handleCellClick(cellId)}
                  onChange={(value, formula) => handleCellChange(cellId, value, formula)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}