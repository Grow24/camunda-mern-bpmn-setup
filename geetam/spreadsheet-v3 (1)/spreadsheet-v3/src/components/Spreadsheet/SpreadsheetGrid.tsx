// import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
// import DataEditor, {
//   GridCell,
//   GridCellKind,
//   GridColumn,
//   Item,
//   EditableGridCell,
//   GridSelection,
//   CompactSelection,
// } from '@glideapps/glide-data-grid';
// import '@glideapps/glide-data-grid/dist/index.css';
// import { useSpreadsheetStore } from '../../stores/spreadsheetStore';
// import { evaluateFormula, getExcelColumnName } from '../../utils/formulaEngine';
// import { ContextMenu } from './ContextMenu';
// import { CommentSystem } from './CommentSystem';

// const NUM_ROWS = 1000;
// const NUM_COLUMNS = 100;

// export const SpreadsheetGrid: React.FC = () => {
//   const {
//     sheets,
//     activeSheet,
//     selection,
//     setSelection,
//     updateCell,
//     columnWidths,
//     setColumnWidth,
//     rowHeights,
//     setRowHeight,
//     zoom,
//     theme,
//     pushToUndoStack,
//     showGridlines,
//     searchResults
//   } = useSpreadsheetStore();

//   const gridRef = useRef<any>(null);
//   const currentSheetData = sheets[activeSheet];
  
//   const [contextMenu, setContextMenu] = useState<{
//     x: number;
//     y: number;
//     selectedCells: { row: number; col: number }[];
//   } | null>(null);

//   const [commentSystem, setCommentSystem] = useState<{
//     visible: boolean;
//     row: number;
//     col: number;
//     position: { x: number; y: number };
//   } | null>(null);

//   const columns: GridColumn[] = useMemo(() =>
//     Array.from({ length: NUM_COLUMNS }, (_, i) => ({
//       title: getExcelColumnName(i),
//       width: columnWidths[i] ?? 100,
//       id: String(i),
//     })),
//     [columnWidths]
//   );

//   const getCellContent = useCallback(
//     ([col, row]: Item): GridCell => {
//       const cell = currentSheetData?.[row]?.[col] ?? { value: "", dataType: 'text' };
//       let displayValue = cell.formula 
//         ? evaluateFormula(cell.formula, currentSheetData) 
//         : cell.value;

//       // Format based on number format
//       if (cell.numberFormat && displayValue) {
//         switch (cell.numberFormat) {
//           case 'currency':
//             displayValue = `$${parseFloat(displayValue).toFixed(2)}`;
//             break;
//           case 'percentage':
//             displayValue = `${(parseFloat(displayValue) * 100).toFixed(2)}%`;
//             break;
//           case 'date':
//             if (!isNaN(Date.parse(displayValue))) {
//               displayValue = new Date(displayValue).toLocaleDateString();
//             }
//             break;
//         }
//       }

//       if (typeof displayValue === 'object' && displayValue !== null) {
//         displayValue = JSON.stringify(displayValue);
//       } else if (displayValue === undefined || displayValue === null) {
//         displayValue = "";
//       }

//       // Check if this cell is in search results
//       const isSearchResult = searchResults.some(result => result.row === row && result.col === col);

//       // Handle checkbox cells
//       if (cell.checkbox) {
//         return {
//           kind: GridCellKind.Boolean,
//           allowOverlay: false,
//           readonly: false,
//           data: cell.checkboxValue || false,
//           themeOverride: isSearchResult ? {
//             bgCell: "#fff3cd",
//             borderColor: "#ffc107"
//           } : undefined
//         };
//       }

//       return {
//         kind: GridCellKind.Text,
//         allowOverlay: true,
//         readonly: false,
//         displayData: String(displayValue),
//         data: cell.formula ?? cell.value,
//         themeOverride: isSearchResult ? {
//           bgCell: "#fff3cd",
//           borderColor: "#ffc107"
//         } : undefined
//       };
//     },
//     [currentSheetData, searchResults]
//   );

//   const onCellEdited = useCallback(
//     ([col, row]: Item, newValue: EditableGridCell) => {
//       if (newValue.kind === GridCellKind.Boolean) {
//         pushToUndoStack();
//         updateCell(row, col, { checkboxValue: newValue.data });
//         return;
//       }

//       if (newValue.kind !== GridCellKind.Text) return;

//       const text = newValue.data;
//       pushToUndoStack();

//       // Auto-detect data type
//       let dataType: 'text' | 'number' | 'date' | 'boolean' = 'text';
//       if (!text.startsWith('=')) {
//         if (!isNaN(parseFloat(text)) && isFinite(parseFloat(text))) {
//           dataType = 'number';
//         } else if (!isNaN(Date.parse(text))) {
//           dataType = 'date';
//         } else if (text.toLowerCase() === 'true' || text.toLowerCase() === 'false') {
//           dataType = 'boolean';
//         }
//       }

//       if (text.startsWith("=")) {
//         updateCell(row, col, {
//           formula: text,
//           value: evaluateFormula(text, currentSheetData),
//           dataType
//         });
//       } else {
//         updateCell(row, col, { value: text, dataType });
//       }
//     },
//     [currentSheetData, updateCell, pushToUndoStack]
//   );

//   const onColumnResize = useCallback(
//     (column: GridColumn, newSize: number, colIndex: number) => {
//       setColumnWidth(colIndex, newSize);
//     },
//     [setColumnWidth]
//   );

//   const onRowResize = useCallback(
//     (row: number, newSize: number) => {
//       setRowHeight(row, newSize);
//     },
//     [setRowHeight]
//   );

//   const onGridSelectionChange = useCallback(
//     (sel: GridSelection) => {
//       setSelection(sel);
//     },
//     [setSelection]
//   );

//   const customDrawCell = useCallback((args: any) => {
//     const { ctx, theme: gridTheme, rect, col, row, cell } = args;
//     if (cell.kind !== GridCellKind.Text && cell.kind !== GridCellKind.Boolean) return false;

//     const cellData = currentSheetData?.[row]?.[col];
//     if (!cellData) return false;

//     const alignment = cellData.alignment || "left";
//     const verticalAlignment = cellData.verticalAlignment || "middle";
//     const fontSize = cellData.fontSize || 14;
//     const isBold = cellData.bold ? "bold" : "normal";
//     const isItalic = cellData.italic ? "italic" : "normal";
//     const textColor = cellData.textColor || (theme === 'dark' ? '#ffffff' : '#202124');
//     const bgColor = cellData.bgColor || (theme === 'dark' ? '#2d3748' : '#ffffff');
//     const borderColor = cellData.borderColor || (theme === 'dark' ? '#4a5568' : '#e2e8f0');
//     const fontFamily = cellData.fontFamily || 'Arial, sans-serif';

//     // Draw background
//     ctx.fillStyle = bgColor;
//     ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

//     // Draw borders
//     if (showGridlines || cellData.borderColor) {
//       ctx.strokeStyle = borderColor;
//       ctx.lineWidth = cellData.borderWidth || 0.5;
      
//       if (cellData.borderStyle === 'dashed') {
//         ctx.setLineDash([5, 5]);
//       } else if (cellData.borderStyle === 'dotted') {
//         ctx.setLineDash([2, 2]);
//       } else {
//         ctx.setLineDash([]);
//       }
      
//       ctx.beginPath();
//       ctx.moveTo(rect.x, rect.y + rect.height);
//       ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
//       ctx.moveTo(rect.x + rect.width, rect.y);
//       ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
//       ctx.stroke();
//       ctx.setLineDash([]);
//     }

//     // Draw text
//     ctx.font = `${isItalic} ${isBold} ${fontSize}px ${fontFamily}`;
//     ctx.fillStyle = textColor;
    
//     // Vertical alignment
//     let textBaseline: CanvasTextBaseline = "middle";
//     if (verticalAlignment === "top") textBaseline = "top";
//     else if (verticalAlignment === "bottom") textBaseline = "bottom";
//     ctx.textBaseline = textBaseline;

//     const padding = 8;
//     const text = String(cell.displayData ?? "");
    
//     // Handle text wrapping
//     if (cellData.wrapText) {
//       const words = text.split(' ');
//       const lines = [];
//       let currentLine = '';
      
//       for (const word of words) {
//         const testLine = currentLine + (currentLine ? ' ' : '') + word;
//         const metrics = ctx.measureText(testLine);
//         if (metrics.width > rect.width - padding * 2 && currentLine) {
//           lines.push(currentLine);
//           currentLine = word;
//         } else {
//           currentLine = testLine;
//         }
//       }
//       if (currentLine) lines.push(currentLine);
      
//       lines.forEach((line, index) => {
//         const textMetrics = ctx.measureText(line);
//         let x = rect.x + padding;
//         if (alignment === "center") {
//           x = rect.x + (rect.width - textMetrics.width) / 2;
//         } else if (alignment === "right") {
//           x = rect.x + rect.width - textMetrics.width - padding;
//         }
        
//         const lineHeight = fontSize * 1.2;
//         const totalHeight = lines.length * lineHeight;
//         let startY = rect.y + rect.height / 2 - totalHeight / 2;
//         if (verticalAlignment === "top") startY = rect.y + padding;
//         else if (verticalAlignment === "bottom") startY = rect.y + rect.height - totalHeight - padding;
        
//         ctx.fillText(line, x, startY + index * lineHeight + lineHeight / 2);
//       });
//     } else {
//       const textMetrics = ctx.measureText(text);
      
//       let x = rect.x + padding;
//       if (alignment === "center") {
//         x = rect.x + (rect.width - textMetrics.width) / 2;
//       } else if (alignment === "right") {
//         x = rect.x + rect.width - textMetrics.width - padding;
//       }

//       let y = rect.y + rect.height / 2;
//       if (verticalAlignment === "top") y = rect.y + padding + fontSize / 2;
//       else if (verticalAlignment === "bottom") y = rect.y + rect.height - padding - fontSize / 2;

//       // Apply text rotation
//       if (cellData.textRotation) {
//         ctx.save();
//         ctx.translate(x + textMetrics.width / 2, y);
//         ctx.rotate((cellData.textRotation * Math.PI) / 180);
//         ctx.fillText(text, -textMetrics.width / 2, 0);
//         ctx.restore();
//       } else {
//         ctx.fillText(text, x, y);
//       }

//       // Draw underline if needed
//       if (cellData.underline) {
//         const underlineY = y + fontSize / 2 + 1;
//         ctx.beginPath();
//         ctx.strokeStyle = textColor;
//         ctx.lineWidth = 1;
//         ctx.moveTo(x, underlineY);
//         ctx.lineTo(x + textMetrics.width, underlineY);
//         ctx.stroke();
//       }

//       // Draw strikethrough if needed
//       if (cellData.strikethrough) {
//         const strikethroughY = y;
//         ctx.beginPath();
//         ctx.strokeStyle = textColor;
//         ctx.lineWidth = 1;
//         ctx.moveTo(x, strikethroughY);
//         ctx.lineTo(x + textMetrics.width, strikethroughY);
//         ctx.stroke();
//       }
//     }

//     // Draw comment indicator
//     if ((cellData.comments && cellData.comments.length > 0) || cellData.comment) {
//       ctx.fillStyle = '#fbbf24';
//       ctx.beginPath();
//       ctx.arc(rect.x + rect.width - 6, rect.y + 6, 3, 0, 2 * Math.PI);
//       ctx.fill();
//     }

//     // Apply conditional formatting
//     if (cellData.conditionalFormatting) {
//       const cf = cellData.conditionalFormatting;
//       const cellValue = cellData.value;
//       let shouldApplyFormat = false;

//       switch (cf.operator) {
//         case 'greaterThan':
//           shouldApplyFormat = parseFloat(cellValue) > parseFloat(cf.value1);
//           break;
//         case 'lessThan':
//           shouldApplyFormat = parseFloat(cellValue) < parseFloat(cf.value1);
//           break;
//         case 'equal':
//           shouldApplyFormat = cellValue === cf.value1;
//           break;
//         case 'between':
//           const val = parseFloat(cellValue);
//           shouldApplyFormat = val >= parseFloat(cf.value1) && val <= parseFloat(cf.value2 || '0');
//           break;
//         case 'contains':
//           shouldApplyFormat = cellValue.toLowerCase().includes(cf.value1.toLowerCase());
//           break;
//       }

//       if (shouldApplyFormat) {
//         // Re-draw background with conditional formatting color
//         ctx.fillStyle = cf.format.bgColor || bgColor;
//         ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        
//         // Update text color if specified
//         if (cf.format.textColor) {
//           ctx.fillStyle = cf.format.textColor;
//         }
        
//         // Apply bold if specified
//         if (cf.format.bold) {
//           ctx.font = `${isItalic} bold ${fontSize}px ${fontFamily}`;
//         }
//       }
//     }

//     // Draw link indicator
//     if (cellData.link) {
//       ctx.fillStyle = '#3b82f6';
//       ctx.beginPath();
//       ctx.arc(rect.x + rect.width - 6, rect.y + rect.height - 6, 3, 0, 2 * Math.PI);
//       ctx.fill();
//     }

//     return true;
//   }, [currentSheetData, theme, showGridlines]);

//   const handleRightClick = useCallback((e: React.MouseEvent) => {
//     e.preventDefault();
    
//     const rect = gridRef.current?.getBoundingClientRect();
//     if (!rect) return;

//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     // Calculate which cell was clicked
//     const col = Math.floor(x / 100); // Approximate column width
//     const row = Math.floor((y - 32) / (rowHeights[Math.floor((y - 32) / 28)] || 28)); // Use actual row height

//     if (row >= 0 && col >= 0) {
//       const selectedCells = [{ row, col }];
      
//       setContextMenu({
//         x: e.clientX,
//         y: e.clientY,
//         selectedCells
//       });
//     }
//   }, [rowHeights]);

//   const handleCellHover = useCallback((e: React.MouseEvent) => {
//     const rect = gridRef.current?.getBoundingClientRect();
//     if (!rect) return;

//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     const col = Math.floor(x / 100);
//     const row = Math.floor((y - 32) / 28);

//     if (row >= 0 && col >= 0) {
//       const cell = currentSheetData?.[row]?.[col];
//       if ((cell?.comments && cell.comments.length > 0) || cell?.comment) {
//         setCommentSystem({
//           visible: true,
//           row,
//           col,
//           position: { x: e.clientX + 10, y: e.clientY + 10 }
//         });
//       } else {
//         setCommentSystem(null);
//       }
//     }
//   }, [currentSheetData]);

//   const handleMouseLeave = useCallback(() => {
//     setCommentSystem(null);
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = () => {
//       setContextMenu(null);
//       setCommentSystem(null);
//     };

//     if (contextMenu || commentSystem) {
//       document.addEventListener('click', handleClickOutside);
//       return () => document.removeEventListener('click', handleClickOutside);
//     }
//   }, [contextMenu, commentSystem]);

//   return (
//     <div 
//      ref={gridRef}
//       className="flex-1 overflow-hidden"
//       style={{ 
//         transform: `scale(${zoom / 100})`,
//         transformOrigin: 'top left',
//         width: `${(100 / zoom) * 100}%`,
//         height: `${(100 / zoom) * 100}%`
//       }}
//       onContextMenu={handleRightClick}
//       onMouseMove={handleCellHover}
//       onMouseLeave={handleMouseLeave}
//     >
//       <DataEditor
//         columns={columns}
//         rows={NUM_ROWS}
//         rowMarkers="both"
//         getCellContent={getCellContent}
//         onCellEdited={onCellEdited}
//         gridSelection={selection}
//         onGridSelectionChange={onGridSelectionChange}
//         onColumnResize={onColumnResize}
//         onRowResize={onRowResize}
//         drawCell={customDrawCell}
//         theme={{
//           accentColor: "#1a73e8",
//           accentFg: "#ffffff",
//           accentLight: "#e8f0fe",
//           textDark: theme === 'dark' ? "#ffffff" : "#202124",
//           textMedium: theme === 'dark' ? "#9aa0a6" : "#5f6368",
//           textLight: theme === 'dark' ? "#5f6368" : "#80868b",
//           textBubble: "#ffffff",
//           bgIconHeader: theme === 'dark' ? "#3c4043" : "#f8f9fa",
//           fgIconHeader: theme === 'dark' ? "#9aa0a6" : "#5f6368",
//           textHeader: theme === 'dark' ? "#e8eaed" : "#202124",
//           textHeaderSelected: "#1a73e8",
//           bgCell: theme === 'dark' ? "#2d3748" : "#ffffff",
//           bgCellMedium: theme === 'dark' ? "#3c4043" : "#f8f9fa",
//           bgHeader: theme === 'dark' ? "#3c4043" : "#f8f9fa",
//           bgHeaderHasFocus: theme === 'dark' ? "#5f6368" : "#e8f0fe",
//           bgHeaderHovered: theme === 'dark' ? "#5f6368" : "#f1f3f4",
//           bgBubble: theme === 'dark' ? "#3c4043" : "#ffffff",
//           bgBubbleSelected: theme === 'dark' ? "#5f6368" : "#e8f0fe",
//           bgSearchResult: "#fff3cd",
//           borderColor: showGridlines ? (theme === 'dark' ? "#5f6368" : "#dadce0") : "transparent",
//           drilldownBorder: "#1a73e8",
//           linkColor: "#1a73e8",
//           headerFontStyle: "600 13px Inter, sans-serif",
//           baseFontStyle: "13px Inter, sans-serif",
//           fontFamily: "Inter, sans-serif"
//         }}
//         smoothScrollX={true}
//         smoothScrollY={true}
//         isDraggable={false}
//         rowHeight={(row) => rowHeights[row] ?? 28}
//         headerHeight={32}
//         groupHeaderHeight={32}
//         freezeColumns={0}
//         freezeRows={0}
//         rangeSelect="multi-rect"
//         columnSelect="multi"
//         rowSelect="multi"
//         experimental={{
//           isSubGrid: false,
//         }}
//       />

//       {contextMenu && (
//         <ContextMenu
//           x={contextMenu.x+40}
//           y={contextMenu.y-300}
//           selectedCells={contextMenu.selectedCells}
//           onClose={() => setContextMenu(null)}
//         />
//       )}

//       {commentSystem && (
//         <CommentSystem
//           row={commentSystem.row}
//           col={commentSystem.col}
//           isVisible={commentSystem.visible}
//           onClose={() => setCommentSystem(null)}
//           position={commentSystem.position}
//         />
//       )}
//     </div>
//   );
// };































































import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import DataEditor, {
  GridCell,
  GridCellKind,
  GridColumn,
  Item,
  EditableGridCell,
  GridSelection,
  CompactSelection,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { useSpreadsheetStore } from '../../stores/spreadsheetStore';
import { evaluateFormula, getExcelColumnName } from '../../utils/formulaEngine';
import { ContextMenu } from './ContextMenu';
import { CommentSystem } from './CommentSystem';

const NUM_ROWS = 1000;
const NUM_COLUMNS = 100;

export const SpreadsheetGrid: React.FC = () => {
  const {
    sheets,
    activeSheet,
    selection,
    setSelection,
    updateCell,
    columnWidths,
    setColumnWidth,
    rowHeights,
    setRowHeight,
    zoom,
    theme,
    pushToUndoStack,
    showGridlines,
    searchResults
  } = useSpreadsheetStore();

  const gridRef = useRef<any>(null);
  const currentSheetData = sheets[activeSheet];
  
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    selectedCells: { row: number; col: number }[];
  } | null>(null);

  const [commentSystem, setCommentSystem] = useState<{
    visible: boolean;
    row: number;
    col: number;
    position: { x: number; y: number };
  } | null>(null);

  const columns: GridColumn[] = useMemo(() =>
    Array.from({ length: NUM_COLUMNS }, (_, i) => ({
      title: getExcelColumnName(i),
      width: columnWidths[i] ?? 100,
      id: String(i),
    })),
    [columnWidths]
  );

  // Helper function to calculate cell from coordinates
  const getCellFromCoordinates = useCallback((x: number, y: number) => {
    const headerHeight = 32;
    
    // Calculate column
    let col = -1;
    let currentX = 0;
    for (let i = 0; i < NUM_COLUMNS; i++) {
      const colWidth = columnWidths[i] ?? 100;
      if (x >= currentX && x < currentX + colWidth) {
        col = i;
        break;
      }
      currentX += colWidth;
    }
    
    // Calculate row
    let row = -1;
    let currentY = headerHeight;
    for (let i = 0; i < NUM_ROWS; i++) {
      const rowHeight = rowHeights[i] ?? 28;
      if (y >= currentY && y < currentY + rowHeight) {
        row = i;
        break;
      }
      currentY += rowHeight;
    }
    
    return { row, col };
  }, [columnWidths, rowHeights]);

  // Helper function to get cell position
  const getCellPosition = useCallback((row: number, col: number) => {
    const headerHeight = 32;
    
    let x = 0;
    for (let i = 0; i < col; i++) {
      x += columnWidths[i] ?? 100;
    }
    
    let y = headerHeight;
    for (let i = 0; i < row; i++) {
      y += rowHeights[i] ?? 28;
    }
    
    return { x, y, width: columnWidths[col] ?? 100, height: rowHeights[row] ?? 28 };
  }, [columnWidths, rowHeights]);

  const getCellContent = useCallback(
    ([col, row]: Item): GridCell => {
      const cell = currentSheetData?.[row]?.[col] ?? { value: "", dataType: 'text' };
      let displayValue = cell.formula 
        ? evaluateFormula(cell.formula, currentSheetData) 
        : cell.value;

      // Format based on number format
      if (cell.numberFormat && displayValue) {
        switch (cell.numberFormat) {
          case 'currency':
            displayValue = `$${parseFloat(displayValue).toFixed(2)}`;
            break;
          case 'percentage':
            displayValue = `${(parseFloat(displayValue) * 100).toFixed(2)}%`;
            break;
          case 'date':
            if (!isNaN(Date.parse(displayValue))) {
              displayValue = new Date(displayValue).toLocaleDateString();
            }
            break;
        }
      }

      if (typeof displayValue === 'object' && displayValue !== null) {
        displayValue = JSON.stringify(displayValue);
      } else if (displayValue === undefined || displayValue === null) {
        displayValue = "";
      }

      // Check if this cell is in search results
      const isSearchResult = searchResults.some(result => result.row === row && result.col === col);

      // Handle checkbox cells
      if (cell.checkbox) {
        return {
          kind: GridCellKind.Boolean,
          allowOverlay: false,
          readonly: false,
          data: cell.checkboxValue || false,
          themeOverride: isSearchResult ? {
            bgCell: "#fff3cd",
            borderColor: "#ffc107"
          } : undefined
        };
      }

      return {
        kind: GridCellKind.Text,
        allowOverlay: true,
        readonly: false,
        displayData: String(displayValue),
        data: cell.formula ?? cell.value,
        themeOverride: isSearchResult ? {
          bgCell: "#fff3cd",
          borderColor: "#ffc107"
        } : undefined
      };
    },
    [currentSheetData, searchResults]
  );

  const onCellEdited = useCallback(
    ([col, row]: Item, newValue: EditableGridCell) => {
      if (newValue.kind === GridCellKind.Boolean) {
        pushToUndoStack();
        updateCell(row, col, { checkboxValue: newValue.data });
        return;
      }

      if (newValue.kind !== GridCellKind.Text) return;

      const text = newValue.data;
      pushToUndoStack();

      // Auto-detect data type
      let dataType: 'text' | 'number' | 'date' | 'boolean' = 'text';
      if (!text.startsWith('=')) {
        if (!isNaN(parseFloat(text)) && isFinite(parseFloat(text))) {
          dataType = 'number';
        } else if (!isNaN(Date.parse(text))) {
          dataType = 'date';
        } else if (text.toLowerCase() === 'true' || text.toLowerCase() === 'false') {
          dataType = 'boolean';
        }
      }

      if (text.startsWith("=")) {
        updateCell(row, col, {
          formula: text,
          value: evaluateFormula(text, currentSheetData),
          dataType
        });
      } else {
        updateCell(row, col, { value: text, dataType });
      }
    },
    [currentSheetData, updateCell, pushToUndoStack]
  );

  const onColumnResize = useCallback(
    (column: GridColumn, newSize: number, colIndex: number) => {
      setColumnWidth(colIndex, newSize);
    },
    [setColumnWidth]
  );

  const onRowResize = useCallback(
    (row: number, newSize: number) => {
      setRowHeight(row, newSize);
    },
    [setRowHeight]
  );

  const onGridSelectionChange = useCallback(
    (sel: GridSelection) => {
      setSelection(sel);
    },
    [setSelection]
  );

  const customDrawCell = useCallback((args: any) => {
    const { ctx, theme: gridTheme, rect, col, row, cell } = args;
    if (cell.kind !== GridCellKind.Text && cell.kind !== GridCellKind.Boolean) return false;

    const cellData = currentSheetData?.[row]?.[col];
    if (!cellData) return false;

    const alignment = cellData.alignment || "left";
    const verticalAlignment = cellData.verticalAlignment || "middle";
    const fontSize = cellData.fontSize || 14;
    const isBold = cellData.bold ? "bold" : "normal";
    const isItalic = cellData.italic ? "italic" : "normal";
    const textColor = cellData.textColor || (theme === 'dark' ? '#ffffff' : '#202124');
    const bgColor = cellData.bgColor || (theme === 'dark' ? '#2d3748' : '#ffffff');
    const borderColor = cellData.borderColor || (theme === 'dark' ? '#4a5568' : '#e2e8f0');
    const fontFamily = cellData.fontFamily || 'Arial, sans-serif';

    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // Draw borders
    if (showGridlines || cellData.borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = cellData.borderWidth || 0.5;
      
      if (cellData.borderStyle === 'dashed') {
        ctx.setLineDash([5, 5]);
      } else if (cellData.borderStyle === 'dotted') {
        ctx.setLineDash([2, 2]);
      } else {
        ctx.setLineDash([]);
      }
      
      ctx.beginPath();
      ctx.moveTo(rect.x, rect.y + rect.height);
      ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
      ctx.moveTo(rect.x + rect.width, rect.y);
      ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw text
    ctx.font = `${isItalic} ${isBold} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    
    // Vertical alignment
    let textBaseline: CanvasTextBaseline = "middle";
    if (verticalAlignment === "top") textBaseline = "top";
    else if (verticalAlignment === "bottom") textBaseline = "bottom";
    ctx.textBaseline = textBaseline;

    const padding = 8;
    const text = String(cell.displayData ?? "");
    
    // Handle text wrapping
    if (cellData.wrapText) {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > rect.width - padding * 2 && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      lines.forEach((line, index) => {
        const textMetrics = ctx.measureText(line);
        let x = rect.x + padding;
        if (alignment === "center") {
          x = rect.x + (rect.width - textMetrics.width) / 2;
        } else if (alignment === "right") {
          x = rect.x + rect.width - textMetrics.width - padding;
        }
        
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        let startY = rect.y + rect.height / 2 - totalHeight / 2;
        if (verticalAlignment === "top") startY = rect.y + padding;
        else if (verticalAlignment === "bottom") startY = rect.y + rect.height - totalHeight - padding;
        
        ctx.fillText(line, x, startY + index * lineHeight + lineHeight / 2);
      });
    } else {
      const textMetrics = ctx.measureText(text);
      
      let x = rect.x + padding;
      if (alignment === "center") {
        x = rect.x + (rect.width - textMetrics.width) / 2;
      } else if (alignment === "right") {
        x = rect.x + rect.width - textMetrics.width - padding;
      }

      let y = rect.y + rect.height / 2;
      if (verticalAlignment === "top") y = rect.y + padding + fontSize / 2;
      else if (verticalAlignment === "bottom") y = rect.y + rect.height - padding - fontSize / 2;

      // Apply text rotation
      if (cellData.textRotation) {
        ctx.save();
        ctx.translate(x + textMetrics.width / 2, y);
        ctx.rotate((cellData.textRotation * Math.PI) / 180);
        ctx.fillText(text, -textMetrics.width / 2, 0);
        ctx.restore();
      } else {
        ctx.fillText(text, x, y);
      }

      // Draw underline if needed
      if (cellData.underline) {
        const underlineY = y + fontSize / 2 + 1;
        ctx.beginPath();
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 1;
        ctx.moveTo(x, underlineY);
        ctx.lineTo(x + textMetrics.width, underlineY);
        ctx.stroke();
      }

      // Draw strikethrough if needed
      if (cellData.strikethrough) {
        const strikethroughY = y;
        ctx.beginPath();
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 1;
        ctx.moveTo(x, strikethroughY);
        ctx.lineTo(x + textMetrics.width, strikethroughY);
        ctx.stroke();
      }
    }

    // Draw comment indicator
    if ((cellData.comments && cellData.comments.length > 0) || cellData.comment) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(rect.x + rect.width - 6, rect.y + 6, 3, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Apply conditional formatting
    if (cellData.conditionalFormatting) {
      const cf = cellData.conditionalFormatting;
      const cellValue = cellData.value;
      let shouldApplyFormat = false;

      switch (cf.operator) {
        case 'greaterThan':
          shouldApplyFormat = parseFloat(cellValue) > parseFloat(cf.value1);
          break;
        case 'lessThan':
          shouldApplyFormat = parseFloat(cellValue) < parseFloat(cf.value1);
          break;
        case 'equal':
          shouldApplyFormat = cellValue === cf.value1;
          break;
        case 'between':
          const val = parseFloat(cellValue);
          shouldApplyFormat = val >= parseFloat(cf.value1) && val <= parseFloat(cf.value2 || '0');
          break;
        case 'contains':
          shouldApplyFormat = cellValue.toLowerCase().includes(cf.value1.toLowerCase());
          break;
      }

      if (shouldApplyFormat) {
        // Re-draw background with conditional formatting color
        ctx.fillStyle = cf.format.bgColor || bgColor;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        
        // Update text color if specified
        console.log("textColor", cf.format.textColor);
        if (cf.format.textColor) {
          console.log("inside textColor", cf.format.textColor);
          ctx.fillStyle = cf.format.textColor;
          console.log(ctx)
        }
        
        // Apply bold if specified
        if (cf.format.bold) {
          ctx.font = `${isItalic} bold ${fontSize}px ${fontFamily}`;
        }
      }
    }

    // Draw link indicator
    if (cellData.link) {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(rect.x + rect.width - 6, rect.y + rect.height - 6, 3, 0, 2 * Math.PI);
      ctx.fill();
    }

    return true;
  }, [currentSheetData, theme, showGridlines]);

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate which cell was clicked using actual column widths and row heights
    const { row, col } = getCellFromCoordinates(x, y);

    if (row >= 0 && col >= 0) {
      const selectedCells = [{ row, col }];
      
      // Get the cell position to adjust context menu if needed
      const cellPos = getCellPosition(row, col);
      const menuX = e.clientX;
      const menuY = e.clientY;
      
      setContextMenu({
        x: menuX,
        y: menuY,
        selectedCells
      });
    }
  }, [getCellFromCoordinates, getCellPosition]);

  const handleCellHover = useCallback((e: React.MouseEvent) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { row, col } = getCellFromCoordinates(x, y);

    if (row >= 0 && col >= 0) {
      const cell = currentSheetData?.[row]?.[col];
      if ((cell?.comments && cell.comments.length > 0) || cell?.comment) {
        // Get exact cell position for accurate comment positioning
        const cellPos = getCellPosition(row, col);
        const commentX = rect.left + cellPos.x + cellPos.width + 10;
        const commentY = rect.top + cellPos.y;
        
        setCommentSystem({
          visible: true,
          row,
          col,
          position: { x: commentX, y: commentY }
        });
      } else {
        setCommentSystem(null);
      }
    }
  }, [currentSheetData, getCellFromCoordinates, getCellPosition]);

  const handleMouseLeave = useCallback(() => {
    setCommentSystem(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setCommentSystem(null);
    };

    if (contextMenu || commentSystem) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu, commentSystem]);

  return (
    <div 
      ref={gridRef}
      className="flex-1 overflow-hidden"
      style={{ 
        transform: `scale(${zoom / 100})`,
        transformOrigin: 'top left',
        width: `${(100 / zoom) * 100}%`,
        height: `${(100 / zoom) * 100}%`
      }}
      onContextMenu={handleRightClick}
      onMouseMove={handleCellHover}
      onMouseLeave={handleMouseLeave}
    >
      <DataEditor
        columns={columns}
        rows={NUM_ROWS}
        rowMarkers="both"
        getCellContent={getCellContent}
        onCellEdited={onCellEdited}
        gridSelection={selection}
        onGridSelectionChange={onGridSelectionChange}
        onColumnResize={onColumnResize}
        onRowResize={onRowResize}
        drawCell={customDrawCell}
        theme={{
          accentColor: "#1a73e8",
          accentFg: "#ffffff",
          accentLight: "#e8f0fe",
          textDark: theme === 'dark' ? "#ffffff" : "#202124",
          textMedium: theme === 'dark' ? "#9aa0a6" : "#5f6368",
          textLight: theme === 'dark' ? "#5f6368" : "#80868b",
          textBubble: "#ffffff",
          bgIconHeader: theme === 'dark' ? "#3c4043" : "#f8f9fa",
          fgIconHeader: theme === 'dark' ? "#9aa0a6" : "#5f6368",
          textHeader: theme === 'dark' ? "#e8eaed" : "#202124",
          textHeaderSelected: "#1a73e8",
          bgCell: theme === 'dark' ? "#2d3748" : "#ffffff",
          bgCellMedium: theme === 'dark' ? "#3c4043" : "#f8f9fa",
          bgHeader: theme === 'dark' ? "#3c4043" : "#f8f9fa",
          bgHeaderHasFocus: theme === 'dark' ? "#5f6368" : "#e8f0fe",
          bgHeaderHovered: theme === 'dark' ? "#5f6368" : "#f1f3f4",
          bgBubble: theme === 'dark' ? "#3c4043" : "#ffffff",
          bgBubbleSelected: theme === 'dark' ? "#5f6368" : "#e8f0fe",
          bgSearchResult: "#fff3cd",
          borderColor: showGridlines ? (theme === 'dark' ? "#5f6368" : "#dadce0") : "transparent",
          drilldownBorder: "#1a73e8",
          linkColor: "#1a73e8",
          headerFontStyle: "600 13px Inter, sans-serif",
          baseFontStyle: "13px Inter, sans-serif",
          fontFamily: "Inter, sans-serif"
        }}
        smoothScrollX={true}
        smoothScrollY={true}
        isDraggable={false}
        rowHeight={(row) => rowHeights[row] ?? 28}
        headerHeight={32}
        groupHeaderHeight={32}
        freezeColumns={0}
        freezeRows={0}
        rangeSelect="multi-rect"
        columnSelect="multi"
        rowSelect="multi"
        experimental={{
          isSubGrid: false,
        }}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedCells={contextMenu.selectedCells}
          onClose={() => setContextMenu(null)}
        />
      )}

      {commentSystem && (
        <CommentSystem
          row={commentSystem.row}
          col={commentSystem.col}
          isVisible={commentSystem.visible}
          onClose={() => setCommentSystem(null)}
          position={commentSystem.position}
        />
      )}
    </div>
  );
};