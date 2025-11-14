/**
 * Compliance Engine
 *
 * Calculates compliance scores for clients based on:
 * - Required documents (issued and not expired)
 * - Recurring filings (on-time submission)
 * - Missing documents
 * - Overdue filings
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface ComplianceBreakdown {
  documentsScore: number;
  filingsScore: number;
  missingDocuments: number;
  expiredDocuments: number;
  expiringDocuments: number; // Expiring within 30 days
  overdueFilings: number;
  upcomingFilings: number; // Due within 14 days
  totalWeight: number;
  achievedWeight: number;
}

interface ComplianceResult {
  clientId: number;
  scoreValue: number;
  level: 'green' | 'amber' | 'red';
  breakdown: ComplianceBreakdown;
  issues: string[];
  recommendations: string[];
}

/**
 * Calculate compliance score for a single client
 */
export async function calculateClientCompliance(
  tenantId: number,
  clientId: number
): Promise<ComplianceResult> {
  try {
    // Get client with all related data
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
      include: {
        documents: {
          include: {
            documentType: true,
            latestVersion: true,
          },
        },
        filings: {
          include: {
            filingType: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    // Get applicable compliance rule sets
    const ruleSets = await prisma.complianceRuleSet.findMany({
      where: {
        tenantId,
        active: true,
      },
      include: {
        rules: true,
      },
    });

    // Filter rule sets that apply to this client
    const applicableRuleSets = ruleSets.filter((ruleSet) => {
      if (!ruleSet.appliesTo) return true;
      const criteria = ruleSet.appliesTo as any;

      if (criteria.clientTypes) {
        return criteria.clientTypes.includes(client.type);
      }

      return true;
    });

    // Initialize breakdown
    const breakdown: ComplianceBreakdown = {
      documentsScore: 0,
      filingsScore: 0,
      missingDocuments: 0,
      expiredDocuments: 0,
      expiringDocuments: 0,
      overdueFilings: 0,
      upcomingFilings: 0,
      totalWeight: 0,
      achievedWeight: 0,
    };

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Current date for comparisons
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Evaluate document rules
    for (const ruleSet of applicableRuleSets) {
      for (const rule of ruleSet.rules) {
        if (rule.ruleType === 'document_required') {
          const condition = rule.condition as any;
          const documentType = condition?.documentType;

          breakdown.totalWeight += rule.weight;

          // Find matching document
          const hasDocument = client.documents.find((doc) =>
            doc.documentType.name === documentType
          );

          if (hasDocument && hasDocument.latestVersion) {
            const expiryDate = hasDocument.latestVersion.expiryDate;

            if (expiryDate) {
              if (expiryDate < now) {
                breakdown.expiredDocuments++;
                issues.push(`${documentType} has expired`);
                recommendations.push(`Renew ${documentType} immediately`);
              } else if (expiryDate < thirtyDaysFromNow) {
                breakdown.expiringDocuments++;
                issues.push(`${documentType} expiring soon`);
                recommendations.push(`Plan renewal for ${documentType}`);
                breakdown.achievedWeight += rule.weight; // Still counts for now
              } else {
                breakdown.achievedWeight += rule.weight;
              }
            } else {
              // Document doesn't expire
              breakdown.achievedWeight += rule.weight;
            }
          } else {
            breakdown.missingDocuments++;
            issues.push(`Missing required document: ${documentType}`);
            recommendations.push(`Upload ${documentType}`);
          }
        } else if (rule.ruleType === 'filing_required') {
          const condition = rule.condition as any;
          const filingType = condition?.filingType;
          const frequency = condition?.frequency;

          breakdown.totalWeight += rule.weight;

          // Get recent filings of this type
          const recentFilings = client.filings.filter(
            (f) => f.filingType.name === filingType
          );

          if (recentFilings.length === 0) {
            breakdown.overdueFilings++;
            issues.push(`No ${filingType} filings found`);
            recommendations.push(`File ${filingType} immediately`);
            continue;
          }

          // Check most recent filing
          const latestFiling = recentFilings[0];

          if (latestFiling.status === 'submitted' || latestFiling.status === 'approved') {
            breakdown.achievedWeight += rule.weight;
          } else if (latestFiling.status === 'overdue') {
            breakdown.overdueFilings++;
            issues.push(`${filingType} is overdue`);
            recommendations.push(`Submit ${filingType} immediately`);
          } else {
            // Check due date
            const periodEnd = latestFiling.periodEnd;
            if (periodEnd && periodEnd < now) {
              breakdown.overdueFilings++;
              issues.push(`${filingType} is overdue`);
              recommendations.push(`Submit ${filingType} immediately`);
            } else if (periodEnd && periodEnd < fourteenDaysFromNow) {
              breakdown.upcomingFilings++;
              recommendations.push(`${filingType} due soon`);
              breakdown.achievedWeight += rule.weight * 0.5; // Partial credit
            } else {
              breakdown.achievedWeight += rule.weight;
            }
          }
        }
      }
    }

    // Calculate final score (0-100)
    let scoreValue = 0;
    if (breakdown.totalWeight > 0) {
      scoreValue = Math.round((breakdown.achievedWeight / breakdown.totalWeight) * 100);
    } else {
      scoreValue = 100; // No rules = perfect score
    }

    // Determine compliance level
    let level: 'green' | 'amber' | 'red';
    if (scoreValue >= 80) {
      level = 'green';
    } else if (scoreValue >= 50) {
      level = 'amber';
    } else {
      level = 'red';
    }

    // Add general recommendations based on score
    if (level === 'red') {
      recommendations.unshift('⚠️ URGENT: Immediate action required to improve compliance');
    } else if (level === 'amber') {
      recommendations.unshift('⚡ Several items need attention');
    }

    // Calculate component scores
    const documentWeight = applicableRuleSets.reduce(
      (sum, rs) => sum + rs.rules.filter(r => r.ruleType === 'document_required').reduce((s, r) => s + r.weight, 0),
      0
    );
    const filingWeight = applicableRuleSets.reduce(
      (sum, rs) => sum + rs.rules.filter(r => r.ruleType === 'filing_required').reduce((s, r) => s + r.weight, 0),
      0
    );

    if (documentWeight > 0) {
      breakdown.documentsScore = Math.round(
        ((breakdown.achievedWeight - breakdown.filingsScore * filingWeight) / documentWeight) * 100
      );
    }
    if (filingWeight > 0) {
      breakdown.filingsScore = Math.round(
        ((breakdown.achievedWeight - breakdown.documentsScore * documentWeight) / filingWeight) * 100
      );
    }

    logger.info('Compliance calculated:', {
      clientId,
      scoreValue,
      level,
      missingDocuments: breakdown.missingDocuments,
      overdueFilings: breakdown.overdueFilings,
    });

    return {
      clientId,
      scoreValue,
      level,
      breakdown,
      issues,
      recommendations,
    };
  } catch (error) {
    logger.error('Error calculating compliance:', error);
    throw error;
  }
}

/**
 * Calculate and save compliance scores for all clients in a tenant
 */
export async function refreshTenantCompliance(tenantId: number): Promise<number> {
  try {
    const clients = await prisma.client.findMany({
      where: { tenantId },
      select: { id: true },
    });

    let updated = 0;

    for (const client of clients) {
      const result = await calculateClientCompliance(tenantId, client.id);

      // Upsert compliance score
      await prisma.complianceScore.upsert({
        where: {
          tenantId_clientId: {
            tenantId,
            clientId: client.id,
          },
        },
        update: {
          scoreValue: result.scoreValue,
          level: result.level,
          missingCount: result.breakdown.missingDocuments,
          expiringCount: result.breakdown.expiringDocuments + result.breakdown.expiredDocuments,
          overdueFilingsCount: result.breakdown.overdueFilings,
          lastCalculatedAt: new Date(),
          breakdown: result.breakdown,
        },
        create: {
          tenantId,
          clientId: client.id,
          scoreValue: result.scoreValue,
          level: result.level,
          missingCount: result.breakdown.missingDocuments,
          expiringCount: result.breakdown.expiringDocuments + result.breakdown.expiredDocuments,
          overdueFilingsCount: result.breakdown.overdueFilings,
          lastCalculatedAt: new Date(),
          breakdown: result.breakdown,
        },
      });

      updated++;
    }

    logger.info('Tenant compliance refreshed:', {
      tenantId,
      clientsUpdated: updated,
    });

    return updated;
  } catch (error) {
    logger.error('Error refreshing tenant compliance:', error);
    throw error;
  }
}

/**
 * Get clients with compliance issues (red or amber status)
 */
export async function getClientsWithIssues(tenantId: number) {
  const scores = await prisma.complianceScore.findMany({
    where: {
      tenantId,
      level: {
        in: ['red', 'amber'],
      },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          type: true,
          riskLevel: true,
        },
      },
    },
    orderBy: {
      scoreValue: 'asc',
    },
  });

  return scores.map((score) => ({
    ...score.client,
    complianceScore: score.scoreValue,
    complianceLevel: score.level,
    missingCount: score.missingCount,
    expiringCount: score.expiringCount,
    overdueFilingsCount: score.overdueFilingsCount,
  }));
}

/**
 * Get compliance summary for dashboard
 */
export async function getComplianceSummary(tenantId: number) {
  const scores = await prisma.complianceScore.findMany({
    where: { tenantId },
  });

  const summary = {
    totalClients: scores.length,
    green: scores.filter((s) => s.level === 'green').length,
    amber: scores.filter((s) => s.level === 'amber').length,
    red: scores.filter((s) => s.level === 'red').length,
    averageScore: scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.scoreValue, 0) / scores.length)
      : 0,
    totalMissingDocuments: scores.reduce((sum, s) => sum + s.missingCount, 0),
    totalExpiringDocuments: scores.reduce((sum, s) => sum + s.expiringCount, 0),
    totalOverdueFilings: scores.reduce((sum, s) => sum + s.overdueFilingsCount, 0),
  };

  return summary;
}

/**
 * Recalculate compliance score for a client and persist to database
 * This is used by wizards and other automated processes
 */
export async function recalculateClientCompliance(
  clientId: number,
  tenantId: number
): Promise<void> {
  try {
    logger.info('Recalculating compliance for client', { clientId, tenantId });

    const result = await calculateClientCompliance(tenantId, clientId);

    await prisma.complianceScore.upsert({
      where: {
        tenantId_clientId: { tenantId, clientId },
      },
      update: {
        scoreValue: result.scoreValue,
        level: result.level,
        missingCount: result.breakdown.missingDocuments,
        expiringCount: result.breakdown.expiringDocuments + result.breakdown.expiredDocuments,
        overdueFilingsCount: result.breakdown.overdueFilings,
        lastCalculatedAt: new Date(),
        breakdown: result.breakdown as any,
      },
      create: {
        tenantId,
        clientId,
        scoreValue: result.scoreValue,
        level: result.level,
        missingCount: result.breakdown.missingDocuments,
        expiringCount: result.breakdown.expiringDocuments + result.breakdown.expiredDocuments,
        overdueFilingsCount: result.breakdown.overdueFilings,
        lastCalculatedAt: new Date(),
        breakdown: result.breakdown as any,
      },
    });

    logger.info('Compliance recalculation completed', {
      clientId,
      tenantId,
      scoreValue: result.scoreValue,
      level: result.level,
    });
  } catch (error) {
    logger.error('Failed to recalculate client compliance', error as Error, {
      clientId,
      tenantId,
    });
    throw error;
  }
}
