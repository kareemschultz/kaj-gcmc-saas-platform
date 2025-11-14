/**
 * Users tRPC Router
 *
 * Handles user management operations: list, get, create, update, delete, change password
 * Migrated from /lib/actions/users.ts
 */

import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { requirePermission, requireAdmin } from '../middleware/rbac';
import { auditLogMiddleware } from '../middleware/logging';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
} from '@/lib/schemas/users';

/**
 * Users router
 */
export const usersRouter = router({
  /**
   * List users with filtering and pagination
   * Requires: users:view permission
   */
  list: protectedProcedure
    .use(requirePermission('users', 'view'))
    .input(
      z
        .object({
          search: z.string().optional(),
          roleId: z.number().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { search = '', roleId, page = 1, pageSize = 20 } = input || {};

      const where = {
        tenantUsers: {
          some: {
            tenantId: ctx.user.tenantId,
            ...(roleId && { roleId }),
          },
        },
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: { name: 'asc' },
          include: {
            tenantUsers: {
              where: { tenantId: ctx.user.tenantId },
              include: {
                role: true,
              },
            },
          },
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return {
        users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * Get single user by ID
   * Requires: users:view permission
   */
  get: protectedProcedure
    .use(requirePermission('users', 'view'))
    .input(z.number())
    .query(async ({ ctx, input: id }) => {
      const user = await ctx.prisma.user.findFirst({
        where: {
          id,
          tenantUsers: {
            some: {
              tenantId: ctx.user.tenantId,
            },
          },
        },
        include: {
          tenantUsers: {
            where: { tenantId: ctx.user.tenantId },
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  /**
   * Create new user
   * Requires: users:create permission
   */
  create: protectedProcedure
    .use(requirePermission('users', 'create'))
    .use(auditLogMiddleware('User', 'create'))
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if email already exists
      const existing = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user and tenant association in a transaction
      const user = await ctx.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: input.email,
            name: input.name,
            phone: input.phone,
            password: hashedPassword,
          },
        });

        // Associate with current tenant
        await tx.tenantUser.create({
          data: {
            tenantId: ctx.user.tenantId,
            userId: newUser.id,
            roleId: input.roleId,
          },
        });

        return newUser;
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'User',
          entityId: user.id,
          action: 'create',
          changes: {
            after: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
          },
        },
      });

      ctx.logger.info('User created', { userId: user.id, tenantId: ctx.user.tenantId });

      return user;
    }),

  /**
   * Update existing user
   * Requires: users:edit permission
   */
  update: protectedProcedure
    .use(requirePermission('users', 'edit'))
    .use(auditLogMiddleware('User', 'update'))
    .input(
      z.object({
        id: z.number(),
        data: updateUserSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Check if user exists and belongs to tenant
      const existing = await ctx.prisma.user.findFirst({
        where: {
          id,
          tenantUsers: {
            some: {
              tenantId: ctx.user.tenantId,
            },
          },
        },
        include: {
          tenantUsers: {
            where: { tenantId: ctx.user.tenantId },
          },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check for duplicate email (excluding current user)
      if (data.email && data.email !== existing.email) {
        const duplicate = await ctx.prisma.user.findUnique({
          where: { email: data.email },
        });

        if (duplicate) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User with this email already exists',
          });
        }
      }

      // Update user and role in a transaction
      const user = await ctx.prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id },
          data: {
            ...(data.email && { email: data.email }),
            ...(data.name && { name: data.name }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
          },
        });

        // Update role if provided
        if (data.roleId) {
          await tx.tenantUser.update({
            where: {
              tenantId_userId: {
                tenantId: ctx.user.tenantId,
                userId: id,
              },
            },
            data: {
              roleId: data.roleId,
            },
          });
        }

        return updated;
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'User',
          entityId: user.id,
          action: 'update',
          changes: { before: existing, after: user },
        },
      });

      ctx.logger.info('User updated', { userId: user.id, tenantId: ctx.user.tenantId });

      return user;
    }),

  /**
   * Delete user
   * Requires: users:delete permission
   */
  delete: protectedProcedure
    .use(requirePermission('users', 'delete'))
    .use(auditLogMiddleware('User', 'delete'))
    .input(z.number())
    .mutation(async ({ ctx, input: id }) => {
      // Can't delete yourself
      if (id === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete your own account',
        });
      }

      // Check if user exists and belongs to tenant
      const existing = await ctx.prisma.user.findFirst({
        where: {
          id,
          tenantUsers: {
            some: {
              tenantId: ctx.user.tenantId,
            },
          },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Remove tenant association (user may be associated with other tenants)
      await ctx.prisma.tenantUser.delete({
        where: {
          tenantId_userId: {
            tenantId: ctx.user.tenantId,
            userId: id,
          },
        },
      });

      // Check if user has other tenant associations
      const otherTenants = await ctx.prisma.tenantUser.count({
        where: { userId: id },
      });

      // If no other tenants, delete the user completely
      if (otherTenants === 0) {
        await ctx.prisma.user.delete({
          where: { id },
        });
      }

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'User',
          entityId: id,
          action: 'delete',
          changes: { before: existing },
        },
      });

      ctx.logger.info('User deleted', { userId: id, tenantId: ctx.user.tenantId });

      return { success: true };
    }),

  /**
   * Change password
   * Users can only change their own password
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        data: changePasswordSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, data } = input;

      // Users can only change their own password (unless they're an admin)
      if (userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only change your own password',
        });
      }

      // Get current user
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.password) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(data.currentPassword, user.password);

      if (!validPassword) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);

      // Update password
      await ctx.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      ctx.logger.info('Password changed', { userId, tenantId: ctx.user.tenantId });

      return { success: true };
    }),
});
