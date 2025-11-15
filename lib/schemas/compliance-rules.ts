import { z } from 'zod';

// Compliance Rule validation schemas
export const complianceRuleSetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  appliesTo: z.object({
    clientTypes: z.array(z.string()).optional(),
    sectors: z.array(z.string()).optional(),
  }).optional(),
  active: z.boolean().default(true),
});

export const complianceRuleSchema = z.object({
  ruleSetId: z.number().int().positive(),
  ruleType: z.string().min(1, 'Rule type is required'),
  condition: z.object({}).passthrough().optional(),
  targetId: z.number().int().positive().optional(),
  weight: z.number().min(0).max(1).default(1),
  description: z.string().optional(),
});

export type ComplianceRuleSetFormData = z.infer<typeof complianceRuleSetSchema>;
export type ComplianceRuleFormData = z.infer<typeof complianceRuleSchema>;
