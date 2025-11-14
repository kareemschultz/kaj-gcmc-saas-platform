import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, AlertCircle, FileText } from 'lucide-react';
import { AuthorityMetrics } from '@/src/lib/actions/dashboard';

interface AuthorityMetricsCardProps {
  metrics: AuthorityMetrics;
}

export function AuthorityMetricsCard({ metrics }: AuthorityMetricsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{metrics.authority}</CardTitle>
          <Building2 className="h-5 w-5 text-teal-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Compliance Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Compliance Rate</span>
            <Badge
              variant={
                metrics.complianceRate >= 80
                  ? 'default'
                  : metrics.complianceRate >= 60
                  ? 'secondary'
                  : 'destructive'
              }
              className={
                metrics.complianceRate >= 80
                  ? 'bg-green-600'
                  : metrics.complianceRate >= 60
                  ? 'bg-amber-600'
                  : ''
              }
            >
              {metrics.complianceRate}%
            </Badge>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                metrics.complianceRate >= 80
                  ? 'bg-green-600'
                  : metrics.complianceRate >= 60
                  ? 'bg-amber-600'
                  : 'bg-red-600'
              }`}
              style={{ width: `${metrics.complianceRate}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {metrics.compliantClients} of {metrics.totalClients} clients
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div>
            <div className="text-xs text-muted-foreground">Filings</div>
            <div className="text-lg font-bold">{metrics.totalFilings}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Overdue
            </div>
            <div
              className={`text-lg font-bold ${
                metrics.overdueFilings > 0 ? 'text-red-600' : 'text-muted-foreground'
              }`}
            >
              {metrics.overdueFilings}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Expiring
            </div>
            <div
              className={`text-lg font-bold ${
                metrics.expiringDocs > 0 ? 'text-amber-600' : 'text-muted-foreground'
              }`}
            >
              {metrics.expiringDocs}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AllAuthorityMetricsProps {
  allMetrics: AuthorityMetrics[];
}

export function AllAuthorityMetrics({ allMetrics }: AllAuthorityMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {allMetrics.map((metrics) => (
        <AuthorityMetricsCard key={metrics.authority} metrics={metrics} />
      ))}
    </div>
  );
}
