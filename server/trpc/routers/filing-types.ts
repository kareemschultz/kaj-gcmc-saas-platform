/**
 * Filing Types Router
 *
 * Handles filing type catalog management
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { TRPCError } from '@trpc/server';

// Validation schema
const filingTypeSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  authority: z.string().min(1),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'one_off']),
  defaultDueDay: z.number().int().min(1).max(31).optional(),
  defaultDueMonth: z.number().int().min(1).max(12).optional(),
  description: z.string().optional(),
});

export const filingTypesRouter = router({
  // List filing types
  list: protectedProcedure
    .use(requirePermission('filing_types', 'view'))
    .input(
      z.object({
        search: z.string().default(''),
        authority: z.string().optional(),
        frequency: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, authority, frequency, page, pageSize } = input;

      const where = {
        tenantId: ctx.user.tenantId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(authority && { authority }),
        ...(frequency && { frequency }),
      };

      const [filingTypes, total] = await Promise.all([
        ctx.prisma.filingType.findMany({
          where,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: [{ authority: 'asc' }, { name: 'asc' }],
          include: {
            _count: {
              select: { filings: true, recurringFilings: true },
            },
          },
        }),
        ctx.prisma.filingType.count({ where }),
      ]);

      return {
        filingTypes,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  // Get single filing type
  get: protectedProcedure
    .use(requirePermission('filing_types', 'view'))
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const filingType = await ctx.prisma.filingType.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          _count: {
            select: { filings: true, recurringFilings: true },
          },
        },
      });

      if (!filingType) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Filing type not found' });
      }

      return filingType;
    }),

  // Create filing type
  create: protectedProcedure
    .use(requirePermission('filing_types', 'create'))
    .input(filingTypeSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate code
      const existing = await ctx.prisma.filingType.findFirst({
        where: {
          tenantId: ctx.user.tenantId,
          code: input.code,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Filing type with this code already exists',
        });
      }

      const filingType = await ctx.prisma.filingType.create({
        data: {
          ...input,
          tenantId: ctx.user.tenantId,
        },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'FilingType',
          entityId: filingType.id,
          action: 'CREATE',
          changes: { after: filingType },
        },
      });

      ctx.logger.info('Filing type created:', { filingTypeId: filingType.id });

      return filingType;
    }),

  // Update filing type
  update: protectedProcedure
    .use(requirePermission('filing_types', 'edit'))
    .input(
      z.object({
        id: z.number(),
        data: filingTypeSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.filingType.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Filing type not found' });
      }

      // Check for duplicate code (excluding current)
      if (input.data.code !== existing.code) {
        const duplicate = await ctx.prisma.filingType.findFirst({
          where: {
            tenantId: ctx.user.tenantId,
            code: input.data.code,
            id: { not: input.id },
          },
        });

        if (duplicate) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Filing type with this code already exists',
          });
        }
      }

      const filingType = await ctx.prisma.filingType.update({
        where: { id: input.id },
        data: input.data,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'FilingType',
          entityId: filingType.id,
          action: 'UPDATE',
          changes: { before: existing, after: filingType },
        },
      });

      ctx.logger.info('Filing type updated:', { filingTypeId: filingType.id });

      return filingType;
    }),

  // Delete filing type
  delete: protectedProcedure
    .use(requirePermission('filing_types', 'delete'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.filingType.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          _count: {
            select: { filings: true, recurringFilings: true },
          },
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Filing type not found' });
      }

      // Check if filing type has associated filings
      if (existing._count.filings > 0 || existing._count.recurringFilings > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete filing type with ${existing._count.filings} filings and ${existing._count.recurringFilings} recurring filings`,
        });
      }

      await ctx.prisma.filingType.delete({
        where: { id: input.id },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'FilingType',
          entityId: input.id,
          action: 'DELETE',
          changes: { before: existing },
        },
      });

      ctx.logger.info('Filing type deleted:', { filingTypeId: input.id });

      return { success: true };
    }),
});
