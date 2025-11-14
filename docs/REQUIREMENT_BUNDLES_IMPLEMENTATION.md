# Guyana Document Bundles and Requirement Engine System

This document describes the implementation of the Guyana-specific document bundles and requirement engine system.

## Overview

The requirement bundles system enables the platform to:
- Define standardized document and filing requirements for different government authorities
- Track client compliance against these requirements
- Calculate compliance scores based on multiple factors
- Display progress for specific services or filings

## Files Created/Modified

### 1. Database Schema Updates

**File:** `/prisma/schema.prisma`

Added two new models:

- `RequirementBundle` - Represents a collection of required documents/filings for a specific authority/process
  - Fields: id, tenantId, name, authority, category, description, timestamps
  - Relations: belongs to Tenant, has many RequirementBundleItems

- `RequirementBundleItem` - Individual requirement within a bundle
  - Fields: id, bundleId, documentTypeId, filingTypeId, required, description, order, timestamps
  - Relations: belongs to RequirementBundle, optionally links to DocumentType or FilingType

Also updated:
- `DocumentType` model - Added `authority`, `metadata` fields and unique constraint
- `FilingType` model - Added relation to RequirementBundleItem
- `Tenant` model - Added relation to RequirementBundle

### 2. Seed Files

#### Enhanced Document Types
**File:** `/prisma/seeds/document-types.ts`

Comprehensive Guyana-specific document types including:
- **GRA Forms:** G0004 (Individual Income Tax), G0003 (PAYE), G0017 (VAT), G0018 (Withholding Tax), G0022 (Corporation Tax), F7B (Annual Reconciliation), F200 (Property Tax)
- **GRA Certificates:** TIN Certificate, VAT Registration, Tender Compliance, Land Compliance, Tax Clearance
- **NIS Documents:** Registration Card, Employer Registration, Compliance Certificates, Contribution Statements, Employee Registration Forms
- **DCRA Documents:** Business Name Registration, Certificate of Incorporation, Articles, Memorandum, Notice of Directors/Office, Annual Returns, Trade License
- **Immigration:** Work Permits, Residence Permits, Business Visas, Landing Permits, Employment Contracts, Police Clearance
- **Deeds Registry:** Transport (Property Deed), Title Search, Property Valuation, Mortgage Documents, Power of Attorney
- **GO-Invest:** Investment Certificates, Incentive Applications
- **Other:** Identification documents, financial documents, legal documents

Total: 70+ document types with full metadata including validity periods, renewal requirements, and authority information.

#### Requirement Bundles
**File:** `/prisma/seeds/guyana-bundles.ts`

Pre-configured bundles for common processes:

**GRA Bundles (6):**
- Individual Income Tax Filing
- PAYE Employer Setup
- VAT Compliance
- Corporation Tax Filing
- Tender Compliance Certificate
- Land Compliance Certificate

**NIS Bundles (4):**
- Employer Registration
- Monthly Employer Contributions
- Employer Compliance Certificate
- Self-Employed Registration

**DCRA Bundles (3):**
- Business Name Registration
- Company Incorporation
- Annual Company Compliance

**Immigration Bundles (3):**
- Work Permit Application
- Work Permit Renewal
- Residence Permit

**Deeds Registry Bundles (2):**
- Property Transfer
- Mortgage Registration

**GO-Invest Bundles (1):**
- Investment Registration

Total: 19+ pre-configured requirement bundles

#### Updated Main Seed
**File:** `/prisma/seed.ts`

Modified to import and call the new seed functions:
- Replaced inline document type creation with `seedDocumentTypes()`
- Added call to `seedGuyanaRequirementBundles()`

### 3. Server Actions

**File:** `/src/lib/actions/requirement-bundles.ts`

Complete CRUD operations for requirement bundles:

**Bundle Operations:**
- `getRequirementBundles(params?)` - List all bundles with filtering
- `getRequirementBundle(id)` - Get single bundle with items
- `getBundleRequirements(bundleId)` - Get bundle with full requirement details
- `createRequirementBundle(data)` - Create new bundle
- `updateRequirementBundle(id, data)` - Update existing bundle
- `deleteRequirementBundle(id)` - Delete bundle
- `getBundlesByAuthority(authority)` - Filter by authority
- `getBundlesByCategory(category)` - Filter by category

**Bundle Item Operations:**
- `addBundleItem(data)` - Add item to bundle
- `updateBundleItem(id, data)` - Update bundle item
- `deleteBundleItem(id)` - Remove bundle item

**Progress Tracking:**
- `checkBundleProgress(clientId, bundleId)` - Check client's progress on a bundle
  - Returns detailed progress with fulfilled/missing items
  - Includes statistics: total required, completed, percentage, completion status
  - Shows existing documents and filings that fulfill requirements

### 4. Compliance Engine

**File:** `/src/lib/compliance-engine.ts`

Comprehensive compliance checking system:

**Main Functions:**
- `checkClientCompliance(clientId, tenantId)` - Calculate overall compliance
  - Returns: score (0-100), level (green/amber/red), missing items, expiring docs, overdue filings
  - Weighted scoring: 35% documents, 35% filings, 30% bundles

**Helper Functions:**
- `checkDocumentsCompliance()` - Score based on valid vs expired documents
- `checkFilingsCompliance()` - Score based on submitted vs overdue filings
- `checkBundlesCompliance()` - Score based on completed bundles
- `checkBundleCompletion()` - Check if specific bundle is complete
- `checkExpiringDocuments()` - Find documents expiring within 30 days
- `checkOverdueFilings()` - Find overdue filings

**Database Persistence:**
- `saveComplianceScore()` - Save calculated score to database
- `recalculateClientCompliance()` - Recalculate and save

**Return Type:**
```typescript
interface ComplianceResult {
  score: number;
  level: 'green' | 'amber' | 'red';
  missing: Array<{bundleId, bundleName, authority, items}>;
  expiring: Array<{documentId, documentTitle, expiryDate, daysUntilExpiry}>;
  overdue: Array<{filingId, filingType, dueDate, daysOverdue}>;
  breakdown: {
    documentsScore, filingsScore, bundlesScore,
    totalDocuments, validDocuments, expiredDocuments,
    totalFilings, submittedFilings, overdueFilings,
    totalBundles, completedBundles
  };
}
```

### 5. React Components

#### Bundle Progress Component
**File:** `/components/requirements/bundle-progress.tsx`

Two variants for displaying bundle progress:

**BundleProgress (Full Version):**
- Shows complete bundle details with authority and description
- Progress bar with color coding (green ≥80%, amber ≥50%, red <50%)
- Detailed list of all requirements with status icons
- Shows fulfilled requirements with links to view documents/filings
- Shows missing requirements with links to add them
- Displays document expiry dates and filing counts
- Optional vs required item distinction
- Summary footer for optional items

**BundleProgressCompact:**
- Minimal dashboard view
- Bundle name and authority
- Percentage complete with color-coded status icon
- Completion fraction (completed/total)

**Props:**
```typescript
interface BundleProgressProps {
  clientId: number;
  bundleId: number;
  showActions?: boolean;
  className?: string;
}
```

**Features:**
- Real-time data fetching from API
- Loading and error states
- Color-coded status indicators:
  - Green: Fulfilled/Complete
  - Red: Missing required item
  - Gray: Missing optional item
- Action buttons to view or add documents/filings
- Metadata display (validity periods, etc.)

#### Component Exports
**File:** `/components/requirements/index.ts`

Central export file for requirement components.

### 6. API Routes

**File:** `/app/api/requirement-bundles/[id]/progress/route.ts`

REST API endpoint for fetching bundle progress:
- **Method:** GET
- **Path:** `/api/requirement-bundles/{id}/progress?clientId={clientId}`
- **Authentication:** Required (NextAuth session)
- **Returns:** Bundle progress data (BundleProgressData)

## Database Migration

After implementing these changes, run:

```bash
# Generate Prisma client with new models
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add-requirement-bundles

# Seed the database with new data
npx prisma db seed
```

## Usage Examples

### 1. Display Bundle Progress in a Component

```tsx
import { BundleProgress } from '@/components/requirements';

export function ServiceDetails({ clientId, serviceId }) {
  return (
    <div>
      <h2>GRA VAT Compliance</h2>
      <BundleProgress
        clientId={clientId}
        bundleId={3} // VAT Compliance bundle
        showActions={true}
      />
    </div>
  );
}
```

### 2. Check Client Compliance

```typescript
import { checkClientCompliance, recalculateClientCompliance } from '@/lib/compliance-engine';

// Get compliance score
const result = await checkClientCompliance(clientId, tenantId);
console.log(`Score: ${result.score}, Level: ${result.level}`);
console.log(`Missing: ${result.missing.length} items`);
console.log(`Expiring: ${result.expiring.length} documents`);

// Recalculate and save to database
await recalculateClientCompliance(clientId, tenantId);
```

### 3. Get Bundle Requirements

```typescript
import { getBundleRequirements } from '@/lib/actions/requirement-bundles';

const bundle = await getBundleRequirements(bundleId);
console.log(`Bundle: ${bundle.name}`);
bundle.items.forEach(item => {
  console.log(`- ${item.documentType?.name || item.filingType?.name}`);
  console.log(`  Required: ${item.required}`);
  console.log(`  Description: ${item.description}`);
});
```

### 4. Create Custom Bundle

```typescript
import {
  createRequirementBundle,
  addBundleItem
} from '@/lib/actions/requirement-bundles';

// Create bundle
const { bundle } = await createRequirementBundle({
  name: 'Custom Service Bundle',
  authority: 'GRA',
  category: 'tax',
  description: 'Custom requirements for special service',
});

// Add items
await addBundleItem({
  bundleId: bundle.id,
  documentTypeId: 123,
  required: true,
  description: 'Required for processing',
  order: 1,
});
```

## Compliance Scoring System

The compliance engine calculates a weighted score:

- **Documents Score (35%):** Percentage of valid documents
- **Filings Score (35%):** Performance on submitted vs overdue filings
- **Bundles Score (30%):** Percentage of completed requirement bundles

**Levels:**
- **Green (80-100%):** Excellent compliance, all critical requirements met
- **Amber (50-79%):** Moderate compliance, some requirements missing
- **Red (0-49%):** Poor compliance, many requirements missing

## Benefits

1. **Standardization:** Consistent requirements across all clients
2. **Automation:** Automatic compliance tracking and scoring
3. **Transparency:** Clients can see exactly what's required
4. **Efficiency:** Quick identification of missing requirements
5. **Compliance:** Ensures all regulatory requirements are met
6. **Flexibility:** Easy to create custom bundles for special cases

## Future Enhancements

Potential improvements:
1. Automated compliance score recalculation on document/filing changes
2. Email notifications for expiring documents
3. Bulk bundle assignment to clients
4. Bundle templates for different client types
5. Integration with government authority APIs
6. Automated form pre-filling from existing documents
7. Compliance trend analysis and reporting
8. Client portal access to view their own bundle progress

## File Paths Summary

All created/modified files:

1. `/prisma/schema.prisma` - Database schema
2. `/prisma/seed.ts` - Main seed file
3. `/prisma/seeds/document-types.ts` - Document types seed
4. `/prisma/seeds/guyana-bundles.ts` - Bundles seed
5. `/src/lib/actions/requirement-bundles.ts` - Server actions
6. `/src/lib/compliance-engine.ts` - Compliance checking
7. `/components/requirements/bundle-progress.tsx` - React component
8. `/components/requirements/index.ts` - Component exports
9. `/app/api/requirement-bundles/[id]/progress/route.ts` - API endpoint
10. `/docs/REQUIREMENT_BUNDLES_IMPLEMENTATION.md` - This documentation

## Support

For questions or issues with the requirement bundles system, please refer to:
- Database schema documentation in `/docs/database-schema.md`
- API documentation in `/docs/api-reference.md`
- Component documentation in `/docs/components.md`
