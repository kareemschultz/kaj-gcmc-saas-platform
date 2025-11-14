'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface AuthorityBreakdownChartProps {
  data: Array<{
    authority: string;
    lateFilings: { total: number };
    expiringDocs: { total: number };
    complianceRate: number;
  }>;
}

const COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#14b8a6', '#6366f1'];

export function AuthorityBreakdownChart({ data }: AuthorityBreakdownChartProps) {
  const filingData = data.map((item, index) => ({
    name: item.authority,
    value: item.lateFilings.total,
    color: COLORS[index % COLORS.length],
  }));

  const docData = data.map((item, index) => ({
    name: item.authority,
    value: item.expiringDocs.total,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Overdue Filings by Authority</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={filingData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {filingData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Expiring Documents by Authority</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={docData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {docData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
