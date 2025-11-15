import { Metadata } from 'next';
import Link from 'next/link';
import { getOverdueFilings, markFilingAsSubmitted } from '@/lib/actions/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Building2, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const metadata: Metadata = {
  title: 'Overdue Filings | KGC Compliance Cloud',
};

interface PageProps {
  searchParams: Promise<{
    authority?: string;
    page?: string;
  }>;
}

export default async function OverdueFilingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const authority = params.authority;
  const page = Number(params.page) || 1;

  const { filings, pagination } = await getOverdueFilings({
    authority,
    page,
    pageSize: 50,
  });

  const getDaysOverdueBadge = (daysOverdue: number) => {
    if (daysOverdue >= 30) return 'destructive';
    if (daysOverdue >= 14) return 'default';
    return 'secondary';
  };

  const getDaysOverdueColor = (daysOverdue: number) => {
    if (daysOverdue >= 30) return 'text-red-600';
    if (daysOverdue >= 14) return 'text-orange-600';
    return 'text-amber-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Overdue Filings</h1>
              <p className="text-muted-foreground mt-1">
                Filings that have passed their due date
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter by Authority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant={!authority ? 'default' : 'outline'}
              size="sm"
            >
              <Link href="/filings/overdue">All Authorities</Link>
            </Button>
            {['GRA', 'NIS', 'DCRA', 'Immigration'].map((auth: any) => (
              <Button
                key={auth}
                asChild
                variant={authority === auth ? 'default' : 'outline'}
                size="sm"
              >
                <Link href={`/filings/overdue?authority=${auth}`}>
                  {auth}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">Total Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {filings.filter((f: any) => f.daysOverdue >= 30).length}
            </div>
            <p className="text-xs text-muted-foreground">30+ Days Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {filings.filter((f: any) => f.daysOverdue >= 14 && f.daysOverdue < 30).length}
            </div>
            <p className="text-xs text-muted-foreground">14-29 Days Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">
              {filings.filter((f: any) => f.daysOverdue < 14).length}
            </div>
            <p className="text-xs text-muted-foreground">Less than 14 Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Filings</CardTitle>
          <CardDescription>
            {authority
              ? `Showing overdue filings for ${authority}`
              : 'Showing all overdue filings'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filings.length > 0 ? (
            <div className="space-y-3">
              {filings.map((filing: any) => (
                <div
                  key={filing.id}
                  className="p-4 rounded-lg border hover:border-teal-600 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <AlertTriangle className={`h-5 w-5 ${getDaysOverdueColor(filing.daysOverdue)}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/filings/${filing.id}`}
                              className="font-semibold text-lg hover:text-teal-600 transition-colors"
                            >
                              {filing.filingType.name}
                            </Link>
                            <Badge variant="outline">{filing.filingType.authority}</Badge>
                            <Badge variant={getDaysOverdueBadge(filing.daysOverdue)}>
                              {filing.daysOverdue} days overdue
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <Link
                              href={`/clients/${filing.client.id}`}
                              className="flex items-center gap-1 hover:text-teal-600 transition-colors"
                            >
                              <Building2 className="h-4 w-4" />
                              <span className="font-medium">{filing.client.name}</span>
                            </Link>
                            {filing.periodEnd && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Due: {format(new Date(filing.periodEnd), 'MMM dd, yyyy')}</span>
                              </div>
                            )}
                            {filing.periodStart && filing.periodEnd && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                <span>
                                  Period: {format(new Date(filing.periodStart), 'MMM dd')} -{' '}
                                  {format(new Date(filing.periodEnd), 'MMM dd, yyyy')}
                                </span>
                              </div>
                            )}
                          </div>
                          {filing.referenceNumber && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Ref: {filing.referenceNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/filings/${filing.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <form
                        action={async () => {
                          'use server';
                          await markFilingAsSubmitted(filing.id);
                        }}
                      >
                        <Button type="submit" size="sm" variant="default" className="w-full">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Submitted
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-600" />
              <p className="text-lg font-medium">No overdue filings!</p>
              <p className="text-sm mt-1">
                {authority
                  ? `All ${authority} filings are up to date`
                  : 'All filings are up to date'}
              </p>
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
                      href={`/filings/overdue?page=${pagination.page - 1}${
                        authority ? `&authority=${authority}` : ''
                      }`}
                    >
                      Previous
                    </Link>
                  </Button>
                )}
                {pagination.page < pagination.totalPages && (
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/filings/overdue?page=${pagination.page + 1}${
                        authority ? `&authority=${authority}` : ''
                      }`}
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
