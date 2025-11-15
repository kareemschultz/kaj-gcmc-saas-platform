import { z } from 'zod';

// Client Business validation schemas
export const clientBusinessSchema = z.object({
  clientId: z.number(),
  name: z.string().min(1, 'Business name is required').max(255),
  registrationNumber: z.string().optional(),
  registrationType: z.enum([
    'Sole Proprietorship',
    'Partnership',
    'LLC',
    'Corporation',
    'Other',
  ]).optional(),
  incorporationDate: z.string().optional().nullable(),
  country: z.string().optional(),
  sector: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Pending', 'Dissolved']).optional(),
});

export type ClientBusinessFormData = z.infer<typeof clientBusinessSchema>;
