// Role definitions and initial role setup

import { UserRole } from '@/types';

export interface RoleDefinition {
  name: UserRole;
  description: string;
  permissions: {
    module: string;
    actions: string[];
  }[];
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    name: 'SuperAdmin',
    description: 'Full system access across all tenants',
    permissions: [
      { module: '*', actions: ['*'] },
    ],
  },
  {
    name: 'FirmAdmin',
    description: 'Full access within tenant, can manage users and settings',
    permissions: [
      { module: 'clients', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'documents', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'filings', actions: ['view', 'create', 'edit', 'delete', 'submit'] },
      { module: 'services', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'users', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'settings', actions: ['view', 'edit'] },
      { module: 'compliance', actions: ['view'] },
    ],
  },
  {
    name: 'ComplianceManager',
    description: 'Manage compliance, filings, and client oversight',
    permissions: [
      { module: 'clients', actions: ['view', 'create', 'edit'] },
      { module: 'documents', actions: ['view', 'create', 'edit'] },
      { module: 'filings', actions: ['view', 'create', 'edit', 'submit'] },
      { module: 'services', actions: ['view', 'create', 'edit'] },
      { module: 'compliance', actions: ['view', 'edit'] },
    ],
  },
  {
    name: 'ComplianceOfficer',
    description: 'Handle client filings and document review',
    permissions: [
      { module: 'clients', actions: ['view', 'edit'] },
      { module: 'documents', actions: ['view', 'create', 'edit'] },
      { module: 'filings', actions: ['view', 'create', 'edit', 'submit'] },
    ],
  },
  {
    name: 'DocumentOfficer',
    description: 'Manage document uploads and organization',
    permissions: [
      { module: 'clients', actions: ['view'] },
      { module: 'documents', actions: ['view', 'create', 'edit'] },
    ],
  },
  {
    name: 'FilingClerk',
    description: 'Prepare and submit filings',
    permissions: [
      { module: 'clients', actions: ['view'] },
      { module: 'filings', actions: ['view', 'create', 'edit'] },
    ],
  },
  {
    name: 'Viewer',
    description: 'Read-only access to client information',
    permissions: [
      { module: 'clients', actions: ['view'] },
      { module: 'documents', actions: ['view'] },
      { module: 'filings', actions: ['view'] },
    ],
  },
  {
    name: 'ClientPortalUser',
    description: 'Client portal access for end users',
    permissions: [
      { module: 'client_portal', actions: ['view', 'upload', 'message'] },
    ],
  },
];
