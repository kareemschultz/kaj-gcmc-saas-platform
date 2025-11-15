import { z } from 'zod';

// Filing validation schemas
export const filingSchema = z.object({
  clientId: z.number().min(1, 'Client is required'),
  clientBusinessId: z.number().optional().nullable(),
  filingTypeId: z.number().min(1, 'Filing type is required'),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  periodLabel: z.string().optional(),
  status: z.enum(['draft', 'prepared', 'submitted', 'approved', 'rejected', 'overdue', 'archived']),
  referenceNumber: z.string().optional(),
  taxAmount: z.number().optional(),
  penalties: z.number().optional(),
  interest: z.number().optional(),
  submissionDate: z.string().optional(),
  internalNotes: z.string().optional(),
});

export type FilingFormData = z.infer<typeof filingSchema>;
