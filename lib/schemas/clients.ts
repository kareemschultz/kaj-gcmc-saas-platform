import { z } from 'zod';

// Client validation schemas
export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(['individual', 'company', 'partnership']),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tin: z.string().optional(),
  nisNumber: z.string().optional(),
  sector: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
