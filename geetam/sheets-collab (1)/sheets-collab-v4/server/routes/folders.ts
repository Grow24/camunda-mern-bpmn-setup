import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().optional(),
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isStarred: z.boolean().optional(),
});

const moveFolderSchema = z.object({
  parentId: z.string().nullable(),
});

// Get folders and files in a directory
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { parentId, view, starred, shared, trash } = req.query;

    let whereClause: any = {
      ownerId: userId,
    };

    // Handle different views
    if (trash === 'true') {
      whereClause.isDeleted = true;
    } else {
      whereClause.isDeleted = false;
      
      if (starred === 'true') {
        whereClause.isStarred = true;
      }
      
      if (parentId) {
        whereClause.parentId = parentId as string;
      } else if (parentId !== 'root') {
        whereClause.parentId = null;
      }
    }

    // Get folders
    const folders = await prisma.folder.findMany({
      where: whereClause,
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        permissions: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            },
            group: {
              select: { id: true, name: true }
            }
          }
        },
        shares: {
          where: { status: 'ACCEPTED' },
          include: {
            sharedWith: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        _count: {
          select: {
            children: true,
            spreadsheets: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Get spreadsheets in the same directory
    const spreadsheetWhereClause: any = {
      ownerId: userId,
      folderId: parentId === 'root' ? null : (parentId as string || null),
    };

    if (trash === 'true') {
      spreadsheetWhereClause.isDeleted = true;
    } else {
      spreadsheetWhereClause.isDeleted = false;
      
      if (starred === 'true') {
        spreadsheetWhereClause.isStarred = true;
      }
    }

    const spreadsheets = await prisma.spreadsheet.findMany({
      where: spreadsheetWhereClause,
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        permissions: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        shares: {
          where: { status: 'ACCEPTED' },
          include: {
            sharedWith: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Handle shared with me view
    if (shared === 'true') {
      const sharedFolders = await prisma.folder.findMany({
        where: {
          OR: [
            {
              permissions: {
                some: { userId: userId }
              }
            },
            {
              shares: {
                some: {
                  sharedWithId: userId,
                  status: 'ACCEPTED'
                }
              }
            }
          ],
          isDeleted: false
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          permissions: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true }
              }
            }
          }
        }
      });

      const sharedSpreadsheets = await prisma.spreadsheet.findMany({
        where: {
          OR: [
            {
              permissions: {
                some: { userId: userId }
              }
            },
            {
              shares: {
                some: {
                  sharedWithId: userId,
                  status: 'ACCEPTED'
                }
              }
            }
          ],
          isDeleted: false
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          permissions: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true }
              }
            }
          }
        }
      });

      return res.json({
        folders: sharedFolders,
        spreadsheets: sharedSpreadsheets
      });
    }

    res.json({
      folders,
      spreadsheets
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Get folder breadcrumb path
router.get('/:id/breadcrumb', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const breadcrumb = [];
    
    let currentFolder = await prisma.folder.findUnique({
      where: { id },
      select: { id: true, name: true, parentId: true }
    });

    while (currentFolder) {
      breadcrumb.unshift({
        id: currentFolder.id,
        name: currentFolder.name,
        path: `/folder/${currentFolder.id}`
      });

      if (currentFolder.parentId) {
        currentFolder = await prisma.folder.findUnique({
          where: { id: currentFolder.parentId },
          select: { id: true, name: true, parentId: true }
        });
      } else {
        break;
      }
    }

    res.json(breadcrumb);
  } catch (error) {
    console.error('Error fetching breadcrumb:', error);
    res.status(500).json({ error: 'Failed to fetch breadcrumb' });
  }
});

// Create folder
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, parentId } = createFolderSchema.parse(req.body);

    // Check if parent folder exists and user has access
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: parentId,
          OR: [
            { ownerId: userId },
            {
              permissions: {
                some: {
                  userId: userId,
                  permission: { in: ['EDIT', 'ADMIN', 'OWNER'] }
                }
              }
            }
          ]
        }
      });

      if (!parentFolder) {
        return res.status(403).json({ error: 'Access denied to parent folder' });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId,
        ownerId: userId,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    // Log activity
    await prisma.recentActivity.create({
      data: {
        userId,
        folderId: folder.id,
        action: 'created_folder'
      }
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Update folder
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updateData = updateFolderSchema.parse(req.body);

    // Check if user owns the folder or has edit permissions
    const folder = await prisma.folder.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          {
            permissions: {
              some: {
                userId: userId,
                permission: { in: ['EDIT', 'ADMIN', 'OWNER'] }
              }
            }
          }
        ]
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found or access denied' });
    }

    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    // Log activity
    await prisma.recentActivity.create({
      data: {
        userId,
        folderId: id,
        action: updateData.name ? 'renamed_folder' : 'updated_folder'
      }
    });

    res.json(updatedFolder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Move folder
router.put('/:id/move', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { parentId } = moveFolderSchema.parse(req.body);

    // Check if user owns the folder
    const folder = await prisma.folder.findFirst({
      where: {
        id,
        ownerId: userId
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found or access denied' });
    }

    // Check if target parent exists and user has access
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: parentId,
          OR: [
            { ownerId: userId },
            {
              permissions: {
                some: {
                  userId: userId,
                  permission: { in: ['EDIT', 'ADMIN', 'OWNER'] }
                }
              }
            }
          ]
        }
      });

      if (!parentFolder) {
        return res.status(403).json({ error: 'Access denied to target folder' });
      }

      // Prevent moving folder into itself or its descendants
      const isDescendant = await checkIfDescendant(id, parentId);
      if (isDescendant) {
        return res.status(400).json({ error: 'Cannot move folder into itself or its descendants' });
      }
    }

    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: { parentId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    // Log activity
    await prisma.recentActivity.create({
      data: {
        userId,
        folderId: id,
        action: 'moved_folder'
      }
    });

    res.json(updatedFolder);
  } catch (error) {
    console.error('Error moving folder:', error);
    res.status(500).json({ error: 'Failed to move folder' });
  }
});

// Delete folder (move to trash)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { permanent } = req.query;

    // Check if user owns the folder
    const folder = await prisma.folder.findFirst({
      where: {
        id,
        ownerId: userId
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found or access denied' });
    }

    if (permanent === 'true') {
      // Permanently delete folder and all contents
      await prisma.folder.delete({
        where: { id }
      });
    } else {
      // Move to trash
      await prisma.folder.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });
    }

    // Log activity
    await prisma.recentActivity.create({
      data: {
        userId,
        folderId: id,
        action: permanent === 'true' ? 'permanently_deleted_folder' : 'deleted_folder'
      }
    });

    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Restore folder from trash
router.put('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const folder = await prisma.folder.findFirst({
      where: {
        id,
        ownerId: userId,
        isDeleted: true
      }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found in trash' });
    }

    const restoredFolder = await prisma.folder.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null
      }
    });

    // Log activity
    await prisma.recentActivity.create({
      data: {
        userId,
        folderId: id,
        action: 'restored_folder'
      }
    });

    res.json(restoredFolder);
  } catch (error) {
    console.error('Error restoring folder:', error);
    res.status(500).json({ error: 'Failed to restore folder' });
  }
});

// Helper function to check if a folder is a descendant of another
async function checkIfDescendant(folderId: string, potentialAncestorId: string): Promise<boolean> {
  let currentFolder = await prisma.folder.findUnique({
    where: { id: potentialAncestorId },
    select: { id: true, parentId: true }
  });

  while (currentFolder) {
    if (currentFolder.id === folderId) {
      return true;
    }

    if (currentFolder.parentId) {
      currentFolder = await prisma.folder.findUnique({
        where: { id: currentFolder.parentId },
        select: { id: true, parentId: true }
      });
    } else {
      break;
    }
  }

  return false;
}

export default router;