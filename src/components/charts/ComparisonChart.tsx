'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { useMemo } from 'react';

interface ComparisonChartProps {
  currentPeriod: {
    scans: number;
    leads: number;
    pageViews: number;
  };
  previousPeriod: {
    scans: number;
    leads: number;
    pageViews: number;
  };
  periodType: 'week' | 'month';
}

export default function ComparisonChart({
  currentPeriod,
  previousPeriod,
  periodType,
}: ComparisonChartProps) {
  const metrics = useMemo(() => [
    {
      name: 'QR Scans',
      current: currentPeriod.scans,
      previous: previousPeriod.scans,
      icon: '📱',
      color: '#3b82f6',
      lightColor: '#dbeafe',
    },
    {
      name: 'Leads',
      current: currentPeriod.leads,
      previous: previousPeriod.leads,
      icon: '🎯',
      color: '#10b981',
      lightColor: '#d1fae5',
    },
    {
      name: 'Page Views',
      current: currentPeriod.pageViews,
      previous: previousPeriod.pageViews,
      icon: '👁️',
      color: '#8b5cf6',
      lightColor: '#ede9fe',
    },
  ], [currentPeriod, previousPeriod]);

  const chartData = metrics.map(metric => ({
    name: metric.name,
    'This Week': metric.current,
    'Last Week': metric.previous,
  }));

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const periodLabel = periodType === 'week' ? 'Week' : 'Month';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {metrics.map((metric) => {
          const change = calculateChange(metric.current, metric.previous);
          const isPositive = change >= 0;
          const isSignificant = Math.abs(change) >= 10;

          return (
            <div
              key={metric.name}
              className="relative overflow-hidden rounded-xl border-2 transition-all hover:shadow-lg"
              style={{
                borderColor: `${metric.color}30`,
                backgroundColor: metric.lightColor,
              }}
            >
              {/* Background gradient */}
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${metric.lightColor} 0%, white 100%)`,
                }}
              />

              <div className="relative p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl shrink-0">{metric.icon}</span>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight">{metric.name}</p>
                  </div>
                  {isSignificant && (
                    <div
                      className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shrink-0 ${
                        isPositive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {isPositive ? (
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      <span>{Math.abs(change).toFixed(0)}%</span>
                    </div>
                  )}
                </div>

                {/* Current Value */}
                <div className="mb-3">
                  <p className="text-3xl sm:text-4xl font-bold text-gray-900">{metric.current}</p>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-1 leading-tight">This {periodLabel.toLowerCase()}</p>
                </div>

                {/* Comparison Bar */}
                <div className="space-y-1.5">
                  {/* This Week */}
                  <div className="flex items-center gap-2">
                    <div className="w-12 sm:w-16 text-[10px] sm:text-xs text-gray-600 shrink-0">This</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden min-w-0">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max((metric.current / Math.max(metric.current, metric.previous, 1)) * 100, 5)}%`,
                          backgroundColor: metric.color,
                        }}
                      />
                    </div>
                    <div className="w-6 sm:w-8 text-[10px] sm:text-xs font-semibold text-gray-900 text-right shrink-0">
                      {metric.current}
                    </div>
                  </div>

                  {/* Last Week */}
                  <div className="flex items-center gap-2">
                    <div className="w-12 sm:w-16 text-[10px] sm:text-xs text-gray-500 shrink-0">Last</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden min-w-0">
                      <div
                        className="h-full rounded-full transition-all duration-500 opacity-60"
                        style={{
                          width: `${Math.max((metric.previous / Math.max(metric.current, metric.previous, 1)) * 100, 5)}%`,
                          backgroundColor: metric.color,
                        }}
                      />
                    </div>
                    <div className="w-6 sm:w-8 text-[10px] sm:text-xs font-medium text-gray-600 text-right shrink-0">
                      {metric.previous}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grouped Bar Chart */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">Performance Comparison</h3>
          <div className="flex items-center gap-3 sm:gap-4 text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-blue-500 shrink-0"></div>
              <span className="text-gray-600">This {periodLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-gray-400 shrink-0"></div>
              <span className="text-gray-600">Last {periodLabel}</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -5, bottom: 5 }}
            barGap={6}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              style={{ fontSize: '10px' }}
              tick={{ fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '10px' }}
              tick={{ fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={30}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const metricName = payload[0].payload.name;
                  const metric = metrics.find(m => m.name === metricName);
                  return (
                    <div className="bg-white p-4 border-2 border-gray-200 rounded-lg shadow-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{metric?.icon}</span>
                        <p className="font-semibold text-gray-900">{metricName}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-gray-600">This {periodLabel}:</span>
                          <span className="text-lg font-bold" style={{ color: metric?.color }}>
                            {payload[0].value}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-gray-600">Last {periodLabel}:</span>
                          <span className="text-lg font-bold text-gray-600">
                            {payload[1].value}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
            />
            <Bar
              dataKey="This Week"
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-current-${index}`} fill={metrics[index].color} />
              ))}
            </Bar>
            <Bar
              dataKey="Last Week"
              fill="#9ca3af"
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
              opacity={0.6}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="text-center p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-[10px] sm:text-xs font-medium text-gray-600 mb-1 leading-tight">Total Growth</p>
          <p className={`text-xl sm:text-2xl font-bold ${
            (currentPeriod.scans + currentPeriod.leads + currentPeriod.pageViews) >= 
            (previousPeriod.scans + previousPeriod.leads + previousPeriod.pageViews)
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {calculateChange(
              currentPeriod.scans + currentPeriod.leads + currentPeriod.pageViews,
              previousPeriod.scans + previousPeriod.leads + previousPeriod.pageViews
            ).toFixed(1)}%
          </p>
        </div>
        
        <div className="text-center p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-[10px] sm:text-xs font-medium text-gray-600 mb-1 leading-tight">Lead Growth</p>
          <p className={`text-xl sm:text-2xl font-bold ${
            currentPeriod.leads >= previousPeriod.leads ? 'text-green-600' : 'text-red-600'
          }`}>
            {calculateChange(currentPeriod.leads, previousPeriod.leads).toFixed(1)}%
          </p>
        </div>
        
        <div className="text-center p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-[10px] sm:text-xs font-medium text-gray-600 mb-1 leading-tight">Engagement Growth</p>
          <p className={`text-xl sm:text-2xl font-bold ${
            currentPeriod.scans >= previousPeriod.scans ? 'text-green-600' : 'text-red-600'
          }`}>
            {calculateChange(currentPeriod.scans, previousPeriod.scans).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
