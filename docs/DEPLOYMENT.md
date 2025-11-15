# KGC Compliance Cloud - Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [Environment Variables](#environment-variables)
6. [Security Checklist](#security-checklist)
7. [Monitoring & Health Checks](#monitoring--health-checks)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ LTS (recommended) or compatible Linux distribution
- **Docker**: 20.10+ with Docker Compose V2
- **Node.js**: 20.x (for local development)
- **PostgreSQL**: 16+ (managed service recommended for production)
- **Redis**: 7+ (managed service recommended for production)
- **MinIO**: Latest (or S3-compatible storage)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 20GB for application + database

### Required Accounts
- PostgreSQL database (AWS RDS, Google Cloud SQL, or self-hosted)
- Redis instance (AWS ElastiCache, Upstash, or self-hosted)
- S3-compatible storage (AWS S3, MinIO, DigitalOcean Spaces, etc.)
- SMTP service (Gmail, SendGrid, AWS SES, etc.)
- (Optional) Sentry account for error tracking
- (Optional) OpenAI API key for AI features

---

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/kareemschultz/kaj-gcmc-saas-platform.git
cd kaj-gcmc-saas-platform
```

### 2. Create Environment File
```bash
cp .env.example .env
```

### 3. Generate Secure Secrets
```bash
# Generate NEXTAUTH_SECRET (CRITICAL!)
openssl rand -base64 32

# Generate MinIO credentials
openssl rand -hex 16  # For MINIO_ROOT_PASSWORD
openssl rand -hex 16  # For MINIO_SECRET_KEY
```

### 4. Configure Environment Variables
Edit `.env` and set all required variables:

```bash
# Database (Use managed PostgreSQL in production)
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# NextAuth (CRITICAL - Must be unique and secure)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="<output-from-openssl-command>"

# Redis
REDIS_URL="redis://your-redis-host:6379"
KV_URL="redis://your-redis-host:6379"

# MinIO / S3 Storage
MINIO_ENDPOINT="your-minio-host.com"
MINIO_PORT="9000"
MINIO_ROOT_USER="admin"
MINIO_ROOT_PASSWORD="<secure-password>"
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="<secure-password>"
MINIO_USE_SSL="true"  # IMPORTANT: Set to true in production!
MINIO_BUCKET_NAME="documents"

# SMTP (Configure your email service)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="<gmail-app-password>"
SMTP_FROM="Your App <noreply@yourdomain.com>"

# Application
NODE_ENV="production"
```

---

## Database Setup

### Option 1: Managed Database (Recommended)

**AWS RDS PostgreSQL:**
```bash
# Install AWS CLI
aws rds create-db-instance \
  --db-instance-identifier kgc-compliance-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --backup-retention-period 7 \
  --multi-az \
  --storage-encrypted
```

**Google Cloud SQL:**
```bash
gcloud sql instances create kgc-compliance-prod \
  --database-version=POSTGRES_16 \
  --tier=db-custom-2-8192 \
  --region=us-central1 \
  --backup \
  --enable-bin-log
```

### Option 2: Self-Hosted Database

```yaml
# docker-compose.production.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: kgc_compliance_cloud
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Run Database Migrations

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

---

## Docker Deployment

### 1. Build the Docker Image

```bash
# Build production image
docker-compose build

# Or build with specific tag
docker build -t kgc-compliance:latest .
```

### 2. Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Check service status
docker-compose ps
```

### 3. Verify Deployment

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-11-14T...",
#   "database": "connected"
# }
```

### 4. Create Initial Admin User

```bash
# Connect to the app container
docker-compose exec app sh

# Run Prisma Studio (or use seed script)
npx prisma studio

# Or use SQL directly
docker-compose exec postgres psql -U postgres kgc_compliance_cloud
```

Create admin user SQL:
```sql
-- Create a tenant
INSERT INTO "Tenant" (code, name, "createdAt", "updatedAt")
VALUES ('main', 'Main Organization', NOW(), NOW())
RETURNING id;

-- Create admin user (use bcrypt-hashed password)
INSERT INTO "User" (email, name, password, "emailVerified", "createdAt", "updatedAt")
VALUES ('admin@example.com', 'Admin User', '<bcrypt-hash>', NOW(), NOW(), NOW())
RETURNING id;

-- Link user to tenant with admin role
-- (Get role ID first)
SELECT id FROM "Role" WHERE name = 'admin';

INSERT INTO "TenantUser" ("userId", "tenantId", "roleId", "createdAt", "updatedAt")
VALUES (<user-id>, <tenant-id>, <role-id>, NOW(), NOW());
```

Generate bcrypt hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('YourSecurePassword', 12))"
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | NextAuth session encryption key | `<32+ char random string>` |
| `NEXTAUTH_URL` | Public URL of application | `https://app.yourdomain.com` |
| `MINIO_ENDPOINT` | S3/MinIO hostname | `s3.amazonaws.com` |
| `MINIO_ACCESS_KEY` | S3/MinIO access key | `AKIA...` |
| `MINIO_SECRET_KEY` | S3/MinIO secret key | `<secret>` |
| `SMTP_USER` | SMTP username | `smtp-user@example.com` |
| `SMTP_PASSWORD` | SMTP password | `<app-password>` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `SENTRY_DSN` | Sentry error tracking DSN | `none` |
| `OPENAI_API_KEY` | OpenAI API key for AI features | `""` |
| `LOG_LEVEL` | Logging level | `info` |

For complete list, see `.env.example`.

---

## Security Checklist

Before deploying to production, ensure:

### ✅ Secrets & Credentials
- [ ] `NEXTAUTH_SECRET` is unique and generated with `openssl rand -base64 32`
- [ ] All default passwords changed (MinIO, PostgreSQL, Redis)
- [ ] No hardcoded credentials in code
- [ ] `.env` file never committed to git
- [ ] Use secrets manager (AWS Secrets Manager, Vault, etc.) in production
- [ ] Database credentials rotated regularly

### ✅ HTTPS & Certificates
- [ ] SSL/TLS enabled for all services
- [ ] Valid SSL certificates installed
- [ ] HTTP redirects to HTTPS
- [ ] `MINIO_USE_SSL="true"` in production
- [ ] `NEXTAUTH_COOKIE_SECURE="true"` set

### ✅ Network Security
- [ ] Firewall configured (allow only 80, 443, 22)
- [ ] Database not publicly accessible
- [ ] Redis not publicly accessible
- [ ] MinIO console not publicly accessible
- [ ] VPC/private networking configured

### ✅ Application Security
- [ ] Authentication middleware enabled
- [ ] RBAC checks implemented for admin functions
- [ ] Input validation on all forms
- [ ] Rate limiting configured
- [ ] CORS headers properly set
- [ ] CSP headers configured

### ✅ Data Security
- [ ] Database encryption at rest enabled
- [ ] Database backups configured (7+ day retention)
- [ ] S3/MinIO bucket encryption enabled
- [ ] File upload size limits enforced
- [ ] Sensitive data properly redacted in logs

### ✅ Monitoring & Logging
- [ ] Error tracking configured (Sentry)
- [ ] Application logs aggregated
- [ ] Database slow query logging enabled
- [ ] Health check endpoint monitored
- [ ] Alerts configured for critical errors

---

## Monitoring & Health Checks

### Health Check Endpoint

```bash
# Application health
curl https://your-domain.com/api/health

# Response when healthy:
{
  "status": "healthy",
  "timestamp": "2025-11-14T12:00:00.000Z",
  "database": "connected"
}

# Response when unhealthy:
{
  "status": "unhealthy",
  "timestamp": "2025-11-14T12:00:00.000Z",
  "database": "disconnected",
  "error": "Connection timeout"
}
```

### Docker Health Checks

The Dockerfile includes automatic health checks:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

### Monitoring Metrics

Key metrics to monitor:
- **Response Time**: p50, p95, p99 latencies
- **Error Rate**: 4xx and 5xx responses
- **Database Connections**: Active connection count
- **Memory Usage**: Application and database memory
- **Disk Usage**: Database and file storage usage
- **Request Rate**: Requests per minute

### Recommended Tools
- **APM**: New Relic, Datadog, or AppSignal
- **Logs**: ELK Stack, Grafana Loki, or CloudWatch
- **Uptime**: UptimeRobot, Pingdom, or StatusCake
- **Errors**: Sentry (already integrated)

---

## Troubleshooting

### Application Won't Start

**Problem**: Application fails to start or immediately exits

**Solutions**:
```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. Database connection failed
# - Verify DATABASE_URL is correct
# - Ensure database is running and accessible
# - Check firewall rules

# 2. Missing NEXTAUTH_SECRET
# - Set NEXTAUTH_SECRET in .env
# - Use: openssl rand -base64 32

# 3. Prisma Client not generated
docker-compose exec app npx prisma generate
docker-compose restart app

# 4. Migrations not run
docker-compose exec app npx prisma migrate deploy
```

### Database Connection Errors

**Problem**: `Error: P1001: Can't reach database server`

**Solutions**:
```bash
# Test database connection
docker-compose exec app npx prisma db execute --stdin <<< "SELECT 1"

# Check database is running
docker-compose ps postgres

# Verify connection string format
# Correct: postgresql://user:pass@host:5432/dbname?schema=public
# Wrong: postgresql://user:pass@host:5432/dbname  # Missing ?schema=public

# For Docker: use service name as hostname
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/kgc_compliance_cloud?schema=public"

# For external: use full hostname
DATABASE_URL="postgresql://user:pass@your-db-host.com:5432/dbname?schema=public"
```

### Import Resolution Errors

**Problem**: `Module not found: Can't resolve '@/lib/...'`

**Solutions**:
```bash
# Verify tsconfig.json paths
cat tsconfig.json | grep -A 3 paths

# Should be:
# "paths": {
#   "@/*": ["./*"]
# }

# Rebuild with clean cache
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### MinIO Connection Errors

**Problem**: `Cannot upload files` or `S3 connection failed`

**Solutions**:
```bash
# Check MinIO is running
docker-compose ps minio

# Verify MinIO credentials
docker-compose exec minio mc alias set local \
  http://localhost:9000 \
  $MINIO_ROOT_USER \
  $MINIO_ROOT_PASSWORD

# Create bucket if missing
docker-compose exec minio mc mb local/documents

# Verify bucket policy
docker-compose exec minio mc policy set download local/documents
```

### WSL2-Specific Issues

**Problem**: Docker volumes not persisting or slow performance

**Solutions**:
```bash
# Move project to WSL2 filesystem (not /mnt/c/)
cd ~
git clone https://github.com/kareemschultz/kaj-gcmc-saas-platform.git
cd kaj-gcmc-saas-platform

# Increase WSL2 memory
# Edit %UserProfile%\.wslconfig:
[wsl2]
memory=8GB
processors=4

# Restart WSL2
wsl --shutdown
```

### Email Not Sending

**Problem**: Emails not being delivered

**Solutions**:
```bash
# Check SMTP credentials
docker-compose exec app node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});
transport.verify().then(() => console.log('✅ SMTP OK')).catch(console.error);
"

# For Gmail: Ensure App Password is used
# Generate at: https://myaccount.google.com/apppasswords

# Check email queue (if using background jobs)
docker-compose logs worker
```

---

## Production Best Practices

### 1. Use Managed Services
- **Database**: AWS RDS, Google Cloud SQL
- **Redis**: AWS ElastiCache, Upstash
- **Storage**: AWS S3, Google Cloud Storage
- **Email**: SendGrid, AWS SES

### 2. Enable Auto-scaling
- Configure horizontal pod autoscaling (Kubernetes)
- Use load balancers (ALB, NLB)
- Set up CloudFront or CDN for static assets

### 3. Implement CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and Push Docker Image
        run: |
          docker build -t kgc-compliance:${{ github.sha }} .
          docker push kgc-compliance:${{ github.sha }}
      - name: Deploy to Production
        run: |
          # Your deployment script here
```

### 4. Regular Maintenance
- Update dependencies monthly: `pnpm update`
- Run security audits: `pnpm audit`
- Monitor disk usage
- Review and rotate logs
- Test disaster recovery procedures

### 5. Backup Strategy
- **Database**: Automated daily backups with 7+ day retention
- **Files**: S3 versioning enabled
- **Configuration**: Infrastructure as Code (Terraform/CloudFormation)
- **Secrets**: Secrets manager with versioning

---

## Support & Resources

- **Documentation**: `/docs` directory
- **Issues**: GitHub Issues
- **Architecture**: `docs/ARCHITECTURE.md`
- **Environment Variables**: `docs/ENVIRONMENT_VARIABLES.md`
- **Docker Setup**: `docs/DOCKER_SETUP.md`

---

**Last Updated**: 2025-11-14  
**Version**: 1.0.0 (Production Ready)
