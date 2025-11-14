# KGC Compliance Cloud - API Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Authentication](#authentication)
- [tRPC API](#trpc-api)
- [Available Routers](#available-routers)
- [RBAC & Permissions](#rbac--permissions)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Overview

The KGC Compliance Cloud API is built with **tRPC** for end-to-end type safety and **React Query** for efficient data fetching and caching. All API endpoints enforce **role-based access control (RBAC)** and **tenant isolation**.

### Technology Stack
- **tRPC v11** - Type-safe API layer
- **React Query (TanStack Query)** - Data fetching and caching
- **Zod** - Runtime validation
- **Prisma** - Database ORM
- **NextAuth v5** - Authentication
- **SuperJSON** - Data transformation (supports Date, Map, Set, BigInt)

---

## Architecture

### Request Flow
```
Client Component
    ↓
tRPC React Hooks (trpc.users.list.useQuery)
    ↓
tRPC Client (HTTP Batch Link)
    ↓
Next.js API Route (/api/trpc/[trpc])
    ↓
tRPC Middleware Chain
    ├─ Logging Middleware (timing, context)
    ├─ Authentication Middleware (session validation)
    └─ RBAC Middleware (permission checks)
    ↓
tRPC Procedure (business logic)
    ↓
Prisma (database queries with tenant filtering)
    ↓
Response (type-safe, cached)
```

### Directory Structure
```
/server/trpc/
├── trpc.ts                    # Base tRPC instance
├── context.ts                 # Request context (session, user, prisma, logger)
├── middleware/
│   ├── auth.ts               # Authentication
│   ├── rbac.ts               # Permission enforcement
│   └── logging.ts            # Request logging + audit trails
└── routers/
    ├── _app.ts               # Root router
    ├── users.ts              # User management
    ├── clients.ts            # Client management
    ├── documents.ts          # Document handling
    ├── filings.ts            # Filing operations
    └── [... 17 more routers]

/lib/trpc/
├── client.ts                 # Vanilla tRPC client
├── react.tsx                 # React Query provider
└── server.ts                 # Server-side caller

/app/api/trpc/[trpc]/
└── route.ts                  # Next.js API handler
```

---

## Authentication

All API endpoints (except public procedures) require authentication via **NextAuth v5** session cookies.

### Session Structure
```typescript
interface Session {
  user: {
    id: number;
    email: string;
    name: string;
    tenantId: number;
  };
  tenant: {
    tenantId: number;
    tenantCode: string;
    tenantName: string;
  };
  role: UserRole; // e.g., "SuperAdmin", "FirmAdmin", "ComplianceOfficer"
}
```

### Context Available in Procedures
```typescript
interface Context {
  session: Session | null;
  user: UserContext | null;  // Parsed user data
  prisma: PrismaClient;
  logger: Logger;
  req: Request;
}
```

---

## tRPC API

### Client-Side Usage

#### 1. Setup (already configured in `/app/layout.tsx`)
```typescript
import { TRPCProvider } from '@/lib/trpc/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
```

#### 2. Query Data
```typescript
'use client';
import { trpc } from '@/lib/trpc/react';

export function UsersList() {
  const { data, isLoading, error } = trpc.users.list.useQuery({
    page: 1,
    pageSize: 20,
    search: 'john',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

#### 3. Mutate Data
```typescript
'use client';
import { trpc } from '@/lib/trpc/react';

export function CreateUserForm() {
  const utils = trpc.useContext();

  const createUser = trpc.users.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch users list
      utils.users.list.invalidate();
    },
  });

  const handleSubmit = (data) => {
    createUser.mutate(data);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Server-Side Usage (Server Components)

```typescript
import { createServerCaller } from '@/lib/trpc/server';

export default async function UsersPage() {
  const trpc = await createServerCaller();
  const { users } = await trpc.users.list({ page: 1, pageSize: 20 });

  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

---

## Available Routers

### ✅ Users Router (`trpc.users`)

Manage users and their roles within the tenant.

| Procedure | Type | Input | Permission Required |
|-----------|------|-------|---------------------|
| `list` | Query | `{ search?, roleId?, page, pageSize }` | `users:view` |
| `get` | Query | `number` (userId) | `users:view` |
| `create` | Mutation | `CreateUserFormData` | `users:create` |
| `update` | Mutation | `{ id, data }` | `users:edit` |
| `delete` | Mutation | `number` (userId) | `users:delete` |
| `changePassword` | Mutation | `{ userId, data }` | None (own password only) |

**Example:**
```typescript
const { data } = trpc.users.list.useQuery({ page: 1, pageSize: 20 });
const createUser = trpc.users.create.useMutation();
```

---

### ✅ Clients Router (`trpc.clients`)

Manage client organizations with automatic tenant isolation.

| Procedure | Type | Input | Permission Required |
|-----------|------|-------|---------------------|
| `list` | Query | `{ search?, type?, sector?, riskLevel?, page, pageSize }` | `clients:view` |
| `get` | Query | `number` (clientId) | `clients:view` |
| `create` | Mutation | `ClientFormData` | `clients:create` |
| `update` | Mutation | `{ id, data }` | `clients:edit` |
| `delete` | Mutation | `number` (clientId) | `clients:delete` |

**Example:**
```typescript
const { data } = trpc.clients.list.useQuery({
  search: 'Acme Corp',
  type: 'company',
  page: 1
});

const createClient = trpc.clients.create.useMutation({
  onSuccess: (result) => {
    console.log('Client created:', result.client);
  },
});
```

---

### 🚧 Documents Router (`trpc.documents`) - Coming Soon

| Procedure | Type | Input | Permission Required |
|-----------|------|-------|---------------------|
| `list` | Query | `{ clientId?, search?, status?, page }` | `documents:view` |
| `get` | Query | `number` (documentId) | `documents:view` |
| `create` | Mutation | `DocumentFormData` | `documents:create` |
| `update` | Mutation | `{ id, data }` | `documents:edit` |
| `delete` | Mutation | `number` (documentId) | `documents:delete` |

---

### 🚧 Filings Router (`trpc.filings`) - Coming Soon

| Procedure | Type | Input | Permission Required |
|-----------|------|-------|---------------------|
| `list` | Query | `{ clientId?, status?, authority?, page }` | `filings:view` |
| `get` | Query | `number` (filingId) | `filings:view` |
| `create` | Mutation | `FilingFormData` | `filings:create` |
| `update` | Mutation | `{ id, data }` | `filings:edit` |
| `submit` | Mutation | `number` (filingId) | `filings:submit` |
| `delete` | Mutation | `number` (filingId) | `filings:delete` |

---

## RBAC & Permissions

### Permission Structure

Permissions follow the format: `{module}:{action}`

**Available Modules:**
- `users`, `clients`, `documents`, `filings`, `services`, `tasks`
- `compliance`, `messages`, `analytics`, `wizards`, `settings`

**Available Actions:**
- `view`, `create`, `edit`, `delete`, `manage`

### Role Definitions

| Role | Description | Example Permissions |
|------|-------------|---------------------|
| **SuperAdmin** | Full system access across all tenants | `*:*` (all modules, all actions) |
| **FirmAdmin** | Full access within tenant | `*:*` within tenant |
| **ComplianceManager** | Manage compliance and oversight | `clients:*, documents:*, filings:*, compliance:*` |
| **ComplianceOfficer** | Handle filings and documents | `clients:view, documents:*, filings:*` |
| **DocumentOfficer** | Manage documents only | `documents:*, clients:view` |
| **FilingClerk** | Prepare and submit filings | `filings:create, filings:edit, filings:submit` |
| **Viewer** | Read-only access | `*:view` |
| **ClientPortalUser** | Client portal access | `client_portal:*` |

### Middleware Usage

```typescript
// Require specific permission
export const myProcedure = protectedProcedure
  .use(requirePermission('clients', 'create'))
  .mutation(async ({ ctx, input }) => {
    // User has clients:create permission
  });

// Require specific role
export const adminProcedure = protectedProcedure
  .use(requireRole('SuperAdmin', 'FirmAdmin'))
  .mutation(async ({ ctx, input }) => {
    // User is SuperAdmin or FirmAdmin
  });

// Admin-only
export const superAdminProcedure = protectedProcedure
  .use(requireSuperAdmin())
  .mutation(async ({ ctx, input }) => {
    // User is SuperAdmin
  });
```

### Tenant Isolation

All queries automatically filter by `tenantId`:

```typescript
// Automatic tenant filtering
const clients = await ctx.prisma.client.findMany({
  where: {
    tenantId: ctx.user.tenantId,  // Automatically added
    // ... other filters
  },
});
```

---

## Error Handling

### tRPC Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Authenticated but no permission |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid input |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

### Error Handling in Components

```typescript
const { data, error } = trpc.users.list.useQuery({ page: 1 });

if (error) {
  switch (error.data?.code) {
    case 'FORBIDDEN':
      return <div>You don't have permission to view users</div>;
    case 'UNAUTHORIZED':
      return <div>Please log in</div>;
    default:
      return <div>Error: {error.message}</div>;
  }
}
```

### Custom Error Messages

```typescript
throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'You cannot delete your own account',
});
```

---

## Examples

### Pagination

```typescript
const [page, setPage] = useState(1);
const { data } = trpc.clients.list.useQuery({
  page,
  pageSize: 20
});

return (
  <div>
    <ClientTable clients={data.clients} />
    <Pagination
      current={page}
      total={data.pagination.totalPages}
      onChange={setPage}
    />
  </div>
);
```

### Optimistic Updates

```typescript
const utils = trpc.useContext();

const updateClient = trpc.clients.update.useMutation({
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await utils.clients.list.cancel();

    // Snapshot previous value
    const previous = utils.clients.list.getData();

    // Optimistically update
    utils.clients.list.setData({ page: 1 }, (old) => ({
      ...old,
      clients: old.clients.map((c) =>
        c.id === variables.id ? { ...c, ...variables.data } : c
      ),
    }));

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    utils.clients.list.setData({ page: 1 }, context.previous);
  },
  onSettled: () => {
    // Refetch after mutation
    utils.clients.list.invalidate();
  },
});
```

### Dependent Queries

```typescript
const { data: client } = trpc.clients.get.useQuery(clientId);

const { data: documents } = trpc.documents.list.useQuery(
  { clientId },
  { enabled: !!client }  // Only fetch when client is loaded
);
```

### Infinite Scroll

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = trpc.clients.list.useInfiniteQuery(
  { pageSize: 20 },
  {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  }
);

return (
  <div>
    {data?.pages.map((page) =>
      page.clients.map((client) => (
        <ClientCard key={client.id} client={client} />
      ))
    )}
    {hasNextPage && (
      <button onClick={() => fetchNextPage()}>
        Load More
      </button>
    )}
  </div>
);
```

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { appRouter } from '@/server/trpc/routers/_app';
import { createContextMock } from '@/tests/helpers/trpc';

describe('users router', () => {
  it('should list users with permission', async () => {
    const ctx = createContextMock({
      user: {
        id: 1,
        role: 'FirmAdmin',
        tenantId: 1,
      },
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.list({ page: 1, pageSize: 10 });

    expect(result.users).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
  });

  it('should throw FORBIDDEN if no permission', async () => {
    const ctx = createContextMock({
      user: {
        id: 1,
        role: 'Viewer',  // Can view but not create
        tenantId: 1,
      },
    });

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.users.create({ name: 'Test', email: 'test@example.com' })
    ).rejects.toThrow('Permission denied');
  });
});
```

---

## Performance

### Caching Strategy

React Query automatically caches data with smart defaults:
- **staleTime**: 60 seconds (data considered fresh)
- **cacheTime**: 5 minutes (how long unused data stays in cache)
- **refetchOnWindowFocus**: false (don't refetch on tab focus)

### Request Batching

tRPC automatically batches multiple requests into a single HTTP call:

```typescript
// These 3 queries are batched into 1 HTTP request
const users = trpc.users.list.useQuery({ page: 1 });
const clients = trpc.clients.list.useQuery({ page: 1 });
const documents = trpc.documents.list.useQuery({ page: 1 });
```

---

## Migration Status

### ✅ Completed (2/22 routers)
- `users` - User management
- `clients` - Client management

### 🚧 In Progress (20/22 routers)
- `documents` - Document handling
- `filings` - Filing operations
- `services` - Service management
- `tasks` - Task operations
- `roles` - Role/permission management
- `tenants` - Tenant management
- ... and 14 more

See [MIGRATION_PLAN.md](/MIGRATION_PLAN.md) for full roadmap.

---

## Support

For questions or issues:
1. Check this documentation
2. Review examples in `/server/trpc/routers/`
3. See [MIGRATION_PLAN.md](/MIGRATION_PLAN.md)
4. Review tRPC docs: https://trpc.io

---

**Last Updated**: 2025-11-14
**Version**: 1.0.0
**Status**: In Active Development
