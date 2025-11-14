'use server';

// Server actions for client portal

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';

// ========================================
// HELPERS
// ========================================

async function getPortalSession() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  // In a real implementation, you'd have a clientId in the session
  // For now, we'll fetch the first client for this user's tenant as a demo
  // You should extend the session type to include clientId for portal users

  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    userEmail: session.user.email,
  };
}

// ========================================
// PORTAL DASHBOARD
// ========================================

export async function getPortalDashboardData(clientId: number) {
  const { tenantId } = await getPortalSession();

  // Verify client belongs to tenant
  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    include: {
      complianceScores: {
        take: 1,
        orderBy: { lastCalculatedAt: 'desc' },
      },
    },
  });

  if (!client) {
    throw new ApiError('Client not found', 404);
  }

  const [upcomingDeadlines, openTasks, recentMessages, activeServiceRequests] =
    await Promise.all([
      // Upcoming filings
      prisma.filing.findMany({
        where: {
          clientId,
          tenantId,
          periodEnd: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          status: { in: ['draft', 'prepared'] },
        },
        include: {
          filingType: { select: { name: true, authority: true } },
        },
        orderBy: { periodEnd: 'asc' },
        take: 5,
      }),

      // Client tasks
      prisma.clientTask.findMany({
        where: {
          clientId,
          tenantId,
          status: { in: ['pending', 'in_progress'] },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),

      // Recent messages in conversations
      prisma.message.findMany({
        where: {
          conversation: {
            clientId,
            tenantId,
          },
        },
        include: {
          author: { select: { name: true } },
          conversation: { select: { subject: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Active service requests
      prisma.serviceRequest.findMany({
        where: {
          clientId,
          tenantId,
          status: { in: ['new', 'in_progress', 'awaiting_client'] },
        },
        include: {
          service: { select: { name: true, category: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

  const complianceScore = client.complianceScores[0] || null;

  return {
    client,
    complianceScore,
    upcomingDeadlines,
    openTasks,
    recentMessages,
    activeServiceRequests,
  };
}

// ========================================
// DOCUMENTS
// ========================================

export async function getPortalDocuments(clientId: number) {
  const { tenantId } = await getPortalSession();

  const documents = await prisma.document.findMany({
    where: { clientId, tenantId },
    include: {
      documentType: { select: { name: true, category: true, authority: true } },
      latestVersion: {
        select: {
          expiryDate: true,
          issueDate: true,
          fileUrl: true,
          fileSize: true,
          mimeType: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return documents;
}

// ========================================
// FILINGS
// ========================================

export async function getPortalFilings(clientId: number) {
  const { tenantId } = await getPortalSession();

  const filings = await prisma.filing.findMany({
    where: { clientId, tenantId },
    include: {
      filingType: { select: { name: true, authority: true, frequency: true } },
    },
    orderBy: { periodEnd: 'desc' },
  });

  return filings;
}

// ========================================
// SERVICE REQUESTS
// ========================================

export async function getPortalServiceRequests(clientId: number) {
  const { tenantId } = await getPortalSession();

  const serviceRequests = await prisma.serviceRequest.findMany({
    where: { clientId, tenantId },
    include: {
      service: { select: { name: true, category: true, description: true } },
      steps: {
        select: {
          id: true,
          title: true,
          status: true,
          order: true,
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return serviceRequests;
}

export async function getPortalServiceRequestDetails(serviceRequestId: number, clientId: number) {
  const { tenantId } = await getPortalSession();

  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id: serviceRequestId,
      clientId,
      tenantId,
    },
    include: {
      service: true,
      steps: {
        orderBy: { order: 'asc' },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
        },
      },
      conversations: {
        include: {
          messages: {
            include: {
              author: { select: { name: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  if (!serviceRequest) {
    throw new ApiError('Service request not found', 404);
  }

  return serviceRequest;
}

// ========================================
// MESSAGES
// ========================================

export async function getPortalConversations(clientId: number) {
  const { tenantId } = await getPortalSession();

  const conversations = await prisma.conversation.findMany({
    where: { clientId, tenantId },
    include: {
      messages: {
        include: {
          author: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return conversations;
}

export async function getPortalConversationDetails(conversationId: number, clientId: number) {
  const { tenantId } = await getPortalSession();

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      clientId,
      tenantId,
    },
    include: {
      messages: {
        include: {
          author: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!conversation) {
    throw new ApiError('Conversation not found', 404);
  }

  return conversation;
}

export async function sendPortalMessage(conversationId: number, clientId: number, body: string) {
  const { tenantId, userId } = await getPortalSession();

  // Verify conversation belongs to client
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      clientId,
      tenantId,
    },
  });

  if (!conversation) {
    throw new ApiError('Conversation not found', 404);
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      authorId: userId,
      body,
    },
    include: {
      author: { select: { name: true, email: true } },
    },
  });

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

// ========================================
// PROFILE
// ========================================

export async function getPortalClientProfile(clientId: number) {
  const { tenantId } = await getPortalSession();

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    include: {
      businesses: true,
    },
  });

  if (!client) {
    throw new ApiError('Client not found', 404);
  }

  return client;
}

// ========================================
// TASKS
// ========================================

export async function getPortalClientTasks(clientId: number) {
  const { tenantId } = await getPortalSession();

  const tasks = await prisma.clientTask.findMany({
    where: { clientId, tenantId },
    include: {
      serviceRequest: {
        select: {
          id: true,
          service: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tasks;
}
