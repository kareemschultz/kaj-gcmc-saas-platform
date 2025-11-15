'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';

interface FilingTrendChartProps {
  data: Array<{
    month: string;
    submitted: number;
    overdue: number;
    total: number;
  }>;
}

export function FilingTrendChart({ data }: FilingTrendChartProps) {
  const chartData = data.map((item) => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    }),
    Submitted: item.submitted,
    Overdue: item.overdue,
    Total: item.total,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Filing Activity Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Submitted" fill="#10b981" />
          <Bar dataKey="Overdue" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
