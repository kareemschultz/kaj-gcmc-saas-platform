# Architecture Overview

Technical architecture documentation for KGC Compliance Cloud.

## System Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│                    (React 19 / Next.js 15)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTPS
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     Next.js App Server                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │             App Router (Server Components)             │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │              Server Actions (Form Handling)            │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                 API Routes (REST/JSON)                 │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │              NextAuth v5 (Authentication)              │ │
│  └────────────────────────────────────────────────────────┘ │
└────────┬──────────────┬────────────────┬───────────────────┘
         │              │                │
         │              │                │
    ┌────▼─────┐   ┌───▼────┐      ┌───▼──────┐
    │PostgreSQL│   │ Redis  │      │  MinIO   │
    │(Database)│   │(Queue) │      │(Storage) │
    └──────────┘   └────────┘      └──────────┘
\`\`\`

## Core Technologies

### Frontend
- **React 19**: UI library with server components
- **Next.js 15**: Full-stack framework with App Router
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library
- **TypeScript**: Type safety

### Backend
- **Next.js API Routes**: RESTful endpoints
- **Server Actions**: Form submissions and mutations
- **Prisma**: Type-safe ORM
- **NextAuth v5**: Authentication and sessions

### Data Layer
- **PostgreSQL**: Primary relational database
- **Redis**: Job queue and caching
- **MinIO**: S3-compatible object storage

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Local orchestration
- **Vercel**: Production hosting (optional)

## Application Structure

### Directory Layout

\`\`\`
src/
├── app/                      # Next.js App Router
│   ├── (dashboard)/         # Protected routes
│   │   ├── clients/         # Client management
│   │   ├── documents/       # Document management
│   │   └── filings/         # Filing management
│   ├── auth/                # Authentication pages
│   └── api/                 # API routes
├── components/              # React components
│   ├── clients/            # Client-specific components
│   ├── documents/          # Document-specific components
│   ├── filings/            # Filing-specific components
│   ├── layout/             # Layout components
│   └── ui/                 # Generic UI components
├── lib/                     # Utility functions
│   ├── actions/            # Server actions
│   ├── auth.ts             # Auth utilities
│   ├── prisma.ts           # Database client
│   ├── storage.ts          # MinIO client
│   ├── queue.ts            # BullMQ client
│   └── validation.ts       # Zod schemas
├── types/                   # TypeScript types
└── config/                  # Configuration
\`\`\`

### Request Flow

#### Server-Side Rendering (SSR)

\`\`\`
1. Browser requests page
2. Next.js server receives request
3. Middleware checks authentication
4. Server component fetches data from Prisma
5. React renders HTML on server
6. HTML sent to browser
7. React hydrates interactive components
\`\`\`

#### Client-Side Interaction

\`\`\`
1. User interacts with form
2. Client component calls Server Action
3. Server Action validates input (Zod)
4. Server Action queries/mutates database (Prisma)
5. Server Action creates audit log
6. Server Action returns result
7. Client component updates UI
\`\`\`

#### File Upload Flow

\`\`\`
1. User selects file in form
2. Client requests presigned URL (Server Action)
3. Server generates MinIO presigned PUT URL
4. Client uploads directly to MinIO
5. Client calls Server Action with file metadata
6. Server creates Document record in database
7. Server returns success/error
\`\`\`

## Multi-Tenant Architecture

### Tenant Isolation

All data is scoped by `tenantId` at the application level:

\`\`\`typescript
// Every query includes tenant context
const clients = await prisma.client.findMany({
  where: {
    tenantId: session.user.tenantId, // Required
    // other filters...
  },
});
\`\`\`

### Security Layers

1. **Authentication**: NextAuth verifies user identity
2. **Session**: JWT contains user ID and tenant ID
3. **Middleware**: Validates session on every request
4. **Query Guards**: All Prisma queries include tenantId filter
5. **Audit Logs**: All mutations logged with user and tenant

### Tenant Context

\`\`\`typescript
// Session structure
interface Session {
  user: {
    id: number;
    email: string;
    tenantId: number;
    role: string;
    permissions: string[];
  };
}

// Helper function
async function getTenantContext(req: Request) {
  const session = await auth();
  if (!session) throw new UnauthorizedError();
  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
  };
}
\`\`\`

## Authentication Flow

### Login Process

\`\`\`
1. User submits email/password
2. NextAuth credentials provider validates
3. Query database for user record
4. Compare password hash (bcrypt)
5. Load user's tenant and role
6. Generate JWT with user context
7. Set HTTP-only cookie
8. Redirect to dashboard
\`\`\`

### Session Management

\`\`\`typescript
// JWT structure
{
  userId: number,
  email: string,
  tenantId: number,
  role: string,
  iat: timestamp,
  exp: timestamp
}
\`\`\`

- **Storage**: HTTP-only cookie
- **Expiration**: 30 days (configurable)
- **Refresh**: Automatic on activity
- **Logout**: Clear cookie, invalidate session

### Protected Routes

\`\`\`typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = await auth();
  
  if (!session && request.url.includes('/dashboard')) {
    return redirect('/auth/login');
  }
  
  return next();
}
\`\`\`

## Database Schema Design

### Core Entities

- **Tenant**: Represents KAJ or GCMC
- **User**: Staff members with roles
- **Client**: Individual or company clients
- **Document**: File metadata and versions
- **Filing**: Tax/regulatory submissions
- **Service**: Service request workflows

### Relationships

\`\`\`
Tenant
  ├─ Users (1:N)
  ├─ Clients (1:N)
  ├─ Documents (1:N)
  ├─ Filings (1:N)
  └─ Services (1:N)

Client
  ├─ Documents (1:N)
  ├─ Filings (1:N)
  └─ Services (1:N)

Filing
  ├─ Documents (M:N via FilingDocument)
  └─ FilingType (N:1)

Document
  └─ Versions (1:N via DocumentVersion)
\`\`\`

### Audit Trail

Every mutation creates an AuditLog record:

\`\`\`typescript
{
  id: number,
  tenantId: number,
  userId: number,
  action: string,        // "CREATE", "UPDATE", "DELETE"
  entityType: string,    // "Client", "Document", etc.
  entityId: number,
  changes: JSON,         // Before/after diff
  timestamp: DateTime
}
\`\`\`

## Storage Architecture

### MinIO Structure

\`\`\`
documents/                    # Bucket name
  ├── tenant-1/              # Tenant isolation
  │   ├── documents/         # Document files
  │   │   ├── 1234567890-passport.pdf
  │   │   └── 1234567891-license.pdf
  │   └── exports/           # Generated reports
  └── tenant-2/
      └── documents/
\`\`\`

### File Access

- **Upload**: Presigned PUT URL (1 hour expiry)
- **Download**: Presigned GET URL (1 hour expiry)
- **Security**: URLs require active session
- **Metadata**: Stored in PostgreSQL Document table

## Job Queue Architecture

### BullMQ Workers

\`\`\`
Redis Queue
  ├── email-notifications      # Send emails
  ├── filing-reminders         # Due date alerts
  ├── compliance-scoring       # Calculate scores
  └── report-generation        # PDF reports
\`\`\`

### Job Processing

\`\`\`typescript
// Create job
await emailQueue.add('send-notification', {
  to: 'user@example.com',
  subject: 'Filing Due Soon',
  template: 'filing-reminder',
  data: { filingId: 123 },
});

// Process job
emailQueue.process(async (job) => {
  const { to, subject, template, data } = job.data;
  await sendEmail(to, subject, renderTemplate(template, data));
});
\`\`\`

## Security Considerations

### Data Protection

1. **Encryption at rest**: Database and storage encryption
2. **Encryption in transit**: HTTPS/TLS everywhere
3. **Password hashing**: bcrypt with salt
4. **Session security**: HTTP-only, secure cookies
5. **SQL injection**: Prevented by Prisma parameterization

### Access Control

1. **Authentication**: Required for all protected routes
2. **Authorization**: Role-based permissions
3. **Tenant isolation**: Every query filtered by tenantId
4. **Audit logging**: All changes tracked

### Attack Prevention

1. **CSRF**: Next.js built-in protection
2. **XSS**: React auto-escaping, CSP headers
3. **Rate limiting**: (TODO: Phase 2)
4. **Input validation**: Zod schemas on all inputs

## Performance Optimization

### Database

- Indexes on foreign keys and tenant ID
- Connection pooling via Prisma
- Pagination for large result sets
- Selective field loading

### Caching

- Redis for session storage
- React Server Component caching
- Static page generation where possible

### File Uploads

- Direct browser → MinIO (bypasses app server)
- Streaming large files
- Chunked uploads for large documents

## Scalability

### Horizontal Scaling

- Stateless Next.js app servers
- Database connection pooling
- Redis pub/sub for multi-instance coordination

### Vertical Scaling

- PostgreSQL read replicas
- Redis cluster mode
- MinIO distributed mode

## Monitoring and Logging

### Application Logs

\`\`\`typescript
logger.info('Client created', { clientId, tenantId });
logger.error('Failed to upload document', error, { documentId });
\`\`\`

### Metrics (Future)

- Request latency
- Error rates
- Database query performance
- Queue job processing times

## Development Workflow

1. **Local**: Docker Compose with hot reloading
2. **Testing**: Prisma seed data, test users
3. **Migrations**: Prisma migrate for schema changes
4. **Deployment**: Docker image or Vercel

## Technology Decisions

### Why Next.js?
- Full-stack framework
- Server components reduce client JS
- Built-in API routes
- Great DX with hot reloading

### Why Prisma?
- Type-safe database access
- Excellent TypeScript integration
- Automatic migrations
- Visual schema management

### Why MinIO?
- S3-compatible API
- Self-hosted option
- Docker-friendly
- Cost-effective

### Why PostgreSQL?
- Robust relational database
- JSON support for flexible data
- Excellent Prisma support
- Mature ecosystem

## Future Enhancements

- **Phase 2**: Service workflows, recurring filing engine
- **Phase 3**: Client portal, secure messaging
- **Phase 4**: OCR pipeline, AI document analysis
- **Performance**: Caching layer, CDN for assets
- **Monitoring**: Sentry, structured logging
- **Testing**: E2E tests, integration tests
