import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { spreadsheetsApi } from '../../services/api';

interface Cell {
  id: string;
  value: any;
  formula?: string;
  style?: {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
    textAlign?: string;
  };
}

interface Spreadsheet {
  id: string;
  title: string;
  description?: string;
  content: {
    cells: Record<string, Cell>;
    rows: number;
    columns: number;
  };
  version: number;
  permissions: any[];
  activities?: any[];
}

interface SpreadsheetState {
  spreadsheets: Spreadsheet[];
  currentSpreadsheet: Spreadsheet | null;
  selectedCell: string | null;
  selectedRange: { start: string; end: string } | null;
  loading: boolean;
  error: string | null;
}

const initialState: SpreadsheetState = {
  spreadsheets: [],
  currentSpreadsheet: null,
  selectedCell: null,
  selectedRange: null,
  loading: false,
  error: null
};

// Async thunks
export const fetchSpreadsheets = createAsyncThunk(
  'spreadsheet/fetchSpreadsheets',
  async () => {
    return await spreadsheetsApi.getAll();
  }
);

export const fetchSpreadsheet = createAsyncThunk(
  'spreadsheet/fetchSpreadsheet',
  async (id: string) => {
    return await spreadsheetsApi.getById(id);
  }
);

export const createSpreadsheet = createAsyncThunk(
  'spreadsheet/createSpreadsheet',
  async (data: { title: string; description?: string }) => {
    return await spreadsheetsApi.create(data);
  }
);

export const updateSpreadsheet = createAsyncThunk(
  'spreadsheet/updateSpreadsheet',
  async ({ id, data }: { id: string; data: any }) => {
    return await spreadsheetsApi.update(id, data);
  }
);

export const deleteSpreadsheet = createAsyncThunk(
  'spreadsheet/deleteSpreadsheet',
  async (id: string) => {
    await spreadsheetsApi.delete(id);
    return id;
  }
);

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    setSelectedCell: (state, action: PayloadAction<string | null>) => {
      state.selectedCell = action.payload;
    },
    setSelectedRange: (state, action: PayloadAction<{ start: string; end: string } | null>) => {
      state.selectedRange = action.payload;
    },
    updateCell: (state, action: PayloadAction<{ cellId: string; value: any; formula?: string }>) => {
      if (state.currentSpreadsheet) {
        const { cellId, value, formula } = action.payload;
        if (!state.currentSpreadsheet.content.cells[cellId]) {
          state.currentSpreadsheet.content.cells[cellId] = { id: cellId, value };
        } else {
          state.currentSpreadsheet.content.cells[cellId].value = value;
          if (formula !== undefined) {
            state.currentSpreadsheet.content.cells[cellId].formula = formula;
          }
        }
      }
    },
    updateCellStyle: (state, action: PayloadAction<{ cellId: string; style: any }>) => {
      if (state.currentSpreadsheet) {
        const { cellId, style } = action.payload;
        if (!state.currentSpreadsheet.content.cells[cellId]) {
          state.currentSpreadsheet.content.cells[cellId] = { id: cellId, value: '', style };
        } else {
          state.currentSpreadsheet.content.cells[cellId].style = {
            ...state.currentSpreadsheet.content.cells[cellId].style,
            ...style
          };
        }
      }
    },
    applyRemoteChanges: (state, action: PayloadAction<{ changes: any; version: number }>) => {
      if (state.currentSpreadsheet) {
        state.currentSpreadsheet.content = action.payload.changes;
        state.currentSpreadsheet.version = action.payload.version;
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch spreadsheets
      .addCase(fetchSpreadsheets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpreadsheets.fulfilled, (state, action) => {
        state.loading = false;
        state.spreadsheets = action.payload;
      })
      .addCase(fetchSpreadsheets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch spreadsheets';
      })
      // Fetch single spreadsheet
      .addCase(fetchSpreadsheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpreadsheet.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSpreadsheet = action.payload;
      })
      .addCase(fetchSpreadsheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch spreadsheet';
      })
      // Create spreadsheet
      .addCase(createSpreadsheet.fulfilled, (state, action) => {
        state.spreadsheets.unshift(action.payload);
      })
      // Update spreadsheet
      .addCase(updateSpreadsheet.fulfilled, (state, action) => {
        const index = state.spreadsheets.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.spreadsheets[index] = action.payload;
        }
        if (state.currentSpreadsheet?.id === action.payload.id) {
          state.currentSpreadsheet = action.payload;
        }
      })
      // Delete spreadsheet
      .addCase(deleteSpreadsheet.fulfilled, (state, action) => {
        state.spreadsheets = state.spreadsheets.filter(s => s.id !== action.payload);
        if (state.currentSpreadsheet?.id === action.payload) {
          state.currentSpreadsheet = null;
        }
      });
  }
});

export const {
  setSelectedCell,
  setSelectedRange,
  updateCell,
  updateCellStyle,
  applyRemoteChanges,
  clearError
} = spreadsheetSlice.actions;

export default spreadsheetSlice.reducer;