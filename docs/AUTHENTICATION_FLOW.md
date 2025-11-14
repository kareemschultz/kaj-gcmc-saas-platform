# Authentication & Authorization

Complete guide to the authentication and authorization system.

## Overview

KGC Compliance Cloud uses NextAuth v5 (Auth.js) with JWT-based sessions for authentication and role-based access control (RBAC) for authorization.

## Authentication Flow

### Login Process

\`\`\`
┌─────────┐         ┌──────────┐         ┌──────────┐         ┌────────┐
│ Browser │         │ Next.js  │         │ NextAuth │         │   DB   │
└────┬────┘         └────┬─────┘         └────┬─────┘         └───┬────┘
     │                   │                    │                    │
     │  POST /api/auth/signin                │                    │
     ├──────────────────>│                    │                    │
     │                   │                    │                    │
     │                   │  Validate credentials                   │
     │                   ├───────────────────>│                    │
     │                   │                    │                    │
     │                   │                    │  Query user        │
     │                   │                    ├───────────────────>│
     │                   │                    │                    │
     │                   │                    │  User + Tenant     │
     │                   │                    │<───────────────────┤
     │                   │                    │                    │
     │                   │  Verify password (bcrypt)               │
     │                   │<───────────────────┤                    │
     │                   │                    │                    │
     │                   │  Generate JWT      │                    │
     │                   │<───────────────────┤                    │
     │                   │                    │                    │
     │  Set cookie + Redirect                 │                    │
     │<──────────────────┤                    │                    │
     │                   │                    │                    │
\`\`\`

### Technical Implementation

#### 1. Login Form

\`\`\`typescript
// src/components/auth/login-form.tsx
export function LoginForm() {
  async function handleSubmit(e: FormEvent) {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    
    if (result?.error) {
      toast.error('Invalid credentials');
    } else {
      router.push('/dashboard');
    }
  }
}
\`\`\`

#### 2. NextAuth Configuration

\`\`\`typescript
// src/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        // 1. Validate input
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        
        // 2. Find user
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { tenant: true, role: true },
        });
        
        if (!user) return null;
        
        // 3. Verify password
        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        
        if (!valid) return null;
        
        // 4. Return user data for JWT
        return {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add custom fields to JWT
      if (user) {
        token.userId = user.id;
        token.tenantId = user.tenantId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session
      session.user.id = token.userId;
      session.user.tenantId = token.tenantId;
      session.user.role = token.role;
      return session;
    },
  },
});
\`\`\`

#### 3. Session Structure

\`\`\`typescript
// src/types/next-auth.d.ts
declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      email: string;
      tenantId: number;
      role: string;
      permissions: string[];
    };
  }
}
\`\`\`

#### 4. Middleware Protection

\`\`\`typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const session = await auth();
  
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}
\`\`\`

### Session Management

#### JWT Token

\`\`\`json
{
  "userId": 1,
  "email": "admin@kaj.com",
  "tenantId": 1,
  "role": "ADMIN",
  "iat": 1234567890,
  "exp": 1237159890
}
\`\`\`

- **Storage**: HTTP-only cookie (secure, cannot be accessed by JavaScript)
- **Name**: `authjs.session-token` (production) or `authjs.session-token` (development)
- **Expiration**: 30 days (configurable)
- **Refresh**: Automatic on activity

#### Getting Current Session

\`\`\`typescript
// Server Component
import { auth } from '@/src/auth';

export default async function Page() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  return <div>Welcome {session.user.email}</div>;
}

// Client Component
'use client';
import { useSession } from 'next-auth/react';

export function Profile() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;
  
  return <div>Welcome {session.user.email}</div>;
}

// Server Action
import { auth } from '@/src/auth';

export async function createClient(data: ClientInput) {
  const session = await auth();
  if (!session) throw new UnauthorizedError();
  
  // Use session.user.tenantId in queries
}
\`\`\`

#### Logout

\`\`\`typescript
// Client-side
import { signOut } from 'next-auth/react';

<Button onClick={() => signOut()}>Logout</Button>

// Server-side
import { signOut } from '@/src/auth';

await signOut();
\`\`\`

## Authorization (RBAC)

### Role Hierarchy

\`\`\`
SUPER_ADMIN     # System-wide access (future)
ADMIN           # Tenant administrator
MANAGER         # Department manager
SENIOR_ASSOCIATE # Senior staff
ASSOCIATE       # Regular staff
JUNIOR_ASSOCIATE # Junior staff
INTERN          # Limited access
CLIENT          # External client (Phase 3)
\`\`\`

### Permission System

\`\`\`typescript
// src/config/roles.ts
export const rolePermissions = {
  ADMIN: [
    'clients:read',
    'clients:create',
    'clients:update',
    'clients:delete',
    'documents:read',
    'documents:create',
    'documents:update',
    'documents:delete',
    'filings:read',
    'filings:create',
    'filings:update',
    'filings:delete',
    'users:read',
    'users:create',
    'users:update',
  ],
  MANAGER: [
    'clients:read',
    'clients:create',
    'clients:update',
    'documents:read',
    'documents:create',
    'documents:update',
    'filings:read',
    'filings:create',
    'filings:update',
  ],
  ASSOCIATE: [
    'clients:read',
    'documents:read',
    'documents:create',
    'filings:read',
    'filings:create',
  ],
};
\`\`\`

### Permission Checking

\`\`\`typescript
// src/lib/auth-helpers.ts
export function hasPermission(
  session: Session,
  permission: string
): boolean {
  const permissions = rolePermissions[session.user.role] || [];
  return permissions.includes(permission);
}

export function requirePermission(
  session: Session,
  permission: string
): void {
  if (!hasPermission(session, permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
}

// Usage in Server Action
export async function deleteClient(clientId: number) {
  const session = await auth();
  if (!session) throw new UnauthorizedError();
  
  requirePermission(session, 'clients:delete');
  
  // Proceed with deletion
}
\`\`\`

### UI-Level Authorization

\`\`\`typescript
// Conditional rendering
import { hasPermission } from '@/src/lib/auth-helpers';

export function ClientActions({ session }: Props) {
  return (
    <div>
      {hasPermission(session, 'clients:update') && (
        <Button>Edit</Button>
      )}
      {hasPermission(session, 'clients:delete') && (
        <Button>Delete</Button>
      )}
    </div>
  );
}
\`\`\`

## Multi-Tenant Security

### Tenant Context

Every authenticated request includes tenant context:

\`\`\`typescript
export async function getTenantContext(req: Request) {
  const session = await auth();
  
  if (!session) {
    throw new UnauthorizedError('Not authenticated');
  }
  
  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: session.user.role,
  };
}
\`\`\`

### Tenant Isolation

All database queries MUST include `tenantId` filter:

\`\`\`typescript
// ✅ CORRECT: Tenant-aware query
const clients = await prisma.client.findMany({
  where: {
    tenantId: session.user.tenantId,  // Required!
    // other filters...
  },
});

// ❌ INCORRECT: Missing tenant filter
const clients = await prisma.client.findMany({
  where: {
    // Missing tenantId - security risk!
  },
});
\`\`\`

### Tenant Guard Helper

\`\`\`typescript
// src/lib/tenant.ts
export async function withTenantGuard<T>(
  tenantId: number,
  callback: () => Promise<T>
): Promise<T> {
  const session = await auth();
  
  if (!session) {
    throw new UnauthorizedError();
  }
  
  if (session.user.tenantId !== tenantId) {
    throw new ForbiddenError('Access denied');
  }
  
  return callback();
}

// Usage
export async function getClient(clientId: number) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });
  
  if (!client) throw new NotFoundError();
  
  return withTenantGuard(client.tenantId, async () => {
    return client;
  });
}
\`\`\`

## Security Best Practices

### Password Security

\`\`\`typescript
// Hash password on user creation
import bcrypt from 'bcryptjs';

const passwordHash = await bcrypt.hash(password, 10);

await prisma.user.create({
  data: {
    email,
    passwordHash, // Never store plain text!
    // ...
  },
});

// Verify password on login
const valid = await bcrypt.compare(inputPassword, user.passwordHash);
\`\`\`

### Session Security

- **HTTP-only cookies**: JavaScript cannot access tokens
- **Secure flag**: Cookies only sent over HTTPS in production
- **SameSite**: CSRF protection
- **Short expiration**: 30 days max
- **Automatic refresh**: Extends on activity

### CSRF Protection

Next.js provides built-in CSRF protection:

- Server Actions automatically include CSRF tokens
- API routes can use NextAuth's CSRF middleware
- Form submissions are protected

### Input Validation

\`\`\`typescript
// Always validate inputs with Zod
import { z } from 'zod';

const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  // ...
});

export async function createClient(input: unknown) {
  // Validate before processing
  const data = createClientSchema.parse(input);
  
  // Now safe to use data
}
\`\`\`

## Common Patterns

### Protected Server Action

\`\`\`typescript
export async function protectedAction(input: ActionInput) {
  // 1. Get session
  const session = await auth();
  if (!session) throw new UnauthorizedError();
  
  // 2. Check permissions
  requirePermission(session, 'resource:action');
  
  // 3. Validate input
  const data = schema.parse(input);
  
  // 4. Perform operation with tenant context
  const result = await prisma.resource.create({
    data: {
      ...data,
      tenantId: session.user.tenantId, // Always include!
    },
  });
  
  // 5. Log action
  await createAuditLog({
    userId: session.user.id,
    tenantId: session.user.tenantId,
    action: 'CREATE',
    entityType: 'Resource',
    entityId: result.id,
  });
  
  // 6. Return result
  return result;
}
\`\`\`

### Protected Page

\`\`\`typescript
// app/(dashboard)/clients/page.tsx
import { auth } from '@/src/auth';
import { redirect } from 'next/navigation';

export default async function ClientsPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  // Fetch tenant-specific data
  const clients = await prisma.client.findMany({
    where: { tenantId: session.user.tenantId },
  });
  
  return <ClientsList clients={clients} session={session} />;
}
\`\`\`

## Troubleshooting

### Session Not Persisting

1. Check cookie settings in browser DevTools
2. Verify NEXTAUTH_URL matches your domain
3. Ensure NEXTAUTH_SECRET is set
4. Check for cookie blocking extensions

### Unauthorized After Login

1. Verify JWT callback adds custom fields
2. Check session callback maps token to session
3. Ensure middleware is configured correctly

### Cross-Tenant Data Leaks

1. Always include `tenantId` in WHERE clauses
2. Use `withTenantGuard` helper
3. Add unit tests for tenant isolation
4. Review audit logs for suspicious access

## Testing Authentication

\`\`\`typescript
// Create test session
import { auth } from '@/src/auth';

// Mock session in tests
jest.mock('@/src/auth', () => ({
  auth: jest.fn().mockResolvedValue({
    user: {
      id: 1,
      email: 'test@example.com',
      tenantId: 1,
      role: 'ADMIN',
    },
  }),
}));
\`\`\`

## Next Steps

- Review [Multi-Tenant Architecture](ARCHITECTURE.md#multi-tenant-architecture)
- Implement additional OAuth providers
- Add 2FA support (Phase 3)
- Set up session monitoring
