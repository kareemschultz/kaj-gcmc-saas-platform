# Role-Based Access Control (RBAC) Guide

## Overview

KGC Compliance Cloud implements comprehensive Role-Based Access Control to ensure that users can only access features and data appropriate to their role within the organization.

## Role Hierarchy

### 1. SuperAdmin
**Description**: Full system access across all tenants (platform administrator)

**Permissions**: All modules, all actions
- Can manage all tenants
- Can access any tenant's data
- Can manage system-wide settings
- Typically used by platform operators

### 2. FirmAdmin  
**Description**: Full access within tenant, can manage users and settings

**Permissions**:
- **Clients**: view, create, edit, delete
- **Documents**: view, create, edit, delete
- **Filings**: view, create, edit, delete, submit
- **Services**: view, create, edit, delete
- **Users**: view, create, edit, delete
- **Settings**: view, edit
- **Compliance**: view

**Use Cases**:
- Managing partners
- Practice administrators
- Operations managers

### 3. ComplianceManager
**Description**: Manage compliance, filings, and client oversight

**Permissions**:
- **Clients**: view, create, edit
- **Documents**: view, create, edit
- **Filings**: view, create, edit, submit
- **Services**: view, create, edit
- **Compliance**: view, edit

**Use Cases**:
- Compliance department heads
- Senior compliance officers
- Quality control managers

### 4. ComplianceOfficer
**Description**: Handle client filings and document review

**Permissions**:
- **Clients**: view, edit
- **Documents**: view, create, edit
- **Filings**: view, create, edit, submit

**Use Cases**:
- Compliance team members
- Filing specialists
- Document reviewers

### 5. DocumentOfficer
**Description**: Manage document uploads and organization

**Permissions**:
- **Clients**: view
- **Documents**: view, create, edit

**Use Cases**:
- Document management specialists
- Data entry staff
- Administrative assistants

### 6. FilingClerk
**Description**: Prepare and submit filings

**Permissions**:
- **Clients**: view
- **Filings**: view, create, edit

**Use Cases**:
- Filing preparation staff
- Submission coordinators

### 7. Viewer
**Description**: Read-only access to client information

**Permissions**:
- **Clients**: view
- **Documents**: view
- **Filings**: view

**Use Cases**:
- Auditors
- Read-only consultants
- Trainees

### 8. ClientPortalUser
**Description**: Client portal access for end users

**Permissions**:
- **Client Portal**: view, upload, message

**Restrictions**:
- Can only access their own client's data
- Cannot access staff dashboard
- Cannot manage users or settings

**Use Cases**:
- Client business owners
- Client administrators
- Client staff

## Permission Matrix

| Module | SuperAdmin | FirmAdmin | ComplianceManager | ComplianceOfficer | DocumentOfficer | FilingClerk | Viewer | ClientPortalUser |
|--------|------------|-----------|-------------------|-------------------|-----------------|-------------|--------|------------------|
| Clients (view) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Clients (create) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Clients (edit) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Clients (delete) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Documents (view) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Documents (create) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Documents (edit) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Documents (delete) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Filings (view) | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Filings (create) | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Filings (edit) | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Filings (submit) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Users (manage) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Settings (manage) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Compliance (view) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Compliance (edit) | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Client Portal | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## Implementation

### Backend (Server Actions)

RBAC is enforced in server actions using the `src/lib/rbac.ts` helper:

\`\`\`typescript
import { auth } from '@/auth';
import { getUserContext, assertPermission, assertAdmin } from '@/lib/rbac';

export async function createClient(data: ClientFormData) {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const userCtx = getUserContext(session);
  
  // Only ComplianceManager and above can create clients
  assertPermission(userCtx, 'clients', 'create');

  // ... rest of function
}

export async function deleteUser(userId: number) {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const userCtx = getUserContext(session);
  
  // Only admins can delete users
  assertAdmin(userCtx);

  // ... rest of function
}
\`\`\`

### Frontend (UI Components)

UI elements are hidden/disabled based on permissions using the `usePermissions` hook:

\`\`\`typescript
import { usePermissions } from '@/lib/hooks/usePermissions';

export function ClientsPage() {
  const { canCreate, canEdit, canDelete, isAdmin } = usePermissions();

  return (
    <div>
      {canCreate('clients') && (
        <Button onClick={handleCreate}>Create Client</Button>
      )}
      
      {canEdit('clients') && (
        <Button onClick={handleEdit}>Edit</Button>
      )}
      
      {canDelete('clients') && (
        <Button onClick={handleDelete}>Delete</Button>
      )}
      
      {isAdmin && (
        <AdminPanel />
      )}
    </div>
  );
}
\`\`\`

## Tenant Isolation

All data access is automatically scoped by `tenantId`:

- Users can only access data within their tenant
- SuperAdmins can access all tenants
- ClientPortalUsers can only access their specific client's data

\`\`\`typescript
import { assertTenantAccess } from '@/lib/rbac';

// Ensure user can only access resources in their tenant
const client = await prisma.client.findFirst({ where: { id: clientId } });
assertTenantAccess(userCtx.tenantId, client.tenantId);
\`\`\`

## Adding New Roles

To add a new role:

1. Add role to `src/config/roles.ts`:

\`\`\`typescript
{
  name: 'NewRole',
  description: 'Description of the role',
  permissions: [
    { module: 'clients', actions: ['view'] },
    { module: 'documents', actions: ['view', 'create'] },
  ],
}
\`\`\`

2. Update `src/types/index.ts` to include the new role:

\`\`\`typescript
export type UserRole = 
  | 'SuperAdmin'
  | 'FirmAdmin'
  | 'NewRole'  // Add here
  // ...
\`\`\`

3. Update Prisma schema and run migration if storing roles in database

4. No changes needed to RBAC system - it automatically uses role definitions

## Security Best Practices

1. **Always check permissions on the server** - Never rely on frontend-only checks
2. **Use assertPermission() for operations** - Throws ForbiddenError if denied
3. **Check tenant isolation** - Use assertTenantAccess() for cross-tenant access
4. **Validate user context** - Use getUserContext() to ensure valid session
5. **Hide UI elements** - Use usePermissions() hook to improve UX
6. **Log permission denials** - Helps identify unauthorized access attempts

## Error Handling

Permission errors use standardized error classes:

- **UnauthorizedError** (401): No session or invalid session
- **ForbiddenError** (403): Valid session but insufficient permissions
- **TenantMismatchError** (403): Attempting to access another tenant's data

These errors are automatically handled by the error boundary and return appropriate HTTP status codes.

## Testing

RBAC is fully tested with unit tests in `src/lib/__tests__/rbac.test.ts`:

\`\`\`bash
pnpm test src/lib/__tests__/rbac.test.ts
\`\`\`

Tests cover:
- Permission checking for all roles
- Permission assertion (throwing errors)
- Admin checking
- Tenant isolation
- Helper functions

---

**Last Updated**: 2025-11-14  
**Version**: 1.0.0
