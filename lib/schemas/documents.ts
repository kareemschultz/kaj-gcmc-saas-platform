import { z } from 'zod';

// Document validation schemas
export const documentSchema = z.object({
  clientId: z.number().min(1, 'Client is required'),
  clientBusinessId: z.number().optional().nullable(),
  documentTypeId: z.number().min(1, 'Document type is required'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['valid', 'expired', 'pending_review', 'rejected']),
  authority: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const documentVersionSchema = z.object({
  documentId: z.number(),
  fileUrl: z.string().url('Invalid file URL'),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  issuingAuthority: z.string().optional(),
});

export type DocumentFormData = z.infer<typeof documentSchema>;
export type DocumentVersionFormData = z.infer<typeof documentVersionSchema>;
