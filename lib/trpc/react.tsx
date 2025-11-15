/**
 * tRPC React Provider
 *
 * Provides tRPC hooks to the React component tree.
 * Wraps React Query's QueryClient for data fetching and caching.
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import type { AppRouter } from '@/server/trpc/routers/_app';
import superjson from 'superjson';

/**
 * Create tRPC React hooks
 * Use these hooks in your components: trpc.users.list.useQuery()
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Get base URL for tRPC API
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser: use relative URL
    return '';
  }

  // Server-side rendering
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // Assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * TRPCProvider component
 * Wrap your app with this provider to enable tRPC hooks
 *
 * @example
 * ```tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <TRPCProvider>{children}</TRPCProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
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
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
