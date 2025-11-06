'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ScanChartProps {
  data: Array<{
    date: string;
    scans: number;
    leads: number;
  }>;
}

export default function ScanChart({ data }: ScanChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="scans" stroke="#3b82f6" name="Scans" />
        <Line type="monotone" dataKey="leads" stroke="#10b981" name="Leads" />
      </LineChart>
    </ResponsiveContainer>
  );
}


