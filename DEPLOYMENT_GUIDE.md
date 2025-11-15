# KGC Compliance Cloud - Deployment Guide

**Version:** 1.0.0-rc
**Last Updated:** 2025-01-15

This guide covers deploying the KGC Compliance Cloud SaaS platform to production.

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment (Recommended)](#docker-deployment-recommended)
4. [Manual Deployment](#manual-deployment)
5. [Production Deployment (Vercel + External Services)](#production-deployment-vercel--external-services)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## 🔍 Pre-Deployment Checklist

Before deploying, ensure you have:

### Required Services
- [ ] **PostgreSQL 16+** database instance
- [ ] **Redis 7+** instance for job queue
- [ ] **MinIO** or **S3-compatible** storage
- [ ] **Node.js 20+** runtime
- [ ] **Docker** (for containerized deployment)

### Required Credentials
- [ ] Database connection string
- [ ] Redis connection URL
- [ ] MinIO/S3 access keys
- [ ] SMTP credentials (optional but recommended)
- [ ] OpenAI API key (optional, for AI features)

### Code Preparation
- [ ] All code pushed to Git repository
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Seed data reviewed

---

## 🔧 Environment Setup

### 1. Create Environment File

Copy the example and fill in your values:

```bash
cp .env.example .env
```

### 2. Required Environment Variables

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@host:5432/database_name"

# Auth (REQUIRED)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.com"  # or http://localhost:3000 for local

# MinIO/S3 Storage (REQUIRED)
MINIO_ENDPOINT="minio"  # or "s3.amazonaws.com" for AWS
MINIO_PORT="9000"
MINIO_USE_SSL="false"  # "true" for production
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
MINIO_BUCKET_NAME="documents"

# Redis (REQUIRED)
REDIS_HOST="redis"  # or your Redis host
REDIS_PORT="6379"
REDIS_PASSWORD=""  # if required
REDIS_URL="redis://redis:6379"  # full connection string
KV_URL="redis://redis:6379"  # for Vercel KV compatibility

# Email (RECOMMENDED)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="KGC Compliance <noreply@your-domain.com>"

# Optional Features
OPENAI_API_KEY=""  # For AI document summaries
OCR_PROVIDER=""  # tesseract, google-vision, aws-textract
SENTRY_DSN=""  # Error tracking
WHATSAPP_API_KEY=""  # WhatsApp notifications
WHATSAPP_PHONE_NUMBER=""  # WhatsApp sender
```

### 3. Generate Secrets

```bash
# Generate NextAuth secret
openssl rand -base64 32

# For additional security, you can generate:
openssl rand -hex 32  # Alternative format
```

---

## 🐳 Docker Deployment (Recommended)

### Option A: Docker Compose (Easiest)

**Perfect for:** Development, staging, small-scale production

#### 1. Ensure Docker is Running

```bash
docker --version
docker-compose --version
```

#### 2. Update docker-compose.yml

The file already contains:
- PostgreSQL database
- Redis cache
- MinIO object storage
- Next.js app
- Background job worker

#### 3. Start All Services

```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f app

# Check status
docker-compose ps
```

#### 4. Run Database Migrations

```bash
# Execute migrations inside the app container
docker-compose exec app npx prisma migrate deploy

# Or use the dev command for first-time setup
docker-compose exec app npx prisma migrate dev --name initial_schema
```

#### 5. Seed the Database

```bash
docker-compose exec app npm run db:seed
```

#### 6. Verify Deployment

```bash
# Check app is running
curl http://localhost:3000/api/health

# Access the application
open http://localhost:3000
```

#### 7. Service URLs

- **Application:** http://localhost:3000
- **MinIO Console:** http://localhost:9001 (login: minioadmin/minioadmin)
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

#### Common Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# Rebuild app after code changes
docker-compose build app
docker-compose up -d app

# View worker logs
docker-compose logs -f worker

# Access database shell
docker-compose exec postgres psql -U postgres -d kgc_compliance_cloud

# Access Redis CLI
docker-compose exec redis redis-cli
```

---

## 📦 Manual Deployment

### Option B: Manual Setup (Full Control)

**Perfect for:** Custom infrastructure, cloud VMs

#### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

#### 2. Set Up External Services

Ensure you have running instances of:
- PostgreSQL (port 5432)
- Redis (port 6379)
- MinIO (ports 9000, 9001)

#### 3. Configure Environment

Update `.env` with your service URLs:

```env
DATABASE_URL="postgresql://user:pass@your-postgres-host:5432/dbname"
REDIS_URL="redis://your-redis-host:6379"
MINIO_ENDPOINT="your-minio-host"
```

#### 4. Generate Prisma Client

```bash
npx prisma generate
```

#### 5. Run Migrations

```bash
npx prisma migrate deploy
```

#### 6. Seed Database

```bash
npm run db:seed
```

#### 7. Build Application

```bash
npm run build
```

#### 8. Start Application

```bash
# Production mode
npm run start

# Development mode
npm run dev
```

#### 9. Start Background Worker

In a separate terminal/process:

```bash
node jobs/worker.js
```

---

## ☁️ Production Deployment (Vercel + External Services)

### Option C: Vercel Deployment

**Perfect for:** Scalable production, automatic deployments

#### 1. Prepare External Services

You'll need managed services for:

**Database:**
- Neon (PostgreSQL) - https://neon.tech
- Supabase - https://supabase.com
- AWS RDS
- DigitalOcean Managed Database

**Redis:**
- Upstash - https://upstash.com
- Redis Cloud - https://redis.com
- AWS ElastiCache

**Storage:**
- AWS S3
- DigitalOcean Spaces
- Cloudflare R2
- Self-hosted MinIO on VPS

#### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Production deployment
vercel --prod
```

#### 3. Configure Environment Variables in Vercel

Go to your project settings and add all environment variables from `.env`:

```bash
# Or use CLI
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add REDIS_URL
# ... etc
```

#### 4. Run Migrations

```bash
# From your local machine (connected to production DB)
npx prisma migrate deploy

# Or use Vercel CLI
vercel env pull .env.production.local
npx prisma migrate deploy
```

#### 5. Deploy Background Worker Separately

**Background jobs can't run on Vercel.** Deploy to:

- **DigitalOcean App Platform**
- **AWS ECS/Fargate**
- **Railway** - https://railway.app
- **Render** - https://render.com
- **Self-hosted VPS**

Example Dockerfile for worker:

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate

CMD ["node", "jobs/worker.js"]
```

#### 6. Configure Custom Domain

In Vercel dashboard:
1. Go to Domains
2. Add your domain (e.g., compliance.kgcgroup.gy)
3. Configure DNS records
4. Update NEXTAUTH_URL environment variable

---

## ✅ Post-Deployment Verification

### 1. Health Checks

```bash
# API health
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "storage": "connected"
}
```

### 2. Test Authentication

1. Navigate to `/auth/login`
2. Login with seed credentials:
   - Email: `admin@kaj.gy`
   - Password: `admin123`
3. Verify redirect to `/dashboard`
4. Check session is active

### 3. Test Core Functionality

- [ ] Create a client
- [ ] Upload a document
- [ ] Create a filing
- [ ] Assign a task
- [ ] View analytics
- [ ] Check compliance scores

### 4. Test Background Jobs

```bash
# Check Redis queues
redis-cli -h your-redis-host

# List queues
keys bull:*

# Check job counts
llen bull:document-processing:wait
llen bull:notifications:wait
```

### 5. Monitor Logs

**Docker:**
```bash
docker-compose logs -f app
docker-compose logs -f worker
```

**Vercel:**
```bash
vercel logs
```

**Manual:**
```bash
pm2 logs  # if using PM2
tail -f logs/app.log
```

---

## 🚨 Troubleshooting

### Issue: Database Connection Failed

**Error:** `Can't reach database server`

**Solutions:**
1. Check DATABASE_URL is correct
2. Ensure database is running: `docker-compose ps postgres`
3. Verify network connectivity
4. Check firewall rules
5. Ensure database user has permissions

```bash
# Test connection
docker-compose exec postgres psql -U postgres -c '\l'
```

### Issue: MinIO Connection Failed

**Error:** `MinIO connection error`

**Solutions:**
1. Verify MinIO is running: `docker-compose ps minio`
2. Check MINIO_ENDPOINT is correct
3. Ensure bucket exists
4. Verify access credentials

```bash
# Access MinIO console
open http://localhost:9001

# Or create bucket via CLI
docker-compose exec app node -e "require('./scripts/setup-minio.ts')"
```

### Issue: Redis Connection Failed

**Error:** `Redis connection refused`

**Solutions:**
1. Check Redis is running: `docker-compose ps redis`
2. Verify REDIS_URL is correct
3. Test connection:

```bash
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Issue: Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```bash
npx prisma generate
```

### Issue: Migration Errors

**Error:** `Migration failed`

**Solutions:**
1. Reset database (DEV ONLY):
```bash
npx prisma migrate reset
```

2. Check migration history:
```bash
npx prisma migrate status
```

3. Manually resolve conflicts:
```bash
npx prisma migrate resolve --applied "migration_name"
```

### Issue: Build Errors on Vercel

**Error:** `Build failed`

**Solutions:**
1. Check Node.js version: Update `package.json`:
```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

2. Ensure environment variables are set in Vercel dashboard
3. Check build logs for specific errors
4. Disable type checking temporarily:
```json
// next.config.js
{
  typescript: {
    ignoreBuildErrors: false  // Change to true temporarily
  }
}
```

### Issue: Worker Not Processing Jobs

**Error:** Jobs stuck in queue

**Solutions:**
1. Check worker is running:
```bash
docker-compose logs worker
```

2. Verify Redis connection
3. Check job errors:
```bash
redis-cli
LRANGE bull:notifications:failed 0 10
```

4. Restart worker:
```bash
docker-compose restart worker
```

---

## 🔒 Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Use strong NEXTAUTH_SECRET (32+ characters)
- [ ] Enable HTTPS (TLS/SSL)
- [ ] Configure CORS properly
- [ ] Set secure cookie flags (production)
- [ ] Enable database SSL connection
- [ ] Restrict database access by IP
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting (future)
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure backup strategy
- [ ] Review RBAC permissions
- [ ] Test audit logging

---

## 📊 Monitoring & Maintenance

### Recommended Tools

- **Sentry** - Error tracking
- **Uptime Robot** - Uptime monitoring
- **DataDog** - Performance monitoring
- **Grafana + Prometheus** - Metrics
- **LogRocket** - Session replay

### Backup Strategy

**Database:**
```bash
# Daily backup via cron
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

**MinIO/S3:**
```bash
# Use MinIO mc tool or AWS CLI
mc mirror minio/documents ./backups/documents
```

---

## 📞 Support

### Getting Help

1. Check logs first
2. Review this guide
3. Check `docs/` folder
4. Review GitHub issues
5. Contact development team

### Useful Commands

```bash
# View all containers
docker ps -a

# Check disk usage
docker system df

# Clean up
docker system prune

# Database shell
docker-compose exec postgres psql -U postgres

# App shell
docker-compose exec app sh

# View environment
docker-compose exec app env | grep -E 'DATABASE|REDIS|MINIO'
```

---

## 🎯 Quick Start Summary

For the fastest deployment:

```bash
# 1. Clone & setup
git clone <your-repo>
cd kaj-gcmc-saas-platform
cp .env.example .env
# Edit .env with your values

# 2. Start services
docker-compose up -d

# 3. Initialize database
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed

# 4. Access application
open http://localhost:3000

# 5. Login
# Email: admin@kaj.gy
# Password: admin123
```

---

**Last Updated:** 2025-01-15
**Maintained by:** Development Team
