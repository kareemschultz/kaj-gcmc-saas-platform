/**
 * React hook for checking user permissions in UI components
 * Use this to show/hide UI elements based on user role
 */

'use client';

import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';
import { ROLE_DEFINITIONS } from '@/config/roles';

export function usePermissions() {
  const { data: session } = useSession();

  const hasPermission = (module: string, action: string): boolean => {
    if (!session?.role) {
      return false;
    }

    const role = session.role as UserRole;

    // SuperAdmin has all permissions
    if (role === 'SuperAdmin') {
      return true;
    }

    const roleDefinition = ROLE_DEFINITIONS.find((r) => r.name === role);

    if (!roleDefinition) {
      return false;
    }

    // Check for wildcard permission
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
  };

  const canView = (module: string) => hasPermission(module, 'view');
  const canCreate = (module: string) => hasPermission(module, 'create');
  const canEdit = (module: string) => hasPermission(module, 'edit');
  const canDelete = (module: string) => hasPermission(module, 'delete');

  const isAdmin = session?.role === 'SuperAdmin' || session?.role === 'FirmAdmin';
  const isSuperAdmin = session?.role === 'SuperAdmin';

  return {
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    isAdmin,
    isSuperAdmin,
    role: session?.role as UserRole | undefined,
  };
}
