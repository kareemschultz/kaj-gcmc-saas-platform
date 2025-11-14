// Tenant context utilities

import { prisma } from './prisma';

export async function getTenantByCode(code: string) {
  return await prisma.tenant.findUnique({
    where: { code },
  });
}

export async function getTenantById(id: number) {
  return await prisma.tenant.findUnique({
    where: { id },
  });
}

export async function getAllTenants() {
  return await prisma.tenant.findMany({
    orderBy: { name: 'asc' },
  });
}

// TODO: Implement tenant-scoped query wrappers for Phase 1
// Example: getTenantClients(tenantId), getTenantDocuments(tenantId), etc.
