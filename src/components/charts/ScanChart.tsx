'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ScanChartProps {
  data: Array<{
    date: string;
    scans: number;
    leads: number;
    pageViews?: number;
  }>;
}

const CustomTooltip = ({ 
  active, 
  payload, 
  label 
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ScanChart({ data }: ScanChartProps) {
  // Check if data is empty
  const hasData = data.length > 0 && data.some(d => (d.scans || 0) > 0 || (d.leads || 0) > 0 || (d.pageViews || 0) > 0);

  if (!hasData) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No scan data yet</h3>
          <p className="text-sm text-gray-600 mb-1">
            Start generating QR codes to track scans, leads, and page views over time.
          </p>
          <p className="text-xs text-gray-500">
            Use the Chrome extension to create QR codes from your property listings.
          </p>
        </div>
      </div>
    );
  }

  // Calculate optimal y-axis domain based on actual data
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.scans || 0, d.leads || 0, d.pageViews || 0)),
    1 // Minimum of 1 to avoid empty chart
  );
  
  // Add 10% padding to top, but ensure minimum domain
  const yAxisMax = Math.ceil(maxValue * 1.1);
  const yAxisDomain = [0, yAxisMax];

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          stroke="#6b7280"
          style={{ fontSize: '11px' }}
          tick={{ fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#6b7280"
          style={{ fontSize: '11px' }}
          tick={{ fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          width={40}
          domain={yAxisDomain}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
          iconType="line"
        />
        <Area 
          type="monotone" 
          dataKey="scans" 
          stroke="#3b82f6" 
          fillOpacity={1}
          fill="url(#colorScans)" 
          strokeWidth={2}
          name="QR Scans"
        />
        <Area 
          type="monotone" 
          dataKey="leads" 
          stroke="#10b981" 
          fillOpacity={1}
          fill="url(#colorLeads)" 
          strokeWidth={2}
          name="Leads"
        />
        {data.some(d => d.pageViews && d.pageViews > 0) && (
          <Area 
            type="monotone" 
            dataKey="pageViews" 
            stroke="#8b5cf6" 
            fillOpacity={1}
            fill="url(#colorPageViews)" 
            strokeWidth={2}
            name="Page Views"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}



