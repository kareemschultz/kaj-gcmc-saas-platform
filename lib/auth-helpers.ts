// Authentication and authorization helpers

import { UserRole } from '@/types';

export function hasPermission(userRole: UserRole, module: string, action: string): boolean {
  // TODO: Implement full RBAC permission checking in Phase 1
  // For now, simple role-based checks
  
  const superAdminModules = ['*'];
  const firmAdminModules = ['clients', 'documents', 'filings', 'services', 'users', 'settings'];
  const complianceManagerModules = ['clients', 'documents', 'filings', 'services', 'compliance'];
  const complianceOfficerModules = ['clients', 'documents', 'filings'];
  const documentOfficerModules = ['documents'];
  const filingClerkModules = ['filings'];
  const viewerModules = ['clients', 'documents', 'filings'];
  
  switch (userRole) {
    case 'SuperAdmin':
      return true;
    case 'FirmAdmin':
      return firmAdminModules.includes(module);
    case 'ComplianceManager':
      return complianceManagerModules.includes(module);
    case 'ComplianceOfficer':
      return complianceOfficerModules.includes(module) && action !== 'delete';
    case 'DocumentOfficer':
      return documentOfficerModules.includes(module);
    case 'FilingClerk':
      return filingClerkModules.includes(module);
    case 'Viewer':
      return viewerModules.includes(module) && action === 'view';
    case 'ClientPortalUser':
      return false; // Client portal has different permission logic
    default:
      return false;
  }
}

export function canEditClient(userRole: UserRole): boolean {
  return hasPermission(userRole, 'clients', 'edit');
}

export function canDeleteClient(userRole: UserRole): boolean {
  return hasPermission(userRole, 'clients', 'delete');
}

export function canUploadDocument(userRole: UserRole): boolean {
  return hasPermission(userRole, 'documents', 'create');
}

export function canSubmitFiling(userRole: UserRole): boolean {
  return hasPermission(userRole, 'filings', 'submit');
}
