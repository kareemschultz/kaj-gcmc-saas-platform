# Detailed Issue List - KGC Compliance Cloud SaaS Platform

## CRITICAL ISSUES TO ADDRESS

### 1. IMPORT PATH INCONSISTENCIES (168 affected imports)

#### Files with @/src/lib/actions/* imports (should be @/lib/actions/*)

**Server Actions Using Incorrect Imports:**
```
/home/user/kaj-gcmc-saas-platform/src/lib/actions/document-types.ts:6-8
/home/user/kaj-gcmc-saas-platform/src/lib/actions/filing-types.ts:6-8
/home/user/kaj-gcmc-saas-platform/src/lib/actions/tasks.ts:6-8
/home/user/kaj-gcmc-saas-platform/src/lib/actions/notifications.ts:6-8
/home/user/kaj-gcmc-saas-platform/src/lib/actions/compliance-rules.ts:6-8
/home/user/kaj-gcmc-saas-platform/src/lib/actions/service-requests.ts:6-8
/home/user/kaj-gcmc-saas-platform/src/lib/actions/recurring-filings.ts:6-8
```

**Pattern to fix:**
```typescript
// WRONG
import { prisma } from '@/src/lib/prisma';
import { ApiError } from '@/src/lib/errors';
import { logger } from '@/src/lib/logger';

// CORRECT
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
```

#### All App Pages Using @/src/lib/actions/* (40+ files)

**List of 40+ pages to fix:**
```
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/filings/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/filings/[id]/page.tsx:10
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/filings/new/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/filings/overdue/page.tsx:9
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/filings/recurring/page.tsx:7-8
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/filings/recurring/toggle-active-button.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/filings/recurring/[id]/page.tsx:7-8
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/filings/recurring/[id]/delete-button.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/filings/recurring/new/page.tsx:7-8
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/clients/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/clients/[id]/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/documents/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/documents/[id]/page.tsx:7-8
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/documents/new/page.tsx:7-8
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/documents/expiring/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/document-types/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/document-types/[id]/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/services/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/services/requests/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/services/requests/[id]/page.tsx:7-8
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/services/requests/new/page.tsx:7-8
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/services/[id]/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/filing-types/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/filing-types/[id]/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/wizards/compliance-setup/[clientId]/page.tsx:10
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/wizards/service-request/new/page.tsx:7-8
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/wizards/new-client/page.tsx:3
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/tasks/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/tasks/[id]/page.tsx:7-8
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/messages/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/messages/[id]/page.tsx:7-8
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/compliance/rules/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/compliance/rules/[id]/page.tsx:7-8
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/compliance/overview/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/admin/users/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/admin/users/[id]/page.tsx:7-8
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/admin/users/new/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/admin/tenants/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/admin/tenants/[id]/page.tsx:7-8
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/admin/tenants/new/page.tsx:7
/home/user/kaj-gcmc-saas-platform/app/(dashboard)/analytics/page.tsx:10
/home/user/kaj-gcmc-saas-platform/app/api/requirement-bundles/[id]/progress/route.ts:7
```

### 2. TYPE IMPORT INCONSISTENCIES

**Files using** `@/src/types/*` (should be `@/types/*`):
```
/home/user/kaj-gcmc-saas-platform/components/wizards/new-client-wizard.tsx:7
  - import { WizardConfig } from '@/src/types/wizard';
  - Should be: import { WizardConfig } from '@/types/wizard';
```

### 3. DOCKER SECURITY ISSUES

**File:** `/home/user/kaj-gcmc-saas-platform/docker-compose.yml`

#### Issues by line number:

**Lines 39-40: Hardcoded MinIO credentials**
```yaml
MINIO_ROOT_USER: minioadmin
MINIO_ROOT_PASSWORD: minioadmin
```
- ❌ DEFAULT credentials - security risk
- ✅ Fix: Use `${MINIO_ROOT_USER:-minioadmin}` pattern with .env

**Lines 62-63: Hardcoded NextAuth Secret**
```yaml
NEXTAUTH_URL: "http://localhost:3000"
NEXTAUTH_SECRET: "GENERATE_A_SECURE_RANDOM_VALUE"
```
- ❌ LITERALLY says "GENERATE_A_SECURE_RANDOM_VALUE" as the actual secret
- ✅ Fix: Generate with `openssl rand -base64 32`

**Lines 72-73: MinIO Credentials**
```yaml
MINIO_ACCESS_KEY: "minioadmin"
MINIO_SECRET_KEY: "minioadmin"
```
- ❌ Hardcoded defaults
- ✅ Fix: Use env variables

**Lines 84-87: SMTP Credentials**
```yaml
SMTP_HOST: "smtp.gmail.com"
SMTP_USER: "your-email@gmail.com"
SMTP_PASSWORD: "your-gmail-app-password"
```
- ❌ Placeholder values still in compose file
- ✅ Fix: Move to .env.local

### 4. DOCKERFILE ISSUES

**File:** `/home/user/kaj-gcmc-saas-platform/Dockerfile`

**Line 54: Insufficient error handling**
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```
- ❌ Fails silently on migration errors
- ❌ No retry logic
- ⚠️ Should use startup wrapper script

**Suggestion:**
```dockerfile
# Copy a startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
CMD ["/docker-entrypoint.sh"]
```

**Missing:** `NODE_ENV=production` during build stage (Line 18-20)

### 5. TSCONFIG ISSUES

**File:** `/home/user/kaj-gcmc-saas-platform/tsconfig.json`

**Lines 21-24: Redundant path alias**
```json
"paths": {
  "@/*": ["./*"],
  "@/src/*": ["./src/*"]
}
```
- ❌ Both mappings exist, creating ambiguity
- ✅ Recommendation: Use only `"@/*": ["./*"]`
- The second mapping is redundant because `@/src/*` can be accessed via `@/*` already

### 6. MIDDLEWARE NOT ACTIVE

**File:** `/home/user/kaj-gcmc-saas-platform/src/middleware.ts`

**Lines 1-47: Entire middleware commented out**
```typescript
/*
// NextAuth middleware for authentication and tenant context
... [full auth middleware code is commented]
*/

// REPLACED WITH: simple pass-through middleware
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}
```

- ❌ No auth enforcement in middleware
- ❌ Tenant context validation disabled
- ⚠️ Could allow unauthorized access to protected routes
- ✅ Fix: Re-enable commented middleware

### 7. INCORRECT 'use server' DIRECTIVES

**Files with 'use server' in non-action files:**

**File:** `/home/user/kaj-gcmc-saas-platform/app/(dashboard)/tasks/[id]/page.tsx`
- ❌ Page component marked as 'use server'
- Should only be in `/src/lib/actions/*` files

**File:** `/home/user/kaj-gcmc-saas-platform/app/(dashboard)/filings/overdue/page.tsx`
- ❌ Page component marked as 'use server'
- Should only be in `/src/lib/actions/*` files

---

## MEDIUM PRIORITY ISSUES

### Session Type Mismatch

**File:** `/home/user/kaj-gcmc-saas-platform/src/lib/actions/portal.ts`

**Lines 13-28: Portal session helper**
```typescript
async function getPortalSession() {
  // In a real implementation, you'd have a clientId in the session
  // For now, we'll fetch the first client for this user's tenant as a demo
  // ⚠️ TODO: You should extend the session type to include clientId
```

- Portal expects clientId but session doesn't include it
- Workaround: Queries first client for tenant as demo
- **Fix:** Extend session.user type to include clientId

### Missing .env Template

- No `.env.local` or `.env.production` files committed
- Users must manually create these files
- **Fix:** Commit `.env.example` with full instructions

---

## SUMMARY OF ALL AFFECTED FILES

### By Issue Type:

**Import Path Issues (116 files):**
- 7 server action files with @/src/lib/* imports
- 40+ app pages with @/src/lib/actions/* imports
- 1 component with @/src/types/* imports
- Multiple other components and files

**Configuration Issues (3 files):**
- tsconfig.json - Redundant paths
- next.config.ts - OK
- docker-compose.yml - Hardcoded secrets

**Docker Issues (2 files):**
- Dockerfile - Error handling missing
- docker-compose.yml - Security issues

**Middleware Issues (1 file):**
- src/middleware.ts - Disabled

**Server Action Issues (2 files):**
- app/(dashboard)/tasks/[id]/page.tsx
- app/(dashboard)/filings/overdue/page.tsx

---

## FIXING STRATEGY

### Phase 1: Quick Security Fixes (30 min)
1. Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
2. Create .env.local with generated secrets
3. Update docker-compose.yml to use environment variables

### Phase 2: Import Path Standardization (2-3 hours)
1. Fix all @/src/lib/* to @/lib/*
2. Fix @/src/types/* to @/types/*
3. Verify no build errors

### Phase 3: Configuration Cleanup (30 min)
1. Remove @/src/* from tsconfig.json
2. Update next.config.ts if needed
3. Fix Dockerfile startup script

### Phase 4: Re-enable Middleware (1 hour)
1. Uncomment src/middleware.ts
2. Test authentication flow
3. Verify tenant context

### Phase 5: Remove Incorrect 'use server' (15 min)
1. Remove 'use server' from page.tsx files
2. Verify they still work as async server components

---

## VERIFICATION CHECKLIST

- [ ] Run `npm run build` successfully
- [ ] No TypeScript errors in imports
- [ ] Docker build succeeds
- [ ] docker-compose up works
- [ ] Application starts without errors
- [ ] Authentication middleware works
- [ ] Portal loads correctly
- [ ] Wizards function properly
- [ ] Analytics dashboard loads
- [ ] No console errors in browser
