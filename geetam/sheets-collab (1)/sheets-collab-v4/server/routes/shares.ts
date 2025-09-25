import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { sendShareInvitationEmail, sendShareAcceptedEmail } from '../services/email';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createShareSchema = z.object({
  spreadsheetId: z.string().optional(),
  folderId: z.string().optional(),
  email: z.string().email().optional(),
  userId: z.string().optional(),
  groupId: z.string().optional(),
  permission: z.enum(['VIEW', 'COMMENT', 'EDIT', 'ADMIN']),
  message: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

const updateShareSchema = z.object({
  permission: z.enum(['VIEW', 'COMMENT', 'EDIT', 'ADMIN']).optional(),
  status: z.enum(['ACCEPTED', 'REJECTED']).optional(),
  expiresAt: z.string().datetime().optional(),
});

const createPublicLinkSchema = z.object({
  spreadsheetId: z.string().optional(),
  folderId: z.string().optional(),
  permission: z.enum(['VIEW', 'COMMENT', 'EDIT']),
  expiresAt: z.string().datetime().optional(),
});

// Get shares for a resource
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { spreadsheetId, folderId, type } = req.query;

    let whereClause: any = {};

    if (type === 'sent') {
      whereClause.sharedById = userId;
    } else if (type === 'received') {
      whereClause.OR = [
        { sharedWithId: userId },
        { email: req.user!.email }
      ];
    } else {
      // Get shares for specific resource
      if (spreadsheetId) {
        whereClause.spreadsheetId = spreadsheetId as string;
      } else if (folderId) {
        whereClause.folderId = folderId as string;
      }
    }

    const shares = await prisma.share.findMany({
      where: whereClause,
      include: {
        spreadsheet: {
          select: { id: true, title: true }
        },
        folder: {
          select: { id: true, name: true }
        },
        sharedBy: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        sharedWith: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(shares);
  } catch (error) {
    console.error('Error fetching shares:', error);
    res.status(500).json({ error: 'Failed to fetch shares' });
  }
});

// Create share invitation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const shareData = createShareSchema.parse(req.body);

    // Validate that either spreadsheetId or folderId is provided
    if (!shareData.spreadsheetId && !shareData.folderId) {
      return res.status(400).json({ error: 'Either spreadsheetId or folderId must be provided' });
    }

    // Validate that either email, userId, or groupId is provided
    if (!shareData.email && !shareData.userId && !shareData.groupId) {
      return res.status(400).json({ error: 'Either email, userId, or groupId must be provided' });
    }

    // Check if user owns the resource
    let resource: any = null;
    if (shareData.spreadsheetId) {
      resource = await prisma.spreadsheet.findFirst({
        where: {
          id: shareData.spreadsheetId,
          ownerId: userId
        }
      });
    } else if (shareData.folderId) {
      resource = await prisma.folder.findFirst({
        where: {
          id: shareData.folderId,
          ownerId: userId
        }
      });
    }

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found or access denied' });
    }

    // Check if share already exists
    const existingShare = await prisma.share.findFirst({
      where: {
        spreadsheetId: shareData.spreadsheetId,
        folderId: shareData.folderId,
        OR: [
          { email: shareData.email },
          { sharedWithId: shareData.userId },
          { groupId: shareData.groupId }
        ]
      }
    });

    if (existingShare) {
      return res.status(400).json({ error: 'Share already exists for this user/email/group' });
    }

    // Find user by email if email is provided
    let sharedWithId = shareData.userId;
    if (shareData.email && !shareData.userId) {
      const user = await prisma.user.findUnique({
        where: { email: shareData.email }
      });
      sharedWithId = user?.id;
    }

    const share = await prisma.share.create({
      data: {
        token: uuidv4(),
        spreadsheetId: shareData.spreadsheetId,
        folderId: shareData.folderId,
        sharedById: userId,
        sharedWithId,
        email: shareData.email,
        permission: shareData.permission,
        message: shareData.message,
        expiresAt: shareData.expiresAt ? new Date(shareData.expiresAt) : null,
      },
      include: {
        spreadsheet: {
          select: { id: true, title: true }
        },
        folder: {
          select: { id: true, name: true }
        },
        sharedBy: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        sharedWith: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    // Send email invitation
    if (shareData.email) {
      try {
        await sendShareInvitationEmail({
          to: shareData.email,
          sharedBy: req.user!,
          resource: {
            type: shareData.spreadsheetId ? 'spreadsheet' : 'folder',
            name: shareData.spreadsheetId ? resource.title : resource.name,
            id: shareData.spreadsheetId || shareData.folderId!
          },
          permission: shareData.permission,
          message: shareData.message,
          token: share.token
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
      }
    }

    // Create notification for the recipient
    if (sharedWithId) {
      await prisma.notification.create({
        data: {
          userId: sharedWithId,
          type: 'SHARE_INVITATION',
          title: 'New share invitation',
          message: `${req.user!.name} shared ${shareData.spreadsheetId ? 'a spreadsheet' : 'a folder'} with you`,
          data: {
            shareId: share.id,
            resourceType: shareData.spreadsheetId ? 'spreadsheet' : 'folder',
            resourceName: shareData.spreadsheetId ? resource.title : resource.name
          }
        }
      });
    }

    // Log activity
    await prisma.recentActivity.create({
      data: {
        userId,
        spreadsheetId: shareData.spreadsheetId,
        folderId: shareData.folderId,
        action: 'shared_resource'
      }
    });

    res.status(201).json(share);
  } catch (error) {
    console.error('Error creating share:', error);
    res.status(500).json({ error: 'Failed to create share' });
  }
});

// Accept/reject share invitation
router.put('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { status } = updateShareSchema.parse(req.body);

    const share = await prisma.share.findUnique({
      where: { token },
      include: {
        spreadsheet: {
          select: { id: true, title: true }
        },
        folder: {
          select: { id: true, name: true }
        },
        sharedBy: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    if (!share) {
      return res.status(404).json({ error: 'Share invitation not found' });
    }

    // Check if share has expired
    if (share.expiresAt && new Date() > share.expiresAt) {
      await prisma.share.update({
        where: { token },
        data: { status: 'EXPIRED' }
      });
      return res.status(400).json({ error: 'Share invitation has expired' });
    }

    const updatedShare = await prisma.share.update({
      where: { token },
      data: { status },
      include: {
        spreadsheet: {
          select: { id: true, title: true }
        },
        folder: {
          select: { id: true, name: true }
        },
        sharedBy: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        sharedWith: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    if (status === 'ACCEPTED') {
      // Create permission record
      if (share.spreadsheetId && share.sharedWithId) {
        await prisma.spreadsheetPermission.create({
          data: {
            spreadsheetId: share.spreadsheetId,
            userId: share.sharedWithId,
            permission: share.permission
          }
        });
      } else if (share.folderId && share.sharedWithId) {
        await prisma.folderPermission.create({
          data: {
            folderId: share.folderId,
            userId: share.sharedWithId,
            permission: share.permission
          }
        });
      }

      // Send acceptance notification to sharer
      await prisma.notification.create({
        data: {
          userId: share.sharedById,
          type: 'SHARE_ACCEPTED',
          title: 'Share invitation accepted',
          message: `${share.sharedWith?.name || share.email} accepted your share invitation`,
          data: {
            shareId: share.id,
            resourceType: share.spreadsheetId ? 'spreadsheet' : 'folder',
            resourceName: share.spreadsheetId ? share.spreadsheet?.title : share.folder?.name
          }
        }
      });

      // Send email notification
      if (share.sharedBy.email) {
        try {
          await sendShareAcceptedEmail({
            to: share.sharedBy.email,
            acceptedBy: share.sharedWith?.name || share.email || 'Someone',
            resource: {
              type: share.spreadsheetId ? 'spreadsheet' : 'folder',
              name: share.spreadsheetId ? share.spreadsheet?.title || '' : share.folder?.name || '',
              id: share.spreadsheetId || share.folderId!
            }
          });
        } catch (emailError) {
          console.error('Failed to send acceptance email:', emailError);
        }
      }
    }

    res.json(updatedShare);
  } catch (error) {
    console.error('Error updating share:', error);
    res.status(500).json({ error: 'Failed to update share' });
  }
});

// Create public link
router.post('/public-link', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const linkData = createPublicLinkSchema.parse(req.body);

    // Check if user owns the resource
    let resource: any = null;
    if (linkData.spreadsheetId) {
      resource = await prisma.spreadsheet.findFirst({
        where: {
          id: linkData.spreadsheetId,
          ownerId: userId
        }
      });
    } else if (linkData.folderId) {
      resource = await prisma.folder.findFirst({
        where: {
          id: linkData.folderId,
          ownerId: userId
        }
      });
    }

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found or access denied' });
    }

    // Check if public link already exists
    const existingLink = await prisma.share.findFirst({
      where: {
        spreadsheetId: linkData.spreadsheetId,
        folderId: linkData.folderId,
        email: null,
        sharedWithId: null,
        status: 'ACCEPTED'
      }
    });

    if (existingLink) {
      return res.json({
        ...existingLink,
        url: `${process.env.APP_URL}/shared/${existingLink.token}`
      });
    }

    const publicLink = await prisma.share.create({
      data: {
        token: uuidv4(),
        spreadsheetId: linkData.spreadsheetId,
        folderId: linkData.folderId,
        sharedById: userId,
        permission: linkData.permission,
        status: 'ACCEPTED',
        expiresAt: linkData.expiresAt ? new Date(linkData.expiresAt) : null,
      }
    });

    // Update resource to be public
    if (linkData.spreadsheetId) {
      await prisma.spreadsheet.update({
        where: { id: linkData.spreadsheetId },
        data: { isPublic: true }
      });
    }

    res.status(201).json({
      ...publicLink,
      url: `${process.env.APP_URL}/shared/${publicLink.token}`
    });
  } catch (error) {
    console.error('Error creating public link:', error);
    res.status(500).json({ error: 'Failed to create public link' });
  }
});

// Access shared resource via token
router.get('/access/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const share = await prisma.share.findUnique({
      where: { token },
      include: {
        spreadsheet: {
          include: {
            owner: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        folder: {
          include: {
            owner: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        sharedBy: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    if (!share) {
      return res.status(404).json({ error: 'Share not found' });
    }

    // Check if share has expired
    if (share.expiresAt && new Date() > share.expiresAt) {
      return res.status(400).json({ error: 'Share has expired' });
    }

    // Check if share is accepted (for email invitations)
    if (share.email && share.status !== 'ACCEPTED') {
      return res.status(400).json({ error: 'Share invitation not accepted' });
    }

    res.json({
      share,
      resource: share.spreadsheet || share.folder,
      permission: share.permission
    });
  } catch (error) {
    console.error('Error accessing shared resource:', error);
    res.status(500).json({ error: 'Failed to access shared resource' });
  }
});

// Delete share
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const share = await prisma.share.findFirst({
      where: {
        id,
        sharedById: userId
      }
    });

    if (!share) {
      return res.status(404).json({ error: 'Share not found or access denied' });
    }

    // Remove associated permissions
    if (share.spreadsheetId && share.sharedWithId) {
      await prisma.spreadsheetPermission.deleteMany({
        where: {
          spreadsheetId: share.spreadsheetId,
          userId: share.sharedWithId
        }
      });
    } else if (share.folderId && share.sharedWithId) {
      await prisma.folderPermission.deleteMany({
        where: {
          folderId: share.folderId,
          userId: share.sharedWithId
        }
      });
    }

    await prisma.share.delete({
      where: { id }
    });

    res.json({ message: 'Share removed successfully' });
  } catch (error) {
    console.error('Error deleting share:', error);
    res.status(500).json({ error: 'Failed to delete share' });
  }
});

export default router;