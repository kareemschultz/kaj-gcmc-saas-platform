/**
 * Role-Based Access Control (RBAC) Enforcement
 * 
 * Centralized permission checking for the entire application.
 * Integrates with existing role definitions from src/config/roles.ts
 */

import { ROLE_DEFINITIONS } from '@/config/roles';
import { UserRole } from '@/types';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';

export interface UserPermissionContext {
  role: UserRole;
  tenantId: number;
  userId: number;
}

/**
 * Check if a user has permission to perform an action on a module
 */
export function hasPermission(
  user: UserPermissionContext,
  module: string,
  action: string
): boolean {
  // SuperAdmin has all permissions
  if (user.role === 'SuperAdmin') {
    return true;
  }

  const roleDefinition = ROLE_DEFINITIONS.find((r) => r.name === user.role);
  
  if (!roleDefinition) {
    return false;
  }

  // Check for wildcard permission (all modules, all actions)
  const hasWildcard = roleDefinition.permissions.some(
    (p) => p.module === '*' && p.actions.includes('*')
  );
  
  if (hasWildcard) {
    return true;
  }

  // Check specific module permissions
  const modulePermission = roleDefinition.permissions.find((p) => p.module === module);
  
  if (!modulePermission) {
    return false;
  }

  // Check for wildcard actions on this module
  if (modulePermission.actions.includes('*')) {
    return true;
  }

  // Check specific action
  return modulePermission.actions.includes(action);
}

/**
 * Assert that user has permission, throw error if not
 * Use this in server actions to enforce permissions
 */
export function assertPermission(
  user: UserPermissionContext,
  module: string,
  action: string,
  customMessage?: string
): void {
  if (!hasPermission(user, module, action)) {
    const message = customMessage ||
      `Permission denied: ${user.role} cannot perform '${action}' on '${module}'`;

    throw new ForbiddenError(message);
  }
}

/**
 * Check if user can view a module
 */
export function canViewModule(user: UserPermissionContext, module: string): boolean {
  return hasPermission(user, module, 'view');
}

/**
 * Check if user can create entities in a module
 */
export function canCreateEntity(user: UserPermissionContext, module: string): boolean {
  return hasPermission(user, module, 'create');
}

/**
 * Check if user can edit entities in a module
 */
export function canEditEntity(user: UserPermissionContext, module: string): boolean {
  return hasPermission(user, module, 'edit');
}

/**
 * Check if user can delete entities in a module
 */
export function canDeleteEntity(user: UserPermissionContext, module: string): boolean {
  return hasPermission(user, module, 'delete');
}

/**
 * Admin-only operations checker
 */
export function assertAdmin(user: UserPermissionContext, customMessage?: string): void {
  const isAdmin = user.role === 'SuperAdmin' || user.role === 'FirmAdmin';
  
  if (!isAdmin) {
    const message = customMessage || 'This operation requires administrator privileges';
    throw new ForbiddenError(message);
  }
}

/**
 * Check if user is SuperAdmin
 */
export function isSuperAdmin(user: UserPermissionContext): boolean {
  return user.role === 'SuperAdmin';
}

/**
 * Check if user has any admin role
 */
export function isAdmin(user: UserPermissionContext): boolean {
  return user.role === 'SuperAdmin' || user.role === 'FirmAdmin';
}

/**
 * Get all permissions for a user's role
 */
export function getUserPermissions(role: UserRole): Array<{ module: string; actions: string[] }> {
  const roleDefinition = ROLE_DEFINITIONS.find((r) => r.name === role);
  return roleDefinition?.permissions || [];
}

/**
 * Get all modules a user can access
 */
export function getUserModules(user: UserPermissionContext): string[] {
  const permissions = getUserPermissions(user.role);
  
  // If has wildcard, return all available modules
  if (permissions.some((p) => p.module === '*')) {
    return [
      'clients',
      'documents',
      'filings',
      'services',
      'users',
      'settings',
      'compliance',
      'tasks',
      'messages',
      'analytics',
      'wizards'
    ];
  }
  
  return permissions.map((p) => p.module).filter((m) => m !== '*');
}

/**
 * Client portal specific: Check if user has access to a specific client
 * For client portal users, they can only access their own client's data
 */
export function canAccessClient(
  user: UserPermissionContext,
  clientId: number,
  userClientIds: number[]
): boolean {
  // Admins and staff can access all clients in their tenant
  if (isAdmin(user) || user.role !== 'ClientPortalUser') {
    return true;
  }

  // Client portal users can only access their assigned clients
  return userClientIds.includes(clientId);
}

/**
 * Ensure tenant isolation: user can only access resources in their tenant
 */
export function assertTenantAccess(
  userTenantId: number,
  resourceTenantId: number
): void {
  if (userTenantId !== resourceTenantId) {
    throw new ForbiddenError('Access denied: resource belongs to a different tenant');
  }
}

/**
 * Get user context from session for RBAC checks
 */
export function getUserContext(session: any): UserPermissionContext {
  if (!session?.user?.id || !session?.user?.tenantId || !session?.role) {
    throw new UnauthorizedError('Invalid session: missing user context');
  }

  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: session.role as UserRole,
  };
}

/**
 * Convenience helper: Assert user can view a module
 */
export function assertCanView(
  user: UserPermissionContext,
  module: string,
  customMessage?: string
): void {
  assertPermission(user, module, 'view', customMessage);
}

/**
 * Convenience helper: Assert user can create in a module
 */
export function assertCanCreate(
  user: UserPermissionContext,
  module: string,
  customMessage?: string
): void {
  assertPermission(user, module, 'create', customMessage);
}

/**
 * Convenience helper: Assert user can edit in a module
 */
export function assertCanEdit(
  user: UserPermissionContext,
  module: string,
  customMessage?: string
): void {
  assertPermission(user, module, 'edit', customMessage);
}

/**
 * Convenience helper: Assert user can delete in a module
 */
export function assertCanDelete(
  user: UserPermissionContext,
  module: string,
  customMessage?: string
): void {
  assertPermission(user, module, 'delete', customMessage);
}
