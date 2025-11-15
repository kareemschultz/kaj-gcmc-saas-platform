import { z } from 'zod';

// Filing Type validation schemas
export const filingTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(50),
  authority: z.string().min(1, 'Authority is required'),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'one_off']),
  defaultDueDay: z.number().int().min(1).max(31).optional(),
  defaultDueMonth: z.number().int().min(1).max(12).optional(),
  description: z.string().optional(),
});

export type FilingTypeFormData = z.infer<typeof filingTypeSchema>;
