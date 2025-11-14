/**
 * tRPC Base Configuration
 *
 * This file sets up the tRPC instance and defines base procedures that can be used
 * throughout the application. It configures SuperJSON for data transformation.
 */

import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { Context } from './context';

/**
 * Initialize tRPC with SuperJSON transformer for handling Date objects,
 * Map, Set, BigInt, and other non-JSON types
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && error.cause.name === 'ZodError'
            ? error.cause
            : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure builders
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

/**
 * Protected procedure - requires authentication
 * Use this for any endpoint that requires a logged-in user
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Ensure user is defined (TypeScript narrowing)
      session: ctx.session,
      user: ctx.user,
    },
  });
});

/**
 * Create a standalone middleware
 * This is useful when you want to create reusable middleware outside of this file
 */
export const createMiddleware = t.middleware;
