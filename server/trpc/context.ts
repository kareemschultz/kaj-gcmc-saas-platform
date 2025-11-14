/**
 * tRPC Context
 *
 * The context is created for each request and contains:
 * - Session data (from NextAuth)
 * - User information (parsed from session)
 * - Prisma client
 * - Logger instance
 */

import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { Session } from 'next-auth';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * User context extracted from session
 */
export interface UserContext {
  id: number;
  email: string;
  name: string | null;
  tenantId: number;
  tenantCode: string;
  tenantName: string;
  role: string;
}

/**
 * Full context available in all tRPC procedures
 */
export interface Context {
  session: Session | null;
  user: UserContext | null;
  prisma: typeof prisma;
  logger: typeof logger;
  req: Request;
}

/**
 * Creates context for an incoming request
 * This runs for every tRPC request
 */
export async function createContext(
  opts?: FetchCreateContextFnOptions
): Promise<Context> {
  const session = await auth();

  // Parse user data from session
  let user: UserContext | null = null;

  if (session?.user?.id && session?.user?.tenantId && session?.tenant) {
    try {
      user = {
        id: typeof session.user.id === 'string'
          ? parseInt(session.user.id, 10)
          : session.user.id,
        email: session.user.email || '',
        name: session.user.name || null,
        tenantId: session.user.tenantId,
        tenantCode: session.tenant.tenantCode,
        tenantName: session.tenant.tenantName,
        role: session.role || 'Viewer',
      };
    } catch (error) {
      logger.error('Failed to parse user context from session', { error, session });
    }
  }

  return {
    session,
    user,
    prisma,
    logger,
    req: opts?.req as Request,
  };
}

/**
 * Context type for protected procedures (after auth middleware)
 */
export interface ProtectedContext extends Context {
  session: Session;
  user: UserContext;
}
