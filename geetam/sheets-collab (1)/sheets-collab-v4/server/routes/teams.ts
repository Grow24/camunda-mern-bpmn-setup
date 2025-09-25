import express from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { AuthRequest, requireRole } from '../middleware/auth.js';

const router = express.Router();

const updateTeamSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  settings: z.any().optional()
});

// Get team info
router.get('/', async (req: AuthRequest, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.user.teamId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
            isActive: true,
            lastSeenAt: true
          }
        },
        _count: {
          select: {
            spreadsheets: true
          }
        }
      }
    });

    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Update team
router.put('/', requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const updates = updateTeamSchema.parse(req.body);

    const team = await prisma.team.update({
      where: { id: req.user.teamId },
      data: updates
    });

    res.json(team);
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Get pending invitations
router.get('/invitations', requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const invitations = await prisma.invitation.findMany({
      where: {
        teamId: req.user.teamId,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(invitations);
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// Update user role
router.put('/users/:userId/role', requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
        teamId: req.user.teamId
      },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Remove user from team
router.delete('/users/:userId', requireRole(['ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    await prisma.user.update({
      where: {
        id: userId,
        teamId: req.user.teamId
      },
      data: { isActive: false }
    });

    res.json({ message: 'User removed from team' });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({ error: 'Failed to remove user' });
  }
});

export { router as teamRoutes };