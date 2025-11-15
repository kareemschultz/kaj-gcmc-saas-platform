'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Validation schemas
const conversationSchema = z.object({
  clientId: z.number().int().positive().optional(),
  serviceRequestId: z.number().int().positive().optional(),
  subject: z.string().max(255).optional(),
});

const messageSchema = z.object({
  conversationId: z.number().int().positive('Conversation is required'),
  body: z.string().min(1, 'Message body is required'),
});

type ConversationFormData = z.infer<typeof conversationSchema>;
type MessageFormData = z.infer<typeof messageSchema>;

// Get all conversations for current tenant
export async function getConversations(params?: {
  search?: string;
  clientId?: number;
  serviceRequestId?: number;
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const {
    search = '',
    clientId,
    serviceRequestId,
    unreadOnly = false,
    page = 1,
    pageSize = 20,
  } = params || {};

  try {
    const where = {
      tenantId: session.user.tenantId,
      ...(clientId && { clientId }),
      ...(serviceRequestId && { serviceRequestId }),
      ...(search && {
        OR: [
          { subject: { contains: search, mode: 'insensitive' as const } },
          { client: { name: { contains: search, mode: 'insensitive' as const } } },
        ],
      }),
      ...(unreadOnly && {
        messages: {
          some: {
            readAt: null,
            authorId: { not: session.user.id },
          },
        },
      }),
    };

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          serviceRequest: {
            select: {
              id: true,
              service: {
                select: { name: true },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return {
      conversations,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Error fetching conversations:', error as Error);
    throw new ApiError('Failed to fetch conversations', 500);
  }
}

// Get single conversation with messages
export async function getConversation(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        client: true,
        serviceRequest: {
          include: {
            service: {
              select: { name: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new ApiError('Conversation not found', 404);
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        authorId: { not: session.user.id },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return conversation;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching conversation:', error as Error);
    throw new ApiError('Failed to fetch conversation', 500);
  }
}

// Create conversation
export async function createConversation(data: ConversationFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = conversationSchema.parse(data);

    // Verify client belongs to tenant if provided
    if (validated.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: validated.clientId,
          tenantId: session.user.tenantId,
        },
      });

      if (!client) {
        throw new ApiError('Client not found', 404);
      }
    }

    // Verify service request belongs to tenant if provided
    if (validated.serviceRequestId) {
      const serviceRequest = await prisma.serviceRequest.findFirst({
        where: {
          id: validated.serviceRequestId,
          tenantId: session.user.tenantId,
        },
      });

      if (!serviceRequest) {
        throw new ApiError('Service request not found', 404);
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        ...validated,
        tenantId: session.user.tenantId,
      },
    });

    revalidatePath('/messages');
    logger.info('Conversation created:', { conversationId: conversation.id });

    return conversation;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error creating conversation:', error as Error);
    throw new ApiError('Failed to create conversation', 500);
  }
}

// Update conversation
export async function updateConversation(id: number, data: Partial<ConversationFormData>) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const existing = await prisma.conversation.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existing) {
      throw new ApiError('Conversation not found', 404);
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data,
    });

    revalidatePath('/messages');
    revalidatePath(`/messages/${id}`);
    logger.info('Conversation updated:', { conversationId: conversation.id });

    return conversation;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error updating conversation:', error as Error);
    throw new ApiError('Failed to update conversation', 500);
  }
}

// Delete conversation
export async function deleteConversation(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const existing = await prisma.conversation.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existing) {
      throw new ApiError('Conversation not found', 404);
    }

    await prisma.conversation.delete({
      where: { id },
    });

    revalidatePath('/messages');
    logger.info('Conversation deleted:', { conversationId: id });

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting conversation:', error as Error);
    throw new ApiError('Failed to delete conversation', 500);
  }
}

// Create message
export async function createMessage(data: MessageFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = messageSchema.parse(data);

    // Verify conversation belongs to tenant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: validated.conversationId,
        tenantId: session.user.tenantId,
      },
    });

    if (!conversation) {
      throw new ApiError('Conversation not found', 404);
    }

    const message = await prisma.$transaction(async (tx) => {
      // Create message
      const msg = await tx.message.create({
        data: {
          ...validated,
          authorId: session.user.id,
        },
      });

      // Update conversation timestamp
      await tx.conversation.update({
        where: { id: validated.conversationId },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    revalidatePath('/messages');
    revalidatePath(`/messages/${validated.conversationId}`);
    logger.info('Message created:', { messageId: message.id });

    return message;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error creating message:', error as Error);
    throw new ApiError('Failed to create message', 500);
  }
}

// Mark message as read
export async function markMessageAsRead(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    // Verify message belongs to tenant via conversation
    const message = await prisma.message.findFirst({
      where: {
        id,
        conversation: {
          tenantId: session.user.tenantId,
        },
      },
    });

    if (!message) {
      throw new ApiError('Message not found', 404);
    }

    // Only mark as read if not the author
    if (message.authorId !== session.user.id && !message.readAt) {
      await prisma.message.update({
        where: { id },
        data: { readAt: new Date() },
      });
    }

    revalidatePath('/messages');
    revalidatePath(`/messages/${message.conversationId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error marking message as read:', error as Error);
    throw new ApiError('Failed to mark message as read', 500);
  }
}

// Get unread message count
export async function getUnreadMessageCount() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const count = await prisma.message.count({
      where: {
        conversation: {
          tenantId: session.user.tenantId,
        },
        authorId: { not: session.user.id },
        readAt: null,
      },
    });

    return count;
  } catch (error) {
    logger.error('Error fetching unread message count:', error as Error);
    throw new ApiError('Failed to fetch unread message count', 500);
  }
}
