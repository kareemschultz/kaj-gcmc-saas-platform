import { z } from 'zod';

// Requirement Bundle validation schemas
export const requirementBundleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  authority: z.string().min(1, 'Authority is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
});

export const requirementBundleItemSchema = z.object({
  bundleId: z.number().min(1),
  documentTypeId: z.number().optional().nullable(),
  filingTypeId: z.number().optional().nullable(),
  required: z.boolean().default(true),
  description: z.string().optional(),
  order: z.number().default(0),
});

export type RequirementBundleFormData = z.infer<typeof requirementBundleSchema>;
export type RequirementBundleItemFormData = z.infer<typeof requirementBundleItemSchema>;
