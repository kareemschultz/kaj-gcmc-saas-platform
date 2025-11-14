# Observability & Monitoring Guide

## Overview

KGC Compliance Cloud implements comprehensive observability through structured logging, health checks, and monitoring-ready metrics. The system is designed to integrate with self-hosted or cloud-based observability tools.

## Logging System

### Architecture

The platform uses a centralized logging system (`src/lib/logger.ts`) that outputs structured JSON logs in production and human-readable logs in development.

### Log Levels

| Level | Use Case | Example |
|-------|----------|---------|
| **debug** | Development troubleshooting | Function entry/exit, variable values |
| **info** | Normal operations | User login, resource creation, job completion |
| **warn** | Recoverable issues | Rate limit approaching, deprecated API use |
| **error** | Application errors | Failed operations, exceptions, system errors |

### Usage

\`\`\`typescript
import { logger } from '@/lib/logger';

// Info - successful operation
logger.info('User created successfully', {
  userId: user.id,
  tenantId: user.tenantId,
  role: user.role,
});

// Warning - potential issue
logger.warn('Document expiring soon', {
  documentId: doc.id,
  clientId: doc.clientId,
  daysUntilExpiry: 7,
});

// Error - operation failed
logger.error('Failed to send email notification', error, {
  userId: user.id,
  emailType: 'welcome',
  attempt: 3,
});

// Debug - development only
logger.debug('Cache hit', {
  key: cacheKey,
  ttl: 3600,
});
\`\`\`

### Log Format

**Development** (human-readable):
\`\`\`
[2025-11-14T12:00:00.000Z] INFO: User logged in {"userId":123,"tenantId":1}
\`\`\`

**Production** (structured JSON):
\`\`\`json
{
  "timestamp": "2025-11-14T12:00:00.000Z",
  "level": "info",
  "message": "User logged in",
  "userId": 123,
  "tenantId": 1
}
\`\`\`

### Log Locations

Logs are output to stdout/stderr and can be collected by:
- Docker logs: `docker-compose logs -f app`
- File: Redirect stdout to file in production
- Log collectors: Fluentd, Filebeat, Promtail

## Health Checks

### Endpoint: `/api/health`

Comprehensive health check endpoint for monitoring and load balancers.

### Response Format

**Healthy State** (200 OK):
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2025-11-14T12:00:00.000Z",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 5
    },
    "redis": {
      "status": "not_configured"
    },
    "storage": {
      "status": "not_configured"
    }
  },
  "version": "1.0.0",
  "uptime": 3600
}
\`\`\`

**Degraded State** (200 OK):
\`\`\`json
{
  "status": "degraded",
  "timestamp": "2025-11-14T12:00:00.000Z",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 8
    },
    "redis": {
      "status": "down"
    },
    "storage": {
      "status": "not_configured"
    }
  },
  "version": "1.0.0",
  "uptime": 3600
}
\`\`\`

**Unhealthy State** (503 Service Unavailable):
\`\`\`json
{
  "status": "unhealthy",
  "timestamp": "2025-11-14T12:00:00.000Z",
  "checks": {
    "database": {
      "status": "down"
    },
    "redis": {
      "status": "down"
    },
    "storage": {
      "status": "down"
    }
  },
  "error": "Connection timeout"
}
\`\`\`

### Status Definitions

- **healthy**: All critical services operational
- **degraded**: Critical services up, optional services down (Redis, MinIO)
- **unhealthy**: Critical service (database) down

### Integration

**Docker Health Check**:
\`\`\`yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
\`\`\`

**Load Balancer Health Check**:
- **Path**: `/api/health`
- **Expected**: HTTP 200
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Unhealthy threshold**: 2 consecutive failures

**Uptime Monitoring**:
- UptimeRobot, Pingdom, StatusCake can monitor this endpoint
- Configure alerts for status != "healthy"

## Log Collection & Analysis

### Recommended Tools (Self-Hosted)

#### 1. Grafana Loki Stack

**Components**:
- **Loki**: Log aggregation
- **Promtail**: Log shipper
- **Grafana**: Visualization

**Setup**:
\`\`\`yaml
# docker-compose.yml addition
loki:
  image: grafana/loki:latest
  ports:
    - "3100:3100"

promtail:
  image: grafana/promtail:latest
  volumes:
    - /var/lib/docker/containers:/var/lib/docker/containers:ro
    - ./promtail-config.yml:/etc/promtail/config.yml
  command: -config.file=/etc/promtail/config.yml

grafana:
  image: grafana/grafana:latest
  ports:
    - "3000:3000"
\`\`\`

**Query Examples**:
\`\`\`
{app="kgc-compliance"} |= "error"
{app="kgc-compliance"} | json | level="error" | userId="123"
rate({app="kgc-compliance"} |= "User logged in" [5m])
\`\`\`

#### 2. OpenSearch/Elasticsearch Stack

**Components**:
- **OpenSearch**: Search and analytics
- **Filebeat**: Log shipper
- **OpenSearch Dashboards**: Visualization

**Use Cases**:
- Full-text log search
- Complex log analysis
- Compliance audit trails

#### 3. GlitchTip (Self-Hosted Sentry Alternative)

**Features**:
- Error tracking
- Performance monitoring
- Release tracking

**Integration**:
\`\`\`typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
\`\`\`

### Cloud-Based Options

| Tool | Use Case | Cost Model |
|------|----------|------------|
| **CloudWatch** | AWS deployments | Pay per GB |
| **Google Cloud Logging** | GCP deployments | Pay per GB |
| **Datadog** | Enterprise APM | Subscription |
| **New Relic** | Full-stack monitoring | Subscription |
| **Sentry** | Error tracking | Free tier available |

## Metrics & Monitoring

### Application Metrics (Planned)

**Business Metrics**:
- Active users (per tenant)
- Documents uploaded (per day)
- Filings submitted (per day)
- Compliance scores (average, by tenant)
- Failed operations (by type)

**Technical Metrics**:
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (errors/total requests)
- Database query time
- Background job queue length

**System Metrics**:
- CPU usage
- Memory usage
- Disk usage
- Network I/O

### Prometheus Integration (Planned)

\`\`\`typescript
// app/api/metrics/route.ts
import promClient from 'prom-client';

const register = new promClient.Registry();

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

register.registerMetric(httpRequestDuration);

export async function GET() {
  const metrics = await register.metrics();
  return new Response(metrics, {
    headers: { 'Content-Type': register.contentType },
  });
}
\`\`\`

## Alerting

### Critical Alerts

**Severity: P0 (Immediate Response)**
- Database down (health check fails)
- Application crashes (container restarts)
- Authentication system down

**Severity: P1 (1 hour response)**
- High error rate (>5% of requests)
- Slow response time (p95 > 2s)
- Background jobs failing (>10% failure rate)

**Severity: P2 (Next business day)**
- Redis down (degraded state)
- MinIO down (degraded state)
- Disk usage > 80%

### Alert Configuration Examples

**UptimeRobot**:
- Monitor `/api/health` every 5 minutes
- Alert if response != 200 or contains "unhealthy"
- Notification channels: Email, Slack, PagerDuty

**Grafana Alerts**:
\`\`\`
rate({app="kgc-compliance"} |= "error" [5m]) > 10
# Alert if more than 10 errors per minute
\`\`\`

## Performance Monitoring

### Response Time Tracking

\`\`\`typescript
import { logger } from '@/lib/logger';

export async function someOperation() {
  const start = Date.now();
  
  try {
    // ... operation
    
    const duration = Date.now() - start;
    logger.info('Operation completed', {
      operation: 'someOperation',
      duration,
    });
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Operation failed', error, {
      operation: 'someOperation',
      duration,
    });
  }
}
\`\`\`

### Database Query Monitoring

Prisma query logging is enabled in development:

\`\`\`typescript
// src/lib/prisma.ts
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});
\`\`\`

For production, use Prisma's built-in metrics or extensions.

## Audit Logging

All critical operations are logged:

**User Actions**:
- Login/logout
- User creation/deletion
- Role changes
- Permission changes

**Data Operations**:
- Client creation/deletion
- Document uploads
- Filing submissions
- Service request changes

**System Operations**:
- Configuration changes
- Backup operations
- Migration runs

**Format**:
\`\`\`json
{
  "timestamp": "2025-11-14T12:00:00.000Z",
  "level": "info",
  "message": "User created",
  "actor": {
    "userId": 1,
    "email": "admin@example.com",
    "role": "FirmAdmin"
  },
  "action": "create_user",
  "resource": {
    "type": "user",
    "id": 123
  },
  "tenantId": 1
}
\`\`\`

## Troubleshooting with Logs

### Common Queries

**Find errors for specific user**:
\`\`\`bash
docker-compose logs app | grep -E '"userId":123' | grep '"level":"error"'
\`\`\`

**Find slow operations**:
\`\`\`bash
docker-compose logs app | grep -E '"duration":[5-9][0-9]{3}' # > 5 seconds
\`\`\`

**Find failed authentications**:
\`\`\`bash
docker-compose logs app | grep "Auth error"
\`\`\`

**Find RBAC denials**:
\`\`\`bash
docker-compose logs app | grep "Permission denied"
\`\`\`

## Best Practices

1. **Log Contextual Information**: Always include userId, tenantId, relevant IDs
2. **Use Appropriate Log Levels**: Don't log info as error or vice versa
3. **Avoid Logging Secrets**: Never log passwords, tokens, API keys
4. **Structured Logging**: Use objects for context, not string concatenation
5. **Monitor Health Checks**: Set up automated monitoring
6. **Set Up Alerts**: Don't wait for users to report issues
7. **Review Logs Regularly**: Look for patterns and anomalies
8. **Rotate Logs**: Implement log rotation to manage disk space

---

**Last Updated**: 2025-11-14  
**Version**: 1.0.0
