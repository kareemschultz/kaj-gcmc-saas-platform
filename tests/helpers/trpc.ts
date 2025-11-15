/**
 * tRPC Testing Utilities
 *
 * Helper functions for testing tRPC procedures
 */

import { Session } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { Context } from '@/server/trpc/context';

/**
 * Create a mock context for testing
 *
 * @param options - Partial context to override
 * @returns Mock context for tRPC procedures
 *
 * @example
 * ```ts
 * const ctx = createContextMock({
 *   user: {
 *     id: 1,
 *     email: 'test@example.com',
 *     name: 'Test User',
 *     tenantId: 1,
 *     tenantCode: 'TEST',
 *     tenantName: 'Test Tenant',
 *     role: 'FirmAdmin',
 *   },
 * });
 * ```
 */
export function createContextMock(options?: {
  user?: {
    id: number;
    email?: string;
    name?: string;
    tenantId: number;
    tenantCode?: string;
    tenantName?: string;
    role: string;
  };
  session?: Session | null;
  prisma?: PrismaClient;
}): Context {
  const user = options?.user
    ? {
        id: options.user.id,
        email: options.user.email || 'test@example.com',
        name: options.user.name || 'Test User',
        tenantId: options.user.tenantId,
        tenantCode: options.user.tenantCode || 'TEST',
        tenantName: options.user.tenantName || 'Test Tenant',
        role: options.user.role,
      }
    : null;

  const session = (options?.session !== undefined
    ? options.session
    : user
    ? {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
        },
        tenant: {
          tenantId: user.tenantId,
          tenantCode: user.tenantCode,
          tenantName: user.tenantName,
        },
        role: user.role,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    : null) as Session | null;

  return {
    session,
    user,
    prisma: options?.prisma || (global as any).__PRISMA_CLIENT__,
    logger,
    req: new Request('http://localhost:3000/api/trpc'),
  };
}

/**
 * Create a caller with mock context
 *
 * @param router - The tRPC router to test
 * @param contextOptions - Options for createContextMock
 * @returns Caller with mock context
 *
 * @example
 * ```ts
 * const caller = createCaller(appRouter, {
 *   user: {
 *     id: 1,
 *     tenantId: 1,
 *     role: 'FirmAdmin',
 *   },
 * });
 *
 * const result = await caller.users.list({ page: 1 });
 * ```
 */
export function createCaller<TRouter extends Record<string, any>>(
  router: TRouter,
  contextOptions?: Parameters<typeof createContextMock>[0]
) {
  const ctx = createContextMock(contextOptions);
  return (router as any).createCaller(ctx);
}

/**
 * Assert that a procedure throws a tRPC error with specific code
 *
 * @param fn - Function that should throw
 * @param code - Expected tRPC error code
 *
 * @example
 * ```ts
 * await expectTRPCError(
 *   () => caller.users.create({ ... }),
 *   'FORBIDDEN'
 * );
 * ```
 */
export async function expectTRPCError(
  fn: () => Promise<any>,
  code: string
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error: any) {
    if (error.code !== code) {
      throw new Error(
        `Expected tRPC error code '${code}', got '${error.code}'`
      );
    }
  }
}
