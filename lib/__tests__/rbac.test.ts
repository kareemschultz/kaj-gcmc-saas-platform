/**
 * Unit tests for RBAC system
 */

import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  assertPermission,
  assertAdmin,
  isAdmin,
  isSuperAdmin,
  canViewModule,
  canCreateEntity,
  canEditEntity,
  canDeleteEntity,
  getUserModules,
} from '../rbac';
import { ForbiddenError } from '../errors';

describe('RBAC System', () => {
  describe('hasPermission', () => {
    it('should allow SuperAdmin all permissions', () => {
      const user = { userId: 1, tenantId: 1, role: 'SuperAdmin' as const };
      
      expect(hasPermission(user, 'clients', 'view')).toBe(true);
      expect(hasPermission(user, 'clients', 'create')).toBe(true);
      expect(hasPermission(user, 'clients', 'edit')).toBe(true);
      expect(hasPermission(user, 'clients', 'delete')).toBe(true);
      expect(hasPermission(user, 'users', 'delete')).toBe(true);
    });

    it('should allow FirmAdmin full access within tenant', () => {
      const user = { userId: 1, tenantId: 1, role: 'FirmAdmin' as const };

      expect(hasPermission(user, 'clients', 'view')).toBe(true);
      expect(hasPermission(user, 'clients', 'create')).toBe(true);
      expect(hasPermission(user, 'documents', 'delete')).toBe(true);
      expect(hasPermission(user, 'users', 'edit')).toBe(true);
    });

    it('should restrict ComplianceOfficer permissions', () => {
      const user = { userId: 1, tenantId: 1, role: 'ComplianceOfficer' as const };

      expect(hasPermission(user, 'clients', 'view')).toBe(true);
      expect(hasPermission(user, 'documents', 'create')).toBe(true);
      expect(hasPermission(user, 'filings', 'submit')).toBe(true);
      
      // Should NOT have these permissions
      expect(hasPermission(user, 'users', 'view')).toBe(false);
      expect(hasPermission(user, 'settings', 'edit')).toBe(false);
      expect(hasPermission(user, 'clients', 'delete')).toBe(false);
    });

    it('should restrict Viewer to read-only', () => {
      const user = { userId: 1, tenantId: 1, role: 'Viewer' as const };

      expect(hasPermission(user, 'clients', 'view')).toBe(true);
      expect(hasPermission(user, 'documents', 'view')).toBe(true);
      expect(hasPermission(user, 'filings', 'view')).toBe(true);

      // Should NOT be able to create/edit/delete
      expect(hasPermission(user, 'clients', 'create')).toBe(false);
      expect(hasPermission(user, 'clients', 'edit')).toBe(false);
      expect(hasPermission(user, 'documents', 'delete')).toBe(false);
    });

    it('should restrict ClientPortalUser to portal only', () => {
      const user = { userId: 1, tenantId: 1, role: 'ClientPortalUser' as const };

      expect(hasPermission(user, 'client_portal', 'view')).toBe(true);
      expect(hasPermission(user, 'client_portal', 'message')).toBe(true);

      // Should NOT have staff module access
      expect(hasPermission(user, 'clients', 'view')).toBe(false);
      expect(hasPermission(user, 'users', 'view')).toBe(false);
    });
  });

  describe('assertPermission', () => {
    it('should not throw for valid permission', () => {
      const user = { userId: 1, tenantId: 1, role: 'FirmAdmin' as const };

      expect(() => {
        assertPermission(user, 'clients', 'create');
      }).not.toThrow();
    });

    it('should throw ForbiddenError for invalid permission', () => {
      const user = { userId: 1, tenantId: 1, role: 'Viewer' as const };

      expect(() => {
        assertPermission(user, 'clients', 'delete');
      }).toThrow(ForbiddenError);
    });

    it('should include custom message in error', () => {
      const user = { userId: 1, tenantId: 1, role: 'FilingClerk' as const };

      expect(() => {
        assertPermission(user, 'users', 'create', 'Custom error message');
      }).toThrow('Custom error message');
    });
  });

  describe('assertAdmin', () => {
    it('should not throw for SuperAdmin', () => {
      const user = { userId: 1, tenantId: 1, role: 'SuperAdmin' as const };
      
      expect(() => {
        assertAdmin(user);
      }).not.toThrow();
    });

    it('should not throw for FirmAdmin', () => {
      const user = { userId: 1, tenantId: 1, role: 'FirmAdmin' as const };

      expect(() => {
        assertAdmin(user);
      }).not.toThrow();
    });

    it('should throw for non-admin roles', () => {
      const user = { userId: 1, tenantId: 1, role: 'ComplianceOfficer' as const };

      expect(() => {
        assertAdmin(user);
      }).toThrow(ForbiddenError);
    });
  });

  describe('Permission Helper Functions', () => {
    it('canViewModule should work correctly', () => {
      const admin = { userId: 1, tenantId: 1, role: 'FirmAdmin' as const };
      const viewer = { userId: 2, tenantId: 1, role: 'Viewer' as const };

      expect(canViewModule(admin, 'clients')).toBe(true);
      expect(canViewModule(viewer, 'clients')).toBe(true);
      expect(canViewModule(viewer, 'users')).toBe(false);
    });

    it('canCreateEntity should work correctly', () => {
      const admin = { userId: 1, tenantId: 1, role: 'FirmAdmin' as const };
      const viewer = { userId: 2, tenantId: 1, role: 'Viewer' as const };

      expect(canCreateEntity(admin, 'clients')).toBe(true);
      expect(canCreateEntity(viewer, 'clients')).toBe(false);
    });

    it('canEditEntity should work correctly', () => {
      const officer = { userId: 1, tenantId: 1, role: 'ComplianceOfficer' as const };
      const clerk = { userId: 2, tenantId: 1, role: 'FilingClerk' as const };

      expect(canEditEntity(officer, 'documents')).toBe(true);
      expect(canEditEntity(clerk, 'documents')).toBe(false);
    });

    it('canDeleteEntity should work correctly', () => {
      const admin = { userId: 1, tenantId: 1, role: 'FirmAdmin' as const };
      const officer = { userId: 2, tenantId: 1, role: 'ComplianceOfficer' as const };

      expect(canDeleteEntity(admin, 'clients')).toBe(true);
      expect(canDeleteEntity(officer, 'clients')).toBe(false);
    });
  });

  describe('Role Checking Functions', () => {
    it('isAdmin should identify admin roles', () => {
      expect(isAdmin({ userId: 1, tenantId: 1, role: 'SuperAdmin' })).toBe(true);
      expect(isAdmin({ userId: 1, tenantId: 1, role: 'FirmAdmin' })).toBe(true);
      expect(isAdmin({ userId: 1, tenantId: 1, role: 'ComplianceOfficer' })).toBe(false);
    });

    it('isSuperAdmin should only identify SuperAdmin', () => {
      expect(isSuperAdmin({ userId: 1, tenantId: 1, role: 'SuperAdmin' })).toBe(true);
      expect(isSuperAdmin({ userId: 1, tenantId: 1, role: 'FirmAdmin' })).toBe(false);
    });
  });

  describe('getUserModules', () => {
    it('should return all modules for SuperAdmin', () => {
      const user = { userId: 1, tenantId: 1, role: 'SuperAdmin' as const };
      const modules = getUserModules(user);

      expect(modules).toContain('clients');
      expect(modules).toContain('users');
      expect(modules).toContain('compliance');
      expect(modules.length).toBeGreaterThan(5);
    });

    it('should return limited modules for FilingClerk', () => {
      const user = { userId: 1, tenantId: 1, role: 'FilingClerk' as const };
      const modules = getUserModules(user);

      expect(modules).toContain('clients');
      expect(modules).toContain('filings');
      expect(modules).not.toContain('users');
      expect(modules).not.toContain('settings');
    });
  });
});
