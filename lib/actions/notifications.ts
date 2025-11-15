'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getUserContext, assertAdmin } from '@/lib/rbac';

// Validation schema
const notificationSchema = z.object({
  recipientUserId: z.number().int().positive('Recipient is required'),
  type: z.enum(['email', 'in_app', 'sms']).default('in_app'),
  channelStatus: z.enum(['pending', 'sent', 'failed']).default('pending'),
  message: z.string().min(1, 'Message is required'),
  metadata: z.object({
    title: z.string().optional(),
    actionUrl: z.string().optional(),
    entityType: z.string().optional(),
    entityId: z.number().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  }).passthrough().optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

// Get all notifications for current user
export async function getNotifications(params?: {
  type?: string;
  status?: string;
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('Unauthorized', 401);
  }

  const {
    type,
    status,
    unreadOnly = false,
    page = 1,
    pageSize = 20,
  } = params || {};

  try {
    const where = {
      recipientUserId: session.user.id,
      ...(type && { type }),
      ...(status && { channelStatus: status }),
      ...(unreadOnly && {
        metadata: {
          path: ['read'],
          equals: false,
        },
      }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Error fetching notifications:', error as Error);
    throw new ApiError('Failed to fetch notifications', 500);
  }
}

// Get all notifications for tenant (admin view)
export async function getTenantNotifications(params?: {
  recipientUserId?: number;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  // TODO: Add RBAC check for admin access

  const {
    recipientUserId,
    type,
    status,
    page = 1,
    pageSize = 50,
  } = params || {};

  try {
    const where = {
      tenantId: session.user.tenantId,
      ...(recipientUserId && { recipientUserId }),
      ...(type && { type }),
      ...(status && { channelStatus: status }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Error fetching tenant notifications:', error as Error);
    throw new ApiError('Failed to fetch tenant notifications', 500);
  }
}

// Create notification
export async function createNotification(data: NotificationFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = notificationSchema.parse(data);

    // Verify recipient belongs to tenant
    const recipient = await prisma.user.findFirst({
      where: {
        id: validated.recipientUserId,
        tenantUsers: {
          some: {
            tenantId: session.user.tenantId,
          },
        },
      },
    });

    if (!recipient) {
      throw new ApiError('Recipient not found', 404);
    }

    const notification = await prisma.notification.create({
      data: {
        ...validated,
        tenantId: session.user.tenantId,
        metadata: {
          ...validated.metadata,
          read: false,
        },
      },
    });

    logger.info('Notification created:', { notificationId: notification.id });

    return notification;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error creating notification:', error as Error);
    throw new ApiError('Failed to create notification', 500);
  }
}

// Mark notification as read
export async function markNotificationAsRead(id: number) {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        recipientUserId: session.user.id,
      },
    });

    if (!notification) {
      throw new ApiError('Notification not found', 404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        metadata: {
          ...(notification.metadata as object || {}),
          read: true,
          readAt: new Date().toISOString(),
        },
      },
    });

    revalidatePath('/notifications');
    return updated;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error marking notification as read:', error as Error);
    throw new ApiError('Failed to mark notification as read', 500);
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    // Get all unread notifications
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        recipientUserId: session.user.id,
        metadata: {
          path: ['read'],
          equals: false,
        },
      },
    });

    // Update each one (since we need to modify JSON field)
    await Promise.all(
      unreadNotifications.map((notification) =>
        prisma.notification.update({
          where: { id: notification.id },
          data: {
            metadata: {
              ...(notification.metadata as object || {}),
              read: true,
              readAt: new Date().toISOString(),
            },
          },
        })
      )
    );

    revalidatePath('/notifications');
    logger.info('All notifications marked as read');

    return { success: true, count: unreadNotifications.length };
  } catch (error) {
    logger.error('Error marking all notifications as read:', error as Error);
    throw new ApiError('Failed to mark all notifications as read', 500);
  }
}

// Delete notification
export async function deleteNotification(id: number) {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        recipientUserId: session.user.id,
      },
    });

    if (!notification) {
      throw new ApiError('Notification not found', 404);
    }

    await prisma.notification.delete({
      where: { id },
    });

    revalidatePath('/notifications');
    logger.info('Notification deleted:', { notificationId: id });

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting notification:', error as Error);
    throw new ApiError('Failed to delete notification', 500);
  }
}

// Get unread notification count
export async function getUnreadNotificationCount() {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const count = await prisma.notification.count({
      where: {
        recipientUserId: session.user.id,
        metadata: {
          path: ['read'],
          equals: false,
        },
      },
    });

    return count;
  } catch (error) {
    logger.error('Error fetching unread notification count:', error as Error);
    throw new ApiError('Failed to fetch unread notification count', 500);
  }
}

// Send notification (helper for background jobs)
export async function sendNotification(
  tenantId: number,
  recipientUserId: number,
  message: string,
  options?: {
    type?: 'email' | 'in_app' | 'sms';
    title?: string;
    actionUrl?: string;
    entityType?: string;
    entityId?: number;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        tenantId,
        recipientUserId,
        type: options?.type || 'in_app',
        channelStatus: 'pending',
        message,
        metadata: {
          read: false,
          title: options?.title,
          actionUrl: options?.actionUrl,
          entityType: options?.entityType,
          entityId: options?.entityId,
          priority: options?.priority || 'medium',
        },
      },
    });

    logger.info('Notification sent:', {
      notificationId: notification.id,
      recipientUserId,
      type: notification.type,
    });

    return notification;
  } catch (error) {
    logger.error('Error sending notification:', error as Error);
    throw new ApiError('Failed to send notification', 500);
  }
}
