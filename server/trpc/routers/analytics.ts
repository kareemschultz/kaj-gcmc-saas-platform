/**
 * Analytics Router
 *
 * Provides advanced analytics and reporting
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import {
  getComplianceTrends,
  getFilingTrends,
  getAuthorityAnalysis,
  getSectorCompliance,
  getRiskCorrelation,
  getWorkloadMetrics,
} from '@/lib/analytics';

export const analyticsRouter = router({
  // Get compliance trends
  getComplianceTrends: protectedProcedure
    .use(requirePermission('analytics', 'view'))
    .input(
      z.object({
        months: z.number().default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      return getComplianceTrends(ctx.user.tenantId, input.months);
    }),

  // Get filing trends
  getFilingTrends: protectedProcedure
    .use(requirePermission('analytics', 'view'))
    .input(
      z.object({
        months: z.number().default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      return getFilingTrends(ctx.user.tenantId, input.months);
    }),

  // Get authority analysis
  getAuthorityAnalysis: protectedProcedure
    .use(requirePermission('analytics', 'view'))
    .input(
      z.object({
        authority: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getAuthorityAnalysis(ctx.user.tenantId, input.authority);
    }),

  // Get all authority analysis
  getAllAuthorityAnalysis: protectedProcedure
    .use(requirePermission('analytics', 'view'))
    .query(async ({ ctx }) => {
      const authorities = ['GRA', 'NIS', 'DCRA', 'Immigration', 'Deeds', 'GO-Invest'];
      const results = await Promise.all(
        authorities.map((auth) => getAuthorityAnalysis(ctx.user.tenantId, auth))
      );

      return results;
    }),

  // Get sector compliance
  getSectorCompliance: protectedProcedure
    .use(requirePermission('analytics', 'view'))
    .query(async ({ ctx }) => {
      return getSectorCompliance(ctx.user.tenantId);
    }),

  // Get risk correlation
  getRiskCorrelation: protectedProcedure
    .use(requirePermission('analytics', 'view'))
    .query(async ({ ctx }) => {
      return getRiskCorrelation(ctx.user.tenantId);
    }),

  // Get workload metrics
  getWorkloadMetrics: protectedProcedure
    .use(requirePermission('analytics', 'view'))
    .query(async ({ ctx }) => {
      return getWorkloadMetrics(ctx.user.tenantId);
    }),

  // Get client statistics
  getClientStats: protectedProcedure
    .use(requirePermission('analytics', 'view'))
    .query(async ({ ctx }) => {
      const [totalClients, clientsByType, clientsByRisk, clientsBySector] = await Promise.all([
        // Total clients
        ctx.prisma.client.count({
          where: { tenantId: ctx.user.tenantId },
        }),

        // Clients by type
        ctx.prisma.client.groupBy({
          by: ['type'],
          where: { tenantId: ctx.user.tenantId },
          _count: true,
        }),

        // Clients by risk level
        ctx.prisma.client.groupBy({
          by: ['riskLevel'],
          where: { tenantId: ctx.user.tenantId },
          _count: true,
        }),

        // Clients by sector
        ctx.prisma.client.groupBy({
          by: ['sector'],
          where: {
            tenantId: ctx.user.tenantId,
            sector: { not: null },
          },
          _count: true,
        }),
      ]);

      return {
        totalClients,
        byType: clientsByType,
        byRisk: clientsByRisk,
        bySector: clientsBySector,
      };
    }),

  // Get document statistics
  getDocumentStats: protectedProcedure
    .use(requirePermission('analytics', 'view'))
    .query(async ({ ctx }) => {
      const [totalDocuments, documentsByStatus, documentsByType, expiringDocuments] =
        await Promise.all([
          // Total documents
          ctx.prisma.document.count({
            where: { tenantId: ctx.user.tenantId },
          }),

          // Documents by status
          ctx.prisma.document.groupBy({
            by: ['status'],
            where: { tenantId: ctx.user.tenantId },
            _count: true,
          }),

          // Documents by type
          ctx.prisma.document.groupBy({
            by: ['documentTypeId'],
            where: { tenantId: ctx.user.tenantId },
            _count: true,
          }),

          // Expiring documents (next 30 days)
          ctx.prisma.documentVersion.count({
            where: {
              document: { tenantId: ctx.user.tenantId },
              isLatest: true,
              expiryDate: {
                gte: new Date(),
                lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            },
          }),
        ]);

      return {
        totalDocuments,
        byStatus: documentsByStatus,
        byType: documentsByType,
        expiringCount: expiringDocuments,
      };
    }),

  // Get filing statistics
  getFilingStats: protectedProcedure
    .use(requirePermission('analytics', 'view'))
    .query(async ({ ctx }) => {
      const [totalFilings, filingsByStatus, filingsByAuthority, upcomingFilings] =
        await Promise.all([
          // Total filings
          ctx.prisma.filing.count({
            where: { tenantId: ctx.user.tenantId },
          }),

          // Filings by status
          ctx.prisma.filing.groupBy({
            by: ['status'],
            where: { tenantId: ctx.user.tenantId },
            _count: true,
          }),

          // Filings by authority (via filing type)
          ctx.prisma.$queryRaw<
            Array<{ authority: string; count: bigint }>
          >`
            SELECT ft.authority, COUNT(f.id)::int as count
            FROM "Filing" f
            INNER JOIN "FilingType" ft ON f."filingTypeId" = ft.id
            WHERE f."tenantId" = ${ctx.user.tenantId}
            GROUP BY ft.authority
          `,

          // Upcoming filings (next 30 days)
          ctx.prisma.filing.count({
            where: {
              tenantId: ctx.user.tenantId,
              periodEnd: {
                gte: new Date(),
                lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
              status: { notIn: ['submitted', 'approved'] },
            },
          }),
        ]);

      return {
        totalFilings,
        byStatus: filingsByStatus,
        byAuthority: filingsByAuthority.map((a) => ({
          authority: a.authority,
          count: Number(a.count),
        })),
        upcomingCount: upcomingFilings,
      };
    }),
});
