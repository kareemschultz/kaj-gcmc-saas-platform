#!/usr/bin/env tsx

/**
 * MinIO Setup Script
 *
 * This script:
 * - Connects to MinIO
 * - Creates buckets for all existing tenants
 * - Sets bucket policies (private by default)
 * - Verifies the setup
 *
 * Usage:
 *   npm run setup-minio
 *   or
 *   tsx scripts/setup-minio.ts
 */

import { Client } from 'minio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// MinIO client configuration
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  region: process.env.MINIO_REGION || 'us-east-1',
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color?: keyof typeof colors) {
  const colorCode = color ? colors[color] : '';
  console.log(`${colorCode}${message}${colors.reset}`);
}

function getTenantBucketName(tenantId: number): string {
  return `tenant-${tenantId}-documents`;
}

async function verifyConnection(): Promise<boolean> {
  try {
    log('\n🔍 Verifying MinIO connection...', 'cyan');
    await minioClient.listBuckets();
    log('✓ MinIO connection successful', 'green');
    return true;
  } catch (error) {
    log('✗ MinIO connection failed', 'red');
    log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    return false;
  }
}

async function createBucketForTenant(tenantId: number, tenantName: string): Promise<boolean> {
  const bucketName = getTenantBucketName(tenantId);

  try {
    // Check if bucket exists
    const exists = await minioClient.bucketExists(bucketName);

    if (exists) {
      log(`  ⚠ Bucket already exists: ${bucketName}`, 'yellow');
      return true;
    }

    // Create bucket
    await minioClient.makeBucket(bucketName, 'us-east-1');
    log(`  ✓ Created bucket: ${bucketName}`, 'green');

    // Set private policy
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Deny',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };

    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    log(`  ✓ Set private policy for: ${bucketName}`, 'green');

    return true;
  } catch (error) {
    log(`  ✗ Failed to create bucket for tenant ${tenantId} (${tenantName})`, 'red');
    log(`    Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    return false;
  }
}

async function listExistingBuckets() {
  try {
    log('\n📦 Existing MinIO buckets:', 'cyan');
    const buckets = await minioClient.listBuckets();

    if (buckets.length === 0) {
      log('  No buckets found', 'yellow');
    } else {
      buckets.forEach((bucket) => {
        log(`  - ${bucket.name} (created: ${bucket.creationDate})`, 'blue');
      });
    }
  } catch (error) {
    log('✗ Failed to list buckets', 'red');
    log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
  }
}

async function verifyBucketSetup(tenantId: number): Promise<boolean> {
  const bucketName = getTenantBucketName(tenantId);

  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      return false;
    }

    // Try to get bucket policy
    const policy = await minioClient.getBucketPolicy(bucketName);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('MinIO Setup Script', 'bright');
  log('='.repeat(60), 'bright');

  // Step 1: Verify connection
  const connected = await verifyConnection();
  if (!connected) {
    log('\n❌ Cannot proceed without MinIO connection', 'red');
    log('Please ensure MinIO is running and environment variables are correct.', 'yellow');
    process.exit(1);
  }

  // Step 2: List existing buckets
  await listExistingBuckets();

  // Step 3: Get all tenants from database
  log('\n🏢 Fetching tenants from database...', 'cyan');
  let tenants;
  try {
    tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { id: 'asc' },
    });
    log(`✓ Found ${tenants.length} tenant(s)`, 'green');
  } catch (error) {
    log('✗ Failed to fetch tenants from database', 'red');
    log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red');
    await prisma.$disconnect();
    process.exit(1);
  }

  if (tenants.length === 0) {
    log('\n⚠ No tenants found in database', 'yellow');
    log('Run database seed script first to create tenants.', 'yellow');
    await prisma.$disconnect();
    process.exit(0);
  }

  // Step 4: Create buckets for each tenant
  log('\n🚀 Creating buckets for tenants...', 'cyan');
  let successCount = 0;
  let failureCount = 0;

  for (const tenant of tenants) {
    log(`\nProcessing tenant: ${tenant.name} (ID: ${tenant.id}, Code: ${tenant.code})`);
    const success = await createBucketForTenant(tenant.id, tenant.name);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  // Step 5: Verify setup
  log('\n✅ Verifying bucket setup...', 'cyan');
  let verifiedCount = 0;

  for (const tenant of tenants) {
    const bucketName = getTenantBucketName(tenant.id);
    const verified = await verifyBucketSetup(tenant.id);
    if (verified) {
      log(`  ✓ Verified: ${bucketName}`, 'green');
      verifiedCount++;
    } else {
      log(`  ✗ Verification failed: ${bucketName}`, 'red');
    }
  }

  // Step 6: Summary
  log('\n' + '='.repeat(60), 'bright');
  log('Setup Summary', 'bright');
  log('='.repeat(60), 'bright');
  log(`Total tenants: ${tenants.length}`);
  log(`Buckets created/verified: ${successCount}`, successCount > 0 ? 'green' : 'yellow');
  log(`Buckets verified: ${verifiedCount}`, verifiedCount > 0 ? 'green' : 'yellow');
  log(`Failures: ${failureCount}`, failureCount > 0 ? 'red' : 'green');

  // Final bucket list
  await listExistingBuckets();

  log('\n' + '='.repeat(60), 'bright');
  if (failureCount === 0 && verifiedCount === tenants.length) {
    log('✅ MinIO setup completed successfully!', 'green');
  } else {
    log('⚠ MinIO setup completed with some issues', 'yellow');
  }
  log('='.repeat(60) + '\n', 'bright');

  // Cleanup
  await prisma.$disconnect();
  process.exit(failureCount > 0 ? 1 : 0);
}

// Run the script
main().catch((error) => {
  log('\n❌ Unexpected error occurred:', 'red');
  console.error(error);
  prisma.$disconnect();
  process.exit(1);
});
