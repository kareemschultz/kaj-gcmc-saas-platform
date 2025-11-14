/**
 * Roles tRPC Router
 *
 * Handles role management for RBAC
 * Migrated from /lib/actions/roles.ts
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { requireAdmin } from '../middleware/rbac';

/**
 * Roles router - Admin only
 */
export const rolesRouter = router({
  /**
   * List all roles
   * Requires: Admin privileges
   */
  list: protectedProcedure
    .use(requireAdmin())
    .query(async ({ ctx }) => {
      const roles = await ctx.prisma.role.findMany({
        orderBy: { name: 'asc' },
        include: {
          permissions: true,
          _count: {
            select: { tenantUsers: true },
          },
        },
      });

      return roles;
    }),

  /**
   * Get single role by ID
   * Requires: Admin privileges
   */
  get: protectedProcedure
    .use(requireAdmin())
    .input(z.number())
    .query(async ({ ctx, input: id }) => {
      const role = await ctx.prisma.role.findUnique({
        where: { id },
        include: {
          permissions: true,
          _count: {
            select: { tenantUsers: true },
          },
        },
      });

      if (!role) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Role not found',
        });
      }

      return role;
    }),
});
