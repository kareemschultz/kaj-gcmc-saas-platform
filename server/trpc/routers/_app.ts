/**
 * Root tRPC App Router
 *
 * This is the main router that combines all individual feature routers.
 * Export the router type for type-safe client usage.
 */

import { router } from '../trpc';
import { usersRouter } from './users';
import { clientsRouter } from './clients';
import { documentsRouter } from './documents';
import { filingsRouter } from './filings';
import { servicesRouter } from './services';
import { tasksRouter } from './tasks';
import { rolesRouter } from './roles';
import { tenantsRouter } from './tenants';
import { serviceRequestsRouter } from './service-requests';
import { complianceRulesRouter } from './compliance-rules';
import { conversationsRouter } from './conversations';
import { documentTypesRouter } from './document-types';
import { filingTypesRouter } from './filing-types';
import { requirementBundlesRouter } from './requirement-bundles';
import { wizardsRouter } from './wizards';
import { recurringFilingsRouter } from './recurring-filings';
import { clientBusinessesRouter } from './client-businesses';
import { dashboardRouter } from './dashboard';
import { documentUploadRouter } from './document-upload';
import { notificationsRouter } from './notifications';
import { analyticsRouter } from './analytics';
import { portalRouter } from './portal';

/**
 * Root application router
 * All 22 feature routers are now integrated
 */
export const appRouter = router({
  users: usersRouter,
  clients: clientsRouter,
  documents: documentsRouter,
  filings: filingsRouter,
  services: servicesRouter,
  tasks: tasksRouter,
  roles: rolesRouter,
  tenants: tenantsRouter,
  serviceRequests: serviceRequestsRouter,
  complianceRules: complianceRulesRouter,
  conversations: conversationsRouter,
  documentTypes: documentTypesRouter,
  filingTypes: filingTypesRouter,
  requirementBundles: requirementBundlesRouter,
  wizards: wizardsRouter,
  recurringFilings: recurringFilingsRouter,
  clientBusinesses: clientBusinessesRouter,
  dashboard: dashboardRouter,
  documentUpload: documentUploadRouter,
  notifications: notificationsRouter,
  analytics: analyticsRouter,
  portal: portalRouter,
});

/**
 * Export type definition of API for client-side type safety
 */
export type AppRouter = typeof appRouter;
