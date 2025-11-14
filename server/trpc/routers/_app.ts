/**
 * Root tRPC App Router
 *
 * This is the main router that combines all individual feature routers.
 * Export the router type for type-safe client usage.
 */

import { router } from '../trpc';
import { usersRouter } from './users';
import { clientsRouter } from './clients';
// ... more routers will be imported as they are created

/**
 * Root application router
 * Add new routers here as they are created
 */
export const appRouter = router({
  users: usersRouter,
  clients: clientsRouter,
  // documents: documentsRouter,
  // filings: filingsRouter,
  // services: servicesRouter,
  // tasks: tasksRouter,
  // roles: rolesRouter,
  // tenants: tenantsRouter,
  // serviceRequests: serviceRequestsRouter,
  // complianceRules: complianceRulesRouter,
  // conversations: conversationsRouter,
  // documentTypes: documentTypesRouter,
  // filingTypes: filingTypesRouter,
  // requirementBundles: requirementBundlesRouter,
  // wizards: wizardsRouter,
  // recurringFilings: recurringFilingsRouter,
  // clientBusinesses: clientBusinessesRouter,
  // dashboard: dashboardRouter,
  // documentUpload: documentUploadRouter,
  // notifications: notificationsRouter,
  // analytics: analyticsRouter,
  // portal: portalRouter,
});

/**
 * Export type definition of API for client-side type safety
 */
export type AppRouter = typeof appRouter;
