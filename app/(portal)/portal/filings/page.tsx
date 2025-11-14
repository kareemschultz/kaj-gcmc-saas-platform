import { Metadata } from 'next';
import { getPortalFilings } from '@/lib/actions/portal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCheck, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Filings | Client Portal',
};

export default async function PortalFilingsPage() {
  const clientId = 1; // From session in real app
  const filings = await getPortalFilings(clientId);

  // Group by authority
  const grouped: Record<string, any[]> = {};
  filings.forEach((filing) => {
    const authority = filing.filingType.authority;
    if (!grouped[authority]) grouped[authority] = [];
    grouped[authority].push(filing);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Filings</h1>
        <p className="text-muted-foreground mt-1">
          View your filing history and upcoming deadlines
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{filings.length}</div>
          <div className="text-sm text-muted-foreground">Total Filings</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {filings.filter((f) => f.status === 'approved').length}
          </div>
          <div className="text-sm text-muted-foreground">Approved</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {filings.filter((f) => f.status === 'submitted').length}
          </div>
          <div className="text-sm text-muted-foreground">Submitted</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {filings.filter((f) => f.status === 'overdue').length}
          </div>
          <div className="text-sm text-muted-foreground">Overdue</div>
        </Card>
      </div>

      {/* Filings by Authority */}
      {Object.entries(grouped).map(([authority, authorityFilings]) => (
        <div key={authority}>
          <h2 className="text-xl font-semibold mb-4">{authority} Filings</h2>
          <div className="space-y-3">
            {authorityFilings.map((filing) => {
              const dueDate = filing.periodEnd ? new Date(filing.periodEnd) : null;
              const daysUntil = dueDate
                ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <Card key={filing.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        <FileCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{filing.filingType.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {filing.filingType.frequency}
                          {filing.periodLabel && ` • ${filing.periodLabel}`}
                        </div>
                        {dueDate && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {dueDate.toLocaleDateString()}</span>
                            {daysUntil !== null && daysUntil > 0 && (
                              <span className="text-amber-600">({daysUntil} days)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          filing.status === 'approved'
                            ? 'default'
                            : filing.status === 'overdue'
                            ? 'destructive'
                            : 'outline'
                        }
                        className={filing.status === 'approved' ? 'bg-green-600' : ''}
                      >
                        {filing.status}
                      </Badge>
                      {filing.submissionDate && (
                        <div className="text-xs text-muted-foreground">
                          Submitted: {new Date(filing.submissionDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {filings.length === 0 && (
        <Card className="p-12 text-center">
          <FileCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No filings found</p>
        </Card>
      )}
    </div>
  );
}
