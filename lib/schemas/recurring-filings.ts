import { z } from 'zod';

// Recurring Filing validation schemas
export const recurringFilingSchema = z.object({
  clientId: z.number().int().positive('Client is required'),
  clientBusinessId: z.number().int().positive().optional(),
  filingTypeId: z.number().int().positive('Filing type is required'),
  schedule: z.string().min(1, 'Schedule is required'),
  active: z.boolean().default(true),
  nextRunAt: z.string().datetime().optional(),
});

export type RecurringFilingFormData = z.infer<typeof recurringFilingSchema>;
