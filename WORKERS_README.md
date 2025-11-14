# Background Job Workers - KGC Compliance Cloud

This document describes the background job worker system for the KGC Compliance Cloud platform. The system uses BullMQ for job queuing and Redis for job storage.

## Overview

The background job system handles:
- **Compliance Score Calculations** - Nightly refresh of compliance scores
- **Document Expiry Notifications** - Daily checks for expiring documents
- **Filing Reminders** - Daily checks for upcoming filing deadlines
- **Email Dispatch** - Continuous processing of queued emails

## Architecture

```
┌─────────────────┐
│   Application   │
│    (Next.js)    │
└────────┬────────┘
         │
         ├─ Enqueue Jobs (via job-helpers.ts)
         │
         ▼
┌─────────────────┐
│   Redis Queue   │
│    (BullMQ)     │
└────────┬────────┘
         │
         ├─ compliance
         ├─ expiry-notification
         ├─ filing-reminder
         └─ email
         │
         ▼
┌─────────────────┐
│  Job Workers    │
│  (Background)   │
└─────────────────┘
```

## Files Structure

```
src/
├── lib/
│   ├── redis.ts              # Redis connection configuration
│   ├── queues.ts             # BullMQ queue definitions
│   └── job-helpers.ts        # Helper functions to enqueue jobs
│
└── jobs/
    ├── worker.ts             # Main entry point to run all workers
    ├── scheduler.ts          # Job scheduler with cron schedules
    ├── compliance-refresh.ts # Compliance score worker
    ├── expiry-notifications.ts # Document expiry worker
    ├── filing-reminders.ts   # Filing reminder worker
    └── email-dispatcher.ts   # Email dispatch worker
```

## Environment Variables

The worker system requires the following environment variables:

```bash
# Required
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Optional (for production email sending)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@kgc-compliance.com
```

## Running Workers

### Development

Run workers in development mode with auto-reload:

```bash
npm run worker:dev
# or
tsx watch src/jobs/worker.ts
```

### Production

Run workers in production mode:

```bash
npm run worker
# or
tsx src/jobs/worker.ts
```

### Using Process Manager (PM2)

For production deployment, use PM2 to manage the worker process:

```bash
# Install PM2
npm install -g pm2

# Start workers
pm2 start tsx --name "kgc-workers" -- src/jobs/worker.ts

# View logs
pm2 logs kgc-workers

# Restart workers
pm2 restart kgc-workers

# Stop workers
pm2 stop kgc-workers

# Delete workers
pm2 delete kgc-workers
```

## Job Schedules

All scheduled jobs use cron expressions (timezone: UTC):

| Job | Schedule | Cron | Description |
|-----|----------|------|-------------|
| Compliance Refresh | Daily at 2:00 AM | `0 2 * * *` | Calculates compliance scores for all clients |
| Expiry Notifications | Daily at 8:00 AM | `0 8 * * *` | Checks for documents expiring in 7, 14, 30 days |
| Filing Reminders | Daily at 8:00 AM | `0 8 * * *` | Checks for filings due in 3, 7, 14 days |
| Email Dispatcher | Continuous | N/A | Processes emails from queue every 5 minutes |

## Docker Integration

### Docker Compose

Add the following service to your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # ... existing services (app, db, etc.)

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  workers:
    build:
      context: .
      dockerfile: Dockerfile
    command: npm run worker
    depends_on:
      - db
      - redis
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - EMAIL_FROM=${EMAIL_FROM}
    restart: unless-stopped
    volumes:
      - ./src:/app/src
      - ./prisma:/app/prisma

volumes:
  redis-data:
  # ... other volumes
```

### Running with Docker Compose

```bash
# Start all services (including workers)
docker-compose up -d

# View worker logs
docker-compose logs -f workers

# Restart workers only
docker-compose restart workers

# Stop all services
docker-compose down
```

### Standalone Docker Container

Build and run workers in a standalone Docker container:

```bash
# Build the image
docker build -t kgc-workers .

# Run the container
docker run -d \
  --name kgc-workers \
  --network host \
  -e DATABASE_URL="postgresql://user:pass@localhost:5432/dbname" \
  -e REDIS_URL="redis://localhost:6379" \
  kgc-workers \
  npm run worker

# View logs
docker logs -f kgc-workers

# Stop and remove
docker stop kgc-workers
docker rm kgc-workers
```

## Usage in Application Code

### Enqueuing Jobs Manually

You can trigger jobs manually from your application code:

```typescript
import {
  enqueueComplianceRefresh,
  enqueueExpiryCheck,
  enqueueFilingReminder,
  enqueueEmail,
} from '@/src/lib/job-helpers';

// Trigger compliance refresh for a specific tenant
await enqueueComplianceRefresh(tenantId, {
  triggeredBy: 'manual',
  priority: 1, // Higher priority
});

// Trigger expiry check for all tenants
await enqueueExpiryCheck();

// Trigger filing reminder check
await enqueueFilingReminder(tenantId);

// Send a custom email
await enqueueEmail({
  recipientEmail: 'user@example.com',
  recipientName: 'John Doe',
  subject: 'Compliance Alert',
  template: 'compliance-alert',
  data: {
    clientName: 'ACME Corp',
    complianceScore: 65,
    complianceLevel: 'amber',
    issues: ['Missing TIN Certificate', 'VAT Filing Overdue'],
    recommendations: ['Upload TIN Certificate', 'Submit VAT Filing'],
  },
  tenantId: 1,
});
```

### Monitoring Queue Statistics

```typescript
import {
  getAllQueueStats,
  getQueueStats,
} from '@/src/lib/job-helpers';

// Get stats for all queues
const allStats = await getAllQueueStats();
console.log(allStats);
/*
{
  compliance: { waiting: 0, active: 1, completed: 150, failed: 2, ... },
  'expiry-notification': { ... },
  'filing-reminder': { ... },
  email: { ... }
}
*/

// Get stats for a specific queue
const emailStats = await getQueueStats('email');
console.log(emailStats);
```

### Queue Management

```typescript
import {
  pauseQueue,
  resumeQueue,
  cleanupQueue,
} from '@/src/lib/job-helpers';

// Pause a queue (stops processing)
await pauseQueue('email');

// Resume a paused queue
await resumeQueue('email');

// Clean up old jobs (older than 7 days)
await cleanupQueue('email', {
  completedAge: 7 * 24 * 60 * 60 * 1000,
  failedAge: 7 * 24 * 60 * 60 * 1000,
});
```

## Worker Details

### 1. Compliance Refresh Worker

**Purpose**: Calculate and update compliance scores for all clients

**Schedule**: Daily at 2:00 AM UTC

**Process**:
1. Fetches all tenants (or specific tenant if provided)
2. For each tenant, calls `refreshTenantCompliance()` from compliance engine
3. Calculates compliance scores based on:
   - Required documents (missing, expired, expiring)
   - Filing status (overdue, upcoming)
4. Updates `ComplianceScore` table with results

**Configuration**:
- Concurrency: 1 (processes one tenant at a time)
- Rate limit: 5 jobs per minute

### 2. Expiry Notifications Worker

**Purpose**: Notify users about documents expiring soon

**Schedule**: Daily at 8:00 AM UTC

**Process**:
1. Finds documents expiring in 7, 14, or 30 days
2. Creates in-app notifications for relevant users (admins, managers, compliance officers)
3. Queues email notifications
4. Respects tenant boundaries

**Notification Recipients**:
- Tenant admins
- Managers
- Compliance officers

**Configuration**:
- Concurrency: 2
- Notification thresholds: 7, 14, 30 days

### 3. Filing Reminders Worker

**Purpose**: Notify users about upcoming filing deadlines

**Schedule**: Daily at 8:00 AM UTC

**Process**:
1. Finds filings due in 3, 7, or 14 days (status: draft or prepared)
2. Marks urgent filings (3 days or less)
3. Creates notifications for:
   - Tenant-wide users (admins, managers, tax preparers, compliance officers)
   - Specific task assignees for each filing
4. Queues email notifications

**Configuration**:
- Concurrency: 2
- Reminder thresholds: 3, 7, 14 days
- Urgency levels: 3 days = URGENT, 7 days = HIGH, 14 days = NORMAL

### 4. Email Dispatcher Worker

**Purpose**: Process and send queued emails

**Schedule**: Continuous (processes queue as jobs arrive)

**Process**:
1. Receives email job from queue
2. Formats email based on template
3. **MVP**: Logs email to console (stub)
4. **Production**: Sends via SMTP/SendGrid/AWS SES
5. Updates notification `channelStatus` to 'sent' or 'failed'

**Email Templates**:
- `document-expiry` - Document expiration notices
- `filing-reminder` - Filing deadline reminders
- `compliance-alert` - Compliance score alerts

**Configuration**:
- Concurrency: 5 (processes up to 5 emails concurrently)
- Rate limit: 100 emails per minute

**Production Setup**:

To enable actual email sending in production, uncomment the nodemailer code in `/src/jobs/email-dispatcher.ts` and set the required environment variables.

## Monitoring and Debugging

### View Job Logs

All workers log to console with structured logging:

```bash
# Development
npm run worker:dev

# Production (with PM2)
pm2 logs kgc-workers

# Docker
docker-compose logs -f workers
```

### Access BullMQ Dashboard (Optional)

Install and run Bull Board for a web-based queue dashboard:

```bash
# Install dependencies
npm install @bull-board/api @bull-board/express

# Create a simple Express server (e.g., src/jobs/dashboard.ts)
# See: https://github.com/felixmosh/bull-board
```

### Redis CLI

Connect to Redis to inspect queues directly:

```bash
# Connect to Redis
redis-cli

# View all keys
KEYS *

# View queue data
LRANGE bull:compliance:waiting 0 -1
HGETALL bull:compliance:1

# Monitor Redis commands in real-time
MONITOR
```

## Troubleshooting

### Workers Not Starting

**Problem**: Workers fail to start

**Solutions**:
1. Check Redis connection:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```
2. Verify `REDIS_URL` environment variable
3. Check worker logs for errors
4. Ensure database is accessible

### Jobs Not Processing

**Problem**: Jobs stuck in queue

**Solutions**:
1. Check if queue is paused:
   ```typescript
   const queue = complianceQueue;
   const isPaused = await queue.isPaused();
   if (isPaused) await queue.resume();
   ```
2. Check worker concurrency settings
3. Verify Redis memory (not full)
4. Check for errors in worker logs

### Jobs Failing Repeatedly

**Problem**: Jobs fail and retry continuously

**Solutions**:
1. Check worker logs for error details
2. Verify database connections
3. Check tenant data integrity
4. Increase retry attempts or backoff delay in queue options
5. Manually inspect failed jobs:
   ```typescript
   const failedJobs = await complianceQueue.getFailed();
   console.log(failedJobs);
   ```

### High Memory Usage

**Problem**: Redis consuming too much memory

**Solutions**:
1. Clean up old jobs:
   ```typescript
   await cleanupQueue('email', {
     completedAge: 24 * 60 * 60 * 1000, // 1 day
   });
   ```
2. Adjust job retention settings in `/src/lib/queues.ts`
3. Configure Redis maxmemory policy:
   ```bash
   # In redis.conf
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

## Best Practices

1. **Graceful Shutdown**: Always use `Ctrl+C` or `pm2 stop` to stop workers gracefully
2. **Monitoring**: Set up alerts for failed jobs and queue backlogs
3. **Rate Limiting**: Adjust rate limits based on your infrastructure capacity
4. **Tenant Isolation**: All jobs respect tenant boundaries
5. **Error Handling**: Workers continue processing other tenants even if one fails
6. **Logging**: Use structured logging for easy debugging and monitoring
7. **Idempotency**: Jobs are designed to be idempotent (safe to retry)

## Production Checklist

- [ ] Redis instance configured and running
- [ ] `REDIS_URL` environment variable set
- [ ] Database accessible from worker environment
- [ ] SMTP credentials configured (for email sending)
- [ ] Process manager (PM2) or Docker container configured
- [ ] Log aggregation set up (e.g., CloudWatch, Datadog)
- [ ] Monitoring and alerts configured
- [ ] Auto-restart on failure enabled
- [ ] Resource limits configured (CPU, memory)
- [ ] Backup Redis data (AOF or RDB)

## Support

For issues or questions:
1. Check worker logs
2. Review queue statistics
3. Inspect failed jobs
4. Contact DevOps team

---

**Last Updated**: 2025-11-14
**Version**: 1.0.0
