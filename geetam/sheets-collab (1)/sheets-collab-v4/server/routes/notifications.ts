import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateNotificationSchema = z.object({
  isRead: z.boolean(),
});

const updatePreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  shareInvitations: z.boolean().optional(),
  mentions: z.boolean().optional(),
  comments: z.boolean().optional(),
  activity: z.boolean().optional(),
});

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { unread, limit = 50, offset = 0 } = req.query;

    let whereClause: any = { userId };

    if (unread === 'true') {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    res.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === parseInt(limit as string)
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read/unread
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { isRead } = updateNotificationSchema.parse(req.body);

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead }
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications as read
router.put('/mark-all/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true }
    });

    const defaultPreferences = {
      emailNotifications: true,
      shareInvitations: true,
      mentions: true,
      comments: true,
      activity: false,
    };

    const preferences = {
      ...defaultPreferences,
      ...(user?.notificationPreferences as object || {})
    };

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// Update notification preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const preferences = updatePreferencesSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true }
    });

    const currentPreferences = user?.notificationPreferences as object || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: updatedPreferences
      }
    });

    res.json(updatedPreferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Create notification (internal use)
export async function createNotification(data: {
  userId: string;
  type: 'SHARE_INVITATION' | 'SHARE_ACCEPTED' | 'SHARE_REJECTED' | 'MENTION' | 'COMMENT' | 'ACTIVITY';
  title: string;
  message: string;
  data?: any;
}) {
  try {
    return await prisma.notification.create({
      data
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export default router;