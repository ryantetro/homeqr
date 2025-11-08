'use client';

interface DeviceChartProps {
  data: Record<string, number>; // { mobile: 10, desktop: 5, tablet: 2 }
}

export default function DeviceChart({ data }: DeviceChartProps) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No device data available
      </div>
    );
  }

  const colors: Record<string, string> = {
    mobile: 'bg-blue-500',
    desktop: 'bg-purple-500',
    tablet: 'bg-pink-500',
    unknown: 'bg-gray-400',
  };

  const labels: Record<string, string> = {
    mobile: 'Mobile',
    desktop: 'Desktop',
    tablet: 'Tablet',
    unknown: 'Unknown',
  };

  const entries = Object.entries(data)
    .map(([device, count]) => ({
      device,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {entries.map(({ device, count, percentage }) => (
          <div key={device} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                {labels[device] || device}
              </span>
              <span className="text-gray-600">
                {count} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${colors[device] || colors.unknown}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Scans</span>
          <span className="text-lg font-bold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
}

