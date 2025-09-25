import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user's recent activities
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { limit = 20, offset = 0 } = req.query;

    const activities = await prisma.recentActivity.findMany({
      where: { userId },
      include: {
        spreadsheet: {
          select: { id: true, title: true }
        },
        folder: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

// Get spreadsheet activities (for collaboration panel)
router.get('/spreadsheet/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { limit = 50 } = req.query;

    // Check if user has access to the spreadsheet
    const spreadsheet = await prisma.spreadsheet.findFirst({
      where: {
        id,
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
          }
        ]
      }
    });

    if (!spreadsheet) {
      return res.status(404).json({ error: 'Spreadsheet not found or access denied' });
    }

    const activities = await prisma.activity.findMany({
      where: { spreadsheetId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching spreadsheet activities:', error);
    res.status(500).json({ error: 'Failed to fetch spreadsheet activities' });
  }
});

// Log activity (internal use)
export async function logActivity(data: {
  userId: string;
  spreadsheetId?: string;
  folderId?: string;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    // Log detailed activity
    if (data.spreadsheetId) {
      await prisma.activity.create({
        data: {
          userId: data.userId,
          spreadsheetId: data.spreadsheetId,
          action: data.action,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        }
      });
    }

    // Log recent activity
    await prisma.recentActivity.create({
      data: {
        userId: data.userId,
        spreadsheetId: data.spreadsheetId,
        folderId: data.folderId,
        action: data.action,
      }
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export default router;