import { z } from 'zod';

// Task validation schemas
export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'blocked', 'completed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime().optional(),
  assignedToId: z.number().int().positive().optional(),
  clientId: z.number().int().positive().optional(),
  serviceRequestId: z.number().int().positive().optional(),
  filingId: z.number().int().positive().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;
