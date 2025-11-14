/**
 * Server-side tRPC Caller
 *
 * Use this to call tRPC procedures from Server Components or Server Actions.
 * This provides type-safe API calls without going through HTTP.
 */

import { appRouter } from '@/server/trpc/routers/_app';
import { createContext } from '@/server/trpc/context';

/**
 * Create a server-side tRPC caller
 * This can be used in Server Components and Server Actions
 *
 * @example
 * ```ts
 * // In a Server Component
 * export default async function Page() {
 *   const trpc = await createServerCaller();
 *   const clients = await trpc.clients.list({ page: 1 });
 *   return <ClientsList clients={clients} />;
 * }
 * ```
 */
export async function createServerCaller() {
  const ctx = await createContext();
  return appRouter.createCaller(ctx);
}
