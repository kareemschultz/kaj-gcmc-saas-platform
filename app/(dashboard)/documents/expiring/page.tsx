import { Metadata } from 'next';
import Link from 'next/link';
import { getExpiringDocuments } from '@/src/lib/actions/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Building2, Calendar, Upload, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export const metadata: Metadata = {
  title: 'Expiring Documents | KGC Compliance Cloud',
};

interface PageProps {
  searchParams: {
    authority?: string;
    daysAhead?: string;
    page?: string;
  };
}

export default async function ExpiringDocumentsPage({ searchParams }: PageProps) {
  const authority = searchParams.authority;
  const daysAhead = Number(searchParams.daysAhead) || 30;
  const page = Number(searchParams.page) || 1;

  const { documents, pagination } = await getExpiringDocuments({
    authority,
    daysAhead,
    page,
    pageSize: 50,
  });

  const getUrgencyBadge = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 7) return 'destructive';
    if (daysUntilExpiry <= 14) return 'default';
    return 'secondary';
  };

  const getUrgencyColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry <= 7) return 'text-red-600';
    if (daysUntilExpiry <= 14) return 'text-orange-600';
    return 'text-amber-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Expiring Documents</h1>
              <p className="text-muted-foreground mt-1">
                Documents expiring in the next {daysAhead} days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Time Range Filter */}
            <div>
              <div className="text-sm font-medium mb-2">Time Range</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  variant={daysAhead === 30 ? 'default' : 'outline'}
                  size="sm"
                >
                  <Link
                    href={`/documents/expiring?daysAhead=30${
                      authority ? `&authority=${authority}` : ''
                    }`}
                  >
                    Next 30 Days
                  </Link>
                </Button>
                <Button
                  asChild
                  variant={daysAhead === 60 ? 'default' : 'outline'}
                  size="sm"
                >
                  <Link
                    href={`/documents/expiring?daysAhead=60${
                      authority ? `&authority=${authority}` : ''
                    }`}
                  >
                    Next 60 Days
                  </Link>
                </Button>
                <Button
                  asChild
                  variant={daysAhead === 90 ? 'default' : 'outline'}
                  size="sm"
                >
                  <Link
                    href={`/documents/expiring?daysAhead=90${
                      authority ? `&authority=${authority}` : ''
                    }`}
                  >
                    Next 90 Days
                  </Link>
                </Button>
              </div>
            </div>

            {/* Authority Filter */}
            <div>
              <div className="text-sm font-medium mb-2">Authority</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  variant={!authority ? 'default' : 'outline'}
                  size="sm"
                >
                  <Link href={`/documents/expiring?daysAhead=${daysAhead}`}>
                    All Authorities
                  </Link>
                </Button>
                {['GRA', 'NIS', 'DCRA', 'Immigration'].map((auth) => (
                  <Button
                    key={auth}
                    asChild
                    variant={authority === auth ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Link href={`/documents/expiring?daysAhead=${daysAhead}&authority=${auth}`}>
                      {auth}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">Total Expiring</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {documents.filter((d) => d.daysUntilExpiry <= 7).length}
            </div>
            <p className="text-xs text-muted-foreground">Next 7 Days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {documents.filter((d) => d.daysUntilExpiry > 7 && d.daysUntilExpiry <= 14).length}
            </div>
            <p className="text-xs text-muted-foreground">8-14 Days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">
              {documents.filter((d) => d.daysUntilExpiry > 14).length}
            </div>
            <p className="text-xs text-muted-foreground">15+ Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expiring Documents</CardTitle>
          <CardDescription>
            {authority
              ? `Showing documents expiring in the next ${daysAhead} days for ${authority}`
              : `Showing documents expiring in the next ${daysAhead} days`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-lg border hover:border-teal-600 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <Clock className={`h-5 w-5 ${getUrgencyColor(doc.daysUntilExpiry)}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/documents/${doc.id}`}
                              className="font-semibold text-lg hover:text-teal-600 transition-colors"
                            >
                              {doc.documentType.name}
                            </Link>
                            {doc.documentType.authority && (
                              <Badge variant="outline">{doc.documentType.authority}</Badge>
                            )}
                            <Badge variant="outline">{doc.documentType.category}</Badge>
                            <Badge variant={getUrgencyBadge(doc.daysUntilExpiry)}>
                              {doc.daysUntilExpiry === 0
                                ? 'Expires today'
                                : doc.daysUntilExpiry === 1
                                ? 'Expires tomorrow'
                                : `Expires in ${doc.daysUntilExpiry} days`}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <Link
                              href={`/clients/${doc.client.id}`}
                              className="flex items-center gap-1 hover:text-teal-600 transition-colors"
                            >
                              <Building2 className="h-4 w-4" />
                              <span className="font-medium">{doc.client.name}</span>
                            </Link>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Expires: {format(new Date(doc.expiryDate), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          </div>
                          {doc.title && doc.title !== doc.documentType.name && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {doc.title}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/documents/${doc.id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          View Document
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="default">
                        <Link href={`/documents/${doc.id}?action=upload`}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload New Version
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-600" />
              <p className="text-lg font-medium">No documents expiring soon!</p>
              <p className="text-sm mt-1">
                {authority
                  ? `No ${authority} documents expire in the next ${daysAhead} days`
                  : `No documents expire in the next ${daysAhead} days`}
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
                      href={`/documents/expiring?page=${pagination.page - 1}&daysAhead=${daysAhead}${
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
                      href={`/documents/expiring?page=${pagination.page + 1}&daysAhead=${daysAhead}${
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
