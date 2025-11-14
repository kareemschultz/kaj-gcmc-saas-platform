'use client';

// Bundle Progress Component
// Displays requirement bundle progress for a client/service/filing

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, AlertCircle, FileText, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BundleItem {
  id: number;
  required: boolean;
  description?: string;
  order: number;
  documentType?: {
    id: number;
    name: string;
    category: string;
    description?: string;
    authority?: string;
    metadata?: any;
  };
  filingType?: {
    id: number;
    name: string;
    code: string;
    authority: string;
    frequency: string;
    description?: string;
  };
}

interface BundleProgressData {
  bundle: {
    id: number;
    name: string;
    authority: string;
    category: string;
    description?: string;
  };
  progress: Array<{
    item: BundleItem;
    fulfilled: boolean;
    documents?: any[];
    filings?: any[];
  }>;
  stats: {
    totalRequired: number;
    completedRequired: number;
    totalOptional: number;
    completedOptional: number;
    percentComplete: number;
    isComplete: boolean;
  };
}

interface BundleProgressProps {
  clientId: number;
  bundleId: number;
  showActions?: boolean;
  className?: string;
}

export function BundleProgress({
  clientId,
  bundleId,
  showActions = true,
  className,
}: BundleProgressProps) {
  const [data, setData] = useState<BundleProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/requirement-bundles/${bundleId}/progress?clientId=${clientId}`
        );

        if (!response.ok) {
          throw new Error('Failed to load bundle progress');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, [clientId, bundleId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p>{error || 'Failed to load bundle progress'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { bundle, progress, stats } = data;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{bundle.name}</CardTitle>
            <CardDescription>
              {bundle.authority} • {bundle.category}
              {bundle.description && ` • ${bundle.description}`}
            </CardDescription>
          </div>
          <div className="text-right">
            <div
              className={cn(
                'text-2xl font-bold',
                stats.isComplete
                  ? 'text-green-600'
                  : stats.percentComplete >= 50
                  ? 'text-amber-600'
                  : 'text-red-600'
              )}
            >
              {Math.round(stats.percentComplete)}%
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.completedRequired} of {stats.totalRequired} complete
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                stats.isComplete
                  ? 'bg-green-600'
                  : stats.percentComplete >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              )}
              style={{ width: `${stats.percentComplete}%` }}
            />
          </div>
        </div>

        {/* Requirements List */}
        <div className="space-y-3">
          {progress.map(({ item, fulfilled, documents, filings }) => (
            <div
              key={item.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border',
                fulfilled
                  ? 'bg-green-50 border-green-200'
                  : item.required
                  ? 'bg-red-50 border-red-200'
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {fulfilled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : item.required ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {/* Requirement Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {item.documentType?.name || item.filingType?.name}
                      {!item.required && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Optional)
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </div>
                    )}
                    {item.documentType?.metadata && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.documentType.metadata.validityPeriod && (
                          <span>
                            Validity: {item.documentType.metadata.validityPeriod}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {showActions && (
                    <div className="flex gap-2">
                      {fulfilled ? (
                        <>
                          {documents && documents.length > 0 && (
                            <Link
                              href={`/dashboard/documents/${documents[0].id}`}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                          {filings && filings.length > 0 && (
                            <Link
                              href={`/dashboard/filings/${filings[0].id}`}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </>
                      ) : (
                        <Link
                          href={
                            item.documentType
                              ? `/dashboard/documents/new?clientId=${clientId}&documentTypeId=${item.documentType.id}`
                              : `/dashboard/filings/new?clientId=${clientId}&filingTypeId=${item.filingType?.id}`
                          }
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          Add <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Show existing documents/filings */}
                {fulfilled && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {documents && documents.length > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>
                          {documents.length} document{documents.length !== 1 ? 's' : ''}
                        </span>
                        {documents[0].latestVersion?.expiryDate && (
                          <>
                            <span className="mx-1">•</span>
                            <Calendar className="h-3 w-3" />
                            <span>
                              Expires:{' '}
                              {new Date(
                                documents[0].latestVersion.expiryDate
                              ).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    {filings && filings.length > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>
                          {filings.length} filing{filings.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        {stats.totalOptional > 0 && (
          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
            Optional items: {stats.completedOptional} of {stats.totalOptional} completed
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for dashboards
 */
export function BundleProgressCompact({
  clientId,
  bundleId,
  className,
}: Omit<BundleProgressProps, 'showActions'>) {
  const [data, setData] = useState<BundleProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/requirement-bundles/${bundleId}/progress?clientId=${clientId}`
        );

        if (!response.ok) {
          throw new Error('Failed to load bundle progress');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Failed to load bundle progress:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, [clientId, bundleId]);

  if (loading || !data) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const { bundle, stats } = data;

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="flex-1">
        <div className="text-sm font-medium">{bundle.name}</div>
        <div className="text-xs text-muted-foreground">{bundle.authority}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div
            className={cn(
              'text-sm font-semibold',
              stats.isComplete
                ? 'text-green-600'
                : stats.percentComplete >= 50
                ? 'text-amber-600'
                : 'text-red-600'
            )}
          >
            {Math.round(stats.percentComplete)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {stats.completedRequired}/{stats.totalRequired}
          </div>
        </div>
        {stats.isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600" />
        )}
      </div>
    </div>
  );
}
