import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { ComplianceSummary } from '@/lib/actions/dashboard';

interface ComplianceSummaryCardProps {
  summary: ComplianceSummary;
}

export function ComplianceSummaryCard({ summary }: ComplianceSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Summary</CardTitle>
        <CardDescription>
          Client compliance levels across all authorities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.green}</div>
              <div className="text-xs text-muted-foreground">Green ({summary.greenPercent}%)</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <div className="text-2xl font-bold text-amber-600">{summary.amber}</div>
              <div className="text-xs text-muted-foreground">Amber ({summary.amberPercent}%)</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-600">{summary.red}</div>
              <div className="text-xs text-muted-foreground">Red ({summary.redPercent}%)</div>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Distribution</span>
            <span className="ml-auto">{summary.total} total clients</span>
          </div>
          <div className="w-full h-8 flex rounded-lg overflow-hidden">
            {summary.green > 0 && (
              <div
                className="bg-green-600 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: `${summary.greenPercent}%` }}
              >
                {summary.greenPercent > 10 && `${summary.greenPercent}%`}
              </div>
            )}
            {summary.amber > 0 && (
              <div
                className="bg-amber-600 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: `${summary.amberPercent}%` }}
              >
                {summary.amberPercent > 10 && `${summary.amberPercent}%`}
              </div>
            )}
            {summary.red > 0 && (
              <div
                className="bg-red-600 flex items-center justify-center text-xs font-medium text-white"
                style={{ width: `${summary.redPercent}%` }}
              >
                {summary.redPercent > 10 && `${summary.redPercent}%`}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/compliance/overview?level=red">
              View at-risk clients
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/compliance/overview">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
