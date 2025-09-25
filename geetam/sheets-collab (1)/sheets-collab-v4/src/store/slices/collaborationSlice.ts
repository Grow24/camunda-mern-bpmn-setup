import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  userId: string;
  name: string;
  avatar?: string;
  cursor?: { x: number; y: number; cellId?: string };
  selection?: { start: string; end: string };
}

interface TypingIndicator {
  userId: string;
  cellId: string;
  name: string;
}

interface CollaborationState {
  activeUsers: User[];
  typingIndicators: TypingIndicator[];
  userColors: Record<string, string>;
}

const initialState: CollaborationState = {
  activeUsers: [],
  typingIndicators: [],
  userColors: {}
};

// Generate a color for a user
const generateUserColor = (userId: string): string => {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
    '#ec4899', '#6366f1', '#14b8a6', '#eab308'
  ];
  
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    setActiveUsers: (state, action: PayloadAction<User[]>) => {
      state.activeUsers = action.payload;
      
      // Generate colors for new users
      action.payload.forEach(user => {
        if (!state.userColors[user.userId]) {
          state.userColors[user.userId] = generateUserColor(user.userId);
        }
      });
    },
    addUser: (state, action: PayloadAction<User>) => {
      const existingIndex = state.activeUsers.findIndex(u => u.userId === action.payload.userId);
      if (existingIndex === -1) {
        state.activeUsers.push(action.payload);
        if (!state.userColors[action.payload.userId]) {
          state.userColors[action.payload.userId] = generateUserColor(action.payload.userId);
        }
      }
    },
    removeUser: (state, action: PayloadAction<{ userId: string }>) => {
      state.activeUsers = state.activeUsers.filter(u => u.userId !== action.payload.userId);
      state.typingIndicators = state.typingIndicators.filter(t => t.userId !== action.payload.userId);
    },
    updateUserCursor: (state, action: PayloadAction<{ userId: string; cursor: any }>) => {
      const user = state.activeUsers.find(u => u.userId === action.payload.userId);
      if (user) {
        user.cursor = action.payload.cursor;
      }
    },
    updateUserSelection: (state, action: PayloadAction<{ userId: string; selection: any }>) => {
      const user = state.activeUsers.find(u => u.userId === action.payload.userId);
      if (user) {
        user.selection = action.payload.selection;
      }
    },
    addTypingIndicator: (state, action: PayloadAction<TypingIndicator>) => {
      const existingIndex = state.typingIndicators.findIndex(
        t => t.userId === action.payload.userId && t.cellId === action.payload.cellId
      );
      if (existingIndex === -1) {
        state.typingIndicators.push(action.payload);
      }
    },
    removeTypingIndicator: (state, action: PayloadAction<{ userId: string; cellId: string }>) => {
      state.typingIndicators = state.typingIndicators.filter(
        t => !(t.userId === action.payload.userId && t.cellId === action.payload.cellId)
      );
    },
    clearCollaboration: (state) => {
      state.activeUsers = [];
      state.typingIndicators = [];
    }
  }
});

export const {
  setActiveUsers,
  addUser,
  removeUser,
  updateUserCursor,
  updateUserSelection,
  addTypingIndicator,
  removeTypingIndicator,
  clearCollaboration
} = collaborationSlice.actions;

export default collaborationSlice.reducer;