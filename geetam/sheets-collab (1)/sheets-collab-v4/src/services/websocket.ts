import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private currentSpreadsheetId: string | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
      auth: { token },
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinSpreadsheet(spreadsheetId: string) {
    if (this.currentSpreadsheetId) {
      this.leaveSpreadsheet(this.currentSpreadsheetId);
    }

    this.currentSpreadsheetId = spreadsheetId;
    this.socket?.emit('join-spreadsheet', spreadsheetId);
  }

  leaveSpreadsheet(spreadsheetId: string) {
    this.socket?.emit('leave-spreadsheet', spreadsheetId);
    if (this.currentSpreadsheetId === spreadsheetId) {
      this.currentSpreadsheetId = null;
    }
  }

  updateCursor(spreadsheetId: string, cursor: { x: number; y: number; cellId?: string }) {
    this.socket?.emit('cursor-move', { spreadsheetId, cursor });
  }

  updateSelection(spreadsheetId: string, selection: { start: string; end: string }) {
    this.socket?.emit('selection-change', { spreadsheetId, selection });
  }

  sendSpreadsheetChange(spreadsheetId: string, changes: any, version: number) {
    this.socket?.emit('spreadsheet-change', { spreadsheetId, changes, version });
  }

  startTyping(spreadsheetId: string, cellId: string) {
    this.socket?.emit('typing-start', { spreadsheetId, cellId });
  }

  stopTyping(spreadsheetId: string, cellId: string) {
    this.socket?.emit('typing-stop', { spreadsheetId, cellId });
  }

  // Event listeners
  onUserJoined(callback: (user: any) => void) {
    this.socket?.on('user-joined', callback);
  }

  onUserLeft(callback: (data: { userId: string }) => void) {
    this.socket?.on('user-left', callback);
  }

  onActiveUsers(callback: (users: any[]) => void) {
    this.socket?.on('active-users', callback);
  }

  onCursorUpdate(callback: (data: { userId: string; cursor: any }) => void) {
    this.socket?.on('cursor-update', callback);
  }

  onSelectionUpdate(callback: (data: { userId: string; selection: any }) => void) {
    this.socket?.on('selection-update', callback);
  }

  onSpreadsheetUpdate(callback: (data: { changes: any; version: number; userId: string; timestamp: Date }) => void) {
    this.socket?.on('spreadsheet-update', callback);
  }

  onUserTyping(callback: (data: { userId: string; cellId: string; name: string }) => void) {
    this.socket?.on('user-typing', callback);
  }

  onUserStoppedTyping(callback: (data: { userId: string; cellId: string }) => void) {
    this.socket?.on('user-stopped-typing', callback);
  }

  // Remove event listeners
  off(event: string, callback?: Function) {
    this.socket?.off(event, callback);
  }
}

export const wsService = new WebSocketService();