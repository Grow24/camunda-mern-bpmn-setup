import express from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all users (for sharing)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { search } = req.query;
    
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } }
          ]
        })
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        lastSeenAt: true
      },
      orderBy: {
        name: 'asc'
      },
      take: 20
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user profile
router.put('/profile', async (req: AuthRequest, res) => {
  try {
    const { name, timezone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(timezone && { timezone })
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        timezone: true,
        role: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user activity
router.get('/activity', async (req: AuthRequest, res) => {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        spreadsheet: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    res.json(activities);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export { router as userRoutes };