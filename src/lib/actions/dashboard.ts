'use server';

// Server actions for Admin Dashboard

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';

export interface ComplianceSummary {
  green: number;
  amber: number;
  red: number;
  total: number;
  greenPercent: number;
  amberPercent: number;
  redPercent: number;
}

export interface UpcomingDeadline {
  id: number;
  type: 'filing' | 'document';
  title: string;
  clientName: string;
  clientId: number;
  dueDate: Date;
  daysUntil: number;
  authority?: string;
  status?: string;
}

export interface RecentActivity {
  id: number;
  actor: string;
  action: string;
  entityType: string;
  entityId: number;
  clientName?: string;
  createdAt: Date;
}

export interface AuthorityMetrics {
  authority: string;
  totalClients: number;
  compliantClients: number;
  complianceRate: number;
  totalFilings: number;
  overdueFilings: number;
  expiringDocs: number;
}

export interface QuickStats {
  totalClients: number;
  activeServiceRequests: number;
  pendingTasks: number;
  totalFilingsThisMonth: number;
  docsUploadedThisWeek: number;
  overdueFilings: number;
  expiringDocs30Days: number;
}

export interface DashboardStats {
  complianceSummary: ComplianceSummary;
  upcomingDeadlines: {
    filings: UpcomingDeadline[];
    expiringDocs: UpcomingDeadline[];
  };
  recentActivity: RecentActivity[];
  authorityMetrics: AuthorityMetrics[];
  quickStats: QuickStats;
}

// Get comprehensive dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const tenantId = session.user.tenantId;

  // Fetch all data in parallel for performance
  const [
    complianceScores,
    upcomingFilings,
    expiringDocuments,
    recentAuditLogs,
    clients,
    serviceRequests,
    tasks,
    allFilings,
    documents,
  ] = await Promise.all([
    // Compliance scores
    prisma.complianceScore.findMany({
      where: { tenantId },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    }),

    // Upcoming filings (next 30 days)
    prisma.filing.findMany({
      where: {
        tenantId,
        status: { in: ['draft', 'prepared', 'overdue'] },
        periodEnd: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        client: { select: { id: true, name: true } },
        filingType: { select: { name: true, authority: true } },
      },
      orderBy: { periodEnd: 'asc' },
      take: 20,
    }),

    // Expiring documents (next 30 days)
    prisma.document.findMany({
      where: {
        tenantId,
        status: { in: ['valid', 'pending_review'] },
      },
      include: {
        client: { select: { id: true, name: true } },
        documentType: { select: { name: true, authority: true } },
        latestVersion: {
          select: {
            expiryDate: true,
          },
        },
      },
    }),

    // Recent audit logs
    prisma.auditLog.findMany({
      where: { tenantId },
      include: {
        actor: { select: { name: true } },
        client: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),

    // All clients
    prisma.client.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    }),

    // Active service requests
    prisma.serviceRequest.findMany({
      where: {
        tenantId,
        status: { in: ['new', 'in_progress', 'awaiting_client', 'awaiting_authority'] },
      },
    }),

    // Pending tasks
    prisma.task.findMany({
      where: {
        tenantId,
        status: { in: ['open', 'in_progress'] },
      },
    }),

    // All filings for metrics
    prisma.filing.findMany({
      where: { tenantId },
      include: {
        filingType: { select: { authority: true } },
      },
    }),

    // Documents uploaded this week
    prisma.document.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  // Calculate compliance summary
  const complianceSummary: ComplianceSummary = {
    green: complianceScores.filter((s) => s.level === 'green').length,
    amber: complianceScores.filter((s) => s.level === 'amber').length,
    red: complianceScores.filter((s) => s.level === 'red').length,
    total: complianceScores.length,
    greenPercent: 0,
    amberPercent: 0,
    redPercent: 0,
  };

  if (complianceSummary.total > 0) {
    complianceSummary.greenPercent = Math.round(
      (complianceSummary.green / complianceSummary.total) * 100
    );
    complianceSummary.amberPercent = Math.round(
      (complianceSummary.amber / complianceSummary.total) * 100
    );
    complianceSummary.redPercent = Math.round(
      (complianceSummary.red / complianceSummary.total) * 100
    );
  }

  // Process upcoming deadlines
  const now = new Date();
  const filingDeadlines: UpcomingDeadline[] = upcomingFilings
    .filter((f) => f.periodEnd)
    .map((filing) => ({
      id: filing.id,
      type: 'filing' as const,
      title: filing.filingType.name,
      clientName: filing.client.name,
      clientId: filing.client.id,
      dueDate: filing.periodEnd!,
      daysUntil: Math.ceil(
        (filing.periodEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
      authority: filing.filingType.authority,
      status: filing.status,
    }))
    .filter((d) => d.daysUntil <= 30);

  const expiringDocs: UpcomingDeadline[] = expiringDocuments
    .filter((doc) => doc.latestVersion?.expiryDate)
    .map((doc) => ({
      id: doc.id,
      type: 'document' as const,
      title: doc.documentType.name,
      clientName: doc.client.name,
      clientId: doc.client.id,
      dueDate: doc.latestVersion!.expiryDate!,
      daysUntil: Math.ceil(
        (doc.latestVersion!.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
      authority: doc.documentType.authority,
    }))
    .filter((d) => d.daysUntil <= 30 && d.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 10);

  // Process recent activity
  const recentActivity: RecentActivity[] = recentAuditLogs.map((log) => ({
    id: log.id,
    actor: log.actor?.name || 'System',
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    clientName: log.client?.name,
    createdAt: log.createdAt,
  }));

  // Calculate authority metrics
  const authorities = ['GRA', 'NIS', 'DCRA', 'Immigration'];
  const authorityMetrics: AuthorityMetrics[] = authorities.map((authority) => {
    const authorityFilings = allFilings.filter(
      (f) => f.filingType.authority === authority
    );
    const overdueFilings = authorityFilings.filter((f) => f.status === 'overdue');

    const authorityDocs = expiringDocuments.filter(
      (d) => d.documentType.authority === authority &&
      d.latestVersion?.expiryDate &&
      Math.ceil((d.latestVersion.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 30
    );

    // Get clients with filings/docs for this authority
    const clientIds = new Set([
      ...authorityFilings.map((f) => f.clientId),
      ...authorityDocs.map((d) => d.clientId),
    ]);

    const clientsForAuthority = Array.from(clientIds);
    const compliantClients = clientsForAuthority.filter((clientId) => {
      const score = complianceScores.find((s) => s.clientId === clientId);
      return score?.level === 'green';
    });

    return {
      authority,
      totalClients: clientsForAuthority.length,
      compliantClients: compliantClients.length,
      complianceRate:
        clientsForAuthority.length > 0
          ? Math.round((compliantClients.length / clientsForAuthority.length) * 100)
          : 0,
      totalFilings: authorityFilings.length,
      overdueFilings: overdueFilings.length,
      expiringDocs: authorityDocs.length,
    };
  });

  // Calculate quick stats
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const filingsThisMonth = allFilings.filter(
    (f) => f.createdAt >= startOfMonth
  ).length;

  const overdueFilingsCount = allFilings.filter((f) => f.status === 'overdue').length;

  const quickStats: QuickStats = {
    totalClients: clients.length,
    activeServiceRequests: serviceRequests.length,
    pendingTasks: tasks.length,
    totalFilingsThisMonth: filingsThisMonth,
    docsUploadedThisWeek: documents.length,
    overdueFilings: overdueFilingsCount,
    expiringDocs30Days: expiringDocs.length,
  };

  return {
    complianceSummary,
    upcomingDeadlines: {
      filings: filingDeadlines,
      expiringDocs,
    },
    recentActivity,
    authorityMetrics,
    quickStats,
  };
}

// Get compliance overview data (detailed view)
export async function getComplianceOverview(params?: {
  level?: 'green' | 'amber' | 'red';
  authority?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const { level, authority, page = 1, pageSize = 50 } = params || {};
  const skip = (page - 1) * pageSize;

  const where: any = { tenantId: session.user.tenantId };
  if (level) where.level = level;

  const [scores, total] = await Promise.all([
    prisma.complianceScore.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true,
            email: true,
          },
        },
      },
      orderBy: { scoreValue: 'asc' },
    }),
    prisma.complianceScore.count({ where }),
  ]);

  // Filter by authority if provided (post-query filtering)
  let filteredScores = scores;
  if (authority) {
    filteredScores = scores.filter((score) => {
      const breakdown = score.breakdown as any;
      return breakdown && breakdown[authority];
    });
  }

  return {
    scores: filteredScores,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// Get overdue filings
export async function getOverdueFilings(params?: {
  authority?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const { authority, page = 1, pageSize = 50 } = params || {};
  const skip = (page - 1) * pageSize;

  const where: any = {
    tenantId: session.user.tenantId,
    status: 'overdue',
  };

  if (authority) {
    where.filingType = { authority };
  }

  const [filings, total] = await Promise.all([
    prisma.filing.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        client: {
          select: { id: true, name: true },
        },
        filingType: {
          select: { name: true, authority: true },
        },
      },
      orderBy: { periodEnd: 'asc' },
    }),
    prisma.filing.count({ where }),
  ]);

  const now = new Date();
  const filingsWithOverdue = filings.map((filing) => ({
    ...filing,
    daysOverdue: filing.periodEnd
      ? Math.ceil((now.getTime() - filing.periodEnd.getTime()) / (1000 * 60 * 60 * 24))
      : 0,
  }));

  return {
    filings: filingsWithOverdue,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// Get expiring documents
export async function getExpiringDocuments(params?: {
  daysAhead?: number;
  authority?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const { daysAhead = 30, authority, page = 1, pageSize = 50 } = params || {};
  const skip = (page - 1) * pageSize;

  // Get all documents with expiry dates
  const where: any = {
    tenantId: session.user.tenantId,
    status: { in: ['valid', 'pending_review'] },
  };

  if (authority) {
    where.documentType = { authority };
  }

  const documents = await prisma.document.findMany({
    where,
    include: {
      client: {
        select: { id: true, name: true },
      },
      documentType: {
        select: { name: true, category: true, authority: true },
      },
      latestVersion: {
        select: {
          expiryDate: true,
        },
      },
    },
  });

  // Filter by expiry date
  const now = new Date();
  const maxDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const expiringDocs = documents
    .filter((doc) => {
      if (!doc.latestVersion?.expiryDate) return false;
      const expiryDate = doc.latestVersion.expiryDate;
      return expiryDate >= now && expiryDate <= maxDate;
    })
    .map((doc) => ({
      ...doc,
      expiryDate: doc.latestVersion!.expiryDate!,
      daysUntilExpiry: Math.ceil(
        (doc.latestVersion!.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }))
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

  // Apply pagination
  const total = expiringDocs.length;
  const paginatedDocs = expiringDocs.slice(skip, skip + pageSize);

  return {
    documents: paginatedDocs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// Mark filing as submitted
export async function markFilingAsSubmitted(filingId: number, submissionDate?: Date) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const filing = await prisma.filing.findFirst({
    where: {
      id: filingId,
      tenantId: session.user.tenantId,
    },
  });

  if (!filing) {
    throw new ApiError('Filing not found', 404);
  }

  const updated = await prisma.filing.update({
    where: { id: filingId },
    data: {
      status: 'submitted',
      submissionDate: submissionDate || new Date(),
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      clientId: filing.clientId,
      entityType: 'Filing',
      entityId: filingId,
      action: 'update',
      changes: { status: 'submitted', submissionDate: submissionDate || new Date() },
    },
  });

  return { success: true, filing: updated };
}
