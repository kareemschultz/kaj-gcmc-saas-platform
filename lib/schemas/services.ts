import { z } from 'zod';

// Service validation schemas
export const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  basePrice: z.number().nonnegative().optional(),
  estimatedDays: z.number().int().positive().optional(),
  active: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
