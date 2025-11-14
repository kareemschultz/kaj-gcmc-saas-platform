/**
 * Authentication Middleware
 *
 * Validates that a user is authenticated before allowing access to a procedure.
 * This is automatically applied by the `protectedProcedure` in trpc.ts
 */

import { TRPCError } from '@trpc/server';
import { middleware } from '../trpc';

/**
 * Require authentication middleware
 * Throws UNAUTHORIZED if no session exists
 */
export const requireAuth = middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  });
});
