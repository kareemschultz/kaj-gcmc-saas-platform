import { Metadata } from 'next';
import Link from 'next/link';
import { getComplianceOverview } from '@/lib/actions/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Calendar,
  Download,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compliance Overview | KGC Compliance Cloud',
};

interface PageProps {
  searchParams: {
    level?: 'green' | 'amber' | 'red';
    authority?: string;
    page?: string;
  };
}

export default async function ComplianceOverviewPage({ searchParams }: PageProps) {
  const level = searchParams.level;
  const authority = searchParams.authority;
  const page = Number(searchParams.page) || 1;

  const { scores, pagination } = await getComplianceOverview({
    level,
    authority,
    page,
    pageSize: 50,
  });

  const levelColors = {
    green: 'text-green-600 bg-green-50 border-green-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    red: 'text-red-600 bg-red-50 border-red-200',
  };

  const levelIcons = {
    green: CheckCircle,
    amber: AlertCircle,
    red: XCircle,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance Overview</h1>
          <p className="text-muted-foreground mt-1">
            Detailed compliance status for all clients
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant={!level ? 'default' : 'outline'}
              size="sm"
            >
              <Link href="/compliance/overview">All Clients</Link>
            </Button>
            <Button
              asChild
              variant={level === 'green' ? 'default' : 'outline'}
              size="sm"
              className={level === 'green' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <Link href="/compliance/overview?level=green">
                <CheckCircle className="h-4 w-4 mr-2" />
                Green
              </Link>
            </Button>
            <Button
              asChild
              variant={level === 'amber' ? 'default' : 'outline'}
              size="sm"
              className={level === 'amber' ? 'bg-amber-600 hover:bg-amber-700' : ''}
            >
              <Link href="/compliance/overview?level=amber">
                <AlertCircle className="h-4 w-4 mr-2" />
                Amber
              </Link>
            </Button>
            <Button
              asChild
              variant={level === 'red' ? 'default' : 'outline'}
              size="sm"
              className={level === 'red' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              <Link href="/compliance/overview?level=red">
                <XCircle className="h-4 w-4 mr-2" />
                Red
              </Link>
            </Button>
            <div className="border-l mx-2" />
            {['GRA', 'NIS', 'DCRA', 'Immigration'].map((auth) => (
              <Button
                key={auth}
                asChild
                variant={authority === auth ? 'default' : 'outline'}
                size="sm"
              >
                <Link
                  href={`/compliance/overview?${level ? `level=${level}&` : ''}authority=${auth}`}
                >
                  {auth}
                </Link>
              </Button>
            ))}
            {authority && (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/compliance/overview${level ? `?level=${level}` : ''}`}>
                  Clear Authority
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">Total Clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {scores.filter((s) => s.level === 'green').length}
            </div>
            <p className="text-xs text-muted-foreground">Compliant (Green)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">
              {scores.filter((s) => s.level === 'amber').length}
            </div>
            <p className="text-xs text-muted-foreground">At Risk (Amber)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {scores.filter((s) => s.level === 'red').length}
            </div>
            <p className="text-xs text-muted-foreground">Non-Compliant (Red)</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client Compliance Scores</CardTitle>
          <CardDescription>
            {level ? `Showing ${level.toUpperCase()} level clients` : 'Showing all clients'}
            {authority && ` for ${authority}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scores.length > 0 ? (
            <div className="space-y-2">
              {scores.map((score) => {
                const LevelIcon = levelIcons[score.level as keyof typeof levelIcons] || AlertCircle;
                return (
                  <Link
                    key={score.id}
                    href={`/clients/${score.clientId}`}
                    className="block p-4 rounded-lg border hover:border-teal-600 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`mt-1 ${levelColors[score.level as keyof typeof levelColors]?.split(' ')[0]}`}>
                          <LevelIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{score.client.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {score.client.type}
                            </Badge>
                          </div>
                          {score.client.email && (
                            <p className="text-sm text-muted-foreground">{score.client.email}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {score.missingCount > 0 && (
                                  <span className="text-red-600 font-medium">
                                    {score.missingCount} missing
                                  </span>
                                )}
                                {score.missingCount === 0 && (
                                  <span className="text-green-600">All docs present</span>
                                )}
                                {score.expiringCount > 0 && (
                                  <span className="text-amber-600 ml-2">
                                    {score.expiringCount} expiring
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {score.overdueFilingsCount > 0 ? (
                                  <span className="text-red-600 font-medium">
                                    {score.overdueFilingsCount} overdue
                                  </span>
                                ) : (
                                  <span className="text-green-600">No overdue filings</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold">
                          {Math.round(score.scoreValue)}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                        <Badge
                          className={`mt-2 ${levelColors[score.level as keyof typeof levelColors]}`}
                        >
                          {score.level.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No clients found matching the selected filters</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                {pagination.page > 1 && (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/compliance/overview?page=${pagination.page - 1}${
                        level ? `&level=${level}` : ''
                      }${authority ? `&authority=${authority}` : ''}`}
                    >
                      Previous
                    </Link>
                  </Button>
                )}
                {pagination.page < pagination.totalPages && (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/compliance/overview?page=${pagination.page + 1}${
                        level ? `&level=${level}` : ''
                      }${authority ? `&authority=${authority}` : ''}`}
                    >
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
