import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

const addMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

// Get user's groups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { userId }
            }
          }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        },
        _count: {
          select: {
            members: true,
            spreadsheetPermissions: true,
            folderPermissions: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const group = await prisma.group.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { userId }
            }
          }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        spreadsheetPermissions: {
          include: {
            spreadsheet: {
              select: { id: true, title: true }
            }
          }
        },
        folderPermissions: {
          include: {
            folder: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found or access denied' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Create group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, description } = createGroupSchema.parse(req.body);

    const group = await prisma.group.create({
      data: {
        name,
        description,
        ownerId: userId,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    });

    // Add creator as admin member
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: 'ADMIN'
      }
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Update group
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updateData = updateGroupSchema.parse(req.body);

    // Check if user is owner or admin
    const group = await prisma.group.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                role: 'ADMIN'
              }
            }
          }
        ]
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found or access denied' });
    }

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        }
      }
    });

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Add member to group
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { userId: memberId, role } = addMemberSchema.parse(req.body);

    // Check if user is owner or admin
    const group = await prisma.group.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                role: 'ADMIN'
              }
            }
          }
        ]
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found or access denied' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: memberId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: memberId
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId: id,
        userId: memberId,
        role
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    // Create notification for the new member
    await prisma.notification.create({
      data: {
        userId: memberId,
        type: 'ACTIVITY',
        title: 'Added to group',
        message: `You were added to the group "${group.name}"`,
        data: {
          groupId: id,
          groupName: group.name
        }
      }
    });

    res.status(201).json(member);
  } catch (error) {
    console.error('Error adding group member:', error);
    res.status(500).json({ error: 'Failed to add group member' });
  }
});

// Update member role
router.put('/:id/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id, memberId } = req.params;
    const { role } = updateMemberSchema.parse(req.body);

    // Check if user is owner or admin
    const group = await prisma.group.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                role: 'ADMIN'
              }
            }
          }
        ]
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found or access denied' });
    }

    // Cannot change owner's role
    if (group.ownerId === memberId) {
      return res.status(400).json({ error: 'Cannot change owner role' });
    }

    const updatedMember = await prisma.groupMember.update({
      where: {
        groupId_userId: {
          groupId: id,
          userId: memberId
        }
      },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    res.json(updatedMember);
  } catch (error) {
    console.error('Error updating group member:', error);
    res.status(500).json({ error: 'Failed to update group member' });
  }
});

// Remove member from group
router.delete('/:id/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id, memberId } = req.params;

    // Check if user is owner or admin, or removing themselves
    const group = await prisma.group.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
                role: 'ADMIN'
              }
            }
          }
        ]
      }
    });

    if (!group && userId !== memberId) {
      return res.status(404).json({ error: 'Group not found or access denied' });
    }

    // Cannot remove owner
    if (group?.ownerId === memberId) {
      return res.status(400).json({ error: 'Cannot remove group owner' });
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId: id,
          userId: memberId
        }
      }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({ error: 'Failed to remove group member' });
  }
});

// Delete group
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if user is owner
    const group = await prisma.group.findFirst({
      where: {
        id,
        ownerId: userId
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found or access denied' });
    }

    await prisma.group.delete({
      where: { id }
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// Search users to add to group
router.get('/:id/search-users', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { q } = req.query;

    // Check if user has access to group
    const group = await prisma.group.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { userId }
            }
          }
        ]
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found or access denied' });
    }

    // Get current group members
    const currentMembers = await prisma.groupMember.findMany({
      where: { groupId: id },
      select: { userId: true }
    });

    const memberIds = currentMembers.map(m => m.userId);

    // Search for users not in the group
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              notIn: memberIds
            }
          },
          {
            OR: [
              {
                name: {
                  contains: q as string,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: q as string,
                  mode: 'insensitive'
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      },
      take: 10
    });

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

export default router;