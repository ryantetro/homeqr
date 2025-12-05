'use client';

import { useMemo } from 'react';

interface DeviceChartProps {
  data: Record<string, number>; // { mobile: 10, desktop: 5, tablet: 2 }
}

export default function DeviceChart({ data }: DeviceChartProps) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  const colors: Record<string, string> = {
    mobile: 'bg-blue-500',
    desktop: 'bg-purple-500',
    tablet: 'bg-pink-500',
    unknown: 'bg-gray-400',
  };

  const colorHex: Record<string, string> = {
    mobile: '#3b82f6',      // blue-500
    desktop: '#a855f7',     // purple-500
    tablet: '#ec4899',      // pink-500
    unknown: '#9ca3af',     // gray-400
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
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate performance insights
  const insights = useMemo(() => {
    const dominantDevice = entries[0];
    const secondDevice = entries[1];
    
    // Calculate diversity score (0-100, where 100 is perfectly balanced)
    const diversityScore = entries.length > 1
      ? 100 - Math.abs(dominantDevice.percentage - (secondDevice?.percentage || 0))
      : 0;
    
    // Determine distribution type
    const isMobileFirst = dominantDevice.device === 'mobile' && dominantDevice.percentage > 60;
    const isDesktopSignificant = entries.find(e => e.device === 'desktop')?.percentage || 0 > 40;
    const isBalanced = diversityScore > 30 && entries.length >= 2;
    const isVeryMobile = dominantDevice.device === 'mobile' && dominantDevice.percentage > 80;
    const hasTablet = entries.some(e => e.device === 'tablet');
    
    return {
      dominantDevice,
      secondDevice,
      diversityScore,
      isMobileFirst,
      isDesktopSignificant,
      isBalanced,
      isVeryMobile,
      hasTablet,
    };
  }, [entries]);

  // Generate actionable recommendation
  const recommendation = useMemo(() => {
    const { isMobileFirst, isDesktopSignificant, isBalanced, isVeryMobile, hasTablet, dominantDevice } = insights;

    if (isVeryMobile) {
      return {
        type: 'mobile-first',
        message: 'Mobile-first audience — prioritize mobile optimization for your listings',
        icon: '📱',
        color: 'blue',
      };
    }

    if (isMobileFirst) {
      return {
        type: 'mobile-optimize',
        message: 'Optimize for mobile — most visitors use mobile devices',
        icon: '📱',
        color: 'blue',
      };
    }

    if (isDesktopSignificant && dominantDevice.device === 'desktop') {
      return {
        type: 'desktop-important',
        message: 'Desktop users are important — ensure desktop experience is smooth',
        icon: '💻',
        color: 'purple',
      };
    }

    if (isBalanced) {
      return {
        type: 'multi-device',
        message: 'Great device diversity — ensure all devices work well',
        icon: '✨',
        color: 'green',
      };
    }

    if (hasTablet) {
      return {
        type: 'responsive',
        message: "Don't forget tablet users — ensure responsive design across all devices",
        icon: '📱',
        color: 'pink',
      };
    }

    // Default
    return {
      type: 'default',
      message: 'Monitor device usage to optimize your listings for your audience',
      icon: '📊',
      color: 'gray',
    };
  }, [insights]);

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
          <span className="text-sm font-medium text-gray-700">Total Sessions</span>
          <span className="text-lg font-bold text-gray-900">{total}</span>
        </div>
      </div>

      {/* Performance Insights & Recommendations */}
      {entries.length > 0 && (
        <div className="pt-4 border-t border-gray-200 space-y-3">
          {/* Performance Insights */}
          <div 
            className={`rounded-lg p-3 border ${
              insights.dominantDevice.device === 'mobile'
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
                : insights.dominantDevice.device === 'desktop'
                ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-100'
                : 'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-100'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">📊</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Device Insights</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Dominant Device:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-gray-900">
                        {labels[insights.dominantDevice.device] || insights.dominantDevice.device}
                      </span>
                      <span 
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{ 
                          backgroundColor: colorHex[insights.dominantDevice.device] || colorHex.unknown,
                        }}
                      >
                        {insights.dominantDevice.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {insights.isMobileFirst && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Distribution:</span>
                      <span className="text-xs font-semibold text-blue-700">Mobile-first</span>
                    </div>
                  )}
                  {insights.isBalanced && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Distribution:</span>
                      <span className="text-xs font-semibold text-green-700">Well-balanced</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Recommendation */}
          <div 
            className={`rounded-lg p-3 border ${
              recommendation.color === 'blue' 
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                : recommendation.color === 'green'
                ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                : recommendation.color === 'purple'
                ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
                : recommendation.color === 'pink'
                ? 'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200'
                : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{recommendation.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 mb-1">Recommendation</p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {recommendation.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

