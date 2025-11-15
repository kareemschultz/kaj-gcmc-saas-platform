import { z } from 'zod';

// Notification validation schemas
export const notificationSchema = z.object({
  recipientUserId: z.number().int().positive('Recipient is required'),
  type: z.enum(['email', 'in_app', 'sms']).default('in_app'),
  channelStatus: z.enum(['pending', 'sent', 'failed']).default('pending'),
  message: z.string().min(1, 'Message is required'),
  metadata: z.object({
    title: z.string().optional(),
    actionUrl: z.string().optional(),
    entityType: z.string().optional(),
    entityId: z.number().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  }).passthrough().optional(),
});

export type NotificationFormData = z.infer<typeof notificationSchema>;
