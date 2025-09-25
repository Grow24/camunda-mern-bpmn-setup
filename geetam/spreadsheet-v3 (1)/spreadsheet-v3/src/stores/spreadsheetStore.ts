import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { CompactSelection, GridSelection } from '@glideapps/glide-data-grid';

export interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  replies: Comment[];
}

export interface CellData {
  value: string;
  formula?: string;
  fontSize?: number;
  alignment?: "left" | "center" | "right";
  verticalAlignment?: "top" | "middle" | "bottom";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  textColor?: string;
  bgColor?: string;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  borderWidth?: number;
  fontFamily?: string;
  comment?: string;
  comments?: Comment[];
  link?: string;
  validation?: {
    type: 'list' | 'number' | 'date' | 'custom';
    criteria: any;
    errorMessage?: string;
  };
  dataType?: 'text' | 'number' | 'date' | 'boolean';
  numberFormat?: 'general' | 'currency' | 'percentage' | 'date' | 'time';
  merged?: boolean;
  mergeRange?: { startRow: number; endRow: number; startCol: number; endCol: number };
  wrapText?: boolean;
  textRotation?: number;
  conditionalFormatting?: {
    type: 'cellValue' | 'formula';
    operator: 'greaterThan' | 'lessThan' | 'between' | 'equal' | 'contains';
    value1: string;
    value2?: string;
    format: {
      bgColor?: string;
      textColor?: string;
      bold?: boolean;
    };
  };
  checkbox?: boolean;
  checkboxValue?: boolean;
  image?: string;
}

export interface SheetData {
  [sheetName: string]: CellData[][];
}

export interface NamedRange {
  name: string;
  range: string;
  sheetName: string;
}

export interface Chart {
  id: string;
  type: 'line' | 'bar' | 'column' | 'pie' | 'scatter';
  dataRange: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  title?: string;
  colors?: string[];
}

export interface SpreadsheetState {
  sheets: SheetData;
  activeSheet: string;
  selection: GridSelection;
  undoStack: SheetData[];
  redoStack: SheetData[];
  columnWidths: { [key: number]: number };
  rowHeights: { [key: number]: number };
  frozenRows: number;
  frozenCols: number;
  zoom: number;
  theme: 'light' | 'dark';
  showGridlines: boolean;
  showFormulaBar: boolean;
  namedRanges: NamedRange[];
  charts: Chart[];
  clipboardData: any;
  searchQuery: string;
  searchResults: { row: number; col: number }[];
  
  // Actions
  setSheets: (sheets: SheetData) => void;
  setActiveSheet: (sheetName: string) => void;
  addSheet: (sheetName: string) => void;
  deleteSheet: (sheetName: string) => void;
  renameSheet: (oldName: string, newName: string) => void;
  updateCell: (row: number, col: number, data: Partial<CellData>) => void;
  updateCellRange: (startRow: number, startCol: number, endRow: number, endCol: number, data: Partial<CellData>) => void;
  setSelection: (selection: GridSelection) => void;
  pushToUndoStack: () => void;
  undo: () => void;
  redo: () => void;
  setColumnWidth: (col: number, width: number) => void;
  setRowHeight: (row: number, height: number) => void;
  setZoom: (zoom: number) => void;
  toggleTheme: () => void;
  toggleGridlines: () => void;
  toggleFormulaBar: () => void;
  addNamedRange: (namedRange: NamedRange) => void;
  addChart: (chart: Chart) => void;
  setClipboardData: (data: any) => void;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => void;
  insertRow: (index: number) => void;
  insertColumn: (index: number) => void;
  deleteRow: (index: number) => void;
  deleteColumn: (index: number) => void;
  addComment: (row: number, col: number, comment: Comment) => void;
  addReply: (row: number, col: number, commentId: string, reply: Comment) => void;
  sortData: (startRow: number, startCol: number, endRow: number, endCol: number, ascending: boolean) => void;
  filterData: (column: number, criteria: string) => void;
  removeDuplicates: (startRow: number, startCol: number, endRow: number, endCol: number) => void;
  trimWhitespace: (startRow: number, startCol: number, endRow: number, endCol: number) => void;
}

const NUM_ROWS = 1000;
const NUM_COLUMNS = 100;

const createInitialSheetData = (): CellData[][] =>
  Array.from({ length: NUM_ROWS }, () =>
    Array.from({ length: NUM_COLUMNS }, () => ({ value: "", dataType: 'text' }))
  );

export const useSpreadsheetStore = create<SpreadsheetState>()(
  subscribeWithSelector((set, get) => ({
    sheets: { "Sheet1": createInitialSheetData() },
    activeSheet: "Sheet1",
    selection: { columns: CompactSelection.empty(), rows: CompactSelection.empty() },
    undoStack: [],
    redoStack: [],
    columnWidths: {},
    rowHeights: {},
    frozenRows: 0,
    frozenCols: 0,
    zoom: 100,
    theme: 'light',
    showGridlines: true,
    showFormulaBar: true,
    namedRanges: [],
    charts: [],
    clipboardData: null,
    searchQuery: '',
    searchResults: [],

    setSheets: (sheets) => set({ sheets }),
    
    setActiveSheet: (sheetName) => set({ activeSheet: sheetName }),
    
    addSheet: (sheetName) => set((state) => ({
      sheets: { ...state.sheets, [sheetName]: createInitialSheetData() },
      activeSheet: sheetName
    })),
    
    deleteSheet: (sheetName) => set((state) => {
      if (Object.keys(state.sheets).length === 1) return state;
      const newSheets = { ...state.sheets };
      delete newSheets[sheetName];
      const newActiveSheet = state.activeSheet === sheetName 
        ? Object.keys(newSheets)[0] 
        : state.activeSheet;
      return { sheets: newSheets, activeSheet: newActiveSheet };
    }),
    
    renameSheet: (oldName, newName) => set((state) => {
      const newSheets: SheetData = {};
      Object.keys(state.sheets).forEach(key => {
        newSheets[key === oldName ? newName : key] = state.sheets[key];
      });
      return {
        sheets: newSheets,
        activeSheet: state.activeSheet === oldName ? newName : state.activeSheet
      };
    }),
    
    updateCell: (row, col, data) => set((state) => {
      const newSheets = { ...state.sheets };
      const currentSheet = [...state.sheets[state.activeSheet]];
      currentSheet[row] = [...currentSheet[row]];
      currentSheet[row][col] = { ...currentSheet[row][col], ...data };
      newSheets[state.activeSheet] = currentSheet;
      return { sheets: newSheets };
    }),

    updateCellRange: (startRow, startCol, endRow, endCol, data) => set((state) => {
      const newSheets = { ...state.sheets };
      const currentSheet = state.sheets[state.activeSheet].map(row => [...row]);
      
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          if (currentSheet[row] && currentSheet[row][col] !== undefined) {
            currentSheet[row][col] = { ...currentSheet[row][col], ...data };
          }
        }
      }
      
      newSheets[state.activeSheet] = currentSheet;
      return { sheets: newSheets };
    }),
    
    setSelection: (selection) => set({ selection }),
    
    pushToUndoStack: () => set((state) => ({
      undoStack: [...state.undoStack.slice(-99), state.sheets],
      redoStack: []
    })),
    
    undo: () => set((state) => {
      if (state.undoStack.length === 0) return state;
      const previous = state.undoStack[state.undoStack.length - 1];
      return {
        sheets: previous,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.sheets]
      };
    }),
    
    redo: () => set((state) => {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      return {
        sheets: next,
        undoStack: [...state.undoStack, state.sheets],
        redoStack: state.redoStack.slice(0, -1)
      };
    }),
    
    setColumnWidth: (col, width) => set((state) => ({
      columnWidths: { ...state.columnWidths, [col]: width }
    })),
    
    setRowHeight: (row, height) => set((state) => ({
      rowHeights: { ...state.rowHeights, [row]: height }
    })),
    
    setZoom: (zoom) => set({ zoom }),
    
    toggleTheme: () => set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light'
    })),

    toggleGridlines: () => set((state) => ({
      showGridlines: !state.showGridlines
    })),

    toggleFormulaBar: () => set((state) => ({
      showFormulaBar: !state.showFormulaBar
    })),

    addNamedRange: (namedRange) => set((state) => ({
      namedRanges: [...state.namedRanges, namedRange]
    })),

    addChart: (chart) => set((state) => ({
      charts: [...state.charts, chart]
    })),

    setClipboardData: (data) => set({ clipboardData: data }),

    setSearchQuery: (query) => set({ searchQuery: query }),

    performSearch: (query) => set((state) => {
      if (!query.trim()) {
        return { searchResults: [] };
      }

      const results: { row: number; col: number }[] = [];
      const currentSheet = state.sheets[state.activeSheet];
      
      for (let row = 0; row < currentSheet.length; row++) {
        for (let col = 0; col < currentSheet[row].length; col++) {
          const cell = currentSheet[row][col];
          const cellValue = cell?.value?.toString().toLowerCase() || '';
          const cellFormula = cell?.formula?.toLowerCase() || '';
          
          if (cellValue.includes(query.toLowerCase()) || cellFormula.includes(query.toLowerCase())) {
            results.push({ row, col });
          }
        }
      }
      
      return { searchResults: results };
    }),

    insertRow: (index) => set((state) => {
      const newSheets = { ...state.sheets };
      const currentSheet = [...state.sheets[state.activeSheet]];
      const emptyRow = Array.from({ length: NUM_COLUMNS }, () => ({ value: "", dataType: 'text' as const }));
      currentSheet.splice(index, 0, emptyRow);
      currentSheet.pop(); // Remove last row to maintain NUM_ROWS
      newSheets[state.activeSheet] = currentSheet;
      return { sheets: newSheets };
    }),

    insertColumn: (index) => set((state) => {
      const newSheets = { ...state.sheets };
      const currentSheet = state.sheets[state.activeSheet].map(row => {
        const newRow = [...row];
        newRow.splice(index, 0, { value: "", dataType: 'text' as const });
        newRow.pop(); // Remove last column to maintain NUM_COLUMNS
        return newRow;
      });
      newSheets[state.activeSheet] = currentSheet;
      return { sheets: newSheets };
    }),

    deleteRow: (index) => set((state) => {
      const newSheets = { ...state.sheets };
      const currentSheet = [...state.sheets[state.activeSheet]];
      currentSheet.splice(index, 1);
      currentSheet.push(Array.from({ length: NUM_COLUMNS }, () => ({ value: "", dataType: 'text' as const })));
      newSheets[state.activeSheet] = currentSheet;
      return { sheets: newSheets };
    }),

    deleteColumn: (index) => set((state) => {
      const newSheets = { ...state.sheets };
      const currentSheet = state.sheets[state.activeSheet].map(row => {
        const newRow = [...row];
        newRow.splice(index, 1);
        newRow.push({ value: "", dataType: 'text' as const });
        return newRow;
      });
      newSheets[state.activeSheet] = currentSheet;
      return { sheets: newSheets };
    }),

    addComment: (row, col, comment) => set((state) => {
      const newSheets = { ...state.sheets };
      const currentSheet = [...state.sheets[state.activeSheet]];
      currentSheet[row] = [...currentSheet[row]];
      const cell = currentSheet[row][col];
      currentSheet[row][col] = {
        ...cell,
        comments: [...(cell.comments || []), comment]
      };
      newSheets[state.activeSheet] = currentSheet;
      return { sheets: newSheets };
    }),

    addReply: (row, col, commentId, reply) => set((state) => {
      const newSheets = { ...state.sheets };
      const currentSheet = [...state.sheets[state.activeSheet]];
      currentSheet[row] = [...currentSheet[row]];
      const cell = currentSheet[row][col];
      const comments = cell.comments?.map(comment => 
        comment.id === commentId 
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      ) || [];
      currentSheet[row][col] = { ...cell, comments };
      newSheets[state.activeSheet] = currentSheet;
      return { sheets: newSheets };
    }),

    sortData: (startRow, startCol, endRow, endCol, ascending) => set((state) => {
      const newSheets = { ...state.sheets };
      const currentSheet = [...state.sheets[state.activeSheet]];
      
      const dataToSort = [];
      for (let row = startRow; row <= endRow; row++) {
        dataToSort.push([...currentSheet[row].slice(startCol, endCol + 1)]);
      }
      
      dataToSort.sort((a, b) => {
        const aVal = a[0]?.value || '';
        const bVal = b[0]?.value || '';
        const comparison = aVal.toString().localeCompare(bVal.toString(), undefined, { numeric: true });
        return ascending ? comparison : -comparison;
      });
      
      for (let i = 0; i < dataToSort.length; i++) {
        for (let j = 0; j < dataToSort[i].length; j++) {
          currentSheet[startRow + i][startCol + j] = dataToSort[i][j];
        }
      }
      
      newSheets[state.activeSheet] = currentSheet;
      return { sheets: newSheets };
    }),

    filterData: (column, criteria) => {
      // Implementation for filtering data
      console.log('Filter data:', column, criteria);
    },

    removeDuplicates: (startRow, startCol, endRow, endCol) => set((state) => {
      const newSheets = { ...state.sheets };
      const currentSheet = [...state.sheets[state.activeSheet]];
      
      const seen = new Set();
      for (let row = startRow; row <= endRow; row++) {
        const rowData = currentSheet[row].slice(startCol, endCol + 1).map(cell => cell.value).join('|');
        if (seen.has(rowData)) {
          // Clear duplicate row
          for (let col = startCol; col <= endCol; col++) {
            currentSheet[row][col] = { value: "", dataType: 'text' as const };
          }
        } else {
          seen.add(rowData);
        }
      }
      
      newSheets[state.activeSheet] = currentSheet;
      return { sheets: newSheets };
    }),

    trimWhitespace: (startRow, startCol, endRow, endCol) => set((state) => {
      const newSheets = { ...state.sheets };
      const currentSheet = [...state.sheets[state.activeSheet]];
      
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const cell = currentSheet[row][col];
          currentSheet[row][col] = {
            ...cell,
            value: cell.value.toString().trim()
          };
        }
      }
      
      newSheets[state.activeSheet] = currentSheet;
      return { sheets: newSheets };
    })
  }))
);

// Auto-save functionality
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useSpreadsheetStore.getState();
    const saveData = {
      sheets: state.sheets,
      activeSheet: state.activeSheet,
      namedRanges: state.namedRanges,
      charts: state.charts,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('spreadsheet-autosave', JSON.stringify(saveData));
  }, 30000); // Auto-save every 30 seconds
}