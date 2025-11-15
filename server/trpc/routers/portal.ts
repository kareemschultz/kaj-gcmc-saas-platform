/**
 * Portal Router
 *
 * Handles client portal operations
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { TRPCError } from '@trpc/server';

export const portalRouter = router({
  // Get portal dashboard data
  getDashboard: protectedProcedure
    .use(requirePermission('portal', 'view'))
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify client belongs to tenant
      const client = await ctx.prisma.client.findFirst({
        where: { id: input.clientId, tenantId: ctx.user.tenantId },
        include: {
          complianceScores: {
            take: 1,
            orderBy: { lastCalculatedAt: 'desc' },
          },
        },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }

      const [upcomingDeadlines, openTasks, recentMessages, activeServiceRequests] =
        await Promise.all([
          // Upcoming filings
          ctx.prisma.filing.findMany({
            where: {
              clientId: input.clientId,
              tenantId: ctx.user.tenantId,
              periodEnd: {
                gte: new Date(),
                lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
              status: { in: ['draft', 'prepared'] },
            },
            include: {
              filingType: { select: { name: true, authority: true } },
            },
            orderBy: { periodEnd: 'asc' },
            take: 5,
          }),

          // Client tasks
          ctx.prisma.clientTask.findMany({
            where: {
              clientId: input.clientId,
              tenantId: ctx.user.tenantId,
              status: { in: ['pending', 'in_progress'] },
            },
            orderBy: { dueDate: 'asc' },
            take: 5,
          }),

          // Recent messages in conversations
          ctx.prisma.message.findMany({
            where: {
              conversation: {
                clientId: input.clientId,
                tenantId: ctx.user.tenantId,
              },
            },
            include: {
              author: { select: { name: true } },
              conversation: { select: { subject: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),

          // Active service requests
          ctx.prisma.serviceRequest.findMany({
            where: {
              clientId: input.clientId,
              tenantId: ctx.user.tenantId,
              status: { in: ['new', 'in_progress', 'awaiting_client'] },
            },
            include: {
              service: { select: { name: true, category: true } },
            },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

      const complianceScore = client.complianceScores[0] || null;

      return {
        client,
        complianceScore,
        upcomingDeadlines,
        openTasks,
        recentMessages,
        activeServiceRequests,
      };
    }),

  // Get portal documents
  getDocuments: protectedProcedure
    .use(requirePermission('portal', 'view'))
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify client belongs to tenant
      const client = await ctx.prisma.client.findFirst({
        where: { id: input.clientId, tenantId: ctx.user.tenantId },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }

      const documents = await ctx.prisma.document.findMany({
        where: { clientId: input.clientId, tenantId: ctx.user.tenantId },
        include: {
          documentType: { select: { name: true, category: true, authority: true } },
          latestVersion: {
            select: {
              expiryDate: true,
              issueDate: true,
              fileUrl: true,
              fileSize: true,
              mimeType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return documents;
    }),

  // Get portal filings
  getFilings: protectedProcedure
    .use(requirePermission('portal', 'view'))
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify client belongs to tenant
      const client = await ctx.prisma.client.findFirst({
        where: { id: input.clientId, tenantId: ctx.user.tenantId },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }

      const filings = await ctx.prisma.filing.findMany({
        where: { clientId: input.clientId, tenantId: ctx.user.tenantId },
        include: {
          filingType: { select: { name: true, authority: true, frequency: true } },
        },
        orderBy: { periodEnd: 'desc' },
      });

      return filings;
    }),

  // Get portal service requests
  getServiceRequests: protectedProcedure
    .use(requirePermission('portal', 'view'))
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify client belongs to tenant
      const client = await ctx.prisma.client.findFirst({
        where: { id: input.clientId, tenantId: ctx.user.tenantId },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }

      const serviceRequests = await ctx.prisma.serviceRequest.findMany({
        where: { clientId: input.clientId, tenantId: ctx.user.tenantId },
        include: {
          service: { select: { name: true, category: true, description: true } },
          steps: {
            select: {
              id: true,
              title: true,
              status: true,
              order: true,
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return serviceRequests;
    }),

  // Get service request details
  getServiceRequestDetails: protectedProcedure
    .use(requirePermission('portal', 'view'))
    .input(
      z.object({
        serviceRequestId: z.number(),
        clientId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const serviceRequest = await ctx.prisma.serviceRequest.findFirst({
        where: {
          id: input.serviceRequestId,
          clientId: input.clientId,
          tenantId: ctx.user.tenantId,
        },
        include: {
          service: true,
          steps: {
            orderBy: { order: 'asc' },
          },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
            },
          },
          conversations: {
            include: {
              messages: {
                include: {
                  author: { select: { name: true } },
                },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      });

      if (!serviceRequest) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Service request not found' });
      }

      return serviceRequest;
    }),

  // Get portal conversations
  getConversations: protectedProcedure
    .use(requirePermission('portal', 'view'))
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify client belongs to tenant
      const client = await ctx.prisma.client.findFirst({
        where: { id: input.clientId, tenantId: ctx.user.tenantId },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }

      const conversations = await ctx.prisma.conversation.findMany({
        where: { clientId: input.clientId, tenantId: ctx.user.tenantId },
        include: {
          messages: {
            include: {
              author: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return conversations;
    }),

  // Get conversation details
  getConversationDetails: protectedProcedure
    .use(requirePermission('portal', 'view'))
    .input(
      z.object({
        conversationId: z.number(),
        clientId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.findFirst({
        where: {
          id: input.conversationId,
          clientId: input.clientId,
          tenantId: ctx.user.tenantId,
        },
        include: {
          messages: {
            include: {
              author: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      return conversation;
    }),

  // Send portal message
  sendMessage: protectedProcedure
    .use(requirePermission('portal', 'edit'))
    .input(
      z.object({
        conversationId: z.number(),
        clientId: z.number(),
        body: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify conversation belongs to client
      const conversation = await ctx.prisma.conversation.findFirst({
        where: {
          id: input.conversationId,
          clientId: input.clientId,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      const message = await ctx.prisma.message.create({
        data: {
          conversationId: input.conversationId,
          authorId: ctx.user.id,
          body: input.body,
        },
        include: {
          author: { select: { name: true, email: true } },
        },
      });

      // Update conversation timestamp
      await ctx.prisma.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() },
      });

      return message;
    }),

  // Get client profile
  getClientProfile: protectedProcedure
    .use(requirePermission('portal', 'view'))
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const client = await ctx.prisma.client.findFirst({
        where: { id: input.clientId, tenantId: ctx.user.tenantId },
        include: {
          businesses: true,
        },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }

      return client;
    }),

  // Get client tasks
  getClientTasks: protectedProcedure
    .use(requirePermission('portal', 'view'))
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify client belongs to tenant
      const client = await ctx.prisma.client.findFirst({
        where: { id: input.clientId, tenantId: ctx.user.tenantId },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }

      const tasks = await ctx.prisma.clientTask.findMany({
        where: { clientId: input.clientId, tenantId: ctx.user.tenantId },
        include: {
          serviceRequest: {
            select: {
              id: true,
              service: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return tasks;
    }),
});
