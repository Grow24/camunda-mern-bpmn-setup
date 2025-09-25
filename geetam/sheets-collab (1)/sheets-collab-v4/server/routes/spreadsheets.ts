import express from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { AuthRequest, requirePermission } from '../middleware/auth.js';

const router = express.Router();

const createSpreadsheetSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional()
});

const updateSpreadsheetSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  content: z.any().optional()
});

const shareSchema = z.object({
  email: z.string().email(),
  permission: z.enum(['READ', 'write', 'comment', 'admin'])
});

// Get all spreadsheets for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const spreadsheets = await prisma.spreadsheet.findMany({
      where: {
        permissions: {
          some: {
            userId: req.user.id
          }
        }
      },
      include: {
        permissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            permissions: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json(spreadsheets);
  } catch (error) {
    console.error('Get spreadsheets error:', error);
    res.status(500).json({ error: 'Failed to fetch spreadsheets' });
  }
});

// Get specific spreadsheet
router.get('/:id', requirePermission('READ'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const spreadsheet = await prisma.spreadsheet.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                lastSeenAt: true
              }
            }
          }
        },
        activities: {
          take: 50,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!spreadsheet) {
      return res.status(404).json({ error: 'Spreadsheet not found' });
    }

    res.json(spreadsheet);
  } catch (error) {
    console.error('Get spreadsheet error:', error);
    res.status(500).json({ error: 'Failed to fetch spreadsheet' });
  }
});

// Create new spreadsheet
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, description } = createSpreadsheetSchema.parse(req.body);

    const spreadsheet = await prisma.spreadsheet.create({
      data: {
        title,
        description,
        permissions: {
          create: {
            userId: req.user.id,
            permission: 'OWNER'
          }
        }
      },
      include: {
        permissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'CREATE_SPREADSHEET',
        details: { title },
        userId: req.user.id,
        spreadsheetId: spreadsheet.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(201).json(spreadsheet);
  } catch (error) {
    console.error('Create spreadsheet error:', error);
    res.status(500).json({ error: 'Failed to create spreadsheet' });
  }
});

// Update spreadsheet
router.put('/:id', requirePermission('WRITE'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = updateSpreadsheetSchema.parse(req.body);

    const spreadsheet = await prisma.spreadsheet.update({
      where: { id },
      data: {
        ...updates,
        version: {
          increment: 1
        }
      },
      include: {
        permissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'UPDATE_SPREADSHEET',
        details: updates,
        userId: req.user.id,
        spreadsheetId: id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json(spreadsheet);
  } catch (error) {
    console.error('Update spreadsheet error:', error);
    res.status(500).json({ error: 'Failed to update spreadsheet' });
  }
});

// Share spreadsheet
router.post('/:id/share', requirePermission('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { email, permission } = shareSchema.parse(req.body);

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or update permission
    const sharedPermission = await prisma.spreadsheetPermission.upsert({
      where: {
        userId_spreadsheetId: {
          userId: targetUser.id,
          spreadsheetId: id
        }
      },
      update: {
        permission: permission.toUpperCase() as any
      },
      create: {
        userId: targetUser.id,
        spreadsheetId: id,
        permission: permission.toUpperCase() as any
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        action: 'SHARE_SPREADSHEET',
        details: { email, permission },
        userId: req.user.id,
        spreadsheetId: id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json(sharedPermission);
  } catch (error) {
    console.error('Share spreadsheet error:', error);
    res.status(500).json({ error: 'Failed to share spreadsheet' });
  }
});

// Delete spreadsheet
router.delete('/:id', requirePermission('OWNER'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.spreadsheet.delete({
      where: { id }
    });

    res.json({ message: 'Spreadsheet deleted successfully' });
  } catch (error) {
    console.error('Delete spreadsheet error:', error);
    res.status(500).json({ error: 'Failed to delete spreadsheet' });
  }
});

export { router as spreadsheetRoutes };