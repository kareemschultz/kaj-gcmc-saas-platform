/**
 * Service Requests Router
 *
 * Handles service request management
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { TRPCError } from '@trpc/server';

// Validation schemas
const serviceRequestSchema = z.object({
  clientId: z.number().int().positive(),
  clientBusinessId: z.number().int().positive().optional(),
  serviceId: z.number().int().positive(),
  templateId: z.number().int().positive().optional(),
  status: z.string().default('new'),
  priority: z.string().default('medium'),
  metadata: z.record(z.unknown()).optional(),
});

const serviceStepSchema = z.object({
  serviceRequestId: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int(),
  status: z.string().default('not_started'),
  dueDate: z.string().datetime().optional(),
});

export const serviceRequestsRouter = router({
  // List service requests
  list: protectedProcedure
    .use(requirePermission('service_requests', 'view'))
    .input(
      z.object({
        clientId: z.number().optional(),
        serviceId: z.number().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        search: z.string().default(''),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { clientId, serviceId, status, priority, search, page, pageSize } = input;

      const where = {
        tenantId: ctx.user.tenantId,
        ...(clientId && { clientId }),
        ...(serviceId && { serviceId }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(search && {
          OR: [
            { client: { name: { contains: search, mode: 'insensitive' as const } } },
            { service: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }),
      };

      const [serviceRequests, total] = await Promise.all([
        ctx.prisma.serviceRequest.findMany({
          where,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: { id: true, name: true, type: true },
            },
            clientBusiness: {
              select: { id: true, name: true },
            },
            service: {
              select: { id: true, name: true, category: true },
            },
            steps: {
              select: {
                id: true,
                title: true,
                status: true,
                order: true,
              },
              orderBy: { order: 'asc' },
            },
            _count: {
              select: { tasks: true },
            },
          },
        }),
        ctx.prisma.serviceRequest.count({ where }),
      ]);

      return {
        serviceRequests,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  // Get single service request
  get: protectedProcedure
    .use(requirePermission('service_requests', 'view'))
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const serviceRequest = await ctx.prisma.serviceRequest.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          client: true,
          clientBusiness: true,
          service: true,
          template: true,
          steps: {
            orderBy: { order: 'asc' },
          },
          tasks: {
            include: {
              assignedTo: {
                select: { id: true, name: true },
              },
            },
          },
          conversations: {
            include: {
              messages: {
                take: 5,
                orderBy: { createdAt: 'desc' },
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

  // Create service request
  create: protectedProcedure
    .use(requirePermission('service_requests', 'create'))
    .input(serviceRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify client belongs to tenant
      const client = await ctx.prisma.client.findFirst({
        where: {
          id: input.clientId,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }

      // Verify service belongs to tenant
      const service = await ctx.prisma.service.findFirst({
        where: {
          id: input.serviceId,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!service) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Service not found' });
      }

      const serviceRequest = await ctx.prisma.serviceRequest.create({
        data: {
          ...input,
          tenantId: ctx.user.tenantId,
          metadata: input.metadata as any,
        } as any,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          clientId: input.clientId,
          entityType: 'ServiceRequest',
          entityId: serviceRequest.id,
          action: 'CREATE',
          changes: { after: serviceRequest },
        },
      });

      ctx.logger.info('Service request created:', { serviceRequestId: serviceRequest.id });

      return serviceRequest;
    }),

  // Update service request
  update: protectedProcedure
    .use(requirePermission('service_requests', 'edit'))
    .input(
      z.object({
        id: z.number(),
        data: serviceRequestSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.serviceRequest.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Service request not found' });
      }

      const serviceRequest = await ctx.prisma.serviceRequest.update({
        where: { id: input.id },
        data: input.data as any,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          clientId: serviceRequest.clientId,
          entityType: 'ServiceRequest',
          entityId: serviceRequest.id,
          action: 'UPDATE',
          changes: { before: existing, after: serviceRequest },
        },
      });

      ctx.logger.info('Service request updated:', { serviceRequestId: serviceRequest.id });

      return serviceRequest;
    }),

  // Delete service request
  delete: protectedProcedure
    .use(requirePermission('service_requests', 'delete'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.serviceRequest.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Service request not found' });
      }

      await ctx.prisma.serviceRequest.delete({
        where: { id: input.id },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          clientId: existing.clientId,
          entityType: 'ServiceRequest',
          entityId: input.id,
          action: 'DELETE',
          changes: { before: existing },
        },
      });

      ctx.logger.info('Service request deleted:', { serviceRequestId: input.id });

      return { success: true };
    }),

  // Create service step
  createStep: protectedProcedure
    .use(requirePermission('service_requests', 'edit'))
    .input(serviceStepSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify service request belongs to tenant
      const serviceRequest = await ctx.prisma.serviceRequest.findFirst({
        where: {
          id: input.serviceRequestId,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!serviceRequest) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Service request not found' });
      }

      const step = await ctx.prisma.serviceStep.create({
        data: {
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
      });

      ctx.logger.info('Service step created:', { stepId: step.id });

      return step;
    }),

  // Update service step
  updateStep: protectedProcedure
    .use(requirePermission('service_requests', 'edit'))
    .input(
      z.object({
        id: z.number(),
        data: serviceStepSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.serviceStep.findFirst({
        where: { id: input.id },
        include: {
          serviceRequest: {
            select: { tenantId: true },
          },
        },
      });

      if (!existing || existing.serviceRequest.tenantId !== ctx.user.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Service step not found' });
      }

      const updateData = { ...input.data };
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate) as any;
      }

      const step = await ctx.prisma.serviceStep.update({
        where: { id: input.id },
        data: updateData,
      });

      ctx.logger.info('Service step updated:', { stepId: step.id });

      return step;
    }),
});
