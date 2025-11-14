// Application constants and configuration

export const APP_NAME = 'KGC Compliance Cloud';
export const APP_DESCRIPTION = 'Multi-tenant compliance platform for professional services firms in Guyana';
export const APP_VERSION = '0.1.0';

// Tenant codes
export const TENANT_CODES = {
  KAJ: 'KAJ',
  GCMC: 'GCMC',
} as const;

// Document categories
export const DOCUMENT_CATEGORIES = {
  IDENTIFICATION: 'Identification',
  TAX: 'Tax',
  INSURANCE: 'Insurance',
  BUSINESS: 'Business Registration',
  IMMIGRATION: 'Immigration',
  FINANCIAL: 'Financial',
  LEGAL: 'Legal',
  OTHER: 'Other',
} as const;

// Service categories
export const SERVICE_CATEGORIES = {
  TAX: 'Tax Services',
  BUSINESS_REG: 'Business Registration',
  IMMIGRATION: 'Immigration Services',
  COMPLIANCE: 'Compliance Services',
  CONSULTING: 'Consulting',
  OTHER: 'Other Services',
} as const;

// Task priorities
export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

// Compliance score thresholds
export const COMPLIANCE_THRESHOLDS = {
  GREEN: 80,
  AMBER: 50,
  RED: 0,
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  FULL: 'MMMM dd, yyyy HH:mm',
} as const;
