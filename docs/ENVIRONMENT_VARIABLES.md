# Environment Variables Reference

Complete guide to all environment variables used in KGC Compliance Cloud.

## Quick Reference

\`\`\`env
# Core Services
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kgc_compliance_cloud"
REDIS_URL="redis://localhost:6379"
KV_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="GENERATE_A_SECURE_RANDOM_VALUE"

# Storage (MinIO)
MINIO_ENDPOINT="minio"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_USE_SSL="false"
MINIO_BUCKET_NAME="documents"

# Email (Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"
SMTP_FROM="Compliance Cloud <no-reply@yourdomain.com>"

# AI/OCR (Disabled for now)
OCR_PROVIDER="none"
OPENAI_API_KEY="your-openai-key"

# Notifications (Disabled)
WHATSAPP_API_KEY="none"
WHATSAPP_PHONE_NUMBER="none"

# Monitoring (Disabled)
SENTRY_DSN="none"

# Environment
NODE_ENV="development"
\`\`\`

## Detailed Configuration

### Database

#### DATABASE_URL
- **Required**: Yes
- **Description**: PostgreSQL connection string
- **Format**: `postgresql://[user]:[password]@[host]:[port]/[database]?schema=public`
- **Docker**: `postgresql://postgres:postgres@postgres:5432/kgc_compliance_cloud`
- **Local**: `postgresql://postgres:postgres@localhost:5432/kgc_compliance_cloud`
- **Example**: `postgresql://user:pass@localhost:5432/mydb?schema=public`

### Authentication (NextAuth)

#### NEXTAUTH_URL
- **Required**: Yes
- **Description**: Public URL where the application is accessible
- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`
- **Note**: Must match actual domain for OAuth callbacks

#### NEXTAUTH_SECRET
- **Required**: Yes
- **Description**: Secret key for encrypting JWT tokens
- **Generation**: `openssl rand -base64 32`
- **Security**: NEVER commit to version control
- **Length**: Minimum 32 characters
- **Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

### Redis (Job Queue)

#### REDIS_URL / KV_URL
- **Required**: Yes
- **Description**: Redis connection string for BullMQ job queue
- **Format**: `redis://[host]:[port]`
- **Docker**: `redis://redis:6379`
- **Local**: `redis://localhost:6379`
- **With Auth**: `redis://:[password]@[host]:[port]`

### Storage (MinIO)

#### MINIO_ENDPOINT
- **Required**: Yes
- **Description**: MinIO server hostname
- **Docker**: `minio` (Docker service name)
- **Local**: `localhost`
- **Production**: Your MinIO domain or S3 endpoint

#### MINIO_PORT
- **Required**: Yes
- **Description**: MinIO API port
- **Default**: `9000`
- **Note**: Different from console port (9001)

#### MINIO_ACCESS_KEY
- **Required**: Yes
- **Description**: MinIO access key (like AWS Access Key ID)
- **Default**: `minioadmin`
- **Production**: Create strong unique key

#### MINIO_SECRET_KEY
- **Required**: Yes
- **Description**: MinIO secret key (like AWS Secret Access Key)
- **Default**: `minioadmin`
- **Production**: Create strong random secret
- **Security**: NEVER commit to version control

#### MINIO_USE_SSL
- **Required**: Yes
- **Description**: Whether to use HTTPS for MinIO connections
- **Values**: `true` or `false`
- **Local/Docker**: `false`
- **Production**: `true` (highly recommended)

#### MINIO_BUCKET_NAME
- **Required**: Yes
- **Description**: S3 bucket name for storing documents
- **Default**: `documents`
- **Note**: Auto-created on first run
- **Format**: lowercase, no spaces, alphanumeric and hyphens

### Email (SMTP)

#### SMTP_HOST
- **Required**: For email features
- **Description**: SMTP server hostname
- **Gmail**: `smtp.gmail.com`
- **Outlook**: `smtp.office365.com`
- **SendGrid**: `smtp.sendgrid.net`

#### SMTP_PORT
- **Required**: For email features
- **Description**: SMTP server port
- **TLS**: `587` (recommended)
- **SSL**: `465`
- **Unencrypted**: `25` (not recommended)

#### SMTP_USER
- **Required**: For email features
- **Description**: SMTP authentication username
- **Gmail**: Your full email address
- **Format**: `your-email@gmail.com`

#### SMTP_PASSWORD
- **Required**: For email features
- **Description**: SMTP authentication password
- **Gmail**: Use App Password, NOT your regular password
- **How to get Gmail App Password**:
  1. Enable 2FA on your Google account
  2. Go to https://myaccount.google.com/apppasswords
  3. Generate app password for "Mail"
  4. Use the 16-character password
- **Security**: NEVER commit to version control

#### SMTP_FROM
- **Required**: For email features
- **Description**: "From" address for outgoing emails
- **Format**: `"Display Name <email@domain.com>"`
- **Example**: `"Compliance Cloud <no-reply@yourdomain.com>"`
- **Note**: Must be authorized sender for your SMTP provider

### AI and OCR

#### OCR_PROVIDER
- **Required**: No (Phase 4 feature)
- **Description**: OCR service provider
- **Values**: `none`, `tesseract`, `aws`, `google`
- **Current**: `none` (disabled)
- **Future**: Will enable document text extraction

#### OPENAI_API_KEY
- **Required**: No (Phase 4 feature)
- **Description**: OpenAI API key for AI features
- **Current**: Placeholder only
- **Future**: Will enable document summarization and AI assistance
- **Get Key**: https://platform.openai.com/api-keys

### Notifications (Currently Disabled)

#### WHATSAPP_API_KEY
- **Required**: No
- **Description**: WhatsApp Business API key
- **Current**: `none` (disabled)
- **Future**: Will enable WhatsApp notifications

#### WHATSAPP_PHONE_NUMBER
- **Required**: No
- **Description**: WhatsApp Business phone number
- **Current**: `none` (disabled)
- **Format**: International format with country code

### Monitoring

#### SENTRY_DSN
- **Required**: No
- **Description**: Sentry error tracking DSN
- **Current**: `none` (disabled)
- **Get DSN**: https://sentry.io/
- **Production**: Highly recommended for error monitoring

### System

#### NODE_ENV
- **Required**: No (auto-detected)
- **Description**: Node.js environment mode
- **Values**: `development`, `production`, `test`
- **Development**: Enables verbose logging, hot reloading
- **Production**: Optimizes performance, reduces logging

## Docker vs Local Development

### Docker Compose

When running with Docker, service names are used for internal networking:

\`\`\`env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/kgc_compliance_cloud"
REDIS_URL="redis://redis:6379"
MINIO_ENDPOINT="minio"
\`\`\`

### Local Development

When running services locally, use `localhost`:

\`\`\`env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kgc_compliance_cloud"
REDIS_URL="redis://localhost:6379"
MINIO_ENDPOINT="localhost"
\`\`\`

## Security Best Practices

### Development

1. **Never commit `.env` files** - Always in `.gitignore`
2. **Use `.env.example`** - Template with placeholder values
3. **Generate strong secrets** - Use `openssl rand -base64 32`
4. **Rotate regularly** - Change secrets periodically

### Production

1. **Use environment variables** - Never hardcode secrets
2. **Use secrets management** - AWS Secrets Manager, Vault, etc.
3. **Enable SSL/TLS** - HTTPS everywhere
4. **Restrict access** - Firewall rules, VPC, security groups
5. **Monitor access** - Audit logs for secret access
6. **Use managed services** - Reduces attack surface

## Validation

The application validates required environment variables on startup. Missing or invalid values will prevent the app from starting.

### Common Errors

\`\`\`
Error: NEXTAUTH_SECRET is not set
Solution: Add NEXTAUTH_SECRET to .env file
\`\`\`

\`\`\`
Error: Failed to connect to database
Solution: Verify DATABASE_URL and ensure PostgreSQL is running
\`\`\`

\`\`\`
Error: MinIO connection refused
Solution: Verify MINIO_ENDPOINT and ensure MinIO is accessible
\`\`\`

## Testing Configuration

\`\`\`bash
# Test database connection
docker-compose exec app npx prisma db push

# Test MinIO connection
docker-compose exec app node -e "
const { minioClient } = require('./src/lib/storage.ts');
minioClient.listBuckets().then(console.log).catch(console.error);
"

# Test Redis connection
docker-compose exec app node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping().then(console.log).catch(console.error);
"
\`\`\`

## Migration from Old Configuration

If you have an existing `.env` file with old variable names:

1. Backup existing file: `cp .env .env.backup`
2. Copy new template: `cp .env.example .env`
3. Transfer values from backup to new format
4. Update service hostnames for Docker compatibility
5. Test application startup

## Support

For configuration issues:
1. Check logs: `docker-compose logs app`
2. Verify services: `docker-compose ps`
3. Review this documentation
4. Contact development team
