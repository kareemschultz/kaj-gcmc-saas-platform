import { Metadata } from 'next';
import Link from 'next/link';
import {
  fetchComplianceTrends,
  fetchFilingTrends,
  fetchAllAuthorityAnalysis,
  fetchSectorCompliance,
  fetchRiskCorrelation,
  fetchWorkloadMetrics,
} from '@/src/lib/actions/analytics';
import { ComplianceTrendChart } from '@/components/analytics/compliance-trend-chart';
import { FilingTrendChart } from '@/components/analytics/filing-trend-chart';
import { SectorComplianceChart } from '@/components/analytics/sector-compliance-chart';
import { AuthorityBreakdownChart } from '@/components/analytics/authority-breakdown-chart';
import { RiskCorrelationTable } from '@/components/analytics/risk-correlation-table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Analytics & Insights | KGC Compliance Cloud',
};

export default async function AnalyticsPage() {
  const [
    complianceTrends,
    filingTrends,
    authorityAnalysis,
    sectorCompliance,
    riskCorrelation,
    workloadMetrics,
  ] = await Promise.all([
    fetchComplianceTrends(6),
    fetchFilingTrends(6),
    fetchAllAuthorityAnalysis(),
    fetchSectorCompliance(),
    fetchRiskCorrelation(),
    fetchWorkloadMetrics(),
  ]);

  // Calculate trend direction for compliance
  const complianceTrend =
    complianceTrends.length >= 2
      ? complianceTrends[complianceTrends.length - 1].avgScore -
        complianceTrends[complianceTrends.length - 2].avgScore
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground mt-1">
            Advanced analytics and correlation views for your compliance operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Compliance Score</p>
              <p className="text-2xl font-bold">
                {complianceTrends.length > 0
                  ? Math.round(
                      complianceTrends[complianceTrends.length - 1].avgScore
                    )
                  : 0}
              </p>
            </div>
            <div
              className={`flex items-center gap-1 text-sm ${
                complianceTrend > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {complianceTrend > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(Math.round(complianceTrend))}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
            <p className="text-2xl font-bold">{workloadMetrics.totalTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(workloadMetrics.avgTasksPerClient)} avg per client
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">High Risk Clients</p>
            <p className="text-2xl font-bold text-red-600">
              {riskCorrelation.filter((c) => c.complianceLevel === 'red').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {riskCorrelation.filter((c) => c.overdueFilings > 0).length} with overdue filings
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">Sectors Tracked</p>
            <p className="text-2xl font-bold">{sectorCompliance.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {sectorCompliance.reduce((sum, s) => sum + s.clientCount, 0)} total clients
            </p>
          </div>
        </Card>
      </div>

      {/* Trend Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ComplianceTrendChart data={complianceTrends} />
        <FilingTrendChart data={filingTrends} />
      </div>

      {/* Authority Breakdown */}
      <AuthorityBreakdownChart data={authorityAnalysis} />

      {/* Detailed Authority Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Authority-Specific Insights</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {authorityAnalysis.map((auth) => (
            <Card key={auth.authority} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg">{auth.authority}</h3>
                <Badge
                  className={
                    auth.complianceRate >= 80
                      ? 'bg-green-600'
                      : auth.complianceRate >= 60
                      ? 'bg-amber-600'
                      : 'bg-red-600'
                  }
                >
                  {auth.complianceRate}%
                </Badge>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Overdue Filings:</dt>
                  <dd className={auth.lateFilings.total > 0 ? 'text-red-600 font-medium' : ''}>
                    {auth.lateFilings.total}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Expiring Docs (30d):</dt>
                  <dd
                    className={
                      auth.expiringDocs.within30Days > 0 ? 'text-amber-600 font-medium' : ''
                    }
                  >
                    {auth.expiringDocs.within30Days}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Expiring Docs (7d):</dt>
                  <dd
                    className={
                      auth.expiringDocs.within7Days > 0 ? 'text-red-600 font-medium' : ''
                    }
                  >
                    {auth.expiringDocs.within7Days}
                  </dd>
                </div>
              </dl>

              {/* Most common late filing types */}
              {auth.lateFilings.total > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Most Overdue:
                  </div>
                  <div className="space-y-1">
                    {Object.entries(auth.lateFilings.byType)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 2)
                      .map(([type, count]) => (
                        <div key={type} className="flex justify-between text-xs">
                          <span className="text-muted-foreground truncate">{type}</span>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Sector Compliance */}
      {sectorCompliance.length > 0 && <SectorComplianceChart data={sectorCompliance} />}

      {/* Risk Correlation */}
      {riskCorrelation.length > 0 && <RiskCorrelationTable data={riskCorrelation} />}

      {/* Workload Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tasks by Status</h3>
          <div className="space-y-3">
            {Object.entries(workloadMetrics.tasksByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-200 rounded-full h-2 w-32">
                    <div
                      className="bg-teal-600 rounded-full h-2"
                      style={{
                        width: `${(count / workloadMetrics.totalTasks) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Service Requests by Status</h3>
          <div className="space-y-3">
            {Object.entries(workloadMetrics.serviceRequestsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
