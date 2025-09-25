import { configureStore } from '@reduxjs/toolkit';
import spreadsheetReducer from './slices/spreadsheetSlice';
import uiReducer from './slices/uiSlice';
import collaborationReducer from './slices/collaborationSlice';

export const store = configureStore({
  reducer: {
    spreadsheet: spreadsheetReducer,
    ui: uiReducer,
    collaboration: collaborationReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;