/**
 * Logging Middleware
 *
 * Logs all tRPC procedure calls with timing information, user context, and errors.
 * Integrates with the application logger.
 */

import { middleware } from '../trpc';

/**
 * Log all tRPC calls with timing and context
 */
export const loggingMiddleware = middleware(async ({ ctx, next, path, type }) => {
  const start = Date.now();

  // Log request start
  ctx.logger.info(`[tRPC ${type}] ${path} - Start`, {
    userId: ctx.user?.id,
    tenantId: ctx.user?.tenantId,
    role: ctx.user?.role,
  });

  try {
    const result = await next();
    const duration = Date.now() - start;

    // Log successful completion
    ctx.logger.info(`[tRPC ${type}] ${path} - Success (${duration}ms)`, {
      userId: ctx.user?.id,
      tenantId: ctx.user?.tenantId,
      duration,
    });

    return result;
  } catch (error: any) {
    const duration = Date.now() - start;

    // Log error
    ctx.logger.error(
      `[tRPC ${type}] ${path} - Error (${duration}ms) - User: ${ctx.user?.id}, Tenant: ${ctx.user?.tenantId}`,
      error as Error
    );

    throw error;
  }
});

/**
 * Audit log middleware - logs specific actions to audit trail
 * Use this for sensitive operations that need to be tracked
 */
export function auditLogMiddleware(
  entityType: string,
  action: 'create' | 'update' | 'delete'
) {
  return middleware(async ({ ctx, next, input }) => {
    const result = await next();

    // Only log if user is authenticated and operation succeeded
    if (ctx.user) {
      try {
        await ctx.prisma.auditLog.create({
          data: {
            tenantId: ctx.user.tenantId,
            actorUserId: ctx.user.id,
            entityType,
            entityId: (input as any)?.id || (result as any)?.id || 0,
            action,
            changes: input || {},
          },
        });
      } catch (error) {
        // Don't fail the request if audit logging fails
        ctx.logger.error(
          `Failed to create audit log for ${entityType} ${action} by user ${ctx.user.id}`,
          error as Error
        );
      }
    }

    return result;
  });
}
