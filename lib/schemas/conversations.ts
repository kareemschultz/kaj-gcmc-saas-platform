import { z } from 'zod';

// Conversation validation schemas
export const conversationSchema = z.object({
  clientId: z.number().int().positive().optional(),
  serviceRequestId: z.number().int().positive().optional(),
  subject: z.string().max(255).optional(),
});

export const messageSchema = z.object({
  conversationId: z.number().int().positive('Conversation is required'),
  body: z.string().min(1, 'Message body is required'),
});

export type ConversationFormData = z.infer<typeof conversationSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
