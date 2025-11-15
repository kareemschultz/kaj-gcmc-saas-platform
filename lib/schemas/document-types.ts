import { z } from 'zod';

// Document Type validation schemas
export const documentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type DocumentTypeFormData = z.infer<typeof documentTypeSchema>;
