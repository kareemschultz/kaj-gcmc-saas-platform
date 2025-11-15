/**
 * Client Businesses Router
 *
 * Handles client business entities
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { TRPCError } from '@trpc/server';

// Validation schema
const clientBusinessSchema = z.object({
  clientId: z.number(),
  name: z.string().min(1).max(255),
  registrationNumber: z.string().optional(),
  registrationType: z
    .enum(['Sole Proprietorship', 'Partnership', 'LLC', 'Corporation', 'Other'])
    .optional(),
  incorporationDate: z.string().optional().nullable(),
  country: z.string().optional(),
  sector: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Pending', 'Dissolved']).optional(),
});

export const clientBusinessesRouter = router({
  // List businesses for a client
  list: protectedProcedure
    .use(requirePermission('clients', 'view'))
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
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

      const businesses = await ctx.prisma.clientBusiness.findMany({
        where: {
          clientId: input.clientId,
          tenantId: ctx.user.tenantId,
        },
        orderBy: { createdAt: 'desc' },
      });

      return businesses;
    }),

  // Get single business
  get: protectedProcedure
    .use(requirePermission('clients', 'view'))
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const business = await ctx.prisma.clientBusiness.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          client: {
            select: { id: true, name: true, type: true },
          },
        },
      });

      if (!business) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found' });
      }

      return business;
    }),

  // Create business
  create: protectedProcedure
    .use(requirePermission('clients', 'edit'))
    .input(clientBusinessSchema)
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

      const business = await ctx.prisma.clientBusiness.create({
        data: {
          tenantId: ctx.user.tenantId,
          clientId: input.clientId,
          name: input.name,
          registrationNumber: input.registrationNumber || null,
          registrationType: input.registrationType || null,
          incorporationDate: input.incorporationDate
            ? new Date(input.incorporationDate)
            : null,
          country: input.country || null,
          sector: input.sector || null,
          status: input.status || null,
        },
      });

      ctx.logger.info('Client business created:', {
        businessId: business.id,
        clientId: input.clientId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          clientId: input.clientId,
          entityType: 'ClientBusiness',
          entityId: business.id,
          action: 'CREATE',
          changes: { after: input },
        },
      });

      return business;
    }),

  // Update business
  update: protectedProcedure
    .use(requirePermission('clients', 'edit'))
    .input(
      z.object({
        id: z.number(),
        data: clientBusinessSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify business belongs to tenant
      const existing = await ctx.prisma.clientBusiness.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found' });
      }

      const business = await ctx.prisma.clientBusiness.update({
        where: { id: input.id },
        data: {
          name: input.data.name,
          registrationNumber: input.data.registrationNumber || null,
          registrationType: input.data.registrationType || null,
          incorporationDate: input.data.incorporationDate
            ? new Date(input.data.incorporationDate)
            : null,
          country: input.data.country || null,
          sector: input.data.sector || null,
          status: input.data.status || null,
        },
      });

      ctx.logger.info('Client business updated:', {
        businessId: input.id,
        clientId: input.data.clientId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          clientId: input.data.clientId,
          entityType: 'ClientBusiness',
          entityId: input.id,
          action: 'UPDATE',
          changes: { before: existing, after: business },
        },
      });

      return business;
    }),

  // Delete business
  delete: protectedProcedure
    .use(requirePermission('clients', 'edit'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify business belongs to tenant
      const existing = await ctx.prisma.clientBusiness.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Business not found' });
      }

      await ctx.prisma.clientBusiness.delete({ where: { id: input.id } });

      ctx.logger.info('Client business deleted:', {
        businessId: input.id,
        clientId: existing.clientId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          clientId: existing.clientId,
          entityType: 'ClientBusiness',
          entityId: input.id,
          action: 'DELETE',
          changes: { before: existing },
        },
      });

      return { success: true };
    }),
});
