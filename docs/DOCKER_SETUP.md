# Docker Setup Guide

Complete guide to running KGC Compliance Cloud with Docker.

## Overview

The application uses Docker Compose to orchestrate four services:

1. **PostgreSQL** - Primary database
2. **Redis** - Job queue and caching
3. **MinIO** - S3-compatible object storage
4. **Next.js App** - Web application

## Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- 4GB+ available RAM
- 10GB+ available disk space

## Quick Start

### 1. Initial Setup

\`\`\`bash
# Clone repository
git clone <your-repo-url>
cd kgc-compliance-cloud

# Create environment file
cp .env.example .env

# Generate secure secret
# On Linux/Mac:
openssl rand -base64 32

# Edit .env and set NEXTAUTH_SECRET to the generated value
\`\`\`

### 2. Start Services

\`\`\`bash
# Build and start all services
docker-compose up -d

# Verify all services are healthy
docker-compose ps
\`\`\`

Expected output:
\`\`\`
NAME            STATUS          PORTS
kgc-postgres    Up (healthy)    0.0.0.0:5432->5432/tcp
kgc-redis       Up (healthy)    0.0.0.0:6379->6379/tcp
kgc-minio       Up (healthy)    0.0.0.0:9000-9001->9000-9001/tcp
kgc-app         Up              0.0.0.0:3000->3000/tcp
\`\`\`

### 3. Initialize Database

\`\`\`bash
# Run migrations
docker-compose exec app npx prisma migrate deploy

# Seed initial data
docker-compose exec app npm run db:seed
\`\`\`

### 4. Access Application

- **Web App**: http://localhost:3000
- **MinIO Console**: http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin`

**Test Credentials:**
- KAJ Admin: `kaj-admin@test.com` / `password123`
- GCMC Admin: `gcmc-admin@test.com` / `password123`

## Common Commands

### Service Management

\`\`\`bash
# Start services
docker-compose up -d

# Stop services (keeps data)
docker-compose stop

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop and remove everything including volumes
docker-compose down -v

# Restart a specific service
docker-compose restart app

# View logs
docker-compose logs -f app
docker-compose logs -f postgres
\`\`\`

### Development Workflow

\`\`\`bash
# Rebuild app after code changes
docker-compose build app
docker-compose up -d app

# Access app container shell
docker-compose exec app sh

# Run commands inside container
docker-compose exec app npm run db:studio
docker-compose exec app npx prisma migrate dev

# View real-time logs
docker-compose logs -f app
\`\`\`

### Database Management

\`\`\`bash
# Run migrations
docker-compose exec app npx prisma migrate deploy

# Create new migration
docker-compose exec app npx prisma migrate dev --name migration_name

# Open Prisma Studio
docker-compose exec app npx prisma studio
# Access at http://localhost:5555

# Seed database
docker-compose exec app npm run db:seed

# Access PostgreSQL directly
docker-compose exec postgres psql -U postgres -d kgc_compliance_cloud
\`\`\`

### MinIO Management

\`\`\`bash
# Access MinIO Console
# Open http://localhost:9001
# Login: minioadmin / minioadmin

# View MinIO logs
docker-compose logs -f minio

# Create bucket manually (if needed)
docker-compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker-compose exec minio mc mb local/documents
\`\`\`

## Docker Compose Configuration

### Services Overview

#### PostgreSQL
- Port: `5432`
- Database: `kgc_compliance_cloud`
- User: `postgres`
- Password: `postgres`
- Volume: `postgres_data`

#### Redis
- Port: `6379`
- Volume: `redis_data`

#### MinIO
- API Port: `9000`
- Console Port: `9001`
- Access Key: `minioadmin`
- Secret Key: `minioadmin`
- Volume: `minio_data`

#### Next.js App
- Port: `3000`
- Auto-runs migrations on startup
- Connects to services via Docker network

### Environment Variables in Docker

Key differences when running in Docker vs local:

\`\`\`env
# Database - uses service name "postgres"
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/kgc_compliance_cloud"

# Redis - uses service name "redis"
REDIS_URL="redis://redis:6379"

# MinIO - uses service name "minio"
MINIO_ENDPOINT="minio"
MINIO_PORT="9000"
\`\`\`

These are automatically set in `docker-compose.yml`.

## Troubleshooting

### App won't start

\`\`\`bash
# Check logs
docker-compose logs app

# Common issues:
# 1. Database not ready - wait for postgres healthcheck
# 2. Migrations failed - run manually:
docker-compose exec app npx prisma migrate deploy
\`\`\`

### Database connection errors

\`\`\`bash
# Verify postgres is healthy
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -c "SELECT 1"
\`\`\`

### MinIO connection errors

\`\`\`bash
# Verify MinIO is healthy
docker-compose ps minio

# Check MinIO logs
docker-compose logs minio

# Access MinIO console
# http://localhost:9001
\`\`\`

### Port conflicts

If ports are already in use:

\`\`\`yaml
# Edit docker-compose.yml to change port mappings
services:
  app:
    ports:
      - "3001:3000"  # Change host port
\`\`\`

### Clear all data and restart

\`\`\`bash
# WARNING: This deletes all data
docker-compose down -v
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed
\`\`\`

### Out of disk space

\`\`\`bash
# Clean up unused Docker resources
docker system prune -a --volumes

# Remove only stopped containers and unused volumes
docker system prune --volumes
\`\`\`

## Production Deployment

For production deployment:

1. **Update environment variables**:
   - Set strong `NEXTAUTH_SECRET`
   - Configure production database URL
   - Set up real SMTP credentials
   - Configure MinIO with SSL

2. **Use production-ready services**:
   - Managed PostgreSQL (e.g., Neon, AWS RDS)
   - Managed Redis (e.g., Upstash, AWS ElastiCache)
   - S3 or managed MinIO

3. **Enable SSL/TLS**:
   - Configure reverse proxy (nginx, Caddy)
   - Set up SSL certificates
   - Update MinIO to use HTTPS

4. **Set up monitoring**:
   - Application logs
   - Database performance
   - Storage usage

See deployment documentation for detailed production setup.

## Development Tips

### Hot Reloading

Code changes are reflected automatically via volume mounts:

\`\`\`yaml
volumes:
  - .:/app  # Syncs code changes
  - /app/node_modules  # Preserves dependencies
  - /app/.next  # Preserves build cache
\`\`\`

### Debugging

\`\`\`bash
# Add console.log statements to your code
# View logs in real-time
docker-compose logs -f app

# Use Node debugger
# Modify docker-compose.yml:
command: ["node", "--inspect=0.0.0.0:9229", "server.js"]
ports:
  - "9229:9229"
\`\`\`

### Testing Migrations

\`\`\`bash
# Create test migration
docker-compose exec app npx prisma migrate dev --name test_migration

# Reset database
docker-compose exec app npx prisma migrate reset

# Re-run migrations
docker-compose exec app npx prisma migrate deploy
\`\`\`

## Architecture Notes

### Networking

All services communicate via Docker's internal network:

- App → PostgreSQL: `postgres:5432`
- App → Redis: `redis:6379`
- App → MinIO: `minio:9000`

External access uses host port mappings.

### Data Persistence

Three volumes persist data:

- `postgres_data` - Database
- `redis_data` - Job queue state
- `minio_data` - Uploaded documents

Volumes persist even when containers are removed.

### Health Checks

All services have health checks:

- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`
- MinIO: HTTP health endpoint

App waits for healthy dependencies before starting.

## Next Steps

- Configure Gmail SMTP for notifications
- Set up backup procedures
- Review security settings
- Configure monitoring and alerts

See other docs for feature-specific setup.
