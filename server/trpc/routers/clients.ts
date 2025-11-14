/**
 * Clients tRPC Router
 *
 * Handles client management operations: list, get, create, update, delete
 * Migrated from /lib/actions/clients.ts (with getUserContext bug fixed)
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { auditLogMiddleware } from '../middleware/logging';

/**
 * Client validation schema
 */
export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(['individual', 'company', 'partnership']),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tin: z.string().optional(),
  nisNumber: z.string().optional(),
  sector: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
});

/**
 * Clients router
 */
export const clientsRouter = router({
  /**
   * List clients with filtering and pagination
   * Requires: clients:view permission
   */
  list: protectedProcedure
    .use(requirePermission('clients', 'view'))
    .input(
      z
        .object({
          search: z.string().optional(),
          type: z.string().optional(),
          sector: z.string().optional(),
          riskLevel: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const {
        search = '',
        type,
        sector,
        riskLevel,
        page = 1,
        pageSize = 20,
      } = input || {};

      const skip = (page - 1) * pageSize;

      const where: any = { tenantId: ctx.user.tenantId };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { tin: { contains: search, mode: 'insensitive' } },
          { nisNumber: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (type) where.type = type;
      if (sector) where.sector = sector;
      if (riskLevel) where.riskLevel = riskLevel;

      const [clients, total] = await Promise.all([
        ctx.prisma.client.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                documents: true,
                filings: true,
                serviceRequests: true,
              },
            },
          },
        }),
        ctx.prisma.client.count({ where }),
      ]);

      return {
        clients,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  /**
   * Get single client by ID
   * Requires: clients:view permission
   */
  get: protectedProcedure
    .use(requirePermission('clients', 'view'))
    .input(z.number())
    .query(async ({ ctx, input: id }) => {
      const client = await ctx.prisma.client.findFirst({
        where: {
          id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          businesses: true,
          _count: {
            select: {
              documents: true,
              filings: true,
              serviceRequests: true,
            },
          },
        },
      });

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      return client;
    }),

  /**
   * Create new client
   * Requires: clients:create permission
   */
  create: protectedProcedure
    .use(requirePermission('clients', 'create'))
    .use(auditLogMiddleware('Client', 'create'))
    .input(clientSchema)
    .mutation(async ({ ctx, input }) => {
      const client = await ctx.prisma.client.create({
        data: {
          ...input,
          tenantId: ctx.user.tenantId,
          email: input.email || null,
        },
      });

      ctx.logger.info('Client created', {
        clientId: client.id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          clientId: client.id,
          entityType: 'Client',
          entityId: client.id,
          action: 'create',
          changes: input,
        },
      });

      return { success: true, client };
    }),

  /**
   * Update existing client
   * Requires: clients:edit permission
   */
  update: protectedProcedure
    .use(requirePermission('clients', 'edit'))
    .use(auditLogMiddleware('Client', 'update'))
    .input(
      z.object({
        id: z.number(),
        data: clientSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify client belongs to tenant
      const existing = await ctx.prisma.client.findFirst({
        where: { id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      const client = await ctx.prisma.client.update({
        where: { id },
        data: {
          ...data,
          email: data.email || null,
        },
      });

      ctx.logger.info('Client updated', {
        clientId: id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          clientId: id,
          entityType: 'Client',
          entityId: id,
          action: 'update',
          changes: data,
        },
      });

      return { success: true, client };
    }),

  /**
   * Delete client
   * Requires: clients:delete permission
   */
  delete: protectedProcedure
    .use(requirePermission('clients', 'delete'))
    .use(auditLogMiddleware('Client', 'delete'))
    .input(z.number())
    .mutation(async ({ ctx, input: id }) => {
      // Verify client belongs to tenant
      const existing = await ctx.prisma.client.findFirst({
        where: { id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      await ctx.prisma.client.delete({ where: { id } });

      ctx.logger.info('Client deleted', {
        clientId: id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'Client',
          entityId: id,
          action: 'delete',
        },
      });

      return { success: true };
    }),
});
