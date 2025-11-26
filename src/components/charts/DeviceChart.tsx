'use client';

interface DeviceChartProps {
  data: Record<string, number>; // { mobile: 10, desktop: 5, tablet: 2 }
}

export default function DeviceChart({ data }: DeviceChartProps) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No device data available</h3>
          <p className="text-sm text-gray-600 mb-1">
            Device information will appear once visitors start scanning your QR codes.
          </p>
          <p className="text-xs text-gray-500">
            Track whether visitors use mobile, desktop, or tablet devices.
          </p>
        </div>
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

