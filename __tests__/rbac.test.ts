import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  canViewModule,
  canCreateEntity,
  canEditEntity,
  canDeleteEntity,
  isStaffUser,
  isClientPortalUser,
  getUserPermissions,
  type UserContext,
} from '@/lib/rbac';

describe('RBAC Permission Checks', () => {
  describe('hasPermission', () => {
    it('should allow SuperAdmin all permissions', () => {
      expect(hasPermission('SuperAdmin', 'clients', 'view')).toBe(true);
      expect(hasPermission('SuperAdmin', 'clients', 'create')).toBe(true);
      expect(hasPermission('SuperAdmin', 'clients', 'edit')).toBe(true);
      expect(hasPermission('SuperAdmin', 'clients', 'delete')).toBe(true);
      expect(hasPermission('SuperAdmin', 'tenants', 'manage')).toBe(true);
    });

    it('should allow FirmAdmin to manage users', () => {
      expect(hasPermission('FirmAdmin', 'users', 'view')).toBe(true);
      expect(hasPermission('FirmAdmin', 'users', 'create')).toBe(true);
      expect(hasPermission('FirmAdmin', 'users', 'edit')).toBe(true);
      expect(hasPermission('FirmAdmin', 'users', 'delete')).toBe(true);
    });

    it('should allow ComplianceOfficer to edit filings', () => {
      expect(hasPermission('ComplianceOfficer', 'filings', 'view')).toBe(true);
      expect(hasPermission('ComplianceOfficer', 'filings', 'create')).toBe(true);
      expect(hasPermission('ComplianceOfficer', 'filings', 'edit')).toBe(true);
    });

    it('should NOT allow ComplianceOfficer to manage users', () => {
      expect(hasPermission('ComplianceOfficer', 'users', 'create')).toBe(false);
      expect(hasPermission('ComplianceOfficer', 'users', 'delete')).toBe(false);
    });

    it('should allow DocumentOfficer to manage documents only', () => {
      expect(hasPermission('DocumentOfficer', 'documents', 'view')).toBe(true);
      expect(hasPermission('DocumentOfficer', 'documents', 'create')).toBe(true);
      expect(hasPermission('DocumentOfficer', 'documents', 'edit')).toBe(true);
      expect(hasPermission('DocumentOfficer', 'filings', 'create')).toBe(false);
    });

    it('should allow FilingClerk to view clients and manage filings', () => {
      expect(hasPermission('FilingClerk', 'clients', 'view')).toBe(true);
      expect(hasPermission('FilingClerk', 'clients', 'edit')).toBe(false);
      expect(hasPermission('FilingClerk', 'filings', 'view')).toBe(true);
      expect(hasPermission('FilingClerk', 'filings', 'create')).toBe(true);
      expect(hasPermission('FilingClerk', 'filings', 'edit')).toBe(true);
    });

    it('should restrict Viewer to read-only access', () => {
      expect(hasPermission('Viewer', 'clients', 'view')).toBe(true);
      expect(hasPermission('Viewer', 'clients', 'create')).toBe(false);
      expect(hasPermission('Viewer', 'clients', 'edit')).toBe(false);
      expect(hasPermission('Viewer', 'clients', 'delete')).toBe(false);
      expect(hasPermission('Viewer', 'documents', 'view')).toBe(true);
      expect(hasPermission('Viewer', 'documents', 'create')).toBe(false);
    });

    it('should restrict ClientPortalUser to portal only', () => {
      expect(hasPermission('ClientPortalUser', 'client_portal', 'view')).toBe(true);
      expect(hasPermission('ClientPortalUser', 'clients', 'view')).toBe(false);
      expect(hasPermission('ClientPortalUser', 'documents', 'view')).toBe(false);
    });
  });

  describe('Module-specific permission checks', () => {
    const firmAdminUser: UserContext = {
      id: 1,
      role: 'FirmAdmin',
      tenantId: 1,
      email: 'admin@test.com',
    };

    const viewerUser: UserContext = {
      id: 2,
      role: 'Viewer',
      tenantId: 1,
      email: 'viewer@test.com',
    };

    it('should correctly check canViewModule', () => {
      expect(canViewModule(firmAdminUser, 'clients')).toBe(true);
      expect(canViewModule(viewerUser, 'clients')).toBe(true);
    });

    it('should correctly check canCreateEntity', () => {
      expect(canCreateEntity(firmAdminUser, 'clients')).toBe(true);
      expect(canCreateEntity(viewerUser, 'clients')).toBe(false);
    });

    it('should correctly check canEditEntity', () => {
      expect(canEditEntity(firmAdminUser, 'clients')).toBe(true);
      expect(canEditEntity(viewerUser, 'clients')).toBe(false);
    });

    it('should correctly check canDeleteEntity', () => {
      expect(canDeleteEntity(firmAdminUser, 'clients')).toBe(true);
      expect(canDeleteEntity(viewerUser, 'clients')).toBe(false);
    });
  });

  describe('User type checks', () => {
    it('should correctly identify staff users', () => {
      const staffUser: UserContext = {
        id: 1,
        role: 'FirmAdmin',
        tenantId: 1,
      };

      expect(isStaffUser(staffUser)).toBe(true);
    });

    it('should correctly identify client portal users', () => {
      const clientUser: UserContext = {
        id: 2,
        role: 'ClientPortalUser',
        tenantId: 1,
      };

      expect(isClientPortalUser(clientUser)).toBe(true);
      expect(isStaffUser(clientUser)).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return correct permissions summary for FirmAdmin', () => {
      const permissions = getUserPermissions('FirmAdmin');

      expect(permissions.canViewClients).toBe(true);
      expect(permissions.canCreateClients).toBe(true);
      expect(permissions.canEditClients).toBe(true);
      expect(permissions.canDeleteClients).toBe(true);
      expect(permissions.canManageUsers).toBe(true);
      expect(permissions.isAdmin).toBe(true);
      expect(permissions.isSuperAdmin).toBe(false);
    });

    it('should return correct permissions summary for Viewer', () => {
      const permissions = getUserPermissions('Viewer');

      expect(permissions.canViewClients).toBe(true);
      expect(permissions.canCreateClients).toBe(false);
      expect(permissions.canEditClients).toBe(false);
      expect(permissions.canDeleteClients).toBe(false);
      expect(permissions.canManageUsers).toBe(false);
      expect(permissions.isAdmin).toBe(false);
    });

    it('should return correct permissions summary for SuperAdmin', () => {
      const permissions = getUserPermissions('SuperAdmin');

      expect(permissions.canViewClients).toBe(true);
      expect(permissions.canCreateClients).toBe(true);
      expect(permissions.canEditClients).toBe(true);
      expect(permissions.canDeleteClients).toBe(true);
      expect(permissions.canManageUsers).toBe(true);
      expect(permissions.canManageTenants).toBe(true);
      expect(permissions.isAdmin).toBe(true);
      expect(permissions.isSuperAdmin).toBe(true);
    });

    it('should return correct permissions summary for ComplianceOfficer', () => {
      const permissions = getUserPermissions('ComplianceOfficer');

      expect(permissions.canViewClients).toBe(true);
      expect(permissions.canEditClients).toBe(true);
      expect(permissions.canDeleteClients).toBe(false);
      expect(permissions.canViewDocuments).toBe(true);
      expect(permissions.canCreateDocuments).toBe(true);
      expect(permissions.canViewFilings).toBe(true);
      expect(permissions.canCreateFilings).toBe(true);
      expect(permissions.canManageUsers).toBe(false);
      expect(permissions.isAdmin).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should return false for unknown role', () => {
      // @ts-expect-error Testing with invalid role
      expect(hasPermission('UnknownRole', 'clients', 'view')).toBe(false);
    });

    it('should return false for unknown module', () => {
      // @ts-expect-error Testing with invalid module
      expect(hasPermission('FirmAdmin', 'unknown_module', 'view')).toBe(false);
    });
  });
});
