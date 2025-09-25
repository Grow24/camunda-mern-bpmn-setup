// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
// import { prisma } from '../index.js';

// export interface AuthRequest extends Request {
//   user?: any;
// }

// export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
//   try {
//     // Check for JWT token in Authorization header
//     const authHeader = req.headers.authorization;
//     if (authHeader && authHeader.startsWith('Bearer ')) {
//       const token = authHeader.substring(7);
      
//       try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
//         const user = await prisma.user.findUnique({
//           where: { id: decoded.userId },
//           select: {
//             id: true,
//             email: true,
//             name: true,
//             avatar: true,
//             role: true,
//             timezone: true,
//             isActive: true,
//             lastSeenAt: true
//           }
//         });

//         if (user && user.isActive) {
//           // Update last seen
//           await prisma.user.update({
//             where: { id: user.id },
//             data: { lastSeenAt: new Date() }
//           });
          
//           req.user = user;
//           return next();
//         }
//       } catch (jwtError) {
//         // JWT verification failed, continue to session check
//       }
//     }

//     // Check for session-based authentication
//     if (req.isAuthenticated && req.isAuthenticated() && req.user) {
//       // Update last seen for session users
//       await prisma.user.update({
//         where: { id: req.user.id },
//         data: { lastSeenAt: new Date() }
//       });
      
//       return next();
//     }

//     return res.status(401).json({ error: 'Authentication required' });
//   } catch (error) {
//     console.error('Auth middleware error:', error);
//     return res.status(401).json({ error: 'Authentication failed' });
//   }
// }

// export function requireRole(roles: string[]) {
//   return (req: AuthRequest, res: Response, next: NextFunction) => {
//     if (!req.user || !roles.includes(req.user.role)) {
//       return res.status(403).json({ error: 'Insufficient permissions' });
//     }
//     next();
//   };
// }

// export function requirePermission(permission: string) {
//   return async (req: AuthRequest, res: Response, next: NextFunction) => {
//     try {
//       const spreadsheetId = req.params.id || req.body.spreadsheetId;
//       if (!spreadsheetId) {
//         return res.status(400).json({ error: 'Spreadsheet ID required' });
//       }

//       const userPermission = await prisma.spreadsheetPermission.findFirst({
//         where: {
//           userId: req.user.id,
//           spreadsheetId,
//           permission: {
//             in: getPermissionHierarchy(permission)
//           }
//         }
//       });

//       if (!userPermission) {
//         return res.status(403).json({ error: 'Insufficient spreadsheet permissions' });
//       }

//       next();
//     } catch (error) {
//       console.error('Permission check error:', error);
//       return res.status(500).json({ error: 'Permission check failed' });
//     }
//   };
// }

// function getPermissionHierarchy(permission: string): string[] {
//   const hierarchy = {
//     'READ': ['READ', 'WRITE', 'COMMENT', 'ADMIN', 'OWNER'],
//     'WRITE': ['WRITE', 'ADMIN', 'OWNER'],
//     'COMMENT': ['COMMENT', 'ADMIN', 'OWNER'],
//     'ADMIN': ['ADMIN', 'OWNER'],
//     'OWNER': ['OWNER']
//   };
  
//   return hierarchy[permission as keyof typeof hierarchy] || [];
// }


import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireAdmin = requireRole(['ADMIN']);

// Permission checking utilities
export const checkSpreadsheetPermission = async (
  userId: string,
  spreadsheetId: string,
  requiredPermission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN' | 'OWNER'
) => {
  const spreadsheet = await prisma.spreadsheet.findUnique({
    where: { id: spreadsheetId },
    include: {
      permissions: {
        include: {
          user: true,
          group: {
            include: {
              members: true
            }
          }
        }
      }
    }
  });

  if (!spreadsheet) {
    return false;
  }

  // Owner has all permissions
  if (spreadsheet.ownerId === userId) {
    return true;
  }

  // Check if spreadsheet is public
  if (spreadsheet.isPublic && requiredPermission === 'VIEW') {
    return true;
  }

  // Check direct user permissions
  const userPermission = spreadsheet.permissions.find(p => p.userId === userId);
  if (userPermission && hasPermission(userPermission.permission, requiredPermission)) {
    return true;
  }

  // Check group permissions
  for (const permission of spreadsheet.permissions) {
    if (permission.group) {
      const isMember = permission.group.members.some(m => m.userId === userId);
      if (isMember && hasPermission(permission.permission, requiredPermission)) {
        return true;
      }
    }
  }

  return false;
};

export const checkFolderPermission = async (
  userId: string,
  folderId: string,
  requiredPermission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN' | 'OWNER'
) => {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      permissions: {
        include: {
          user: true,
          group: {
            include: {
              members: true
            }
          }
        }
      },
      parent: true
    }
  });

  if (!folder) {
    return false;
  }

  // Owner has all permissions
  if (folder.ownerId === userId) {
    return true;
  }

  // Check direct folder permissions
  const userPermission = folder.permissions.find(p => p.userId === userId);
  if (userPermission && hasPermission(userPermission.permission, requiredPermission)) {
    return true;
  }

  // Check group permissions
  for (const permission of folder.permissions) {
    if (permission.group) {
      const isMember = permission.group.members.some(m => m.userId === userId);
      if (isMember && hasPermission(permission.permission, requiredPermission)) {
        return true;
      }
    }
  }

  // Check parent folder permissions (inheritance)
  if (folder.parent) {
    return await checkFolderPermission(userId, folder.parent.id, requiredPermission);
  }

  return false;
};

// Helper function to check if a permission level satisfies the requirement
const hasPermission = (
  userPermission: string,
  requiredPermission: string
): boolean => {
  const permissionLevels = {
    'VIEW': 1,
    'COMMENT': 2,
    'EDIT': 3,
    'ADMIN': 4,
    'OWNER': 5
  };

  const userLevel = permissionLevels[userPermission as keyof typeof permissionLevels] || 0;
  const requiredLevel = permissionLevels[requiredPermission as keyof typeof permissionLevels] || 0;

  return userLevel >= requiredLevel;
};

// Middleware to check spreadsheet permissions
export const requireSpreadsheetPermission = (permission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN' | 'OWNER') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const spreadsheetId = req.params.id || req.params.spreadsheetId;
      
      if (!spreadsheetId) {
        return res.status(400).json({ error: 'Spreadsheet ID required' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasAccess = await checkSpreadsheetPermission(req.user.id, spreadsheetId, permission);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Middleware to check folder permissions
export const requireFolderPermission = (permission: 'VIEW' | 'COMMENT' | 'EDIT' | 'ADMIN' | 'OWNER') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const folderId = req.params.id || req.params.folderId;
      
      if (!folderId) {
        return res.status(400).json({ error: 'Folder ID required' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasAccess = await checkFolderPermission(req.user.id, folderId, permission);
      
      if (!hasAccess) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

export type { AuthenticatedRequest };

export interface AuthRequest extends Request {
  user?: any;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
            timezone: true,
            isActive: true,
            lastSeenAt: true
          }
        });

        if (user && user.isActive) {
          // Update last seen
          await prisma.user.update({
            where: { id: user.id },
            data: { lastSeenAt: new Date() }
          });
          
          req.user = user;
          return next();
        }
      } catch (jwtError) {
        // JWT verification failed, continue to session check
      }
    }

    // Check for session-based authentication
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      // Update last seen for session users
      await prisma.user.update({
        where: { id: req.user.id },
        data: { lastSeenAt: new Date() }
      });
      
      return next();
    }

    return res.status(401).json({ error: 'Authentication required' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export function requirePermission(permission: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const spreadsheetId = req.params.id || req.body.spreadsheetId;
      if (!spreadsheetId) {
        return res.status(400).json({ error: 'Spreadsheet ID required' });
      }

      const userPermission = await prisma.spreadsheetPermission.findFirst({
        where: {
          userId: req.user.id,
          spreadsheetId,
          permission: {
            in: getPermissionHierarchy(permission)
          }
        }
      });

      if (!userPermission) {
        return res.status(403).json({ error: 'Insufficient spreadsheet permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}


function getPermissionHierarchy(permission: string): string[] {
  const hierarchy = {
    'READ': ['READ', 'WRITE', 'COMMENT', 'ADMIN', 'OWNER'],
    'WRITE': ['WRITE', 'ADMIN', 'OWNER'],
    'COMMENT': ['COMMENT', 'ADMIN', 'OWNER'],
    'ADMIN': ['ADMIN', 'OWNER'],
    'OWNER': ['OWNER']
  };
  
  return hierarchy[permission as keyof typeof hierarchy] || [];
}