'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';

interface ComplianceTrendChartProps {
  data: Array<{
    date: Date;
    green: number;
    amber: number;
    red: number;
    avgScore: number;
  }>;
}

export function ComplianceTrendChart({ data }: ComplianceTrendChartProps) {
  const chartData = data.map((item) => ({
    month: new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    Green: item.green,
    Amber: item.amber,
    Red: item.red,
    'Avg Score': Math.round(item.avgScore),
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Compliance Score Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Green" stroke="#10b981" strokeWidth={2} />
          <Line type="monotone" dataKey="Amber" stroke="#f59e0b" strokeWidth={2} />
          <Line type="monotone" dataKey="Red" stroke="#ef4444" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
