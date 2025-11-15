# KGC Compliance Cloud – Deployment Guide

This guide will help you deploy the full production-ready KGC Compliance Cloud platform using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- At least 4GB RAM available
- Ports 3000, 5432, 6379, 9000, 9001 available

## Quick Start (Local Development with Docker)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd kaj-gcmc-saas-platform
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your settings:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kgc_compliance_cloud?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# Redis
REDIS_URL="redis://localhost:6379"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_USE_SSL="false"

# SMTP (optional, for email notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"
SMTP_FROM="Compliance Cloud <no-reply@yourdomain.com>"
```

### 3. Start Infrastructure Services

```bash
# Start Postgres, Redis, and MinIO
docker-compose up -d postgres redis minio
```

Wait for services to be healthy:

```bash
docker-compose ps
```

All services should show "healthy" status.

### 4. Run Database Migrations

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:deploy

# Seed database with initial data
npm run db:seed
```

### 5. Setup MinIO Buckets

```bash
# Initialize MinIO buckets for tenants
npm run setup:minio
```

Access MinIO Console at `http://localhost:9001`:
- Username: `minioadmin`
- Password: `minioadmin`

### 6. Start the Application

```bash
# Start the Next.js app
npm run dev
```

Or with Docker:

```bash
docker-compose up -d app
```

Access the application at `http://localhost:3000`

### 7. Start Background Workers

```bash
# Start the worker service
docker-compose up -d worker
```

Or locally:

```bash
npm run worker:dev
```

### 8. Verify Everything is Running

Check all services:

```bash
docker-compose ps
```

You should see:
- `kgc-postgres` (healthy)
- `kgc-redis` (healthy)
- `kgc-minio` (healthy)
- `kgc-app` (up)
- `kgc-worker` (up)

## Default Login Credentials

After seeding, you can log in with:

```
Email: admin@kaj.com
Password: <check seed.ts for default password>
```

Or:

```
Email: admin@gcmc.com
Password: <check seed.ts for default password>
```

## Production Deployment

### 1. Build for Production

```bash
# Build the Docker image
docker-compose build
```

### 2. Update Environment Variables

Update `docker-compose.yml` or create a `.env.production` file with:

- Secure `NEXTAUTH_SECRET` (use `openssl rand -base64 32`)
- Production `DATABASE_URL`
- Production `REDIS_URL`
- Production MinIO credentials
- Production SMTP settings

### 3. Use Secure Passwords

Replace all default passwords:

```yaml
# In docker-compose.yml
postgres:
  environment:
    POSTGRES_PASSWORD: <strong-random-password>

minio:
  environment:
    MINIO_ROOT_USER: <custom-admin-user>
    MINIO_ROOT_PASSWORD: <strong-random-password>
```

### 4. Enable SSL/TLS

For production:

- Configure MinIO with SSL
- Use HTTPS for the web app (behind a reverse proxy like Nginx)
- Set `MINIO_USE_SSL="true"`

### 5. Start All Services

```bash
docker-compose up -d
```

### 6. Setup Reverse Proxy (Nginx example)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7. Setup SSL with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com
```

## Service Architecture

### Core Services

| Service | Port | Purpose |
|---------|------|---------|
| **App** | 3000 | Next.js web application |
| **Worker** | - | Background job processor |
| **Postgres** | 5432 | Primary database |
| **Redis** | 6379 | Job queue & caching |
| **MinIO** | 9000 (API), 9001 (Console) | Document storage |

### Data Volumes

- `postgres_data` - Database files
- `redis_data` - Redis persistence
- `minio_data` - Uploaded documents

## Background Jobs

The worker service runs these scheduled jobs:

| Job | Schedule | Purpose |
|-----|----------|---------|
| **Compliance Refresh** | Daily at 2 AM | Recalculate compliance scores |
| **Expiry Notifications** | Daily at 8 AM | Alert users about expiring documents |
| **Filing Reminders** | Daily at 8 AM | Remind about upcoming filing deadlines |
| **Email Dispatcher** | Continuous | Process queued emails |

View worker logs:

```bash
docker-compose logs -f worker
```

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f worker
docker-compose logs -f postgres
```

### Database Backups

```bash
# Backup
docker exec kgc-postgres pg_dump -U postgres kgc_compliance_cloud > backup.sql

# Restore
docker exec -i kgc-postgres psql -U postgres kgc_compliance_cloud < backup.sql
```

### Health Checks

Access health check endpoints:

- App: `http://localhost:3000/api/health`
- MinIO: `http://localhost:9000/minio/health/live`
- Postgres: `docker exec kgc-postgres pg_isready`
- Redis: `docker exec kgc-redis redis-cli ping`

### Prisma Studio (Database GUI)

```bash
npm run db:studio
```

Access at `http://localhost:5555`

## Scaling

### Horizontal Scaling

For production, you can scale workers:

```bash
docker-compose up -d --scale worker=3
```

### Database Connection Pooling

Update `DATABASE_URL` to use connection pooling:

```
postgresql://user:password@host:5432/db?pgbouncer=true&connection_limit=20
```

## Troubleshooting

### App won't start

1. Check if all dependencies are installed: `npm install`
2. Verify environment variables are set correctly
3. Ensure Postgres migrations have run: `npm run db:migrate:deploy`

### Database connection errors

1. Check Postgres is running: `docker-compose ps postgres`
2. Verify `DATABASE_URL` matches Docker service name
3. Check logs: `docker-compose logs postgres`

### MinIO upload fails

1. Verify MinIO is running: `docker-compose ps minio`
2. Run setup script: `npm run setup:minio`
3. Check buckets exist in MinIO Console: `http://localhost:9001`

### Worker jobs not running

1. Check Redis is running: `docker-compose ps redis`
2. Verify worker is up: `docker-compose ps worker`
3. Check worker logs: `docker-compose logs -f worker`
4. Inspect queue stats: Use Redis CLI to check job queues

### Email notifications not sending

1. Verify SMTP credentials are correct
2. Check worker logs for email job errors
3. For Gmail, ensure "App Passwords" are enabled
4. Verify `SMTP_FROM` is a valid email address

## Updates & Migrations

### Applying Schema Changes

```bash
# Development
npm run db:migrate

# Production
npm run db:migrate:deploy
```

### Updating the Application

```bash
# Pull latest code
git pull

# Rebuild Docker images
docker-compose build

# Stop services
docker-compose down

# Start with new images
docker-compose up -d

# Run any new migrations
docker exec kgc-app npm run db:migrate:deploy
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Generate secure `NEXTAUTH_SECRET`
- [ ] Enable SSL/TLS for production
- [ ] Restrict database access to app network only
- [ ] Use environment-specific `.env` files
- [ ] Enable firewall rules
- [ ] Regular security updates
- [ ] Set up automated backups
- [ ] Configure Sentry for error tracking (optional)
- [ ] Implement rate limiting (API Gateway or Nginx)

## Performance Optimization

### Database

- Enable connection pooling
- Add database indexes (already included in schema)
- Regular VACUUM and ANALYZE operations

### Caching

- Redis is already configured for sessions and queues
- Consider adding Redis caching for frequently accessed data

### File Storage

- Use CDN in front of MinIO for document downloads
- Enable MinIO caching policies

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review logs for error messages
3. Check GitHub Issues: `<repository-url>/issues`
4. Review documentation in `/docs` folder

## Additional Documentation

- [Workers README](./WORKERS_README.md) - Background jobs documentation
- [MinIO Setup](./MINIO_SETUP.md) - Document storage guide
- [Requirement Bundles](./docs/REQUIREMENT_BUNDLES_IMPLEMENTATION.md) - Compliance bundles guide
- [Migration Guide](./MIGRATION_GUIDE_BUNDLES.md) - Database migration guide

## Success! 🎉

You now have a fully functional, production-ready multi-tenant compliance management platform running with:

✅ Multi-tenant SaaS architecture
✅ Complete CRUD interfaces for all entities
✅ Guyana-specific compliance bundles
✅ Admin dashboard with metrics
✅ Background job processing
✅ Secure document storage
✅ Audit logging
✅ Email notifications

Access your application at `http://localhost:3000` and start managing compliance operations!
