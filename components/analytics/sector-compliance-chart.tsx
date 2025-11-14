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
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/card';

interface SectorComplianceChartProps {
  data: Array<{
    sector: string;
    clientCount: number;
    avgScore: number;
    greenCount: number;
    amberCount: number;
    redCount: number;
  }>;
}

export function SectorComplianceChart({ data }: SectorComplianceChartProps) {
  const chartData = data.map((item) => ({
    sector: item.sector,
    Green: item.greenCount,
    Amber: item.amberCount,
    Red: item.redCount,
    'Avg Score': Math.round(item.avgScore),
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Compliance by Sector</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Client compliance distribution across different industry sectors
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="sector" type="category" width={120} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Green" stackId="a" fill="#10b981" />
          <Bar dataKey="Amber" stackId="a" fill="#f59e0b" />
          <Bar dataKey="Red" stackId="a" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
