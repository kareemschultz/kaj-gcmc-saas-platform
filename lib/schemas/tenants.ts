import { z } from 'zod';

// Tenant validation schemas
export const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(50).regex(/^[a-z0-9-]+$/, 'Code must be lowercase alphanumeric with hyphens'),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  settings: z.object({
    branding: z.object({
      logoUrl: z.string().url().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
    }).optional(),
    defaults: z.object({
      currency: z.string().optional(),
      timezone: z.string().optional(),
      dateFormat: z.string().optional(),
    }).optional(),
  }).optional(),
});

export type TenantFormData = z.infer<typeof tenantSchema>;
