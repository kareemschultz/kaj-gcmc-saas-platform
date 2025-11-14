/**
 * Filings tRPC Router
 *
 * Handles filing management for regulatory compliance
 * Migrated from /lib/actions/filings.ts
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { auditLogMiddleware } from '../middleware/logging';

/**
 * Filing validation schema
 */
export const filingSchema = z.object({
  clientId: z.number().min(1, 'Client is required'),
  clientBusinessId: z.number().optional().nullable(),
  filingTypeId: z.number().min(1, 'Filing type is required'),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  periodLabel: z.string().optional(),
  status: z.enum(['draft', 'prepared', 'submitted', 'approved', 'rejected', 'overdue', 'archived']),
  referenceNumber: z.string().optional(),
  taxAmount: z.number().optional(),
  penalties: z.number().optional(),
  interest: z.number().optional(),
  submissionDate: z.string().optional(),
  internalNotes: z.string().optional(),
});

/**
 * Filings router
 */
export const filingsRouter = router({
  /**
   * List filings with filtering and pagination
   * Requires: filings:view permission
   */
  list: protectedProcedure
    .use(requirePermission('filings', 'view'))
    .input(
      z
        .object({
          search: z.string().optional(),
          clientId: z.number().optional(),
          status: z.string().optional(),
          authority: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const {
        search = '',
        clientId,
        status,
        authority,
        page = 1,
        pageSize = 20,
      } = input || {};

      const skip = (page - 1) * pageSize;

      const where: any = { tenantId: ctx.user.tenantId };

      if (search) {
        where.OR = [
          { referenceNumber: { contains: search, mode: 'insensitive' } },
          { periodLabel: { contains: search, mode: 'insensitive' } },
          { client: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (clientId) where.clientId = clientId;
      if (status) where.status = status;
      if (authority) {
        where.filingType = {
          authority: authority,
        };
      }

      const [filings, total] = await Promise.all([
        ctx.prisma.filing.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: { id: true, name: true },
            },
            filingType: {
              select: { id: true, name: true, authority: true },
            },
            _count: {
              select: { documents: true },
            },
          },
        }),
        ctx.prisma.filing.count({ where }),
      ]);

      return {
        filings,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  /**
   * Get single filing by ID
   * Requires: filings:view permission
   */
  get: protectedProcedure
    .use(requirePermission('filings', 'view'))
    .input(z.number())
    .query(async ({ ctx, input: id }) => {
      const filing = await ctx.prisma.filing.findFirst({
        where: {
          id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          client: true,
          clientBusiness: true,
          filingType: true,
          documents: {
            include: {
              document: {
                include: {
                  documentType: true,
                  latestVersion: true,
                },
              },
            },
          },
        },
      });

      if (!filing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Filing not found',
        });
      }

      return filing;
    }),

  /**
   * Create new filing
   * Requires: filings:create permission
   */
  create: protectedProcedure
    .use(requirePermission('filings', 'create'))
    .use(auditLogMiddleware('Filing', 'create'))
    .input(filingSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify client belongs to tenant
      const client = await ctx.prisma.client.findFirst({
        where: {
          id: input.clientId,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      const filing = await ctx.prisma.filing.create({
        data: {
          ...input,
          tenantId: ctx.user.tenantId,
        },
        include: {
          client: true,
          filingType: true,
        },
      });

      ctx.logger.info('Filing created', {
        filingId: filing.id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          clientId: input.clientId,
          entityType: 'Filing',
          entityId: filing.id,
          action: 'create',
          changes: input,
        },
      });

      return { success: true, filing };
    }),

  /**
   * Update existing filing
   * Requires: filings:edit permission
   */
  update: protectedProcedure
    .use(requirePermission('filings', 'edit'))
    .use(auditLogMiddleware('Filing', 'update'))
    .input(
      z.object({
        id: z.number(),
        data: filingSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify filing belongs to tenant
      const existing = await ctx.prisma.filing.findFirst({
        where: { id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Filing not found',
        });
      }

      const filing = await ctx.prisma.filing.update({
        where: { id },
        data,
        include: {
          client: true,
          filingType: true,
        },
      });

      ctx.logger.info('Filing updated', {
        filingId: id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'Filing',
          entityId: id,
          action: 'update',
          changes: data,
        },
      });

      return { success: true, filing };
    }),

  /**
   * Submit filing
   * Requires: filings:submit permission
   */
  submit: protectedProcedure
    .use(requirePermission('filings', 'submit'))
    .input(z.number())
    .mutation(async ({ ctx, input: id }) => {
      // Verify filing belongs to tenant
      const existing = await ctx.prisma.filing.findFirst({
        where: { id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Filing not found',
        });
      }

      if (existing.status !== 'prepared') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only prepared filings can be submitted',
        });
      }

      const filing = await ctx.prisma.filing.update({
        where: { id },
        data: {
          status: 'submitted',
          submissionDate: new Date().toISOString(),
        },
      });

      ctx.logger.info('Filing submitted', {
        filingId: id,
        tenantId: ctx.user.tenantId,
      });

      return { success: true, filing };
    }),

  /**
   * Delete filing
   * Requires: filings:delete permission
   */
  delete: protectedProcedure
    .use(requirePermission('filings', 'delete'))
    .use(auditLogMiddleware('Filing', 'delete'))
    .input(z.number())
    .mutation(async ({ ctx, input: id }) => {
      // Verify filing belongs to tenant
      const existing = await ctx.prisma.filing.findFirst({
        where: { id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Filing not found',
        });
      }

      await ctx.prisma.filing.delete({ where: { id } });

      ctx.logger.info('Filing deleted', {
        filingId: id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'Filing',
          entityId: id,
          action: 'delete',
        },
      });

      return { success: true };
    }),
});
