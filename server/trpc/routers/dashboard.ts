/**
 * Dashboard Router
 *
 * Provides dashboard statistics and metrics
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';

export const dashboardRouter = router({
  // Get dashboard stats
  getStats: protectedProcedure
    .use(requirePermission('dashboard', 'view'))
    .query(async ({ ctx }) => {
      const tenantId = ctx.user.tenantId;

      // Fetch all stats in parallel
      const [
        clientCount,
        documentCount,
        filingCount,
        taskCount,
        complianceSummary,
        upcomingDeadlines,
        recentActivity,
        authorityMetrics,
      ] = await Promise.all([
        // Total clients
        ctx.prisma.client.count({
          where: { tenantId },
        }),

        // Total documents
        ctx.prisma.document.count({
          where: { tenantId },
        }),

        // Total filings
        ctx.prisma.filing.count({
          where: { tenantId },
        }),

        // Open tasks
        ctx.prisma.task.count({
          where: {
            tenantId,
            status: { in: ['open', 'in_progress'] },
          },
        }),

        // Compliance summary
        ctx.prisma.client.findMany({
          where: { tenantId },
          include: {
            complianceScores: {
              take: 1,
              orderBy: { lastCalculatedAt: 'desc' },
            },
          },
        }).then((clients) => {
          const scores = clients
            .map((c) => c.complianceScores[0]?.scoreValue || 0)
            .filter((s) => s > 0);

          return {
            totalClients: clients.length,
            averageScore: scores.length > 0
              ? scores.reduce((a, b) => a + b, 0) / scores.length
              : 0,
            compliantClients: scores.filter((s) => s >= 80).length,
            atRiskClients: scores.filter((s) => s < 60).length,
          };
        }),

        // Upcoming deadlines (next 30 days)
        ctx.prisma.filing.findMany({
          where: {
            tenantId,
            periodEnd: {
              gte: new Date(),
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            status: { notIn: ['submitted', 'approved'] },
          },
          include: {
            client: {
              select: { id: true, name: true },
            },
            filingType: {
              select: { id: true, name: true, authority: true },
            },
          },
          orderBy: { periodEnd: 'asc' },
          take: 10,
        }),

        // Recent activity (last 20 audit logs)
        ctx.prisma.auditLog.findMany({
          where: { tenantId },
          include: {
            actor: {
              select: { id: true, name: true },
            },
            client: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),

        // Authority metrics
        ctx.prisma.filing.groupBy({
          by: ['status'],
          where: { tenantId },
          _count: true,
        }).then(async (statusGroups) => {
          const filingsByAuthority = await ctx.prisma.$queryRaw<
            Array<{ authority: string; count: bigint }>
          >`
            SELECT ft.authority, COUNT(f.id)::int as count
            FROM "Filing" f
            INNER JOIN "FilingType" ft ON f."filingTypeId" = ft.id
            WHERE f."tenantId" = ${tenantId}
            GROUP BY ft.authority
          `;

          return {
            byStatus: statusGroups.map((g) => ({
              status: g.status,
              count: g._count,
            })),
            byAuthority: filingsByAuthority.map((a) => ({
              authority: a.authority,
              count: Number(a.count),
            })),
          };
        }),
      ]);

      return {
        summary: {
          totalClients: clientCount,
          totalDocuments: documentCount,
          totalFilings: filingCount,
          openTasks: taskCount,
        },
        compliance: complianceSummary,
        upcomingDeadlines,
        recentActivity,
        authorityMetrics,
      };
    }),

  // Get compliance trends
  getComplianceTrends: protectedProcedure
    .use(requirePermission('dashboard', 'view'))
    .input(
      z.object({
        months: z.number().default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      const { months } = input;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const scores = await ctx.prisma.complianceScore.findMany({
        where: {
          tenantId: ctx.user.tenantId,
          lastCalculatedAt: {
            gte: startDate,
          },
        },
        include: {
          client: {
            select: { id: true, name: true },
          },
        },
        orderBy: { lastCalculatedAt: 'asc' },
      });

      return scores;
    }),

  // Get workload metrics
  getWorkloadMetrics: protectedProcedure
    .use(requirePermission('dashboard', 'view'))
    .query(async ({ ctx }) => {
      const [tasksByUser, tasksByStatus, serviceRequestsByStatus] = await Promise.all([
        // Tasks by user
        ctx.prisma.task.groupBy({
          by: ['assignedToId'],
          where: {
            tenantId: ctx.user.tenantId,
            status: { in: ['open', 'in_progress'] },
          },
          _count: true,
        }),

        // Tasks by status
        ctx.prisma.task.groupBy({
          by: ['status'],
          where: {
            tenantId: ctx.user.tenantId,
          },
          _count: true,
        }),

        // Service requests by status
        ctx.prisma.serviceRequest.groupBy({
          by: ['status'],
          where: {
            tenantId: ctx.user.tenantId,
          },
          _count: true,
        }),
      ]);

      return {
        tasksByUser,
        tasksByStatus,
        serviceRequestsByStatus,
      };
    }),
});
