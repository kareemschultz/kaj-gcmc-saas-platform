// Core type definitions for KGC Compliance Cloud

export type UserRole = 
  | 'SuperAdmin'
  | 'FirmAdmin'
  | 'ComplianceManager'
  | 'ComplianceOfficer'
  | 'DocumentOfficer'
  | 'FilingClerk'
  | 'Viewer'
  | 'ClientPortalUser';

export type ClientType = 'individual' | 'company' | 'partnership';

export type RiskLevel = 'low' | 'medium' | 'high';

export type DocumentStatus = 'valid' | 'expired' | 'pending_review' | 'rejected';

export type FilingStatus = 
  | 'draft'
  | 'prepared'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'overdue'
  | 'archived';

export type FilingFrequency = 'monthly' | 'quarterly' | 'annual' | 'one_off';

export type ServiceRequestStatus = 
  | 'new'
  | 'in_progress'
  | 'awaiting_client'
  | 'awaiting_authority'
  | 'completed'
  | 'cancelled';

export type ServiceStepStatus = 
  | 'not_started'
  | 'in_progress'
  | 'done'
  | 'blocked';

export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'completed';

export type ClientTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type ComplianceLevel = 'green' | 'amber' | 'red';

export type NotificationType = 'email' | 'in_app' | 'sms';

export type NotificationChannelStatus = 'pending' | 'sent' | 'failed';

export type Authority = 'GRA' | 'NIS' | 'DCRA' | 'Immigration';

export interface TenantContext {
  tenantId: number;
  tenantCode: string;
  tenantName: string;
}

export interface UserContext {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
  tenantId: number;
}

// TODO: Add specific type definitions for metadata fields as needed
export type DocumentMetadata = Record<string, any>;
export type ServiceRequestMetadata = Record<string, any>;
export type ComplianceBreakdown = Record<string, any>;
