'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

interface ConversionChartProps {
  data: Array<{
    date: string;
    scans: number;
    leads: number;
  }>;
}

const CustomTooltip = ({ 
  active, 
  payload, 
  label 
}: {
  active?: boolean;
  payload?: Array<{ payload: { conversionRate: number; scans: number; leads: number } }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-xl">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-gray-600">Conversion Rate:</span>{' '}
            <span className="font-semibold text-blue-600">{data.conversionRate.toFixed(2)}%</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Scans:</span>{' '}
            <span className="font-semibold text-gray-900">{data.scans}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Leads:</span>{' '}
            <span className="font-semibold text-green-600">{data.leads}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function ConversionChart({ data }: ConversionChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => {
      const conversionRate = item.scans > 0 ? (item.leads / item.scans) * 100 : 0;
      return {
        date: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        fullDate: item.date,
        conversionRate: Number(conversionRate.toFixed(2)),
        scans: item.scans,
        leads: item.leads,
      };
    });
  }, [data]);

  const avgRate = useMemo(() => {
    if (chartData.length === 0) return 0;
    const totalLeads = chartData.reduce((sum, d) => sum + d.leads, 0);
    const totalScans = chartData.reduce((sum, d) => sum + d.scans, 0);
    return totalScans > 0 ? (totalLeads / totalScans) * 100 : 0;
  }, [chartData]);

  const maxRate = Math.max(...chartData.map((d) => d.conversionRate), 0);
  const minRate = Math.min(...chartData.filter((d) => d.conversionRate > 0).map((d) => d.conversionRate), 0);
  const range = maxRate - minRate;
  const yAxisDomain = [Math.max(0, minRate - range * 0.1), maxRate + range * 0.1];

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No data available</p>
          <p className="text-sm">Start generating QR codes to see conversion rates</p>
        </div>
      </div>
    );
  }

  // Calculate trend (comparing last 7 days to previous 7 days if available)
  const recentData = chartData.slice(-7);
  const previousData = chartData.slice(-14, -7);
  const recentAvg = recentData.length > 0
    ? recentData.reduce((sum, d) => sum + d.conversionRate, 0) / recentData.length
    : 0;
  const previousAvg = previousData.length > 0
    ? previousData.reduce((sum, d) => sum + d.conversionRate, 0) / previousData.length
    : 0;
  const trend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
  const isPositiveTrend = trend > 0;

  return (
    <div className="space-y-6">
      {/* Header with Average and Trend */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">Average Conversion Rate</p>
          <div className="flex items-baseline gap-3">
            <p className="text-4xl font-bold text-gray-900">
              {avgRate.toFixed(1)}%
            </p>
            {Math.abs(trend) > 0.1 && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                isPositiveTrend 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                <svg 
                  className={`w-3 h-3 ${isPositiveTrend ? '' : 'rotate-180'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {chartData.reduce((sum, d) => sum + d.leads, 0)} leads from {chartData.reduce((sum, d) => sum + d.scans, 0)} scans
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart 
          data={chartData} 
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
            tickLine={{ stroke: '#e5e7eb' }}
            domain={yAxisDomain}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            y={avgRate} 
            stroke="#10b981" 
            strokeDasharray="5 5" 
            strokeWidth={2}
            label={{ value: `Avg: ${avgRate.toFixed(1)}%`, position: 'right', fill: '#10b981', fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="conversionRate"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#colorConversion)"
            dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500 mb-1">Peak Rate</p>
          <p className="text-lg font-semibold text-gray-900">{maxRate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Lowest Rate</p>
          <p className="text-lg font-semibold text-gray-900">{minRate > 0 ? minRate.toFixed(1) : '0.0'}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">7-Day Trend</p>
          <p className={`text-lg font-semibold ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
            {isPositiveTrend ? '+' : ''}{trend.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

