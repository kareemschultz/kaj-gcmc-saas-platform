import { Metadata } from 'next';
import Link from 'next/link';
import { getDashboardStats } from '@/src/lib/actions/dashboard';
import { StatCard } from '@/components/dashboard/stat-card';
import { ComplianceSummaryCard } from '@/components/dashboard/compliance-summary';
import { UpcomingDeadlinesCard } from '@/components/dashboard/upcoming-deadlines';
import { RecentActivityCard } from '@/components/dashboard/recent-activity';
import { AllAuthorityMetrics } from '@/components/dashboard/authority-metrics';
import { Button } from '@/components/ui/button';
import {
  Users,
  FileText,
  Calendar,
  Briefcase,
  Upload,
  AlertTriangle,
  Clock
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | KGC Compliance Cloud',
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive overview of your compliance operations
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clients"
          value={stats.quickStats.totalClients}
          icon={Users}
          description="Active clients"
          className="border-l-4 border-l-teal-600"
        />
        <StatCard
          title="Active Service Requests"
          value={stats.quickStats.activeServiceRequests}
          icon={Briefcase}
          description="In progress"
          className="border-l-4 border-l-blue-600"
        />
        <StatCard
          title="Pending Tasks"
          value={stats.quickStats.pendingTasks}
          icon={Calendar}
          description="Awaiting action"
          className="border-l-4 border-l-purple-600"
        />
        <StatCard
          title="Filings This Month"
          value={stats.quickStats.totalFilingsThisMonth}
          icon={FileText}
          description={`${stats.quickStats.overdueFilings} overdue`}
          className="border-l-4 border-l-green-600"
          valueClassName={stats.quickStats.overdueFilings > 0 ? 'text-amber-600' : ''}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link href="/filings/overdue">
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{stats.quickStats.overdueFilings}</div>
                <div className="text-xs text-muted-foreground">Overdue Filings</div>
              </div>
            </div>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link href="/documents/expiring">
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{stats.quickStats.expiringDocs30Days}</div>
                <div className="text-xs text-muted-foreground">Expiring Docs (30d)</div>
              </div>
            </div>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link href="/compliance/overview?level=red">
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{stats.complianceSummary.red}</div>
                <div className="text-xs text-muted-foreground">At-Risk Clients</div>
              </div>
            </div>
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-auto py-4 justify-start">
          <Link href="/documents">
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                <Upload className="h-5 w-5 text-teal-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{stats.quickStats.docsUploadedThisWeek}</div>
                <div className="text-xs text-muted-foreground">Docs This Week</div>
              </div>
            </div>
          </Link>
        </Button>
      </div>

      {/* Compliance Summary */}
      <ComplianceSummaryCard summary={stats.complianceSummary} />

      {/* Authority Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Authority Compliance Metrics</h2>
        <AllAuthorityMetrics allMetrics={stats.authorityMetrics} />
      </div>

      {/* Deadlines and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingDeadlinesCard
          filings={stats.upcomingDeadlines.filings}
          expiringDocs={stats.upcomingDeadlines.expiringDocs}
        />
        <RecentActivityCard activities={stats.recentActivity} />
      </div>
    </div>
  );
}
