'use server';

// Server actions for advanced analytics

import { auth } from '@/auth';
import { ApiError } from '@/lib/errors';
import {
  getComplianceTrends,
  getFilingTrends,
  getAuthorityAnalysis,
  getSectorCompliance,
  getRiskCorrelation,
  getWorkloadMetrics,
} from '@/lib/analytics';

export async function fetchComplianceTrends(months: number = 6) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  return getComplianceTrends(session.user.tenantId, months);
}

export async function fetchFilingTrends(months: number = 6) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  return getFilingTrends(session.user.tenantId, months);
}

export async function fetchAuthorityAnalysis(authority: string) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  return getAuthorityAnalysis(session.user.tenantId, authority);
}

export async function fetchAllAuthorityAnalysis() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const authorities = ['GRA', 'NIS', 'DCRA', 'Immigration', 'Deeds', 'GO-Invest'];
  const results = await Promise.all(
    authorities.map((auth) => getAuthorityAnalysis(session.user.tenantId!, auth))
  );

  return results;
}

export async function fetchSectorCompliance() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  return getSectorCompliance(session.user.tenantId);
}

export async function fetchRiskCorrelation() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  return getRiskCorrelation(session.user.tenantId);
}

export async function fetchWorkloadMetrics() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  return getWorkloadMetrics(session.user.tenantId);
}
