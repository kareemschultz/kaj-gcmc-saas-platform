/**
 * Notifications Router
 *
 * Handles notification management for users
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { TRPCError } from '@trpc/server';

// Validation schemas
const notificationSchema = z.object({
  type: z.string().min(1),
  message: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  channelStatus: z.record(z.string()).optional(),
});

export const notificationsRouter = router({
  // List notifications
  list: protectedProcedure
    .use(requirePermission('notifications', 'view'))
    .input(
      z.object({
        type: z.string().optional(),
        status: z.string().optional(),
        unreadOnly: z.boolean().default(false),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { type, status, unreadOnly, page, pageSize } = input;

      const where = {
        tenantId: ctx.user.tenantId,
        recipientUserId: ctx.user.id,
        ...(type && { type }),
        ...(status && { status }),
        ...(unreadOnly && { channelStatus: { not: 'read' } }),
      };

      const [notifications, total] = await Promise.all([
        ctx.prisma.notification.findMany({
          where,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.notification.count({ where }),
      ]);

      return {
        notifications,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  // Get single notification
  get: protectedProcedure
    .use(requirePermission('notifications', 'view'))
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
          recipientUserId: ctx.user.id,
        },
      });

      if (!notification) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' });
      }

      return notification;
    }),

  // Create notification
  create: protectedProcedure
    .use(requirePermission('notifications', 'create'))
    .input(
      z.object({
        userId: z.number(),
        type: z.string().min(1),
        message: z.string().min(1),
        metadata: z.record(z.unknown()).optional(),
        channelStatus: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.create({
        data: {
          tenantId: ctx.user.tenantId,
          recipientUserId: input.userId,
          type: input.type,
          message: input.message,
          metadata: (input.metadata || {}) as any,
          channelStatus: (input.channelStatus as any) || 'pending',
        },
      });

      ctx.logger.info('Notification created:', { notificationId: notification.id });

      return notification;
    }),

  // Mark as read
  markAsRead: protectedProcedure
    .use(requirePermission('notifications', 'edit'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
          recipientUserId: ctx.user.id,
        },
      });

      if (!notification) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' });
      }

      // Use metadata to store read status since readAt field doesn't exist in schema
      const currentMetadata = (notification.metadata as any) || {};
      const updated = await ctx.prisma.notification.update({
        where: { id: input.id },
        data: {
          metadata: {
            ...currentMetadata,
            readAt: new Date().toISOString(),
          } as any,
        },
      });

      ctx.logger.info('Notification marked as read:', { notificationId: updated.id });

      return updated;
    }),

  // Mark all as read
  // Note: Since Notification model doesn't have readAt field, this updates channelStatus
  markAllAsRead: protectedProcedure
    .use(requirePermission('notifications', 'edit'))
    .mutation(async ({ ctx }) => {
      const result = await ctx.prisma.notification.updateMany({
        where: {
          tenantId: ctx.user.tenantId,
          recipientUserId: ctx.user.id,
        },
        data: { channelStatus: 'read' },
      });

      ctx.logger.info('All notifications marked as read:', { count: result.count });

      return { count: result.count };
    }),

  // Delete notification
  delete: protectedProcedure
    .use(requirePermission('notifications', 'delete'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
          recipientUserId: ctx.user.id,
        },
      });

      if (!notification) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' });
      }

      await ctx.prisma.notification.delete({
        where: { id: input.id },
      });

      ctx.logger.info('Notification deleted:', { notificationId: input.id });

      return { success: true };
    }),

  // Get unread count
  unreadCount: protectedProcedure
    .use(requirePermission('notifications', 'view'))
    .query(async ({ ctx }) => {
      const count = await ctx.prisma.notification.count({
        where: {
          tenantId: ctx.user.tenantId,
          recipientUserId: ctx.user.id,
          channelStatus: { not: 'read' },
        },
      });

      return count;
    }),
});
