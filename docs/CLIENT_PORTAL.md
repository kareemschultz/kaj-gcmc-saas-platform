# Client Portal Documentation

The KGC Compliance Cloud includes a self-service client portal for end-users to manage their compliance needs.

## Overview

The client portal provides:
- **Separate UI** from internal staff dashboard
- **Secure access** with client-specific data isolation
- **Self-service** document viewing and compliance tracking
- **Communication** with compliance team
- **Task management** for client action items

## Portal Routes

All portal routes are under the `(portal)` route group:

- `/portal/dashboard` - Overview and quick stats
- `/portal/documents` - View and download documents
- `/portal/filings` - Filing history and status
- `/portal/services` - Service request tracking
- `/portal/tasks` - Client tasks and action items
- `/portal/messages` - Secure messaging
- `/portal/profile` - Client information and settings

## Portal Dashboard

**Route:** `/portal/dashboard`

### Features

#### Compliance Status Card
- Current compliance score (0-100)
- Compliance level badge (GREEN/AMBER/RED)
- Missing items count
- Expiring items count
- Overdue filings count

#### Quick Stats
- Upcoming deadlines count
- Open tasks count
- Active service requests count
- New messages count

#### Upcoming Deadlines Section
- Next 5 filings due within 30 days
- Filing type and authority
- Days until due
- Color-coded urgency (red ≤ 7 days, amber > 7 days)

#### Your Tasks Section
- Open client tasks
- Task descriptions
- Status badges
- Link to tasks page

#### Active Service Requests
- Service name and category
- Status (new, in_progress, awaiting_client, completed)
- Action required alerts for awaiting_client status

## Documents Page

**Route:** `/portal/documents`

### Features

- Documents grouped by category
- Total, valid, and expiring soon counts
- Document details:
  - Title and description
  - Type and authority
  - Status (valid, expired, pending_review)
  - Expiry date with countdown
  - Download button
- Expiry alerts (amber for ≤ 30 days, red for expired)

### Security

- Only documents belonging to the client are visible
- Downloads use presigned URLs (when MinIO is integrated)
- Multi-tenant isolation enforced at query level

## Filings Page

**Route:** `/portal/filings`

### Features

- Filings grouped by authority (GRA, NIS, DCRA, etc.)
- Summary stats:
  - Total filings
  - Approved count
  - Submitted count
  - Overdue count
- Filing details:
  - Filing type and frequency
  - Period label
  - Due date with countdown
  - Status badge
  - Submission date (if submitted)

## Service Requests Page

**Route:** `/portal/services`

### Features

- Service request list with status
- Summary stats by status
- Progress tracking:
  - Completed steps / total steps
  - Visual progress bar
- Service details:
  - Name, category, description
  - Creation date
  - Link to detailed view

## Tasks Page

**Route:** `/portal/tasks`

### Features

- Client tasks (from ClientTask model)
- Summary by status (pending, in_progress, completed)
- Task details:
  - Title and description
  - Related service request (if applicable)
  - Due date with overdue indicator
  - Status badge

## Messages Page

**Route:** `/portal/messages`

### Features

- Conversation list
- Last message preview
- Message count per conversation
- Last updated timestamp
- Link to conversation details

### Future Enhancement

- Send new messages
- Mark as read/unread
- Attach files
- Real-time notifications

## Profile Page

**Route:** `/portal/profile`

### Features

#### Client Information
- Name and type
- Email and phone
- Address
- TIN and NIS number
- Sector
- Risk level

#### Business Entities
- List of associated businesses
- Registration details
- Business type and status

## Portal Layout

### Sidebar Navigation
- KGC Compliance branding
- Navigation links with icons
- Active route highlighting
- Teal color scheme (`#0d9488`)

### Header
- Welcome message
- Notifications bell (with unread indicator)
- User menu dropdown:
  - User name and email
  - Settings (future)
  - Sign out

## Data Access & RBAC

All portal server actions (`src/lib/actions/portal.ts`) enforce:

1. **Authentication** - User must be logged in
2. **Tenant Isolation** - Only data from user's tenant
3. **Client Isolation** - Only data for the specific client
4. **Role Verification** - ClientPortalUser role (future enhancement)

### Server Actions

```typescript
// Portal Dashboard
getPortalDashboardData(clientId: number)

// Documents
getPortalDocuments(clientId: number)

// Filings
getPortalFilings(clientId: number)

// Service Requests
getPortalServiceRequests(clientId: number)
getPortalServiceRequestDetails(serviceRequestId: number, clientId: number)

// Messages
getPortalConversations(clientId: number)
getPortalConversationDetails(conversationId: number, clientId: number)
sendPortalMessage(conversationId: number, clientId: number, body: string)

// Profile
getPortalClientProfile(clientId: number)

// Tasks
getPortalClientTasks(clientId: number)
```

## Session Management

**Current Implementation:**
- Portal uses existing NextAuth session
- ClientId is hardcoded as `1` for demo purposes

**Production Implementation:**
- Extend session to include `clientId` field
- Users with ClientPortalUser role get clientId assigned
- Session validation middleware checks clientId

### Extending Session Type

```typescript
// src/types/session.ts
declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      email: string;
      name: string;
      tenantId: number;
      roleName: string;
      clientId?: number; // For portal users
    };
  }
}
```

## Multi-Tenant Isolation

Every portal query includes:

```typescript
where: {
  clientId: clientId,
  tenantId: session.user.tenantId,
}
```

This ensures:
- Clients only see their own data
- Data is scoped to correct tenant
- No cross-tenant leakage

## Styling & Theming

- Uses same design system as internal dashboard
- Teal primary color (`#0d9488`)
- shadcn/ui components
- Tailwind CSS utilities
- Responsive design (mobile-friendly)

## Future Enhancements

### Document Upload
- Allow clients to upload documents
- Integration with MinIO
- Version control
- Document type selection

### Service Request Creation
- Client-initiated service requests
- Form with service selection
- Notes and attachments
- Automatic notification to staff

### Interactive Messaging
- Real-time chat
- File attachments
- Message notifications
- Read receipts

### Notifications
- In-app notifications
- Email notifications
- SMS/WhatsApp integration (via Twilio)
- Notification preferences

### Payment Integration
- View invoices
- Pay online (Stripe/PayPal)
- Payment history
- Receipt downloads

### Mobile App
- iOS and Android apps
- Push notifications
- Offline document access
- Biometric authentication

## Testing Portal Access

### Test Credentials

From seed data, create a ClientPortalUser:

```sql
-- This would be done via admin UI in production
INSERT INTO "tenant_users" (tenantId, userId, roleId)
VALUES (1, <userId>, <clientPortalUserRoleId>);
```

Then login with that user's credentials.

### Demo Mode

For development, the portal defaults to `clientId = 1`. Update this in:
- Portal page components
- Session middleware (future)

## Related Documentation

- [RBAC](./RBAC.md)
- [Authentication](./AUTHENTICATION_FLOW.md)
- [Multi-Tenant Architecture](./ARCHITECTURE.md)
