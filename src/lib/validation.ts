// Validation schemas using Zod

import { z } from 'zod';

// Client validation schemas
export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(['individual', 'company', 'partnership']),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tin: z.string().optional(),
  nisNumber: z.string().optional(),
  sector: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
});

export const createClientSchema = clientSchema;
export const updateClientSchema = clientSchema.partial();

// Document validation schemas
export const documentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  documentTypeId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  clientBusinessId: z.number().int().positive().optional(),
  authority: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const documentVersionSchema = z.object({
  documentId: z.number().int().positive(),
  fileUrl: z.string().url(),
  storageProvider: z.string(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  issuingAuthority: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Filing validation schemas
export const filingSchema = z.object({
  clientId: z.number().int().positive(),
  clientBusinessId: z.number().int().positive().optional(),
  filingTypeId: z.number().int().positive(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  periodLabel: z.string().optional(),
  status: z.enum(['draft', 'prepared', 'submitted', 'approved', 'rejected', 'overdue', 'archived']),
  referenceNumber: z.string().optional(),
  taxAmount: z.number().optional(),
  penalties: z.number().optional(),
  interest: z.number().optional(),
  total: z.number().optional(),
  submissionDate: z.string().datetime().optional(),
  approvalDate: z.string().datetime().optional(),
  internalNotes: z.string().optional(),
});

// Service Request validation schemas
export const serviceRequestSchema = z.object({
  clientId: z.number().int().positive(),
  clientBusinessId: z.number().int().positive().optional(),
  serviceId: z.number().int().positive(),
  templateId: z.number().int().positive().optional(),
  status: z.enum(['new', 'in_progress', 'awaiting_client', 'awaiting_authority', 'completed', 'cancelled']),
  priority: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Task validation schemas
export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'blocked', 'completed']),
  priority: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  clientId: z.number().int().positive().optional(),
  serviceRequestId: z.number().int().positive().optional(),
  filingId: z.number().int().positive().optional(),
  assignedToId: z.number().int().positive().optional(),
});

// User validation schemas
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
