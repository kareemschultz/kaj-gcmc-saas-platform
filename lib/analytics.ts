// Advanced analytics queries and correlation engine

import { prisma } from '@/lib/prisma';

// ========================================
// COMPLIANCE TRENDS
// ========================================

export interface ComplianceTrend {
  date: Date;
  green: number;
  amber: number;
  red: number;
  avgScore: number;
}

export async function getComplianceTrends(
  tenantId: number,
  months: number = 6
): Promise<ComplianceTrend[]> {
  // For now, we'll aggregate current scores into monthly buckets
  // In production, you'd want a separate time-series table
  const scores = await prisma.complianceScore.findMany({
    where: { tenantId },
    select: {
      level: true,
      scoreValue: true,
      lastCalculatedAt: true,
    },
  });

  // Group by month
  const trends: Record<string, { green: number; amber: number; red: number; scores: number[] }> =
    {};

  scores.forEach((score) => {
    const monthKey = score.lastCalculatedAt.toISOString().slice(0, 7); // YYYY-MM
    if (!trends[monthKey]) {
      trends[monthKey] = { green: 0, amber: 0, red: 0, scores: [] };
    }
    trends[monthKey][score.level as 'green' | 'amber' | 'red']++;
    trends[monthKey].scores.push(score.scoreValue);
  });

  // Convert to array and calculate averages
  return Object.entries(trends)
    .map(([monthKey, data]) => ({
      date: new Date(monthKey + '-01'),
      green: data.green,
      amber: data.amber,
      red: data.red,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length || 0,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-months);
}

// ========================================
// FILING TRENDS
// ========================================

export interface FilingTrend {
  month: string;
  submitted: number;
  overdue: number;
  total: number;
}

export async function getFilingTrends(
  tenantId: number,
  months: number = 6
): Promise<FilingTrend[]> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const filings = await prisma.filing.findMany({
    where: {
      tenantId,
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      status: true,
    },
  });

  const trends: Record<string, { submitted: number; overdue: number; total: number }> = {};

  filings.forEach((filing) => {
    const monthKey = filing.createdAt.toISOString().slice(0, 7);
    if (!trends[monthKey]) {
      trends[monthKey] = { submitted: 0, overdue: 0, total: 0 };
    }
    trends[monthKey].total++;
    if (filing.status === 'submitted' || filing.status === 'approved') {
      trends[monthKey].submitted++;
    }
    if (filing.status === 'overdue') {
      trends[monthKey].overdue++;
    }
  });

  return Object.entries(trends)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// ========================================
// AUTHORITY-SPECIFIC ANALYSIS
// ========================================

export interface AuthorityAnalysis {
  authority: string;
  lateFilings: {
    total: number;
    byType: Record<string, number>;
  };
  expiringDocs: {
    total: number;
    within7Days: number;
    within30Days: number;
  };
  complianceRate: number;
}

export async function getAuthorityAnalysis(
  tenantId: number,
  authority: string
): Promise<AuthorityAnalysis> {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Get filings
  const filings = await prisma.filing.findMany({
    where: {
      tenantId,
      filingType: { authority },
    },
    include: {
      filingType: { select: { name: true } },
    },
  });

  const lateFilings = filings.filter((f) => f.status === 'overdue');
  const byType: Record<string, number> = {};
  lateFilings.forEach((f) => {
    byType[f.filingType.name] = (byType[f.filingType.name] || 0) + 1;
  });

  // Get documents
  const documents = await prisma.document.findMany({
    where: {
      tenantId,
      documentType: { authority },
    },
    include: {
      latestVersion: {
        select: { expiryDate: true },
      },
    },
  });

  const expiringDocs = documents.filter((d) => d.latestVersion?.expiryDate);
  const within7 = expiringDocs.filter(
    (d) => d.latestVersion!.expiryDate! <= in7Days && d.latestVersion!.expiryDate! >= now
  );
  const within30 = expiringDocs.filter(
    (d) => d.latestVersion!.expiryDate! <= in30Days && d.latestVersion!.expiryDate! >= now
  );

  // Compliance rate: % of clients with this authority that are green
  const clientsWithAuthority = new Set([
    ...filings.map((f) => f.clientId),
    ...documents.map((d) => d.clientId),
  ]);

  const scores = await prisma.complianceScore.findMany({
    where: {
      tenantId,
      clientId: { in: Array.from(clientsWithAuthority) },
    },
  });

  const greenCount = scores.filter((s) => s.level === 'green').length;
  const complianceRate = scores.length > 0 ? (greenCount / scores.length) * 100 : 0;

  return {
    authority,
    lateFilings: {
      total: lateFilings.length,
      byType,
    },
    expiringDocs: {
      total: expiringDocs.length,
      within7Days: within7.length,
      within30Days: within30.length,
    },
    complianceRate: Math.round(complianceRate),
  };
}

// ========================================
// SECTOR-BASED ANALYSIS
// ========================================

export interface SectorCompliance {
  sector: string;
  clientCount: number;
  avgScore: number;
  greenCount: number;
  amberCount: number;
  redCount: number;
}

export async function getSectorCompliance(tenantId: number): Promise<SectorCompliance[]> {
  const clients = await prisma.client.findMany({
    where: { tenantId },
    select: {
      id: true,
      sector: true,
    },
  });

  const scores = await prisma.complianceScore.findMany({
    where: { tenantId },
    include: {
      client: {
        select: { sector: true },
      },
    },
  });

  // Group by sector
  const sectorMap: Record<
    string,
    { clientIds: Set<number>; scores: number[]; levels: string[] }
  > = {};

  clients.forEach((client) => {
    const sector = client.sector || 'Unknown';
    if (!sectorMap[sector]) {
      sectorMap[sector] = { clientIds: new Set(), scores: [], levels: [] };
    }
    sectorMap[sector].clientIds.add(client.id);
  });

  scores.forEach((score) => {
    const sector = score.client.sector || 'Unknown';
    if (sectorMap[sector]) {
      sectorMap[sector].scores.push(score.scoreValue);
      sectorMap[sector].levels.push(score.level);
    }
  });

  return Object.entries(sectorMap)
    .map(([sector, data]) => ({
      sector,
      clientCount: data.clientIds.size,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length || 0,
      greenCount: data.levels.filter((l) => l === 'green').length,
      amberCount: data.levels.filter((l) => l === 'amber').length,
      redCount: data.levels.filter((l) => l === 'red').length,
    }))
    .sort((a, b) => b.clientCount - a.clientCount);
}

// ========================================
// RISK CORRELATION
// ========================================

export interface RiskCorrelation {
  clientId: number;
  clientName: string;
  riskLevel: string;
  complianceLevel: string;
  overdueFilings: number;
  missingDocs: number;
  highFilingVolume: boolean;
}

export async function getRiskCorrelation(
  tenantId: number
): Promise<RiskCorrelation[]> {
  const clients = await prisma.client.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      riskLevel: true,
    },
  });

  const scores = await prisma.complianceScore.findMany({
    where: { tenantId },
  });

  const filings = await prisma.filing.findMany({
    where: {
      tenantId,
      status: 'overdue',
    },
  });

  const results: RiskCorrelation[] = [];

  for (const client of clients) {
    const score = scores.find((s) => s.clientId === client.id);
    const overdueFilings = filings.filter((f) => f.clientId === client.id).length;

    // High filing volume = more than 20 filings total
    const totalFilings = await prisma.filing.count({
      where: { tenantId, clientId: client.id },
    });

    results.push({
      clientId: client.id,
      clientName: client.name,
      riskLevel: client.riskLevel || 'medium',
      complianceLevel: score?.level || 'unknown',
      overdueFilings,
      missingDocs: score?.missingCount || 0,
      highFilingVolume: totalFilings > 20,
    });
  }

  // Sort by risk (red compliance + high risk clients first)
  return results.sort((a, b) => {
    const aRisk =
      (a.complianceLevel === 'red' ? 100 : a.complianceLevel === 'amber' ? 50 : 0) +
      (a.riskLevel === 'high' ? 30 : a.riskLevel === 'medium' ? 15 : 0) +
      a.overdueFilings * 5;
    const bRisk =
      (b.complianceLevel === 'red' ? 100 : b.complianceLevel === 'amber' ? 50 : 0) +
      (b.riskLevel === 'high' ? 30 : b.riskLevel === 'medium' ? 15 : 0) +
      b.overdueFilings * 5;
    return bRisk - aRisk;
  });
}

// ========================================
// WORKLOAD DISTRIBUTION
// ========================================

export interface WorkloadMetrics {
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  serviceRequestsByStatus: Record<string, number>;
  avgTasksPerClient: number;
}

export async function getWorkloadMetrics(tenantId: number): Promise<WorkloadMetrics> {
  const tasks = await prisma.task.findMany({
    where: { tenantId },
    select: {
      status: true,
      priority: true,
      clientId: true,
    },
  });

  const serviceRequests = await prisma.serviceRequest.findMany({
    where: { tenantId },
    select: {
      status: true,
    },
  });

  const tasksByStatus: Record<string, number> = {};
  const tasksByPriority: Record<string, number> = {};

  tasks.forEach((task) => {
    tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
    if (task.priority) {
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
    }
  });

  const serviceRequestsByStatus: Record<string, number> = {};
  serviceRequests.forEach((sr) => {
    serviceRequestsByStatus[sr.status] = (serviceRequestsByStatus[sr.status] || 0) + 1;
  });

  const clientCount = await prisma.client.count({ where: { tenantId } });
  const avgTasksPerClient = clientCount > 0 ? tasks.length / clientCount : 0;

  return {
    totalTasks: tasks.length,
    tasksByStatus,
    tasksByPriority,
    serviceRequestsByStatus,
    avgTasksPerClient: Math.round(avgTasksPerClient * 10) / 10,
  };
}
