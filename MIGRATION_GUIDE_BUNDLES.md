# Migration Guide: Requirement Bundles System

## Quick Start

Follow these steps to deploy the requirement bundles system:

### 1. Generate Prisma Client

```bash
npx prisma generate
```

This regenerates the Prisma client with the new RequirementBundle and RequirementBundleItem models.

### 2. Create Database Migration

```bash
npx prisma migrate dev --name add_requirement_bundles_system
```

This creates and applies the database migration for:
- RequirementBundle table
- RequirementBundleItem table
- Updates to DocumentType table (authority, metadata fields)
- Updates to FilingType table

### 3. Seed the Database

```bash
npx prisma db seed
```

This will populate:
- 70+ enhanced Guyana-specific document types
- 19+ pre-configured requirement bundles for GRA, NIS, DCRA, Immigration, Deeds, and GO-Invest
- All existing seed data (tenants, users, clients, etc.)

### 4. Verify Installation

Check that the data was seeded correctly:

```bash
npx prisma studio
```

Navigate to:
- `RequirementBundle` table - should have ~19 bundles
- `RequirementBundleItem` table - should have 80+ items
- `DocumentType` table - should have 70+ types with metadata

### 5. Test the Components

Create a test page to verify the bundle progress component works:

```tsx
// app/test-bundles/page.tsx
import { BundleProgress } from '@/components/requirements';

export default function TestBundles() {
  // Use actual IDs from your seeded data
  const clientId = 1; // First client from seed
  const bundleId = 1; // GRA Individual Income Tax Filing bundle
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Bundle Progress Test</h1>
      <BundleProgress 
        clientId={clientId} 
        bundleId={bundleId}
        showActions={true}
      />
    </div>
  );
}
```

## Rollback (if needed)

If you need to rollback:

```bash
# Rollback the last migration
npx prisma migrate reset

# Or drop specific tables
npx prisma db execute --sql "DROP TABLE IF EXISTS requirement_bundle_items CASCADE; DROP TABLE IF EXISTS requirement_bundles CASCADE;"

# Then re-run migrations up to the previous version
npx prisma migrate deploy
```

## Troubleshooting

### Error: "Module not found" for seed files

Make sure your `package.json` has the seed script configured:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

### Error: Document types not found when creating bundles

The bundles seed depends on document types being created first. Ensure `seedDocumentTypes()` is called before `seedGuyanaRequirementBundles()` in the main seed file.

### Error: Cannot find auth module

Ensure your auth configuration is properly set up. The API route requires a valid NextAuth session.

### TypeScript errors in components

Run `npx prisma generate` to ensure the Prisma client types are up to date.

## Production Deployment

For production:

1. **Test in staging first** with a copy of production data
2. **Backup your database** before running migrations
3. **Run migrations during low-traffic period**
4. **Monitor logs** for any errors during seeding

```bash
# Production migration (non-interactive)
npx prisma migrate deploy

# Production seed
NODE_ENV=production npx prisma db seed
```

## Next Steps

After successful installation:

1. Review the bundles and customize for your needs
2. Assign relevant bundles to client service requests
3. Set up automated compliance score recalculation
4. Configure notifications for expiring documents
5. Add bundle progress widgets to client dashboards

## Files Modified/Created

See `/docs/REQUIREMENT_BUNDLES_IMPLEMENTATION.md` for complete file listing.
