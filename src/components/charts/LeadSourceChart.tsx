'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useMemo, useState } from 'react';

interface LeadSourceChartProps {
  data: Record<string, { visits: number; leads: number }>; // { qr_scan: { visits: 10, leads: 2 }, direct: { visits: 5, leads: 1 } }
}

const COLORS = {
  qr_scan: '#3b82f6',      // Blue
  direct: '#10b981',        // Green
  referral: '#8b5cf6',      // Purple
  unknown: '#6b7280',       // Gray
};

const LABELS: Record<string, string> = {
  qr_scan: 'QR Scan',
  direct: 'Direct Link',
  microsite: 'Direct Microsite',
  referral: 'Referral',
  unknown: 'Unknown',
};

const ICONS: Record<string, string> = {
  qr_scan: '📱',
  direct: '🔗',
  microsite: '🏠',
  referral: '👥',
  unknown: '❓',
};

export default function LeadSourceChart({ data }: LeadSourceChartProps) {
  const totalVisits = Object.values(data).reduce((sum, val) => sum + val.visits, 0);
  const totalLeads = Object.values(data).reduce((sum, val) => sum + val.leads, 0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return Object.entries(data)
      .map(([source, stats]) => ({
        source,
        name: LABELS[source] || source,
        value: stats.visits,
        visits: stats.visits,
        leads: stats.leads,
        percentage: totalVisits > 0 ? ((stats.visits / totalVisits) * 100).toFixed(1) : '0.0',
        conversionRate: stats.visits > 0 ? ((stats.leads / stats.visits) * 100).toFixed(1) : '0.0',
        color: COLORS[source as keyof typeof COLORS] || COLORS.unknown,
      }))
      .filter((item) => item.visits > 0 || item.leads > 0)
      .sort((a, b) => b.value - a.value);
  }, [data, totalVisits]);

  if (totalVisits === 0 && totalLeads === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No traffic data yet</h3>
          <p className="text-sm text-gray-600 mb-1">
            Start generating QR codes and sharing your listings to see where your traffic comes from.
          </p>
          <p className="text-xs text-gray-500">
            Track QR scans, direct links, referrals, and other traffic sources.
          </p>
        </div>
      </div>
    );
  }

  const topSource = chartData[0];
  const hoveredData = hoveredIndex !== null ? chartData[hoveredIndex] : null;

  return (
    <div className="space-y-4">
      {/* Donut Chart with Center Stat */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  style={{
                    filter: hoveredIndex === index 
                      ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' 
                      : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Stat - changes on hover */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center bg-white rounded-full px-5 py-3 shadow-md border border-gray-100 min-w-[140px] transition-all duration-200">
            {hoveredData ? (
              <>
                <p className="text-xs text-gray-500 mb-1">{hoveredData.name}</p>
                <p className="text-2xl font-bold text-gray-900">{hoveredData.visits}</p>
                <p className="text-xs text-gray-500 mt-0.5">visits · {hoveredData.percentage}%</p>
                <p className="text-sm font-semibold text-green-600 mt-1">
                  {hoveredData.leads} leads ({hoveredData.conversionRate}%)
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">{totalVisits}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total Visits</p>
                <p className="text-sm font-semibold text-green-600 mt-1">{totalLeads} leads</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown List */}
      <div className="space-y-2">
        {chartData.map((item) => (
          <div 
            key={item.source}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Icon & Color Indicator */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-lg">{ICONS[item.source] || ICONS.unknown}</span>
            </div>
            
            {/* Label & Stats */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.name}
              </p>
              <p className="text-xs text-gray-500">
                {item.visits} {item.visits === 1 ? 'visit' : 'visits'} · {item.leads} {item.leads === 1 ? 'lead' : 'leads'}
                {item.visits > 0 && (
                  <span className="text-green-600 font-semibold ml-1">
                    ({item.conversionRate}%)
                  </span>
                )}
              </p>
            </div>
            
            {/* Percentage */}
            <div className="shrink-0">
              <span 
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ 
                  backgroundColor: `${item.color}15`,
                  color: item.color,
                }}
              >
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Source Highlight */}
      {topSource && (
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Top Source</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{topSource.name}</span>
              <span 
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ 
                  backgroundColor: `${topSource.color}20`,
                  color: topSource.color,
                }}
              >
                {topSource.percentage}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

