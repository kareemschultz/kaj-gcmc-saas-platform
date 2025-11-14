# KGC Compliance Cloud - Setup Instructions

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 20+** and npm/yarn/pnpm
- **PostgreSQL 15+**
- **Redis 7+** (for BullMQ job queue)
- **MinIO** (or access to S3-compatible storage)

## Local Development Setup

### 1. Clone and Install

\`\`\`bash
git clone <repository-url>
cd kgc-compliance-cloud
npm install
\`\`\`

### 2. Environment Configuration

Copy the example environment file:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and configure:

**Database:**
\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/kgc_compliance_cloud"
\`\`\`

**Authentication:**
\`\`\`env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-a-random-secret>"
\`\`\`

Generate a secure secret:
\`\`\`bash
openssl rand -base64 32
\`\`\`

**Redis:**
\`\`\`env
REDIS_URL="redis://localhost:6379"
\`\`\`

**MinIO:**
\`\`\`env
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_USE_SSL="false"
MINIO_BUCKET_NAME="kgc-documents"
\`\`\`

### 3. Database Setup

Create the database:
\`\`\`bash
createdb kgc_compliance_cloud
\`\`\`

Generate Prisma client:
\`\`\`bash
npm run db:generate
\`\`\`

Run migrations:
\`\`\`bash
npm run db:migrate
\`\`\`

Seed the database with initial data:
\`\`\`bash
npm run db:seed
\`\`\`

### 4. Start Redis

\`\`\`bash
redis-server
\`\`\`

### 5. Start MinIO

Download and run MinIO:
\`\`\`bash
# macOS (Homebrew)
brew install minio/stable/minio
minio server ./data

# Linux
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
./minio server ./data

# Windows
# Download from https://min.io/download and run
\`\`\`

### 6. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### 7. Login

Use the seeded test credentials:

**KAJ Administrator:**
- Email: `admin@kaj.gy`
- Password: `admin123`

**KAJ Compliance Officer:**
- Email: `compliance@kaj.gy`
- Password: `user123`

**GCMC Administrator:**
- Email: `admin@gcmc.gy`
- Password: `admin123`

## Database Management Commands

- **Generate Prisma Client:** `npm run db:generate`
- **Create Migration:** `npm run db:migrate`
- **Deploy Migrations (Production):** `npm run db:migrate:deploy`
- **Open Prisma Studio:** `npm run db:studio`
- **Re-seed Database:** `npm run db:seed`

## Project Structure

\`\`\`
├── app/                      # Next.js App Router
│   ├── auth/                 # Authentication pages
│   ├── dashboard/            # Main application pages
│   └── api/                  # API routes
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Database migrations
│   └── seed.ts               # Seed data script
├── src/
│   ├── components/           # React components
│   │   ├── auth/             # Auth-related components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                  # Utility libraries
│   │   ├── prisma.ts         # Prisma client
│   │   ├── auth.ts           # Auth utilities
│   │   ├── validation.ts     # Zod schemas
│   │   ├── storage.ts        # MinIO client
│   │   └── queue.ts          # BullMQ queues
│   ├── types/                # TypeScript types
│   └── config/               # Configuration files
└── docs/                     # Documentation
\`\`\`

## Next Steps

After setup, you can:

1. Explore the dashboard at `/dashboard`
2. View clients, documents, and filings
3. Create new clients and manage compliance data
4. Access Prisma Studio to view database: `npm run db:studio`

## Troubleshooting

**Database connection errors:**
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env matches your PostgreSQL credentials

**Redis connection errors:**
- Verify Redis is running: `redis-cli ping` (should return `PONG`)
- Check REDIS_URL in .env

**MinIO errors:**
- Verify MinIO is running on port 9000
- Check MinIO credentials match .env configuration
- Access MinIO console at http://localhost:9000

**Build errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Regenerate Prisma client: `npm run db:generate`

## Production Deployment

For Vercel deployment:

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy with `npm run db:migrate:deploy` in build command

See deployment documentation for detailed instructions.
\`\`\`
