# KGC Compliance Cloud

![Production Ready](https://img.shields.io/badge/Production-Ready-brightgreen)
![Next.js 15](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED)

**Multi-tenant SaaS compliance platform for professional services firms in Guyana**

KGC Compliance Cloud is a comprehensive compliance management system designed for KAJ and GCMC, supporting client management, document storage, filing orchestration, service request workflows, and compliance scoring across Guyana's key regulatory authorities: GRA, NIS, DCRA, and Immigration.

## 🎉 Production Readiness Status

**Latest Update**: 2025-11-14 - ✅ **PRODUCTION READY**

All critical security and functionality issues have been resolved:
- ✅ Import path standardization (168 fixes)
- ✅ Docker security hardening
- ✅ Authentication middleware enabled
- ✅ Health check endpoint
- ✅ Comprehensive error handling
- ✅ Null safety fixes in authentication

See [PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md) for full details.

## Features

### Core Platform
- **Multi-tenant SaaS architecture** with complete row-level data isolation
- **Full CRUD interfaces** for all entities (Clients, Documents, Filings, Services, Users, Tasks, etc.)
- **Role-based access control (RBAC)** with granular permissions
- **Comprehensive audit logging** for compliance and security
- **Admin dashboard** with real-time metrics and compliance overview

### Client & Business Management
- **Client profiles** with risk levels, sectors, and compliance scores
- **Client businesses** - manage multiple businesses per client
- **Compliance scoring** - automated green/amber/red ratings
- **Client-specific views** with linked documents, filings, and service requests

### Document Management
- **Version-controlled document storage** with MinIO (S3-compatible)
- **Presigned URL uploads/downloads** for security and performance
- **Document types** - 70+ Guyana-specific types (GRA, NIS, DCRA, Immigration, Deeds, GO-Invest)
- **Expiry tracking** with automated notifications
- **Document preview** for PDFs and images
- **Drag-and-drop uploads** with progress tracking

### Filing & Compliance
- **Filing types** for all major Guyana authorities
- **Recurring filings** with automated scheduling
- **Overdue tracking** with urgency indicators
- **Filing reminders** - automated notifications 3, 7, 14 days before due date
- **Status workflows** - draft → prepared → submitted → approved
- **Linked documents** - attach supporting documents to filings

### Service Requests & Workflows
- **Service catalog** with pricing and estimated timelines
- **Service request workflows** with multi-step processes
- **Step-based tracking** with dependencies
- **Status timeline** showing request history
- **Linked conversations** and tasks
- **Progress indicators** for client visibility

### Requirement Bundles (Guyana-Specific)
- **19 pre-configured bundles** for common compliance scenarios
- **Authority-specific bundles**:
  - GRA: Individual Tax, PAYE, VAT, Corporation Tax, Tender Compliance
  - NIS: Employer Registration, Contributions, Certificates
  - DCRA: Business Registration, Incorporation, Annual Compliance
  - Immigration: Work Permits, Residence Permits
  - Deeds: Property Transfer, Mortgage Registration
  - GO-Invest: Investment Registration
- **Bundle progress tracking** - visual indicators of completion
- **Requirement validation** - automatic checks for missing/expiring documents

### Task Management
- **Kanban board view** with drag-drop support
- **Table view** with advanced filtering
- **Task assignment** to users
- **Priority levels** (low, medium, high, urgent)
- **Due date tracking** with overdue indicators
- **Linked entities** - connect tasks to clients, service requests, or filings

### Compliance Dashboard
- **Compliance summary** - green/amber/red distribution
- **Authority-specific metrics** - GRA, NIS, DCRA, Immigration compliance rates
- **Upcoming deadlines** - filings due in next 7 days, documents expiring in 30 days
- **Recent activity feed** - audit log highlights
- **Quick actions** - view overdue filings, expiring documents, at-risk clients

### Messaging & Collaboration
- **Conversations** - chat-style messaging
- **Thread view** with message history
- **Unread indicators** and message counts
- **Link to clients** and service requests
- **Real-time updates** via server actions

### Background Jobs & Automation
- **Compliance refresh** - nightly recalculation of all client scores
- **Expiry notifications** - daily checks for documents expiring in 7/14/30 days
- **Filing reminders** - daily checks for filings due in 3/7/14 days
- **Email dispatcher** - automated email notifications (MVP stub, production-ready)
- **Job monitoring** - queue statistics and health checks

### Admin Features
- **Tenant management** - create and configure tenants
- **Tenant branding** - custom logos and colors per tenant
- **User management** - create users, assign roles, manage access
- **Password management** - secure password reset flow
- **Compliance rules** - create custom rule sets
- **System configuration** - defaults for currency, timezone, date format

## Tech Stack

- **Frontend/Backend**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth v5
- **Job Queue**: BullMQ + Redis
- **File Storage**: MinIO (S3-compatible)
- **UI**: Tailwind CSS + shadcn/ui
- **Containerization**: Docker + Docker Compose

## Quick Start with Docker (Recommended)

The fastest way to get started is using Docker Compose. **For production deployment, see [DEPLOYMENT.md](docs/DEPLOYMENT.md).**

### Prerequisites

- Docker 20+
- Docker Compose 2+

### Setup

1. Clone the repository:

\`\`\`bash
git clone https://github.com/kareemschultz/kaj-gcmc-saas-platform.git
cd kaj-gcmc-saas-platform
\`\`\`

2. Create environment file:

\`\`\`bash
cp .env.example .env

# Generate secure NEXTAUTH_SECRET (REQUIRED!)
openssl rand -base64 32

# Edit .env and set NEXTAUTH_SECRET to the generated value
\`\`\`

3. Start all services:

\`\`\`bash
docker-compose up -d
\`\`\`

4. Wait for services to be healthy:

\`\`\`bash
# Check health status
curl http://localhost:3000/api/health

# View logs
docker-compose logs -f app
\`\`\`

5. Run database migrations and seed (optional for development):

\`\`\`bash
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser

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

## Development Status

### ✅ Completed (Full Flagship Product)

#### Core Platform
- ✅ **Foundation** - Database schema, auth, multi-tenant architecture
- ✅ **Core CRUD** - All entities with full create/read/update/delete
- ✅ **Document Management** - MinIO integration, version control, presigned URLs
- ✅ **Workflows** - Service requests, recurring filings, task management
- ✅ **Compliance Engine** - Automated scoring, bundle tracking, expiry detection
- ✅ **Background Jobs** - BullMQ workers for compliance, notifications, reminders
- ✅ **Admin Dashboard** - Metrics, compliance overview, quick actions
- ✅ **Guyana Bundles** - 70+ document types, 19 pre-configured requirement bundles
- ✅ **Docker Deployment** - Complete docker-compose setup with all services

#### 🆕 Staff Wizards (NEW)
- ✅ **New Client Onboarding Wizard** - 5-step guided client setup with compliance bundles
- ✅ **Compliance Setup Wizard** - Configure authorities and bundles for existing clients
- ✅ **Service Request Wizard** - Create service requests with workflow configuration
- ✅ **Wizard Framework** - Reusable framework for building multi-step wizards

#### 🆕 Advanced Analytics (NEW)
- ✅ **Analytics Dashboard** - Comprehensive analytics with charts and trends
- ✅ **Compliance Trends** - Track compliance scores over time (6-month view)
- ✅ **Filing Trends** - Visualize filing activity and overdue patterns
- ✅ **Authority Analysis** - Deep dive into GRA, NIS, DCRA, Immigration metrics
- ✅ **Sector Analysis** - Compliance breakdown by industry sector
- ✅ **Risk Correlation** - Identify high-risk clients with multiple factors
- ✅ **Workload Metrics** - Task and service request distribution
- ✅ **Client Profile Analytics** - Individual client analytics with bundle progress

#### 🆕 Client Portal (NEW)
- ✅ **Portal Dashboard** - Client-facing dashboard with compliance status
- ✅ **Document Viewer** - View and download documents with expiry tracking
- ✅ **Filing History** - View filings grouped by authority
- ✅ **Service Tracking** - Track service request progress
- ✅ **Client Tasks** - View and manage assigned tasks
- ✅ **Secure Messaging** - Message threads with compliance team
- ✅ **Profile Management** - View client and business information
- ✅ **Multi-Tenant Isolation** - Complete data isolation for security

### 📅 Future Enhancements

- 📅 **OCR Pipeline** - Automated document text extraction
- 📅 **AI Summaries** - Smart document summaries and compliance insights
- 📅 **Custom Reporting** - Advanced report builder with exports
- 📅 **Mobile App** - iOS/Android companion apps
- 📅 **API Gateway** - Public API for third-party integrations
- 📅 **WhatsApp Integration** - Notifications via WhatsApp Business API
- 📅 **Payment Integration** - Online payments via Stripe/PayPal
- 📅 **Document Upload** - Client portal document upload feature

## Documentation

### 🚀 Production Deployment (Start Here!)
- [**Production Deployment Guide**](docs/DEPLOYMENT.md) - Complete production deployment guide
- [**Production Readiness Checklist**](docs/PRODUCTION_READINESS.md) - Pre-deployment checklist and status
- [Docker Setup](docs/DOCKER_SETUP.md) - Docker configuration details
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md) - Complete environment variable reference

### 🆕 New Features Documentation
- [**Wizards**](docs/WIZARDS.md) - Multi-step wizard system for staff workflows
- [**Analytics**](docs/ANALYTICS.md) - Advanced analytics dashboard and reporting
- [**Client Portal**](docs/CLIENT_PORTAL.md) - Self-service client portal features

### Implementation Guides
- [Requirement Bundles Implementation](docs/REQUIREMENT_BUNDLES_IMPLEMENTATION.md) - Guyana compliance bundles system
- [Workers Documentation](WORKERS_README.md) - Background jobs setup and monitoring
- [MinIO Setup](MINIO_SETUP.md) - Document storage configuration
- [MinIO Quick Start](MINIO_QUICK_START.md) - 5-minute MinIO guide

### Architecture & Development
- [System Specification](docs/SYSTEM_SPEC.md) - Complete system design
- [Architecture Overview](docs/ARCHITECTURE.md) - Technical architecture and design patterns
- [Developer Setup](docs/DEVELOPER_SETUP.md) - Local development environment setup
- [Authentication Flow](docs/AUTHENTICATION_FLOW.md) - NextAuth v5 implementation details
- [Storage & Uploads](docs/STORAGE_AND_UPLOADS.md) - File handling and MinIO integration

### Code Analysis & Audit
- [Codebase Analysis](CODEBASE_ANALYSIS.md) - Comprehensive codebase analysis
- [Analysis Summary](ANALYSIS_SUMMARY.md) - Quick overview of codebase structure
- [Detailed Issues](DETAILED_ISSUES.md) - Technical debt and improvement opportunities

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
