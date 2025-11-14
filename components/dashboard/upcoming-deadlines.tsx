import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import { UpcomingDeadline } from '@/src/lib/actions/dashboard';
import { format } from 'date-fns';

interface UpcomingDeadlinesCardProps {
  filings: UpcomingDeadline[];
  expiringDocs: UpcomingDeadline[];
}

export function UpcomingDeadlinesCard({ filings, expiringDocs }: UpcomingDeadlinesCardProps) {
  const next7DaysFilings = filings.filter((f) => f.daysUntil <= 7);
  const expiringNext30 = expiringDocs.filter((d) => d.daysUntil <= 30);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Deadlines</CardTitle>
        <CardDescription>
          Filings due and documents expiring soon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-600" />
            <div>
              <div className="text-sm font-medium">Next 7 days</div>
              <div className="text-2xl font-bold text-teal-600">{next7DaysFilings.length}</div>
              <div className="text-xs text-muted-foreground">filings due</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-600" />
            <div>
              <div className="text-sm font-medium">Next 30 days</div>
              <div className="text-2xl font-bold text-amber-600">{expiringNext30.length}</div>
              <div className="text-xs text-muted-foreground">docs expiring</div>
            </div>
          </div>
        </div>

        {/* Urgent Filings */}
        {next7DaysFilings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span>Urgent Filings (Next 7 Days)</span>
            </div>
            <div className="space-y-2">
              {next7DaysFilings.slice(0, 5).map((filing) => (
                <Link
                  key={filing.id}
                  href={`/filings/${filing.id}`}
                  className="block p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{filing.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {filing.clientName}
                      </div>
                    </div>
                    <Badge
                      variant={filing.daysUntil <= 3 ? 'destructive' : 'default'}
                      className="shrink-0"
                    >
                      {filing.daysUntil === 0
                        ? 'Today'
                        : filing.daysUntil === 1
                        ? 'Tomorrow'
                        : `${filing.daysUntil}d`}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Expiring Documents */}
        {expiringNext30.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-amber-600" />
              <span>Expiring Documents</span>
            </div>
            <div className="space-y-2">
              {expiringNext30.slice(0, 5).map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="block p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{doc.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {doc.clientName} • {doc.authority}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-medium">
                        {doc.daysUntil}d
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(doc.dueDate), 'MMM dd')}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No Deadlines */}
        {next7DaysFilings.length === 0 && expiringNext30.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No urgent deadlines in the next 30 days</p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/filings/overdue">
              View overdue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/documents/expiring">
              View expiring
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
