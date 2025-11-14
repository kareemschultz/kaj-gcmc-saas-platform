# KGC Compliance Cloud

**Multi-tenant SaaS compliance platform for professional services firms in Guyana**

KGC Compliance Cloud is a comprehensive compliance management system designed for KAJ and GCMC, supporting client management, document storage, filing orchestration, service request workflows, and compliance scoring across Guyana's key regulatory authorities: GRA, NIS, DCRA, and Immigration.

## Features

- **Multi-tenant architecture** with row-level isolation
- **Client & business management** with risk profiling
- **Document management** with version control and MinIO storage
- **Filing orchestration** for recurring GRA, NIS, DCRA, and Immigration filings
- **Service request workflows** with customizable templates
- **Compliance tracking** with deadline management
- **Task management** for internal staff
- **Role-based access control** with granular permissions
- **Audit logging** for all critical actions

## Tech Stack

- **Frontend/Backend**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth v5
- **Job Queue**: BullMQ + Redis
- **File Storage**: MinIO (S3-compatible)
- **UI**: Tailwind CSS + shadcn/ui
- **Containerization**: Docker + Docker Compose

## Quick Start with Docker (Recommended)

The fastest way to get started is using Docker Compose:

### Prerequisites

- Docker 20+
- Docker Compose 2+

### Setup

1. Clone the repository:

\`\`\`bash
git clone <your-repo-url>
cd kgc-compliance-cloud
\`\`\`

2. Create environment file:

\`\`\`bash
cp .env.example .env
# Edit .env and set NEXTAUTH_SECRET to a secure random value
\`\`\`

3. Start all services:

\`\`\`bash
docker-compose up -d
\`\`\`

4. Run database migrations and seed:

\`\`\`bash
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

**Default Test Credentials:**
- KAJ Admin: `kaj-admin@test.com` / `password123`
- GCMC Admin: `gcmc-admin@test.com` / `password123`

**Service URLs:**
- Application: http://localhost:3000
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Docker Commands

\`\`\`bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose build app
docker-compose up -d app

# Access app container shell
docker-compose exec app sh

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Seed database
docker-compose exec app npm run db:seed
\`\`\`

## Local Development (Without Docker)

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- MinIO Server

### Installation

1. Install dependencies:

\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:

\`\`\`bash
cp .env.example .env
# Edit .env with your local credentials
# Change MINIO_ENDPOINT to "localhost" for local dev
\`\`\`

3. Start required services:

\`\`\`bash
# PostgreSQL, Redis, MinIO must be running locally
\`\`\`

4. Initialize database:

\`\`\`bash
npm run db:generate
npm run db:migrate
npm run db:seed
\`\`\`

5. Start dev server:

\`\`\`bash
npm run dev
\`\`\`

## Project Structure

\`\`\`
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed data
├── src/
│   ├── app/                   # Next.js pages (App Router)
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── auth/              # Authentication pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── clients/           # Client management UI
│   │   ├── documents/         # Document management UI
│   │   ├── filings/           # Filing management UI
│   │   ├── layout/            # Layout components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/                   # Utility functions
│   │   ├── actions/           # Server actions
│   │   ├── auth.ts            # Auth utilities
│   │   ├── prisma.ts          # Database client
│   │   ├── storage.ts         # MinIO client
│   │   └── queue.ts           # BullMQ client
│   ├── types/                 # TypeScript definitions
│   └── config/                # Configuration files
├── docs/                      # Documentation
├── docker-compose.yml         # Docker services
├── Dockerfile                 # Next.js app container
└── .env.example               # Environment template
\`\`\`

## Environment Variables

Key environment variables (see `.env.example` for full list):

\`\`\`env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kgc_compliance_cloud"

# Auth
NEXTAUTH_SECRET="GENERATE_A_SECURE_RANDOM_VALUE"

# MinIO (use "minio" hostname in Docker, "localhost" for local dev)
MINIO_ENDPOINT="minio"
MINIO_BUCKET_NAME="documents"

# Email (Gmail App Password recommended)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"
\`\`\`

See `docs/ENVIRONMENT_VARIABLES.md` for detailed descriptions.

## Development Roadmap

- ✅ **Phase 0**: Foundation - Database schema, auth, project structure
- ✅ **Phase 1**: Core CRUD - Clients, documents, filings
- 🚧 **Phase 2**: Workflows - Service requests, recurring engine, tasks
- 📅 **Phase 3**: Client Portal - Client login, messaging
- 📅 **Phase 4**: AI/Automation - OCR pipeline, compliance scoring

## Documentation

- [Docker Setup Guide](docs/DOCKER_SETUP.md)
- [Developer Setup](docs/DEVELOPER_SETUP.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [System Specification](docs/SYSTEM_SPEC.md)
- [Authentication Flow](docs/AUTHENTICATION_FLOW.md)
- [Storage & Uploads](docs/STORAGE_AND_UPLOADS.md)
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md)

## Multi-Tenant Architecture

All data is scoped by `tenantId` at the database level. Row-level security is enforced in application code via:

- Server-side Prisma queries with tenant context
- Middleware for route-level validation
- Helper functions in `src/lib/tenant.ts`

## Security

- NextAuth v5 with JWT sessions
- bcrypt password hashing
- Environment-based secrets
- RBAC with 8 predefined roles
- Audit logging for all critical actions
- Multi-tenant data isolation

## Support

For questions or issues, contact the development team.

## License

Proprietary - All rights reserved.
