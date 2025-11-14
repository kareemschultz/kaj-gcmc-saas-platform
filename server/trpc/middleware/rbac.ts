/**
 * RBAC (Role-Based Access Control) Middleware
 *
 * Provides middleware factories for enforcing permissions and roles in tRPC procedures.
 * Integrates with the existing RBAC system in /lib/rbac.ts
 */

import { TRPCError } from '@trpc/server';
import { UserRole } from '@/types';
import {
  hasPermission,
  assertPermission,
  getUserContext,
  isAdmin,
  isSuperAdmin,
  UserPermissionContext,
} from '@/lib/rbac';
import { middleware } from '../trpc';
import { ProtectedContext } from '../context';

/**
 * Require specific permission middleware factory
 *
 * @param module - The module to check (e.g., 'clients', 'documents')
 * @param action - The action to check (e.g., 'view', 'create', 'edit', 'delete')
 *
 * @example
 * ```ts
 * const listClients = protectedProcedure
 *   .use(requirePermission('clients', 'view'))
 *   .query(async ({ ctx }) => {
 *     // User has permission to view clients
 *   });
 * ```
 */
export function requirePermission(module: string, action: string) {
  return middleware<{ ctx: ProtectedContext }>(({ ctx, next }) => {
    try {
      // Get user context for RBAC checks
      const userCtx = getUserContext(ctx.session);

      // Assert permission (throws ForbiddenError if no permission)
      assertPermission(userCtx, module, action);

      // Add userContext to ctx for downstream use
      return next({
        ctx: {
          ...ctx,
          userContext: userCtx,
        },
      });
    } catch (error: any) {
      // Convert ForbiddenError to tRPC FORBIDDEN error
      if (error.statusCode === 403) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: error.message || `Permission denied: cannot ${action} ${module}`,
        });
      }
      // Convert UnauthorizedError to tRPC UNAUTHORIZED error
      if (error.statusCode === 401) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message,
        });
      }
      throw error;
    }
  });
}

/**
 * Require one of the specified roles
 *
 * @param roles - Array of allowed roles
 *
 * @example
 * ```ts
 * const adminOnlyAction = protectedProcedure
 *   .use(requireRole('SuperAdmin', 'FirmAdmin'))
 *   .mutation(async ({ ctx }) => {
 *     // Only SuperAdmin or FirmAdmin can execute
 *   });
 * ```
 */
export function requireRole(...roles: UserRole[]) {
  return middleware<{ ctx: ProtectedContext }>(({ ctx, next }) => {
    const userRole = ctx.user.role as UserRole;

    if (!roles.includes(userRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${userRole}`,
      });
    }

    return next();
  });
}

/**
 * Require admin role (SuperAdmin or FirmAdmin)
 *
 * @example
 * ```ts
 * const adminAction = protectedProcedure
 *   .use(requireAdmin())
 *   .mutation(async ({ ctx }) => {
 *     // Only admins can execute
 *   });
 * ```
 */
export function requireAdmin() {
  return middleware<{ ctx: ProtectedContext }>(({ ctx, next }) => {
    const userCtx = getUserContext(ctx.session);

    if (!isAdmin(userCtx)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'This operation requires administrator privileges',
      });
    }

    return next({
      ctx: {
        ...ctx,
        userContext: userCtx,
      },
    });
  });
}

/**
 * Require SuperAdmin role
 *
 * @example
 * ```ts
 * const superAdminAction = protectedProcedure
 *   .use(requireSuperAdmin())
 *   .mutation(async ({ ctx }) => {
 *     // Only SuperAdmin can execute
 *   });
 * ```
 */
export function requireSuperAdmin() {
  return middleware<{ ctx: ProtectedContext }>(({ ctx, next }) => {
    const userCtx = getUserContext(ctx.session);

    if (!isSuperAdmin(userCtx)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'This operation requires SuperAdmin privileges',
      });
    }

    return next({
      ctx: {
        ...ctx,
        userContext: userCtx,
      },
    });
  });
}

/**
 * Ensure tenant isolation - resource must belong to user's tenant
 *
 * @param getTenantId - Function to extract tenantId from input or resource
 *
 * @example
 * ```ts
 * const getClient = protectedProcedure
 *   .use(requirePermission('clients', 'view'))
 *   .use(requireTenantIsolation((input) => input.tenantId))
 *   .query(async ({ ctx, input }) => {
 *     // User can only access clients in their tenant
 *   });
 * ```
 */
export function requireTenantIsolation<TInput>(
  getTenantId: (input: TInput) => number | Promise<number>
) {
  return middleware<{ ctx: ProtectedContext; input: TInput }>(
    async ({ ctx, input, next }) => {
      const resourceTenantId = await getTenantId(input);
      const userTenantId = ctx.user.tenantId;

      if (resourceTenantId !== userTenantId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied: resource belongs to a different tenant',
        });
      }

      return next();
    }
  );
}

/**
 * Check permission (non-blocking)
 * Returns a boolean indicating if user has permission
 *
 * @param ctx - Protected context
 * @param module - Module name
 * @param action - Action name
 */
export function checkPermission(
  ctx: ProtectedContext,
  module: string,
  action: string
): boolean {
  try {
    const userCtx = getUserContext(ctx.session);
    return hasPermission(userCtx, module, action);
  } catch {
    return false;
  }
}

/**
 * Get user permission context from tRPC context
 * Utility function to extract UserPermissionContext
 */
export function getUserPermissionContext(
  ctx: ProtectedContext
): UserPermissionContext {
  return getUserContext(ctx.session);
}
