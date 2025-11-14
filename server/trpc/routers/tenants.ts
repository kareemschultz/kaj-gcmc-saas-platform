/**
 * Tenants tRPC Router
 *
 * Handles tenant management - SuperAdmin only
 * Migrated from /lib/actions/tenants.ts
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { requireSuperAdmin } from '../middleware/rbac';

/**
 * Tenant validation schema
 */
export const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(50),
  status: z.enum(['active', 'suspended', 'trial']).default('active'),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  settings: z.object({
    branding: z.object({
      logoUrl: z.string().url().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
    }).optional(),
    defaults: z.object({
      currency: z.string().optional(),
      timezone: z.string().optional(),
      dateFormat: z.string().optional(),
    }).optional(),
  }).optional(),
});

/**
 * Tenants router - SuperAdmin only
 */
export const tenantsRouter = router({
  /**
   * List all tenants (SuperAdmin only)
   * Requires: SuperAdmin privileges
   */
  list: protectedProcedure
    .use(requireSuperAdmin())
    .input(
      z
        .object({
          search: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { search = '', page = 1, pageSize = 20 } = input || {};

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [tenants, total] = await Promise.all([
        ctx.prisma.tenant.findMany({
          where,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: {
                tenantUsers: true,
                clients: true,
                documents: true,
                filings: true,
              },
            },
          },
        }),
        ctx.prisma.tenant.count({ where }),
      ]);

      return {
        tenants,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * Get single tenant by ID
   * Requires: SuperAdmin privileges
   */
  get: protectedProcedure
    .use(requireSuperAdmin())
    .input(z.number())
    .query(async ({ ctx, input: id }) => {
      const tenant = await ctx.prisma.tenant.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              tenantUsers: true,
              clients: true,
              documents: true,
              filings: true,
            },
          },
        },
      });

      if (!tenant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        });
      }

      return tenant;
    }),

  /**
   * Create new tenant
   * Requires: SuperAdmin privileges
   */
  create: protectedProcedure
    .use(requireSuperAdmin())
    .input(tenantSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if code already exists
      const existing = await ctx.prisma.tenant.findUnique({
        where: { code: input.code },
      });

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tenant code already exists',
        });
      }

      const tenant = await ctx.prisma.tenant.create({
        data: input,
      });

      ctx.logger.info('Tenant created', {
        tenantId: tenant.id,
        actorUserId: ctx.user.id,
      });

      return { success: true, tenant };
    }),

  /**
   * Update existing tenant
   * Requires: SuperAdmin privileges
   */
  update: protectedProcedure
    .use(requireSuperAdmin())
    .input(
      z.object({
        id: z.number(),
        data: tenantSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      const existing = await ctx.prisma.tenant.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tenant not found',
        });
      }

      const tenant = await ctx.prisma.tenant.update({
        where: { id },
        data,
      });

      ctx.logger.info('Tenant updated', {
        tenantId: id,
        actorUserId: ctx.user.id,
      });

      return { success: true, tenant };
    }),
});
