import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface UserPresence {
  userId: string;
  name: string;
  avatar?: string;
  cursor?: {
    x: number;
    y: number;
    cellId?: string;
  };
  selection?: {
    start: string;
    end: string;
  };
  lastSeen: Date;
}

// Store active users per spreadsheet
const activeUsers = new Map<string, Map<string, UserPresence>>();
const userSockets = new Map<string, AuthenticatedSocket>();

export function initializeWebSocket(io: Server) {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, avatar: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      userSockets.set(user.id, socket);
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.name} connected`);

    // Join spreadsheet room
    socket.on('join-spreadsheet', async (spreadsheetId: string) => {
      try {
        // Verify user has access to spreadsheet
        const hasAccess = await verifySpreadsheetAccess(socket.userId!, spreadsheetId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to spreadsheet' });
          return;
        }

        socket.join(`spreadsheet:${spreadsheetId}`);
        
        // Add user to active users
        if (!activeUsers.has(spreadsheetId)) {
          activeUsers.set(spreadsheetId, new Map());
        }
        
        const spreadsheetUsers = activeUsers.get(spreadsheetId)!;
        spreadsheetUsers.set(socket.userId!, {
          userId: socket.userId!,
          name: socket.user!.name,
          avatar: socket.user!.avatar,
          lastSeen: new Date()
        });

        // Notify other users
        socket.to(`spreadsheet:${spreadsheetId}`).emit('user-joined', {
          userId: socket.userId,
          name: socket.user!.name,
          avatar: socket.user!.avatar
        });

        // Send current active users to the joining user
        const users = Array.from(spreadsheetUsers.values());
        socket.emit('active-users', users);

        console.log(`User ${socket.user?.name} joined spreadsheet ${spreadsheetId}`);
      } catch (error) {
        console.error('Error joining spreadsheet:', error);
        socket.emit('error', { message: 'Failed to join spreadsheet' });
      }
    });

    // Leave spreadsheet room
    socket.on('leave-spreadsheet', (spreadsheetId: string) => {
      socket.leave(`spreadsheet:${spreadsheetId}`);
      
      // Remove user from active users
      const spreadsheetUsers = activeUsers.get(spreadsheetId);
      if (spreadsheetUsers) {
        spreadsheetUsers.delete(socket.userId!);
        
        // Notify other users
        socket.to(`spreadsheet:${spreadsheetId}`).emit('user-left', {
          userId: socket.userId
        });

        // Clean up empty spreadsheet rooms
        if (spreadsheetUsers.size === 0) {
          activeUsers.delete(spreadsheetId);
        }
      }

      console.log(`User ${socket.user?.name} left spreadsheet ${spreadsheetId}`);
    });

    // Handle cursor movement
    socket.on('cursor-move', (data: { spreadsheetId: string; cursor: any }) => {
      const { spreadsheetId, cursor } = data;
      
      // Update user's cursor position
      const spreadsheetUsers = activeUsers.get(spreadsheetId);
      if (spreadsheetUsers && spreadsheetUsers.has(socket.userId!)) {
        const user = spreadsheetUsers.get(socket.userId!)!;
        user.cursor = cursor;
        user.lastSeen = new Date();
        
        // Broadcast to other users
        socket.to(`spreadsheet:${spreadsheetId}`).emit('cursor-update', {
          userId: socket.userId,
          cursor
        });
      }
    });

    // Handle selection changes
    socket.on('selection-change', (data: { spreadsheetId: string; selection: any }) => {
      const { spreadsheetId, selection } = data;
      
      // Update user's selection
      const spreadsheetUsers = activeUsers.get(spreadsheetId);
      if (spreadsheetUsers && spreadsheetUsers.has(socket.userId!)) {
        const user = spreadsheetUsers.get(socket.userId!)!;
        user.selection = selection;
        user.lastSeen = new Date();
        
        // Broadcast to other users
        socket.to(`spreadsheet:${spreadsheetId}`).emit('selection-update', {
          userId: socket.userId,
          selection
        });
      }
    });

    // Handle spreadsheet changes
    socket.on('spreadsheet-change', async (data: { 
      spreadsheetId: string; 
      changes: any; 
      version: number;
    }) => {
      try {
        const { spreadsheetId, changes, version } = data;
        
        // Verify user has edit access
        const hasEditAccess = await verifySpreadsheetEditAccess(socket.userId!, spreadsheetId);
        if (!hasEditAccess) {
          socket.emit('error', { message: 'No edit access to spreadsheet' });
          return;
        }

        // Update spreadsheet in database
        await prisma.spreadsheet.update({
          where: { id: spreadsheetId },
          data: {
            content: changes,
            updatedAt: new Date()
          }
        });

        // Log activity
        await prisma.activity.create({
          data: {
            userId: socket.userId!,
            spreadsheetId,
            action: 'edited_spreadsheet',
            details: { version },
            ipAddress: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent']
          }
        });

        // Broadcast changes to other users
        socket.to(`spreadsheet:${spreadsheetId}`).emit('spreadsheet-update', {
          changes,
          version,
          userId: socket.userId,
          timestamp: new Date()
        });

        console.log(`Spreadsheet ${spreadsheetId} updated by ${socket.user?.name}`);
      } catch (error) {
        console.error('Error updating spreadsheet:', error);
        socket.emit('error', { message: 'Failed to update spreadsheet' });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data: { spreadsheetId: string; cellId: string }) => {
      const { spreadsheetId, cellId } = data;
      
      socket.to(`spreadsheet:${spreadsheetId}`).emit('user-typing', {
        userId: socket.userId,
        cellId,
        name: socket.user!.name
      });
    });

    socket.on('typing-stop', (data: { spreadsheetId: string; cellId: string }) => {
      const { spreadsheetId, cellId } = data;
      
      socket.to(`spreadsheet:${spreadsheetId}`).emit('user-stopped-typing', {
        userId: socket.userId,
        cellId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.user?.name} disconnected`);
      
      // Remove user from all spreadsheets
      for (const [spreadsheetId, users] of activeUsers.entries()) {
        if (users.has(socket.userId!)) {
          users.delete(socket.userId!);
          
          // Notify other users
          socket.to(`spreadsheet:${spreadsheetId}`).emit('user-left', {
            userId: socket.userId
          });

          // Clean up empty spreadsheet rooms
          if (users.size === 0) {
            activeUsers.delete(spreadsheetId);
          }
        }
      }

      // Remove from user sockets
      userSockets.delete(socket.userId!);
    });
  });

  // Clean up inactive users periodically
  setInterval(() => {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [spreadsheetId, users] of activeUsers.entries()) {
      for (const [userId, user] of users.entries()) {
        if (now.getTime() - user.lastSeen.getTime() > timeout) {
          users.delete(userId);
          
          // Notify other users
          io.to(`spreadsheet:${spreadsheetId}`).emit('user-left', { userId });
        }
      }

      // Clean up empty spreadsheet rooms
      if (users.size === 0) {
        activeUsers.delete(spreadsheetId);
      }
    }
  }, 60000); // Check every minute
}

// Helper functions
async function verifySpreadsheetAccess(userId: string, spreadsheetId: string): Promise<boolean> {
  try {
    const spreadsheet = await prisma.spreadsheet.findFirst({
      where: {
        id: spreadsheetId,
        OR: [
          { ownerId: userId },
          {
            permissions: {
              some: { userId }
            }
          },
          {
            shares: {
              some: {
                sharedWithId: userId,
                status: 'ACCEPTED'
              }
            }
          },
          { isPublic: true }
        ]
      }
    });

    return !!spreadsheet;
  } catch (error) {
    console.error('Error verifying spreadsheet access:', error);
    return false;
  }
}

async function verifySpreadsheetEditAccess(userId: string, spreadsheetId: string): Promise<boolean> {
  try {
    const spreadsheet = await prisma.spreadsheet.findFirst({
      where: {
        id: spreadsheetId,
        OR: [
          { ownerId: userId },
          {
            permissions: {
              some: {
                userId,
                permission: { in: ['EDIT', 'ADMIN', 'OWNER'] }
              }
            }
          },
          {
            shares: {
              some: {
                sharedWithId: userId,
                status: 'ACCEPTED',
                permission: { in: ['EDIT', 'ADMIN'] }
              }
            }
          }
        ]
      }
    });

    return !!spreadsheet;
  } catch (error) {
    console.error('Error verifying spreadsheet edit access:', error);
    return false;
  }
}

// Export function to send notifications to users
export function sendNotificationToUser(userId: string, notification: any) {
  const socket = userSockets.get(userId);
  if (socket) {
    socket.emit('notification', notification);
  }
}

export function getActiveUsers(spreadsheetId: string): UserPresence[] {
  const users = activeUsers.get(spreadsheetId);
  return users ? Array.from(users.values()) : [];
}