# System Specification

Complete technical specification for KGC Compliance Cloud.

## Project Overview

**Name**: KGC Compliance Cloud  
**Purpose**: Multi-tenant SaaS compliance platform for professional services firms  
**Primary Users**: KAJ and GCMC (accounting/management consulting firms in Guyana)  
**Target Clients**: Guyanese businesses requiring GRA, NIS, DCRA, and Immigration compliance

## Core Requirements

### Functional Requirements

#### 1. Client Management
- CRUD operations for individual and corporate clients
- Client type classification
- Contact information management
- Risk profiling
- Notes and history tracking
- Multi-tenant isolation

#### 2. Document Management
- File upload to MinIO storage
- Document type classification (22 types across 4 authorities)
- Version control
- Issue and expiry date tracking
- Client association
- Secure download with presigned URLs

#### 3. Filing Management
- CRUD operations for tax/regulatory filings
- Filing type classification (24 types across 4 authorities)
- Status tracking (Draft, Pending, Submitted, Completed, Rejected)
- Due date management
- Document attachments
- Financial calculations (tax, penalties, interest)
- Authority-specific workflows

#### 4. Service Management (Phase 2)
- Service request templates
- Multi-step workflow tracking
- Time tracking
- Client approval workflow
- Billing integration

#### 5. Compliance Tracking (Phase 2)
- Compliance rules per authority
- Deadline monitoring
- Gap analysis
- Automated reminders
- Scoring system

#### 6. User Management
- Role-based access control (8 roles)
- User authentication (NextAuth v5)
- Permission system
- Tenant association
- Profile management

#### 7. Audit Logging
- Track all CREATE, UPDATE, DELETE operations
- Store before/after state
- User attribution
- Timestamp tracking
- Tenant isolation

### Non-Functional Requirements

#### Performance
- Page load < 2 seconds
- API response < 500ms (p95)
- File upload progress indication
- Pagination for large datasets
- Database query optimization

#### Security
- Multi-tenant data isolation
- HTTPS/TLS encryption
- Bcrypt password hashing
- JWT session management
- Role-based authorization
- Input validation (Zod)
- Audit logging

#### Scalability
- Horizontal scaling support
- Database connection pooling
- Stateless application design
- Background job processing (BullMQ)
- Object storage (MinIO/S3)

#### Reliability
- Database backups
- Error handling
- Graceful degradation
- Transaction management
- Data validation

#### Usability
- Intuitive UI with shadcn/ui components
- Responsive design (mobile/tablet/desktop)
- Clear error messages
- Toast notifications
- Loading states
- Professional visual design

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **State**: React Context + SWR
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Next.js 15 (API Routes + Server Actions)
- **Language**: TypeScript 5
- **Authentication**: NextAuth v5
- **ORM**: Prisma 6.19

### Database & Storage
- **Primary DB**: PostgreSQL 15+
- **Object Storage**: MinIO (S3-compatible)
- **Job Queue**: Redis 7+ with BullMQ
- **Caching**: Redis

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Deployment**: Vercel (or self-hosted)
- **CI/CD**: GitHub Actions (future)

## Database Schema

### Core Tables

#### Tenant
\`\`\`sql
- id: Serial Primary Key
- name: String (unique)
- slug: String (unique)
- domain: String (optional)
- isActive: Boolean
- metadata: JSON
- createdAt: DateTime
- updatedAt: DateTime
\`\`\`

#### User
\`\`\`sql
- id: Serial Primary Key
- tenantId: Foreign Key → Tenant
- roleId: Foreign Key → Role
- email: String (unique)
- passwordHash: String
- firstName: String
- lastName: String
- phone: String (optional)
- isActive: Boolean
- lastLoginAt: DateTime (optional)
- createdAt: DateTime
- updatedAt: DateTime
\`\`\`

#### Client
\`\`\`sql
- id: Serial Primary Key
- tenantId: Foreign Key → Tenant
- clientType: Enum (INDIVIDUAL, BUSINESS)
- businessType: Enum (SOLE_PROPRIETOR, PARTNERSHIP, COMPANY, OTHER)
- name: String
- tin: String (optional)
- email: String (optional)
- phone: String (optional)
- address: String (optional)
- riskLevel: Enum (LOW, MEDIUM, HIGH)
- isActive: Boolean
- notes: Text (optional)
- metadata: JSON (optional)
- createdById: Foreign Key → User
- createdAt: DateTime
- updatedAt: DateTime
\`\`\`

#### DocumentType
\`\`\`sql
- id: Serial Primary Key
- authority: Enum (GRA, NIS, DCRA, IMMIGRATION)
- name: String
- description: String (optional)
- requiresExpiry: Boolean
- createdAt: DateTime
\`\`\`

#### Document
\`\`\`sql
- id: Serial Primary Key
- tenantId: Foreign Key → Tenant
- clientId: Foreign Key → Client (optional)
- documentTypeId: Foreign Key → DocumentType
- name: String
- description: Text (optional)
- fileUrl: String
- fileSize: BigInt
- mimeType: String
- version: Int (default: 1)
- issueDate: Date (optional)
- expiryDate: Date (optional)
- uploadedById: Foreign Key → User
- createdAt: DateTime
- updatedAt: DateTime
\`\`\`

#### FilingType
\`\`\`sql
- id: Serial Primary Key
- authority: Enum (GRA, NIS, DCRA, IMMIGRATION)
- name: String
- description: String (optional)
- frequency: Enum (MONTHLY, QUARTERLY, ANNUAL, ONE_TIME)
- createdAt: DateTime
\`\`\`

#### Filing
\`\`\`sql
- id: Serial Primary Key
- tenantId: Foreign Key → Tenant
- clientId: Foreign Key → Client
- filingTypeId: Foreign Key → FilingType
- status: Enum (DRAFT, PENDING, SUBMITTED, COMPLETED, REJECTED)
- dueDate: Date
- filedDate: Date (optional)
- referenceNumber: String (optional)
- taxAmount: Decimal (optional)
- penaltyAmount: Decimal (optional)
- interestAmount: Decimal (optional)
- totalAmount: Decimal (optional)
- notes: Text (optional)
- createdById: Foreign Key → User
- createdAt: DateTime
- updatedAt: DateTime
\`\`\`

#### FilingDocument
\`\`\`sql
- id: Serial Primary Key
- filingId: Foreign Key → Filing
- documentId: Foreign Key → Document
- createdAt: DateTime
\`\`\`

#### AuditLog
\`\`\`sql
- id: Serial Primary Key
- tenantId: Foreign Key → Tenant
- userId: Foreign Key → User
- action: Enum (CREATE, UPDATE, DELETE)
- entityType: String
- entityId: Int
- changes: JSON
- ipAddress: String (optional)
- userAgent: String (optional)
- createdAt: DateTime
\`\`\`

### Indexes

\`\`\`sql
CREATE INDEX idx_client_tenant ON "Client"("tenantId");
CREATE INDEX idx_document_tenant ON "Document"("tenantId");
CREATE INDEX idx_document_client ON "Document"("clientId");
CREATE INDEX idx_filing_tenant ON "Filing"("tenantId");
CREATE INDEX idx_filing_client ON "Filing"("clientId");
CREATE INDEX idx_filing_due_date ON "Filing"("dueDate");
CREATE INDEX idx_audit_tenant ON "AuditLog"("tenantId");
CREATE INDEX idx_audit_entity ON "AuditLog"("entityType", "entityId");
\`\`\`

## API Endpoints

### Server Actions (Primary)

\`\`\`typescript
// Clients
createClient(data: CreateClientInput): Promise<Client>
updateClient(id: number, data: UpdateClientInput): Promise<Client>
deleteClient(id: number): Promise<void>
getClients(filters: ClientFilters): Promise<ClientsResult>

// Documents
createDocument(data: CreateDocumentInput): Promise<Document>
updateDocument(id: number, data: UpdateDocumentInput): Promise<Document>
deleteDocument(id: number): Promise<void>
getDocuments(filters: DocumentFilters): Promise<DocumentsResult>
generateUploadUrl(fileName: string, fileType: string): Promise<UploadUrl>
generateDownloadUrl(documentId: number): Promise<string>

// Filings
createFiling(data: CreateFilingInput): Promise<Filing>
updateFiling(id: number, data: UpdateFilingInput): Promise<Filing>
deleteFiling(id: number): Promise<void>
getFilings(filters: FilingFilters): Promise<FilingsResult>
attachDocumentToFiling(filingId: number, documentId: number): Promise<void>
\`\`\`

### REST API (Secondary)

\`\`\`
POST   /api/auth/signin          # Login
POST   /api/auth/signout         # Logout
GET    /api/auth/session         # Get current session

GET    /api/clients              # List clients (paginated)
GET    /api/clients/:id          # Get client by ID
POST   /api/clients              # Create client
PATCH  /api/clients/:id          # Update client
DELETE /api/clients/:id          # Delete client

GET    /api/documents            # List documents (paginated)
GET    /api/documents/:id        # Get document by ID
POST   /api/documents            # Create document
PATCH  /api/documents/:id        # Update document
DELETE /api/documents/:id        # Delete document

GET    /api/filings              # List filings (paginated)
GET    /api/filings/:id          # Get filing by ID
POST   /api/filings              # Create filing
PATCH  /api/filings/:id          # Update filing
DELETE /api/filings/:id          # Delete filing
\`\`\`

## User Roles & Permissions

### Role Hierarchy

1. **SUPER_ADMIN** (Future): System-wide access
2. **ADMIN**: Full tenant access
3. **MANAGER**: Department management
4. **SENIOR_ASSOCIATE**: Advanced operations
5. **ASSOCIATE**: Standard operations
6. **JUNIOR_ASSOCIATE**: Limited operations
7. **INTERN**: Read-only access
8. **CLIENT** (Phase 3): Client portal access

### Permission Matrix

| Permission | ADMIN | MANAGER | SENIOR | ASSOCIATE | JUNIOR | INTERN |
|------------|-------|---------|--------|-----------|--------|--------|
| clients:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| clients:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| clients:update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| clients:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| documents:create | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| documents:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| documents:update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| documents:delete | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| filings:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| filings:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| filings:update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| filings:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| users:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| users:read | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| users:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## Guyana Regulatory Authorities

### GRA (Guyana Revenue Authority)

**Document Types:**
- Corporate Income Tax Return
- Personal Income Tax Return
- VAT Return
- Property Tax Assessment
- Withholding Tax Certificate
- Tax Clearance Certificate

**Filing Types:**
- Monthly VAT Return
- Quarterly Corporate Tax Payment
- Annual Corporate Income Tax Return
- Annual Personal Income Tax Return
- Monthly Withholding Tax Return
- Quarterly Property Tax Payment

### NIS (National Insurance Scheme)

**Document Types:**
- NIS Registration Certificate
- NIS Compliance Certificate
- NIS Payment Receipt

**Filing Types:**
- Monthly NIS Contribution Return
- Quarterly NIS Statement

### DCRA (Deeds and Commercial Registries Authority)

**Document Types:**
- Certificate of Incorporation
- Certificate of Good Standing
- Business Name Registration
- Articles of Incorporation
- Annual Return Filed Stamp

**Filing Types:**
- Annual Return

### Immigration

**Document Types:**
- Work Permit
- Residence Permit
- Visa
- Passport Copy
- Police Clearance

**Filing Types:**
- Work Permit Renewal
- Residence Permit Renewal

## Development Phases

### Phase 0: Foundation ✅ COMPLETE
- Database schema
- Authentication setup
- Project structure
- Base UI components
- Docker configuration

### Phase 1: Core CRUD ✅ COMPLETE
- Client management
- Document management
- Filing management
- Basic reporting

### Phase 2: Workflows 🚧 IN PROGRESS
- Service request system
- Recurring filing engine
- Task management
- Email notifications
- Staff assignment

### Phase 3: Client Portal 📅 PLANNED
- Client authentication
- Client task view
- Document sharing
- Secure messaging
- Payment integration

### Phase 4: AI/Automation 📅 PLANNED
- OCR document scanning
- Compliance scoring
- AI document summaries
- Predictive analytics
- Automated reminders

## Deployment

### Local Development
\`\`\`bash
docker-compose up -d
npm run db:migrate
npm run db:seed
npm run dev
\`\`\`

### Production
- Managed PostgreSQL (Neon)
- Managed Redis (Upstash)
- S3 or managed MinIO
- Vercel or self-hosted
- SSL/TLS certificates
- Environment secrets management

## Monitoring & Maintenance

### Logging
- Application logs (Winston)
- Database query logs
- Error tracking (Sentry - future)
- Audit logs in database

### Backups
- Daily database backups
- Document storage backups
- Backup retention: 30 days
- Disaster recovery plan

### Performance
- Database query optimization
- Index management
- Connection pooling
- Caching strategy
- CDN for static assets

## Support & Documentation

- Technical docs in `/docs`
- API documentation (future)
- User guides (future)
- Admin training materials (future)
- Support ticketing system (future)

## Compliance & Security

- GDPR considerations (if applicable)
- Data retention policies
- Access control auditing
- Security incident response
- Regular security reviews

## Future Enhancements

- Mobile applications
- Advanced reporting
- Business intelligence dashboard
- Integration with accounting software
- WhatsApp notifications
- SMS reminders
- Multi-language support
- Custom branding per tenant
