/**
 * tRPC Client Configuration
 *
 * Creates a tRPC client with React Query integration for use in Client Components.
 */

import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/server/trpc/routers/_app';
import superjson from 'superjson';

/**
 * Get base URL for tRPC API
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser: use relative URL
    return '';
  }

  // Server-side rendering
  if (process.env.VERCEL_URL) {
    // Reference for Vercel deployment
    return `https://${process.env.VERCEL_URL}`;
  }

  // Assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Vanilla tRPC client (no React Query)
 * Use this for non-React contexts or server-side calls
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      // Add credentials for cookie-based auth
      fetch(url, options) {
        return fetch(url, {
          ...(options as RequestInit),
          credentials: 'include',
        });
      },
    }),
  ],
});
