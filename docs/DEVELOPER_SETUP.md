# Developer Setup Guide

Complete guide for setting up your local development environment.

## Prerequisites

### Required Software

- **Node.js**: 20.x or higher
- **pnpm**: 8.x or higher (recommended) or npm/yarn
- **Docker**: 20.10+ and Docker Compose 2.0+
- **Git**: 2.x or higher
- **Code Editor**: VS Code recommended

### Optional Tools

- **PostgreSQL Client**: psql, pgAdmin, or TablePlus
- **Redis Client**: RedisInsight or redis-cli
- **API Testing**: Postman or Insomnia

## Initial Setup

### 1. Clone Repository

\`\`\`bash
git clone <repository-url>
cd kgc-compliance-cloud
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
\`\`\`

### 3. Environment Configuration

\`\`\`bash
# Copy environment template
cp .env.example .env

# Generate secure secret
openssl rand -base64 32

# Edit .env and set NEXTAUTH_SECRET
nano .env
\`\`\`

### 4. Start Infrastructure Services

#### Option A: Docker Compose (Recommended)

\`\`\`bash
# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f
\`\`\`

#### Option B: Local Services

If you prefer running services locally:

\`\`\`bash
# Start PostgreSQL
brew services start postgresql@15
# or
sudo systemctl start postgresql

# Start Redis
brew services start redis
# or
sudo systemctl start redis

# Start MinIO
minio server /data --console-address ":9001"
\`\`\`

Update `.env` to use `localhost`:

\`\`\`env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kgc_compliance_cloud"
REDIS_URL="redis://localhost:6379"
MINIO_ENDPOINT="localhost"
\`\`\`

### 5. Initialize Database

\`\`\`bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
\`\`\`

### 6. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Open http://localhost:3000 in your browser.

## Test Credentials

After seeding, use these credentials:

**KAJ Tenant:**
- Admin: `kaj-admin@test.com` / `password123`
- Manager: `kaj-manager@test.com` / `password123`
- Associate: `kaj-associate@test.com` / `password123`

**GCMC Tenant:**
- Admin: `gcmc-admin@test.com` / `password123`

## Development Workflow

### Making Code Changes

1. **Create feature branch**

\`\`\`bash
git checkout -b feature/your-feature-name
\`\`\`

2. **Make changes**

Hot reloading is enabled - changes appear immediately.

3. **Test changes**

\`\`\`bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Test in browser
open http://localhost:3000
\`\`\`

4. **Commit changes**

\`\`\`bash
git add .
git commit -m "feat: description of your changes"
\`\`\`

### Database Changes

#### Create Migration

\`\`\`bash
# Make changes to prisma/schema.prisma
# Then create migration
npm run db:migrate

# Name your migration descriptively
# Example: "add_client_notes_field"
\`\`\`

#### Reset Database

\`\`\`bash
# WARNING: This deletes all data
npx prisma migrate reset

# Then reseed
npm run db:seed
\`\`\`

#### View Database

\`\`\`bash
# Open Prisma Studio
npm run db:studio

# Access at http://localhost:5555
\`\`\`

### Adding New Dependencies

\`\`\`bash
# Add runtime dependency
pnpm add package-name

# Add dev dependency
pnpm add -D package-name

# Update lockfile
pnpm install
\`\`\`

### Code Organization

Follow these patterns:

\`\`\`typescript
// Server Actions (src/lib/actions/*.ts)
export async function createClient(data: CreateClientInput) {
  // 1. Get session and tenant context
  // 2. Validate input with Zod
  // 3. Perform database operation
  // 4. Create audit log
  // 5. Return result
}

// Components (src/components/**/*.tsx)
// - Use TypeScript
// - Extract reusable logic to hooks
// - Keep components focused and small

// Database queries (always include tenantId)
const clients = await prisma.client.findMany({
  where: { tenantId: session.user.tenantId },
});
\`\`\`

## VS Code Setup

### Recommended Extensions

\`\`\`json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next"
  ]
}
\`\`\`

### Settings

Create `.vscode/settings.json`:

\`\`\`json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
\`\`\`

## Debugging

### Next.js Debugging

Add to `.vscode/launch.json`:

\`\`\`json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
\`\`\`

### Prisma Debugging

\`\`\`bash
# Enable query logging
export DEBUG="prisma:query"
npm run dev

# View generated SQL
npx prisma generate --watch
\`\`\`

### MinIO Debugging

Access MinIO Console:
- URL: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin`

View buckets and uploaded files.

## Common Issues

### Port Already in Use

\`\`\`bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
\`\`\`

### Database Connection Error

\`\`\`bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check connection
docker-compose exec postgres psql -U postgres -c "SELECT 1"

# Verify DATABASE_URL in .env
echo $DATABASE_URL
\`\`\`

### Prisma Client Out of Sync

\`\`\`bash
# Regenerate Prisma Client
npm run db:generate

# Restart dev server
\`\`\`

### MinIO Connection Error

\`\`\`bash
# Check if MinIO is running
docker-compose ps minio

# Check logs
docker-compose logs minio

# Test connection
curl http://localhost:9000/minio/health/live
\`\`\`

### Module Not Found

\`\`\`bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Restart dev server
npm run dev
\`\`\`

## Testing

### Manual Testing

1. Test authentication flow
2. Test client CRUD operations
3. Test document upload
4. Test filing creation with documents
5. Test filtering and pagination

### Database Testing

\`\`\`sql
-- Connect to database
docker-compose exec postgres psql -U postgres -d kgc_compliance_cloud

-- View tenants
SELECT * FROM "Tenant";

-- View users
SELECT id, email, "tenantId", role FROM "User";

-- View clients count per tenant
SELECT "tenantId", COUNT(*) FROM "Client" GROUP BY "tenantId";
\`\`\`

## Performance Tips

### Development Speed

\`\`\`bash
# Use Turbopack (faster bundler)
npm run dev --turbo

# Reduce bundling time
# Comment out unused imports
\`\`\`

### Database Performance

\`\`\`bash
# View slow queries
docker-compose exec postgres psql -U postgres -d kgc_compliance_cloud
\x
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
\`\`\`

## Git Workflow

### Branch Naming

- Feature: `feature/description`
- Bug fix: `fix/description`
- Hotfix: `hotfix/description`
- Refactor: `refactor/description`

### Commit Messages

Follow conventional commits:

\`\`\`
feat: add client risk scoring
fix: correct filing date validation
docs: update setup instructions
refactor: extract auth helpers
test: add client creation tests
\`\`\`

### Pull Request Process

1. Create feature branch
2. Make changes with clear commits
3. Test thoroughly locally
4. Push to remote
5. Create PR with description
6. Request review
7. Address feedback
8. Merge after approval

## Next Steps

- Review [Architecture](ARCHITECTURE.md)
- Read [System Specification](SYSTEM_SPEC.md)
- Check [Docker Setup](DOCKER_SETUP.md)
- Explore Phase 2 features

## Getting Help

- Check documentation in `/docs`
- Review existing code for patterns
- Ask team for guidance
- Check error logs: `docker-compose logs -f app`

## Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
