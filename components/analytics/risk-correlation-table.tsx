'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface RiskCorrelationTableProps {
  data: Array<{
    clientId: number;
    clientName: string;
    riskLevel: string;
    complianceLevel: string;
    overdueFilings: number;
    missingDocs: number;
    highFilingVolume: boolean;
  }>;
}

export function RiskCorrelationTable({ data }: RiskCorrelationTableProps) {
  // Show top 10 highest risk clients
  const topRiskClients = data.slice(0, 10);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Top Risk Clients</h3>
          <p className="text-sm text-muted-foreground">
            Clients with poor compliance and high risk levels
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-2 font-medium">Client</th>
              <th className="text-left py-3 px-2 font-medium">Risk Level</th>
              <th className="text-left py-3 px-2 font-medium">Compliance</th>
              <th className="text-right py-3 px-2 font-medium">Overdue</th>
              <th className="text-right py-3 px-2 font-medium">Missing</th>
              <th className="text-center py-3 px-2 font-medium">Volume</th>
              <th className="text-right py-3 px-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {topRiskClients.map((client) => (
              <tr key={client.clientId} className="border-b hover:bg-gray-50">
                <td className="py-3 px-2">
                  <div className="font-medium">{client.clientName}</div>
                </td>
                <td className="py-3 px-2">
                  <Badge
                    variant={
                      client.riskLevel === 'high'
                        ? 'destructive'
                        : client.riskLevel === 'medium'
                        ? 'outline'
                        : 'secondary'
                    }
                  >
                    {client.riskLevel}
                  </Badge>
                </td>
                <td className="py-3 px-2">
                  <Badge
                    className={
                      client.complianceLevel === 'green'
                        ? 'bg-green-600'
                        : client.complianceLevel === 'amber'
                        ? 'bg-amber-600'
                        : 'bg-red-600'
                    }
                  >
                    {client.complianceLevel}
                  </Badge>
                </td>
                <td className="py-3 px-2 text-right">
                  {client.overdueFilings > 0 ? (
                    <span className="text-red-600 font-medium">{client.overdueFilings}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 px-2 text-right">
                  {client.missingDocs > 0 ? (
                    <span className="text-amber-600 font-medium">{client.missingDocs}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 px-2 text-center">
                  {client.highFilingVolume && (
                    <Badge variant="secondary" className="text-xs">
                      High
                    </Badge>
                  )}
                </td>
                <td className="py-3 px-2 text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/clients/${client.clientId}`}>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > 10 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Showing top 10 of {data.length} clients
        </div>
      )}
    </Card>
  );
}
