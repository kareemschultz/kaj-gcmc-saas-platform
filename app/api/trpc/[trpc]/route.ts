/**
 * Next.js tRPC API Route Handler
 *
 * This file handles all tRPC requests at /api/trpc/*
 * Uses the Next.js App Router fetch adapter
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/routers/_app';
import { createContext } from '@/server/trpc/context';

/**
 * Handle all tRPC requests (GET, POST, etc.)
 */
const handler = async (req: Request) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path || 'unknown'}:`, error);
    },
  });
};

export { handler as GET, handler as POST };
