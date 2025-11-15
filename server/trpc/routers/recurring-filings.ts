/**
 * Recurring Filings Router
 *
 * Handles scheduled recurring filings
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { TRPCError } from '@trpc/server';

// Validation schema
const recurringFilingSchema = z.object({
  clientId: z.number().int().positive(),
  clientBusinessId: z.number().int().positive().optional(),
  filingTypeId: z.number().int().positive(),
  schedule: z.string().min(1),
  active: z.boolean().default(true),
  nextRunAt: z.string().datetime().optional(),
});

export const recurringFilingsRouter = router({
  // List recurring filings
  list: protectedProcedure
    .use(requirePermission('filings', 'view'))
    .input(
      z.object({
        search: z.string().default(''),
        clientId: z.number().optional(),
        filingTypeId: z.number().optional(),
        active: z.boolean().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, clientId, filingTypeId, active, page, pageSize } = input;

      const where = {
        tenantId: ctx.user.tenantId,
        ...(clientId && { clientId }),
        ...(filingTypeId && { filingTypeId }),
        ...(active !== undefined && { active }),
        ...(search && {
          OR: [
            { client: { name: { contains: search, mode: 'insensitive' as const } } },
            { filingType: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }),
      };

      const [recurringFilings, total] = await Promise.all([
        ctx.prisma.recurringFiling.findMany({
          where,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: [{ active: 'desc' }, { nextRunAt: 'asc' }],
          include: {
            client: {
              select: { id: true, name: true, type: true },
            },
            clientBusiness: {
              select: { id: true, name: true },
            },
            filingType: {
              select: {
                id: true,
                name: true,
                code: true,
                authority: true,
                frequency: true,
              },
            },
          },
        }),
        ctx.prisma.recurringFiling.count({ where }),
      ]);

      return {
        recurringFilings,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  // Get single recurring filing
  get: protectedProcedure
    .use(requirePermission('filings', 'view'))
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const recurringFiling = await ctx.prisma.recurringFiling.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          client: true,
          clientBusiness: true,
          filingType: true,
        },
      });

      if (!recurringFiling) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Recurring filing not found' });
      }

      return recurringFiling;
    }),

  // Create recurring filing
  create: protectedProcedure
    .use(requirePermission('filings', 'create'))
    .input(recurringFilingSchema)
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

      // Verify filing type belongs to tenant
      const filingType = await ctx.prisma.filingType.findFirst({
        where: {
          id: input.filingTypeId,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!filingType) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Filing type not found' });
      }

      const recurringFiling = await ctx.prisma.recurringFiling.create({
        data: {
          ...input,
          nextRunAt: input.nextRunAt ? new Date(input.nextRunAt) : null,
          tenantId: ctx.user.tenantId,
        },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          clientId: input.clientId,
          entityType: 'RecurringFiling',
          entityId: recurringFiling.id,
          action: 'CREATE',
          changes: { after: recurringFiling },
        },
      });

      ctx.logger.info('Recurring filing created:', { recurringFilingId: recurringFiling.id });

      return recurringFiling;
    }),

  // Update recurring filing
  update: protectedProcedure
    .use(requirePermission('filings', 'edit'))
    .input(
      z.object({
        id: z.number(),
        data: recurringFilingSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.recurringFiling.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Recurring filing not found' });
      }

      const updateData = { ...input.data };
      if (updateData.nextRunAt) {
        updateData.nextRunAt = new Date(updateData.nextRunAt) as any;
      }

      const recurringFiling = await ctx.prisma.recurringFiling.update({
        where: { id: input.id },
        data: updateData,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          clientId: recurringFiling.clientId,
          entityType: 'RecurringFiling',
          entityId: recurringFiling.id,
          action: 'UPDATE',
          changes: { before: existing, after: recurringFiling },
        },
      });

      ctx.logger.info('Recurring filing updated:', { recurringFilingId: recurringFiling.id });

      return recurringFiling;
    }),

  // Delete recurring filing
  delete: protectedProcedure
    .use(requirePermission('filings', 'delete'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.recurringFiling.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Recurring filing not found' });
      }

      await ctx.prisma.recurringFiling.delete({
        where: { id: input.id },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          clientId: existing.clientId,
          entityType: 'RecurringFiling',
          entityId: input.id,
          action: 'DELETE',
          changes: { before: existing },
        },
      });

      ctx.logger.info('Recurring filing deleted:', { recurringFilingId: input.id });

      return { success: true };
    }),

  // Toggle active status
  toggleActive: protectedProcedure
    .use(requirePermission('filings', 'edit'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.recurringFiling.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Recurring filing not found' });
      }

      const recurringFiling = await ctx.prisma.recurringFiling.update({
        where: { id: input.id },
        data: { active: !existing.active },
      });

      ctx.logger.info('Recurring filing toggled:', {
        recurringFilingId: input.id,
        active: recurringFiling.active,
      });

      return recurringFiling;
    }),
});
