/**
 * Conversations Router
 *
 * Handles internal messaging and conversations
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { TRPCError } from '@trpc/server';

// Validation schemas
const conversationSchema = z.object({
  clientId: z.number().int().positive().optional(),
  serviceRequestId: z.number().int().positive().optional(),
  subject: z.string().max(255).optional(),
});

const messageSchema = z.object({
  conversationId: z.number().int().positive(),
  body: z.string().min(1),
});

export const conversationsRouter = router({
  // List conversations
  list: protectedProcedure
    .use(requirePermission('conversations', 'view'))
    .input(
      z.object({
        search: z.string().default(''),
        clientId: z.number().optional(),
        serviceRequestId: z.number().optional(),
        unreadOnly: z.boolean().default(false),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, clientId, serviceRequestId, unreadOnly, page, pageSize } = input;

      const where = {
        tenantId: ctx.user.tenantId,
        ...(clientId && { clientId }),
        ...(serviceRequestId && { serviceRequestId }),
        ...(search && {
          OR: [
            { subject: { contains: search, mode: 'insensitive' as const } },
            { client: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }),
        ...(unreadOnly && {
          messages: {
            some: {
              readAt: null,
              authorId: { not: ctx.user.id },
            },
          },
        }),
      };

      const [conversations, total] = await Promise.all([
        ctx.prisma.conversation.findMany({
          where,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: { updatedAt: 'desc' },
          include: {
            client: {
              select: { id: true, name: true },
            },
            serviceRequest: {
              select: {
                id: true,
                service: {
                  select: { name: true },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                author: {
                  select: { id: true, name: true },
                },
              },
            },
            _count: {
              select: { messages: true },
            },
          },
        }),
        ctx.prisma.conversation.count({ where }),
      ]);

      return {
        conversations,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  // Get single conversation with messages
  get: protectedProcedure
    .use(requirePermission('conversations', 'view'))
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          client: true,
          serviceRequest: {
            include: {
              service: {
                select: { name: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      // Mark messages as read
      await ctx.prisma.message.updateMany({
        where: {
          conversationId: input.id,
          authorId: { not: ctx.user.id },
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      return conversation;
    }),

  // Create conversation
  create: protectedProcedure
    .use(requirePermission('conversations', 'create'))
    .input(conversationSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify client belongs to tenant if provided
      if (input.clientId) {
        const client = await ctx.prisma.client.findFirst({
          where: {
            id: input.clientId,
            tenantId: ctx.user.tenantId,
          },
        });

        if (!client) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
        }
      }

      // Verify service request belongs to tenant if provided
      if (input.serviceRequestId) {
        const serviceRequest = await ctx.prisma.serviceRequest.findFirst({
          where: {
            id: input.serviceRequestId,
            tenantId: ctx.user.tenantId,
          },
        });

        if (!serviceRequest) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Service request not found' });
        }
      }

      const conversation = await ctx.prisma.conversation.create({
        data: {
          ...input,
          tenantId: ctx.user.tenantId,
        },
      });

      ctx.logger.info('Conversation created:', { conversationId: conversation.id });

      return conversation;
    }),

  // Update conversation
  update: protectedProcedure
    .use(requirePermission('conversations', 'edit'))
    .input(
      z.object({
        id: z.number(),
        data: conversationSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.conversation.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      const conversation = await ctx.prisma.conversation.update({
        where: { id: input.id },
        data: input.data,
      });

      ctx.logger.info('Conversation updated:', { conversationId: conversation.id });

      return conversation;
    }),

  // Delete conversation
  delete: protectedProcedure
    .use(requirePermission('conversations', 'delete'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.conversation.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      await ctx.prisma.conversation.delete({
        where: { id: input.id },
      });

      ctx.logger.info('Conversation deleted:', { conversationId: input.id });

      return { success: true };
    }),

  // Create message
  createMessage: protectedProcedure
    .use(requirePermission('conversations', 'edit'))
    .input(messageSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify conversation belongs to tenant
      const conversation = await ctx.prisma.conversation.findFirst({
        where: {
          id: input.conversationId,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      const message = await ctx.prisma.$transaction(async (tx) => {
        // Create message
        const msg = await tx.message.create({
          data: {
            ...input,
            authorId: ctx.user.id,
          },
        });

        // Update conversation timestamp
        await tx.conversation.update({
          where: { id: input.conversationId },
          data: { updatedAt: new Date() },
        });

        return msg;
      });

      ctx.logger.info('Message created:', { messageId: message.id });

      return message;
    }),

  // Mark message as read
  markMessageAsRead: protectedProcedure
    .use(requirePermission('conversations', 'view'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify message belongs to tenant via conversation
      const message = await ctx.prisma.message.findFirst({
        where: {
          id: input.id,
          conversation: {
            tenantId: ctx.user.tenantId,
          },
        },
      });

      if (!message) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Message not found' });
      }

      // Only mark as read if not the author
      if (message.authorId !== ctx.user.id && !message.readAt) {
        await ctx.prisma.message.update({
          where: { id: input.id },
          data: { readAt: new Date() },
        });
      }

      return { success: true };
    }),

  // Get unread message count
  getUnreadCount: protectedProcedure
    .use(requirePermission('conversations', 'view'))
    .query(async ({ ctx }) => {
      const count = await ctx.prisma.message.count({
        where: {
          conversation: {
            tenantId: ctx.user.tenantId,
          },
          authorId: { not: ctx.user.id },
          readAt: null,
        },
      });

      return count;
    }),
});
