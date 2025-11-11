'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeOfDayChartProps {
  data: number[]; // Array of 24 numbers, one for each hour
}

export default function TimeOfDayChart({ data }: TimeOfDayChartProps) {
  const maxValue = Math.max(...data, 1);
  const totalActivity = data.reduce((sum, val) => sum + val, 0);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Find peak hour
  const peakHour = useMemo(() => {
    const maxVal = Math.max(...data);
    return data.indexOf(maxVal);
  }, [data]);

  // Group hours into periods for better visualization
  const periods = useMemo(() => {
    return [
      { name: 'Night', range: '12AM-6AM', hours: [0, 1, 2, 3, 4, 5], color: '#3b82f6', icon: '🌙' },
      { name: 'Morning', range: '6AM-12PM', hours: [6, 7, 8, 9, 10, 11], color: '#f59e0b', icon: '🌅' },
      { name: 'Afternoon', range: '12PM-6PM', hours: [12, 13, 14, 15, 16, 17], color: '#10b981', icon: '☀️' },
      { name: 'Evening', range: '6PM-12AM', hours: [18, 19, 20, 21, 22, 23], color: '#8b5cf6', icon: '🌆' },
    ].map(period => ({
      ...period,
      total: period.hours.reduce((sum, h) => sum + (data[h] || 0), 0),
      avg: period.hours.reduce((sum, h) => sum + (data[h] || 0), 0) / period.hours.length,
    }));
  }, [data]);

  const topPeriod = useMemo(() => {
    return periods.reduce((max, p) => p.total > max.total ? p : max, periods[0]);
  }, [periods]);

  const getTimeLabel = (hour: number) => {
    if (hour === 0) return '12AM';
    if (hour < 12) return `${hour}AM`;
    if (hour === 12) return '12PM';
    return `${hour - 12}PM`;
  };

  const getBarColor = (value: number) => {
    if (value === 0) return '#e5e7eb';
    const intensity = value / maxValue;
    if (intensity > 0.7) return '#10b981';
    if (intensity > 0.4) return '#f59e0b';
    return '#3b82f6';
  };

  if (totalActivity === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No activity data yet</p>
          <p className="text-gray-400 text-xs mt-1">Activity will appear as visitors interact</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Period Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {periods.map((period) => {
          const isPeak = period.name === topPeriod.name;
          return (
            <div
              key={period.name}
              className={`relative p-3 sm:p-4 rounded-lg border transition-all ${
                isPeak
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-md'
                  : 'bg-gray-50 border-gray-200 hover:shadow-sm'
              }`}
              style={{
                borderTopColor: period.color,
                borderTopWidth: '3px',
              }}
            >
              {isPeak && (
                <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-green-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm">
                  Peak
                </div>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <span className="text-lg sm:text-xl shrink-0">{period.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight">{period.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">{period.range}</p>
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{period.total}</p>
              <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 leading-tight">
                {period.total === 1 ? 'visit' : 'visits'}
              </p>
            </div>
          );
        })}
      </div>

      {/* 24-Hour Activity Bar Chart */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <p className="text-sm font-semibold text-gray-700">Hourly Breakdown</p>
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-blue-500 shrink-0"></div>
              <span className="text-gray-600">Low</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-amber-500 shrink-0"></div>
              <span className="text-gray-600">Medium</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-green-500 shrink-0"></div>
              <span className="text-gray-600">High</span>
            </div>
          </div>
        </div>

        {/* Line/Area Chart */}
        <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 sm:p-4 md:p-5 border border-gray-200 shadow-sm">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={hours.map(hour => ({
                hour,
                hourLabel: getTimeLabel(hour),
                value: data[hour] || 0,
                isPeak: hour === peakHour && data[hour] > 0,
              }))}
              margin={{ top: 10, right: 5, left: -5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="hour"
                stroke="#6b7280"
                style={{ fontSize: '10px' }}
                tick={{ fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(hour) => {
                  if (hour % 3 === 0) {
                    return hour === 0 ? '12A' : hour === 12 ? '12P' : hour < 12 ? `${hour}A` : `${hour - 12}P`;
                  }
                  return '';
                }}
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
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border-2 border-gray-200 rounded-lg shadow-xl">
                        <p className="font-semibold text-gray-900 mb-1">{data.hourLabel}</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-blue-600">{data.value}</p>
                          <p className="text-sm text-gray-600">
                            {data.value === 1 ? 'visit' : 'visits'}
                          </p>
                        </div>
                        {data.isPeak && (
                          <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                            <span>🔥</span> Peak hour
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#activityGradient)"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.isPeak) {
                    return (
                      <circle
                        key={`dot-peak-${cx}-${cy}`}
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#10b981"
                        stroke="#fff"
                        strokeWidth={2}
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4))' }}
                      />
                    );
                  }
                  if (payload.value > 0) {
                    return (
                      <circle
                        key={`dot-${cx}-${cy}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#3b82f6"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    );
                  }
                  return <g key={`dot-empty-${cx}-${cy}`} />;
                }}
                activeDot={{
                  r: 6,
                  fill: '#3b82f6',
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Insights */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <span className="text-lg sm:text-xl shrink-0">📊</span>
            <p className="text-xs font-semibold text-gray-700 leading-tight">Total Activity</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalActivity}</p>
          <p className="text-[10px] sm:text-xs text-gray-600 mt-1 leading-tight">
            Avg {(totalActivity / 24).toFixed(1)} per hour
          </p>
        </div>

        <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <span className="text-lg sm:text-xl shrink-0">🔥</span>
            <p className="text-xs font-semibold text-gray-700 leading-tight">Peak Hour</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{getTimeLabel(peakHour)}</p>
          <p className="text-[10px] sm:text-xs text-gray-600 mt-1 leading-tight">
            {data[peakHour]} {data[peakHour] === 1 ? 'visit' : 'visits'}
          </p>
        </div>
      </div>
    </div>
  );
}
