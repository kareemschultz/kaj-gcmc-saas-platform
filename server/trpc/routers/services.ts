/**
 * Services tRPC Router
 *
 * Handles service catalog management
 * Migrated from /lib/actions/services.ts
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { auditLogMiddleware } from '../middleware/logging';

/**
 * Service validation schema
 */
export const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  basePrice: z.number().nonnegative().optional(),
  estimatedDays: z.number().int().positive().optional(),
  active: z.boolean().default(true),
});

/**
 * Services router
 */
export const servicesRouter = router({
  /**
   * List services with filtering and pagination
   * Requires: services:view permission
   */
  list: protectedProcedure
    .use(requirePermission('services', 'view'))
    .input(
      z
        .object({
          search: z.string().optional(),
          category: z.string().optional(),
          active: z.boolean().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const {
        search = '',
        category,
        active,
        page = 1,
        pageSize = 20,
      } = input || {};

      const where = {
        tenantId: ctx.user.tenantId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(category && { category }),
        ...(active !== undefined && { active }),
      };

      const [services, total] = await Promise.all([
        ctx.prisma.service.findMany({
          where,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: [{ category: 'asc' }, { name: 'asc' }],
          include: {
            _count: {
              select: { serviceRequests: true, templates: true },
            },
          },
        }),
        ctx.prisma.service.count({ where }),
      ]);

      return {
        services,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * Get single service by ID
   * Requires: services:view permission
   */
  get: protectedProcedure
    .use(requirePermission('services', 'view'))
    .input(z.number())
    .query(async ({ ctx, input: id }) => {
      const service = await ctx.prisma.service.findFirst({
        where: {
          id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          templates: {
            orderBy: { name: 'asc' },
          },
          _count: {
            select: { serviceRequests: true },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Service not found',
        });
      }

      return service;
    }),

  /**
   * Create new service
   * Requires: services:create permission
   */
  create: protectedProcedure
    .use(requirePermission('services', 'create'))
    .use(auditLogMiddleware('Service', 'create'))
    .input(serviceSchema)
    .mutation(async ({ ctx, input }) => {
      const service = await ctx.prisma.service.create({
        data: {
          ...input,
          tenantId: ctx.user.tenantId,
        },
      });

      ctx.logger.info('Service created', {
        serviceId: service.id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'Service',
          entityId: service.id,
          action: 'create',
          changes: input,
        },
      });

      return { success: true, service };
    }),

  /**
   * Update existing service
   * Requires: services:edit permission
   */
  update: protectedProcedure
    .use(requirePermission('services', 'edit'))
    .use(auditLogMiddleware('Service', 'update'))
    .input(
      z.object({
        id: z.number(),
        data: serviceSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify service belongs to tenant
      const existing = await ctx.prisma.service.findFirst({
        where: { id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Service not found',
        });
      }

      const service = await ctx.prisma.service.update({
        where: { id },
        data,
      });

      ctx.logger.info('Service updated', {
        serviceId: id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'Service',
          entityId: id,
          action: 'update',
          changes: data,
        },
      });

      return { success: true, service };
    }),

  /**
   * Delete service
   * Requires: services:delete permission
   */
  delete: protectedProcedure
    .use(requirePermission('services', 'delete'))
    .use(auditLogMiddleware('Service', 'delete'))
    .input(z.number())
    .mutation(async ({ ctx, input: id }) => {
      // Verify service belongs to tenant
      const existing = await ctx.prisma.service.findFirst({
        where: { id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Service not found',
        });
      }

      await ctx.prisma.service.delete({ where: { id } });

      ctx.logger.info('Service deleted', {
        serviceId: id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'Service',
          entityId: id,
          action: 'delete',
        },
      });

      return { success: true };
    }),
});
