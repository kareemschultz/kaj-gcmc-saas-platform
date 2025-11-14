// Dashboard statistics cards

import { prisma } from '@/lib/prisma';
import { Users, FileText, FolderOpen, AlertCircle } from 'lucide-react';

interface DashboardStatsProps {
  tenantId: number;
}

export async function DashboardStats({ tenantId }: DashboardStatsProps) {
  // Fetch basic stats
  const [clientCount, documentCount, filingCount, overdueCount] = await Promise.all([
    prisma.client.count({ where: { tenantId } }),
    prisma.document.count({ where: { tenantId } }),
    prisma.filing.count({ where: { tenantId } }),
    prisma.filing.count({ 
      where: { 
        tenantId,
        status: 'overdue'
      } 
    }),
  ]);

  const stats = [
    {
      name: 'Total Clients',
      value: clientCount,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      name: 'Documents',
      value: documentCount,
      icon: FileText,
      color: 'text-green-600',
    },
    {
      name: 'Filings',
      value: filingCount,
      icon: FolderOpen,
      color: 'text-purple-600',
    },
    {
      name: 'Overdue',
      value: overdueCount,
      icon: AlertCircle,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.name} className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              </div>
              <Icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
