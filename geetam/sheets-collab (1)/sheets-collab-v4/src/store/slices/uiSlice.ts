import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface Modal {
  type: 'share' | 'settings' | null;
  data?: any;
}

interface UIState {
  toasts: Toast[];
  modal: Modal;
  sidebarOpen: boolean;
  loading: boolean;
}

const initialState: UIState = {
  toasts: [],
  modal: { type: null },
  sidebarOpen: true,
  loading: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        id: Date.now().toString(),
        duration: 5000,
        ...action.payload
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    openModal: (state, action: PayloadAction<{ type: Modal['type']; data?: any }>) => {
      state.modal = action.payload;
    },
    closeModal: (state) => {
      state.modal = { type: null };
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    }
  }
});

export const {
  addToast,
  removeToast,
  openModal,
  closeModal,
  toggleSidebar,
  setLoading
} = uiSlice.actions;

export default uiSlice.reducer;