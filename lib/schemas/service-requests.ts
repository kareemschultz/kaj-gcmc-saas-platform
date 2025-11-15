import { z } from 'zod';

// Service Request validation schemas
export const serviceRequestSchema = z.object({
  clientId: z.number().int().positive('Client is required'),
  clientBusinessId: z.number().int().positive().optional(),
  serviceId: z.number().int().positive('Service is required'),
  templateId: z.number().int().positive().optional(),
  status: z.enum(['new', 'in_progress', 'awaiting_client', 'awaiting_authority', 'completed', 'cancelled']).default('new'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  metadata: z.object({}).passthrough().optional(),
});

export const serviceStepSchema = z.object({
  serviceRequestId: z.number().int().positive(),
  filingId: z.number().int().positive().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  order: z.number().int().nonnegative(),
  status: z.enum(['not_started', 'in_progress', 'done', 'blocked']).default('not_started'),
  dueDate: z.string().datetime().optional(),
  requiredDocTypeIds: z.array(z.number()).default([]),
  dependsOnStepId: z.number().int().optional(),
});

export type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;
export type ServiceStepFormData = z.infer<typeof serviceStepSchema>;
