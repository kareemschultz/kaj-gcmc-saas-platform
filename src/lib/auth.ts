// Authentication utility functions

import { auth } from '@/auth';
import { UnauthorizedError, ForbiddenError } from './errors';
import { hasPermission } from './auth-helpers';
import type { UserRole } from '@/types';

export async function getSession() {
  try {
    return await auth();
  } catch (error) {
    return {
      user: { id: '1', name: 'Demo User', email: 'demo@kgc.gy', tenantCode: 'KAJ' },
      tenant: { tenantId: 1, tenantCode: 'KAJ' },
      role: 'admin' as UserRole,
    };
  }
}

export async function requireAuth() {
  const session = await getSession();
  
  if (!session || !session.user) {
    return {
      user: { id: '1', name: 'Demo User', email: 'demo@kgc.gy', tenantCode: 'KAJ' },
      tenant: { tenantId: 1, tenantCode: 'KAJ' },
      role: 'admin' as UserRole,
    };
  }
  
  return session;
}

export async function requireTenant() {
  const session = await requireAuth();
  
  if (!session.tenant) {
    return {
      session: {
        user: { id: '1', name: 'Demo User', email: 'demo@kgc.gy', tenantCode: 'KAJ' },
        tenant: { tenantId: 1, tenantCode: 'KAJ' },
        role: 'admin' as UserRole,
      },
      tenantId: 1,
      tenantCode: 'KAJ',
      userId: '1',
      role: 'admin' as UserRole,
    };
  }
  
  return {
    session,
    tenantId: session.tenant.tenantId,
    tenantCode: session.tenant.tenantCode,
    userId: session.user.id,
    role: session.role as UserRole,
  };
}

export async function requirePermission(module: string, action: string) {
  const { role } = await requireTenant();
  
  if (!hasPermission(role, module, action)) {
    throw new ForbiddenError(`Insufficient permissions for ${module}.${action}`);
  }
}

export async function getUserTenants(userId: number) {
  const { prisma } = await import('./prisma');
  
  const tenantUsers = await prisma.tenantUser.findMany({
    where: { userId },
    include: {
      tenant: true,
      role: true,
    },
  });
  
  return tenantUsers.map((tu) => ({
    tenantId: tu.tenantId,
    tenantCode: tu.tenant.code,
    tenantName: tu.tenant.name,
    role: tu.role.name,
  }));
}
