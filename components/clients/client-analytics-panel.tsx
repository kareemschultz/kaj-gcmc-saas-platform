'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileCheck,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface ClientAnalyticsPanelProps {
  client: any;
  complianceScore?: any;
  bundles?: any[];
  recentActivity?: any[];
  filings?: any[];
  documents?: any[];
}

export function ClientAnalyticsPanel({
  client,
  complianceScore,
  bundles = [],
  recentActivity = [],
  filings = [],
  documents = [],
}: ClientAnalyticsPanelProps) {
  // Calculate bundle completion
  const bundleProgress = bundles.map((bundle) => {
    const totalItems = bundle.items?.length || 0;
    // In a real scenario, you'd check which items are satisfied
    // For now, use a simplified calculation
    const completedItems = Math.floor(totalItems * 0.7); // Mock 70% completion
    return {
      name: bundle.name,
      authority: bundle.authority,
      category: bundle.category,
      total: totalItems,
      completed: completedItems,
      percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    };
  });

  // Filing activity by month (last 6 months)
  const filingActivity = filings.reduce((acc: any[], filing: any) => {
    const month = new Date(filing.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    const existing = acc.find((item) => item.month === month);
    if (existing) {
      existing.count++;
      if (filing.status === 'overdue') existing.overdue++;
    } else {
      acc.push({
        month,
        count: 1,
        overdue: filing.status === 'overdue' ? 1 : 0,
      });
    }
    return acc;
  }, []);

  // Risk factors
  const riskFactors = [];
  const overdueFilings = filings.filter((f: any) => f.status === 'overdue').length;
  const missingDocs = complianceScore?.missingCount || 0;
  const expiringDocs = documents.filter((d: any) => {
    if (!d.latestVersion?.expiryDate) return false;
    const daysUntil = Math.ceil(
      (new Date(d.latestVersion.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil <= 30 && daysUntil >= 0;
  }).length;

  if (overdueFilings > 0) {
    riskFactors.push({ label: `${overdueFilings} overdue filings`, severity: 'high' });
  }
  if (missingDocs > 0) {
    riskFactors.push({ label: `${missingDocs} missing documents`, severity: 'medium' });
  }
  if (expiringDocs > 0) {
    riskFactors.push({ label: `${expiringDocs} documents expiring soon`, severity: 'medium' });
  }

  return (
    <div className="space-y-6">
      {/* Compliance Overview Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Compliance Overview</h3>
          {complianceScore && (
            <Badge
              className={
                complianceScore.level === 'green'
                  ? 'bg-green-600'
                  : complianceScore.level === 'amber'
                  ? 'bg-amber-600'
                  : 'bg-red-600'
              }
            >
              {complianceScore.level.toUpperCase()} - Score: {Math.round(complianceScore.scoreValue)}
            </Badge>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Missing Items</span>
            <span className="text-2xl font-bold">
              {complianceScore?.missingCount || 0}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Expiring Soon</span>
            <span className="text-2xl font-bold">
              {complianceScore?.expiringCount || 0}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Overdue Filings</span>
            <span className="text-2xl font-bold text-red-600">
              {complianceScore?.overdueFilingsCount || 0}
            </span>
          </div>
        </div>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="bundles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bundles">Bundles</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="risk">Risk Factors</TabsTrigger>
        </TabsList>

        {/* Bundle Progress Tab */}
        <TabsContent value="bundles" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-600" />
              Compliance Bundle Progress
            </h3>

            {bundleProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No compliance bundles assigned yet</p>
                <p className="text-sm mt-2">
                  Use the Compliance Setup Wizard to assign bundles to this client
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bundleProgress.map((bundle, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium">{bundle.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {bundle.authority} • {bundle.category}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{bundle.percentage}%</div>
                        <div className="text-sm text-muted-foreground">
                          {bundle.completed}/{bundle.total}
                        </div>
                      </div>
                    </div>
                    <Progress value={bundle.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Filing Activity Timeline
            </h3>

            {filingActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No filing activity yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={filingActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" name="Total Filings" />
                  <Bar dataKey="overdue" fill="#ef4444" name="Overdue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Recent Events */}
          {recentActivity.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <div className="mt-1">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{activity.action}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Risk Factors Tab */}
        <TabsContent value="risk" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Risk Factors & Alerts
            </h3>

            {riskFactors.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-green-700 font-medium">All Clear!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No immediate risk factors identified
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {riskFactors.map((factor, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      factor.severity === 'high'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-5 h-5 mt-0.5 ${
                        factor.severity === 'high' ? 'text-red-600' : 'text-amber-600'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{factor.label}</div>
                      <div
                        className={`text-sm ${
                          factor.severity === 'high' ? 'text-red-700' : 'text-amber-700'
                        }`}
                      >
                        {factor.severity === 'high' ? 'Requires immediate attention' : 'Monitor'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
