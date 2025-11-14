# 🔥 COMPREHENSIVE tRPC + RBAC MIGRATION PLAN

## Executive Summary

This document outlines the complete migration from Next.js Server Actions to tRPC with enhanced RBAC enforcement, covering folder restructuring, API migration, Prisma optimization, middleware improvements, testing strategy, and implementation order.

---

## PART 6: FULL MIGRATION PLAN

### 1. Folder Restructuring Plan

#### Current Structure
```
/lib/actions/          # 22 server action files (~7,760 LOC)
/lib/rbac.ts           # RBAC utilities
/lib/hooks/            # React hooks
/components/           # 76 client components
/app/                  # Next.js app directory
```

#### Target Structure
```
/server/
  /trpc/
    /index.ts          # App router export
    /context.ts        # Session + tenant context
    /trpc.ts           # tRPC instance + base procedures
    /middleware/
      /auth.ts         # Authentication middleware
      /rbac.ts         # Permission enforcement middleware
      /logging.ts      # Request logging middleware
      /tenant.ts       # Tenant isolation middleware
    /routers/
      /users.ts        # User management procedures
      /clients.ts      # Client management procedures
      /documents.ts    # Document management procedures
      /filings.ts      # Filing management procedures
      /services.ts     # Service management procedures
      /tasks.ts        # Task management procedures
      /roles.ts        # Role/permission management procedures
      /tenants.ts      # Tenant management procedures
      /service-requests.ts
      /compliance-rules.ts
      /conversations.ts
      /document-types.ts
      /filing-types.ts
      /requirement-bundles.ts
      /wizards.ts
      /recurring-filings.ts
      /client-businesses.ts
      /dashboard.ts
      /document-upload.ts
      /notifications.ts
      /analytics.ts
      /portal.ts
      /_app.ts         # Root router combining all routers

/lib/
  /trpc/
    /client.ts         # tRPC client (React Query)
    /react.tsx         # tRPC React hooks provider
    /server.ts         # Server-side tRPC caller
  /rbac/
    /permissions.ts    # Permission definitions
    /middleware.ts     # Reusable RBAC middleware
    /utils.ts          # Permission helper functions
  /actions/            # DEPRECATED - to be removed after migration
  /hooks/              # Keep existing hooks, update to use tRPC
```

---

### 2. API Migration Steps

#### Phase 1: Infrastructure Setup (Week 1)

**Step 1.1: Install Dependencies**
```bash
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query superjson
```

**Step 1.2: Create tRPC Instance**
- File: `/server/trpc/trpc.ts`
- Define base tRPC instance
- Configure SuperJSON transformer
- Create base procedures: `publicProcedure`, `protectedProcedure`

**Step 1.3: Create Context**
- File: `/server/trpc/context.ts`
- Extract session from NextAuth
- Extract tenant context
- Provide Prisma client
- Add logger instance

**Step 1.4: Create Authentication Middleware**
- File: `/server/trpc/middleware/auth.ts`
- Validate session exists
- Throw UnauthorizedError if not authenticated
- Attach user context to ctx

**Step 1.5: Create RBAC Middleware**
- File: `/server/trpc/middleware/rbac.ts`
- Create `requirePermission(module, action)` middleware factory
- Create `requireRole(...roles)` middleware factory
- Create `requireTenant()` middleware for tenant isolation
- Integrate with existing `/lib/rbac.ts` utilities

**Step 1.6: Create Logging Middleware**
- File: `/server/trpc/middleware/logging.ts`
- Log all procedure calls with timing
- Log errors with context
- Integrate with `/lib/logger.ts`

**Step 1.7: Set Up App Router**
- File: `/server/trpc/index.ts`
- Export root `appRouter` combining all routers
- Export router type for client

**Step 1.8: Create Next.js API Route**
- File: `/app/api/trpc/[trpc]/route.ts`
- Use `@trpc/next` adapter
- Handle GET/POST requests
- Configure CORS if needed

**Step 1.9: Create Client**
- File: `/lib/trpc/client.ts`
- Configure tRPC client with fetch
- Add SuperJSON transformer
- Configure error handling

**Step 1.10: Create React Provider**
- File: `/lib/trpc/react.tsx`
- Wrap React Query provider
- Create `TRPCProvider` component
- Export typed hooks: `trpc`, `useMutation`, `useQuery`

---

#### Phase 2: Critical Bug Fixes (Week 1)

**Bug #1: getUserContext() Signature**
- **Files Affected**: `/lib/actions/clients.ts` (lines 43, 109, 143, 182, 231)
- **Issue**: Called as `await getUserContext()` without session parameter
- **Fix**: Change to `getUserContext(session)`
- **Impact**: HIGH - Will cause runtime errors

**Bug #2: Inconsistent Permission Checks**
- **Files Affected**: Multiple action files
- **Issue**: Not all actions enforce RBAC
- **Fix**: Add permission checks to all procedures
- **Impact**: CRITICAL - Security vulnerability

---

#### Phase 3: Core Router Migration (Week 2-3)

**Priority 1: Authentication & Authorization**
1. **users.router.ts** - User management
   - Procedures: `list`, `get`, `create`, `update`, `delete`, `changePassword`
   - Permissions: `users:view`, `users:create`, `users:edit`, `users:delete`
   - Migrate from: `/lib/actions/users.ts`

2. **roles.router.ts** - Role management
   - Procedures: `list`, `get`, `create`, `update`, `delete`, `getPermissions`
   - Permissions: `users:manage` (admin only)
   - Migrate from: `/lib/actions/roles.ts`

3. **tenants.router.ts** - Tenant management
   - Procedures: `list`, `get`, `create`, `update`
   - Permissions: `settings:manage` (SuperAdmin only)
   - Migrate from: `/lib/actions/tenants.ts`

**Priority 2: Core Domain**
4. **clients.router.ts** - Client management (FIX BUG!)
   - Procedures: `list`, `get`, `create`, `update`, `delete`
   - Permissions: `clients:view`, `clients:create`, `clients:edit`, `clients:delete`
   - Migrate from: `/lib/actions/clients.ts`
   - **CRITICAL**: Fix `getUserContext()` bug during migration

5. **documents.router.ts** - Document management
   - Procedures: `list`, `get`, `create`, `update`, `delete`, `listVersions`
   - Permissions: `documents:view`, `documents:create`, `documents:edit`, `documents:delete`
   - Migrate from: `/lib/actions/documents.ts`

6. **filings.router.ts** - Filing management
   - Procedures: `list`, `get`, `create`, `update`, `submit`, `approve`, `reject`, `delete`
   - Permissions: `filings:view`, `filings:create`, `filings:edit`, `filings:delete`, `filings:submit`
   - Migrate from: `/lib/actions/filings.ts`

7. **services.router.ts** - Service management
   - Procedures: `list`, `get`, `create`, `update`, `delete`
   - Permissions: `services:view`, `services:create`, `services:edit`, `services:delete`
   - Migrate from: `/lib/actions/services.ts`

8. **tasks.router.ts** - Task management
   - Procedures: `list`, `get`, `create`, `update`, `complete`, `delete`
   - Permissions: `tasks:view`, `tasks:create`, `tasks:edit`, `tasks:delete`
   - Migrate from: `/lib/actions/tasks.ts`

---

#### Phase 4: Supporting Routers (Week 3-4)

9. **service-requests.router.ts**
   - Migrate from: `/lib/actions/service-requests.ts`

10. **compliance-rules.router.ts**
    - Migrate from: `/lib/actions/compliance-rules.ts`

11. **conversations.router.ts**
    - Migrate from: `/lib/actions/conversations.ts`

12. **document-types.router.ts**
    - Migrate from: `/lib/actions/document-types.ts`

13. **filing-types.router.ts**
    - Migrate from: `/lib/actions/filing-types.ts`

14. **requirement-bundles.router.ts**
    - Migrate from: `/lib/actions/requirement-bundles.ts`

15. **wizards.router.ts**
    - Migrate from: `/lib/actions/wizards.ts`

16. **recurring-filings.router.ts**
    - Migrate from: `/lib/actions/recurring-filings.ts`

17. **client-businesses.router.ts**
    - Migrate from: `/lib/actions/client-businesses.ts`

---

#### Phase 5: Specialized Routers (Week 4)

18. **dashboard.router.ts**
    - Procedures: `getUpcomingDeadlines`, `getRecentActivity`, `getComplianceSummary`
    - Migrate from: `/lib/actions/dashboard.ts`

19. **document-upload.router.ts**
    - Procedures: `getUploadUrl`, `confirmUpload`, `deleteVersion`, `getDownloadUrl`
    - Migrate from: `/lib/actions/document-upload.ts`

20. **notifications.router.ts**
    - Procedures: `list`, `create`, `markAsRead`, `markAllAsRead`
    - Migrate from: `/lib/actions/notifications.ts`

21. **analytics.router.ts**
    - Procedures: `getAnalytics`, `getMetrics`, `getCharts`
    - Migrate from: `/lib/actions/analytics.ts`

22. **portal.router.ts**
    - Procedures: Portal-specific operations for ClientPortalUser
    - Migrate from: `/lib/actions/portal.ts`

---

### 3. Prisma Schema Cleanup

**No major changes needed** - Schema is well-designed. Optional improvements:

#### Optional: Add Database-Level RLS (Row-Level Security)
```prisma
// Currently all models have tenantId
// Could add Prisma middleware for automatic tenant filtering
```

#### Optional: Add Indexes
```prisma
model Client {
  // ... existing fields
  @@index([tenantId, name])
  @@index([tenantId, createdAt])
}

model Document {
  @@index([tenantId, clientId])
  @@index([tenantId, status])
}
```

#### Optional: Sync Role Definitions
- Add migration to seed `roles` and `permissions` tables from `config/roles.ts`
- Create admin UI to manage roles dynamically
- Update RBAC to read from database instead of static config

---

### 4. tRPC Router Structure

#### Root Router (`/server/trpc/index.ts`)
```typescript
import { router } from './trpc';
import { usersRouter } from './routers/users';
import { clientsRouter } from './routers/clients';
// ... import all routers

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

export type AppRouter = typeof appRouter;
```

#### Example Router (`/server/trpc/routers/clients.ts`)
```typescript
import { z } from 'zod';
import { router } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { clientSchema } from '@/lib/schemas/clients';

export const clientsRouter = router({
  list: protectedProcedure
    .use(requirePermission('clients', 'view'))
    .input(z.object({
      search: z.string().optional(),
      type: z.string().optional(),
      page: z.number().default(1),
      pageSize: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      // Business logic here
    }),

  get: protectedProcedure
    .use(requirePermission('clients', 'view'))
    .input(z.number())
    .query(async ({ ctx, input: id }) => {
      // Business logic here
    }),

  create: protectedProcedure
    .use(requirePermission('clients', 'create'))
    .input(clientSchema)
    .mutation(async ({ ctx, input }) => {
      // Business logic here
    }),

  update: protectedProcedure
    .use(requirePermission('clients', 'edit'))
    .input(z.object({
      id: z.number(),
      data: clientSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      // Business logic here
    }),

  delete: protectedProcedure
    .use(requirePermission('clients', 'delete'))
    .input(z.number())
    .mutation(async ({ ctx, input: id }) => {
      // Business logic here
    }),
});
```

---

### 5. Middleware + Session Context Improvements

#### Context Type (`/server/trpc/context.ts`)
```typescript
import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface Context {
  session: Session | null;
  prisma: typeof prisma;
  logger: typeof logger;
  user?: {
    id: number;
    email: string;
    tenantId: number;
    tenantCode: string;
    role: string;
  };
}

export async function createContext(): Promise<Context> {
  const session = await auth();

  return {
    session,
    prisma,
    logger,
    user: session?.user ? {
      id: session.user.id,
      email: session.user.email,
      tenantId: session.user.tenantId,
      tenantCode: session.tenant?.tenantCode,
      role: session.role,
    } : undefined,
  };
}
```

#### RBAC Middleware Factory
```typescript
// /server/trpc/middleware/rbac.ts
import { middleware } from '../trpc';
import { assertPermission, getUserContext } from '@/lib/rbac';

export function requirePermission(module: string, action: string) {
  return middleware(({ ctx, next }) => {
    if (!ctx.session) {
      throw new UnauthorizedError('Not authenticated');
    }

    const userCtx = getUserContext(ctx.session);
    assertPermission(userCtx, module, action);

    return next({
      ctx: {
        ...ctx,
        userContext: userCtx,
      },
    });
  });
}

export function requireRole(...roles: UserRole[]) {
  return middleware(({ ctx, next }) => {
    if (!ctx.session?.role) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (!roles.includes(ctx.session.role as UserRole)) {
      throw new ForbiddenError(`Requires one of: ${roles.join(', ')}`);
    }

    return next();
  });
}

export function requireTenant() {
  return middleware(({ ctx, next }) => {
    if (!ctx.user?.tenantId) {
      throw new UnauthorizedError('Tenant context required');
    }

    return next();
  });
}
```

#### Logging Middleware
```typescript
// /server/trpc/middleware/logging.ts
import { middleware } from '../trpc';

export const loggingMiddleware = middleware(async ({ ctx, next, path, type }) => {
  const start = Date.now();

  ctx.logger.info(`[tRPC] ${type} ${path} - Start`, {
    userId: ctx.user?.id,
    tenantId: ctx.user?.tenantId,
  });

  const result = await next();

  const duration = Date.now() - start;

  if (result.ok) {
    ctx.logger.info(`[tRPC] ${type} ${path} - Success (${duration}ms)`);
  } else {
    ctx.logger.error(`[tRPC] ${type} ${path} - Error (${duration}ms)`, {
      error: result.error,
    });
  }

  return result;
});
```

---

### 6. Testing Plan (Vitest + tRPC Test Utilities)

#### Test Structure
```
/tests/
  /server/
    /trpc/
      /routers/
        clients.test.ts
        documents.test.ts
        filings.test.ts
        ...
      /middleware/
        auth.test.ts
        rbac.test.ts
  /integration/
    client-workflows.test.ts
    filing-workflows.test.ts
```

#### Unit Test Example
```typescript
// tests/server/trpc/routers/clients.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '@/server/trpc';
import { createContextMock } from '../helpers';

describe('clients router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createContextMock({
      user: {
        id: 1,
        role: 'FirmAdmin',
        tenantId: 1,
      },
    });
    caller = appRouter.createCaller(ctx);
  });

  it('should list clients with permission', async () => {
    const result = await caller.clients.list({ page: 1, pageSize: 10 });
    expect(result.clients).toBeDefined();
    expect(result.pagination).toBeDefined();
  });

  it('should throw if no permission', async () => {
    const ctx = createContextMock({
      user: {
        id: 1,
        role: 'Viewer',
        tenantId: 1,
      },
    });
    const viewerCaller = appRouter.createCaller(ctx);

    await expect(
      viewerCaller.clients.create({ name: 'Test' })
    ).rejects.toThrow('Permission denied');
  });
});
```

#### Integration Test Example
```typescript
// tests/integration/client-workflows.test.ts
import { describe, it } from 'vitest';
import { trpc } from '@/lib/trpc/client';

describe('Client Workflow', () => {
  it('should create, update, and delete client', async () => {
    // Create
    const created = await trpc.clients.create.mutate({
      name: 'Test Client',
      type: 'company',
    });

    // Update
    const updated = await trpc.clients.update.mutate({
      id: created.client.id,
      data: { name: 'Updated Client' },
    });

    // Delete
    await trpc.clients.delete.mutate(created.client.id);
  });
});
```

---

### 7. Steps to Remove Legacy Server Actions

#### Step 7.1: Verify All Routers Implemented
- [ ] Check all 22 server action files have corresponding tRPC routers
- [ ] Verify all procedures are tested
- [ ] Verify all frontend components updated

#### Step 7.2: Update Component Imports
- [ ] Find all imports from `/lib/actions/*`
- [ ] Replace with tRPC hooks
- [ ] Remove server action imports

#### Step 7.3: Mark Server Actions as Deprecated
```typescript
// lib/actions/clients.ts
/** @deprecated Use tRPC clients router instead */
export async function getClients() {
  throw new Error('Deprecated: Use trpc.clients.list instead');
}
```

#### Step 7.4: Delete Server Action Files
```bash
# After verifying all migrations
rm -rf /lib/actions/
```

#### Step 7.5: Clean Up Exports
- Remove exports from `/lib/index.ts`
- Update any re-exports

---

### 8. Full End-to-End Implementation Order

#### Week 1: Foundation
- [x] **Day 1-2**: Explore codebase, document current state
- [ ] **Day 2-3**: Install tRPC dependencies
- [ ] **Day 3-4**: Set up tRPC infrastructure (context, middleware, base procedures)
- [ ] **Day 4-5**: Create RBAC middleware
- [ ] **Day 5**: Create logging middleware
- [ ] **Day 5**: Set up tRPC client and React provider

#### Week 2: Core Routers + Critical Fixes
- [ ] **Day 1**: Fix `getUserContext()` bug in existing server actions
- [ ] **Day 1-2**: Migrate `users.router.ts`
- [ ] **Day 2-3**: Migrate `clients.router.ts` (with bug fix)
- [ ] **Day 3-4**: Migrate `roles.router.ts`
- [ ] **Day 4-5**: Migrate `tenants.router.ts`

#### Week 3: Domain Routers
- [ ] **Day 1-2**: Migrate `documents.router.ts`
- [ ] **Day 2-3**: Migrate `filings.router.ts`
- [ ] **Day 3-4**: Migrate `services.router.ts`
- [ ] **Day 4-5**: Migrate `tasks.router.ts`

#### Week 4: Supporting Routers (Part 1)
- [ ] **Day 1**: Migrate `service-requests.router.ts`
- [ ] **Day 1**: Migrate `compliance-rules.router.ts`
- [ ] **Day 2**: Migrate `conversations.router.ts`
- [ ] **Day 2**: Migrate `document-types.router.ts`
- [ ] **Day 3**: Migrate `filing-types.router.ts`
- [ ] **Day 3**: Migrate `requirement-bundles.router.ts`
- [ ] **Day 4**: Migrate `wizards.router.ts`
- [ ] **Day 4**: Migrate `recurring-filings.router.ts`
- [ ] **Day 5**: Migrate `client-businesses.router.ts`

#### Week 5: Specialized Routers
- [ ] **Day 1**: Migrate `dashboard.router.ts`
- [ ] **Day 1**: Migrate `document-upload.router.ts`
- [ ] **Day 2**: Migrate `notifications.router.ts`
- [ ] **Day 2**: Migrate `analytics.router.ts`
- [ ] **Day 3**: Migrate `portal.router.ts`
- [ ] **Day 3-5**: Buffer for complex migrations

#### Week 6-7: Frontend Integration
- [ ] **Day 1-2**: Update core components (clients, documents, filings)
- [ ] **Day 3-4**: Update supporting components (services, tasks, etc.)
- [ ] **Day 5**: Update specialized components (dashboard, analytics, portal)
- [ ] **Week 7**: Update remaining 76 client components
- [ ] Add loading states, error handling, optimistic updates

#### Week 8: Testing & Cleanup
- [ ] **Day 1-2**: Write unit tests for all routers
- [ ] **Day 2-3**: Write integration tests
- [ ] **Day 3-4**: E2E testing
- [ ] **Day 4**: Fix TypeScript errors
- [ ] **Day 5**: Verify build succeeds
- [ ] **Day 5**: Remove legacy server actions
- [ ] **Day 5**: Final verification and documentation

---

## Implementation Checklist

### Infrastructure
- [ ] Install tRPC packages
- [ ] Create tRPC instance and context
- [ ] Create authentication middleware
- [ ] Create RBAC middleware
- [ ] Create logging middleware
- [ ] Set up Next.js API route
- [ ] Create tRPC client
- [ ] Create React provider
- [ ] Update root layout with TRPCProvider

### Router Migration (22 total)
- [ ] users.router.ts
- [ ] clients.router.ts (fix getUserContext bug)
- [ ] roles.router.ts
- [ ] tenants.router.ts
- [ ] documents.router.ts
- [ ] filings.router.ts
- [ ] services.router.ts
- [ ] tasks.router.ts
- [ ] service-requests.router.ts
- [ ] compliance-rules.router.ts
- [ ] conversations.router.ts
- [ ] document-types.router.ts
- [ ] filing-types.router.ts
- [ ] requirement-bundles.router.ts
- [ ] wizards.router.ts
- [ ] recurring-filings.router.ts
- [ ] client-businesses.router.ts
- [ ] dashboard.router.ts
- [ ] document-upload.router.ts
- [ ] notifications.router.ts
- [ ] analytics.router.ts
- [ ] portal.router.ts

### Frontend Updates (76 client components)
- [ ] Update all imports from server actions to tRPC
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add optimistic updates where appropriate
- [ ] Update forms to use tRPC mutations
- [ ] Update tables/lists to use tRPC queries

### Testing
- [ ] Unit tests for all routers
- [ ] Integration tests for workflows
- [ ] E2E tests for critical paths
- [ ] Permission enforcement tests
- [ ] Tenant isolation tests

### Cleanup
- [ ] Mark server actions as deprecated
- [ ] Remove server action files
- [ ] Update documentation
- [ ] Verify zero TypeScript errors
- [ ] Verify build succeeds
- [ ] Performance testing

---

## Success Criteria

✅ All 22 server action files migrated to tRPC routers
✅ All 76 client components use tRPC hooks
✅ RBAC enforced on all mutations and queries
✅ Zero TypeScript errors
✅ Build succeeds with no warnings
✅ All tests passing
✅ No legacy server actions remaining
✅ Tenant isolation verified
✅ Performance maintained or improved
✅ Type-safe client-server contract

---

## Risk Mitigation

**Risk**: Breaking existing functionality during migration
**Mitigation**: Migrate incrementally, test each router before proceeding

**Risk**: Performance regression
**Mitigation**: Use React Query caching, implement pagination, monitor bundle size

**Risk**: Type mismatches between client and server
**Mitigation**: Use tRPC's built-in type inference, validate with Zod schemas

**Risk**: Missing permission checks
**Mitigation**: Use middleware for all procedures, audit all routers

**Risk**: Tenant data leakage
**Mitigation**: Enforce tenant filtering in middleware, test isolation

---

## Estimated Effort

- **Total Time**: 8 weeks (full-time equivalent)
- **Total Procedures**: ~110 (22 routers × 5 avg procedures)
- **Total Files**: ~260 (routers + components + tests)
- **Complexity**: High
- **Risk**: Medium (incremental migration reduces risk)

---

## Next Steps

1. ✅ Complete this migration plan
2. ⏳ Install tRPC dependencies
3. ⏳ Create tRPC infrastructure
4. ⏳ Fix critical bugs
5. ⏳ Begin router migration

---

*Last Updated: 2025-11-14*
*Document Version: 1.0*
