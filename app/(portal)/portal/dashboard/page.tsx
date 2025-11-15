import { Metadata } from 'next';
import { getPortalDashboardData } from '@/lib/actions/portal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | Client Portal',
};

export default async function PortalDashboardPage() {
  // In a real app, get clientId from session
  // For demo, using clientId = 1
  const clientId = 1;

  const data = await getPortalDashboardData(clientId);
  const { client, complianceScore, upcomingDeadlines, openTasks, recentMessages, activeServiceRequests } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome, {client.name}</h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your compliance status and recent activity
        </p>
      </div>

      {/* Compliance Status Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Compliance Status</h2>
            {complianceScore ? (
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-3xl font-bold">{Math.round(complianceScore.scoreValue)}</div>
                  <div className="text-sm text-muted-foreground">Compliance Score</div>
                </div>
                <Badge
                  className={`text-lg px-4 py-2 ${
                    complianceScore.level === 'green'
                      ? 'bg-green-600'
                      : complianceScore.level === 'amber'
                      ? 'bg-amber-600'
                      : 'bg-red-600'
                  }`}
                >
                  {complianceScore.level.toUpperCase()}
                </Badge>
              </div>
            ) : (
              <p className="text-muted-foreground">Compliance score pending calculation</p>
            )}
          </div>

          {complianceScore && (
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {complianceScore.missingCount}
                </div>
                <div className="text-sm text-muted-foreground">Missing Items</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {complianceScore.expiringCount}
                </div>
                <div className="text-sm text-muted-foreground">Expiring Soon</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {complianceScore.overdueFilingsCount}
                </div>
                <div className="text-sm text-muted-foreground">Overdue Filings</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{upcomingDeadlines.length}</div>
              <div className="text-sm text-muted-foreground">Upcoming Deadlines</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{openTasks.length}</div>
              <div className="text-sm text-muted-foreground">Open Tasks</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{activeServiceRequests.length}</div>
              <div className="text-sm text-muted-foreground">Active Requests</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{recentMessages.length}</div>
              <div className="text-sm text-muted-foreground">New Messages</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Upcoming Deadlines
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/filings">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((filing: any) => {
                const daysUntil = filing.periodEnd
                  ? Math.ceil(
                      (new Date(filing.periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )
                  : 0;

                return (
                  <div key={filing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{filing.filingType.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {filing.filingType.authority}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={daysUntil <= 7 ? 'destructive' : 'outline'}>
                        {daysUntil} days
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Open Tasks */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Your Tasks
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/tasks">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          {openTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No open tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openTasks.map((task: any) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline">{task.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Active Service Requests */}
      {activeServiceRequests.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              Active Service Requests
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/services">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {activeServiceRequests.map((sr: any) => (
              <Card key={sr.id} className="p-4 border-l-4 border-l-purple-600">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">{sr.service.name}</div>
                    <div className="text-sm text-muted-foreground">{sr.service.category}</div>
                  </div>
                  <Badge
                    variant={
                      sr.status === 'awaiting_client'
                        ? 'destructive'
                        : sr.status === 'in_progress'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {sr.status.replace('_', ' ')}
                  </Badge>
                </div>
                {sr.status === 'awaiting_client' && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Action required</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
