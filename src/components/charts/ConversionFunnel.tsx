'use client';

interface ConversionFunnelProps {
  scans: number;
  pageViews: number;
  uniqueVisitors: number;
  leads: number;
}

export default function ConversionFunnel({
  scans,
  pageViews,
  uniqueVisitors,
  leads,
}: ConversionFunnelProps) {
  const totalTraffic = Math.max(scans, uniqueVisitors, pageViews);
  const scanToLeadRate = scans > 0 ? (leads / scans) * 100 : 0;
  const viewToLeadRate = pageViews > 0 ? (leads / pageViews) * 100 : 0;
  const overallConversion = totalTraffic > 0 ? (leads / totalTraffic) * 100 : 0;

  const stages = [
    {
      label: 'Total Traffic',
      value: totalTraffic,
      percentage: 100,
      color: '#3b82f6',
      icon: '👥',
      description: 'All visitors who reached your listings',
    },
    {
      label: 'Unique Visitors',
      value: uniqueVisitors,
      percentage: totalTraffic > 0 ? (uniqueVisitors / totalTraffic) * 100 : 0,
      color: '#a855f7',
      icon: '👤',
      description: 'Individual people who viewed your content',
    },
    {
      label: 'Leads Generated',
      value: leads,
      percentage: totalTraffic > 0 ? (leads / totalTraffic) * 100 : 0,
      color: '#10b981',
      icon: '🎯',
      description: 'Visitors who submitted their contact info',
    },
  ];

  if (totalTraffic === 0) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No conversion data available yet</p>
          <p className="text-gray-400 text-xs mt-1">Start tracking to see your funnel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-4">
      {/* Funnel Stages */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const dropoff = index > 0 
            ? ((stages[index - 1].value - stage.value) / stages[index - 1].value * 100).toFixed(1)
            : null;
          
          return (
            <div key={stage.label} className="relative">
              {/* Funnel Stage */}
              <div 
                className="relative group cursor-pointer transition-all duration-300 hover:scale-[1.01]"
                style={{
                  width: `${Math.max(stage.percentage, 15)}%`,
                  marginLeft: `${(100 - Math.max(stage.percentage, 15)) / 2}%`,
                }}
              >
                {/* Main Funnel Bar */}
                <div 
                  className="relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${stage.color}15 0%, ${stage.color}25 100%)`,
                    border: `2px solid ${stage.color}40`,
                  }}
                >
                  {/* Animated gradient overlay on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${stage.color}25 0%, ${stage.color}35 100%)`,
                    }}
                  />
                  
                  {/* Content */}
                  <div className="relative px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{stage.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{stage.label}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {stage.percentage.toFixed(1)}% of traffic
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">{stage.value}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stage.value === 1 ? 'visitor' : 'visitors'}
                      </p>
                    </div>
                  </div>

                  {/* Progress indicator at bottom */}
                  <div className="h-1.5 w-full" style={{ backgroundColor: `${stage.color}15` }}>
                    <div 
                      className="h-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${stage.percentage}%`,
                        background: `linear-gradient(90deg, ${stage.color} 0%, ${stage.color}cc 100%)`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Drop-off indicator between stages */}
              {dropoff && parseFloat(dropoff) > 0 && (
                <div className="flex items-center justify-center py-2.5">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full shadow-sm">
                    <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="text-xs font-semibold text-red-700">
                      {dropoff}% drop-off
                    </span>
                    <span className="text-xs text-red-600">
                      ({stages[index - 1].value - stage.value} lost)
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats - Conversion Metrics */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Conversion Metrics
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="relative overflow-hidden text-center p-4 bg-linear-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-xs font-medium text-gray-600 mb-2">QR Scan Rate</p>
            <p className="text-2xl font-bold text-blue-600">
              {scanToLeadRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {leads} from {scans} scans
            </p>
          </div>
          <div className="relative overflow-hidden text-center p-4 bg-linear-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-xs font-medium text-gray-600 mb-2">Page View Rate</p>
            <p className="text-2xl font-bold text-purple-600">
              {viewToLeadRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {leads} from {pageViews} views
            </p>
          </div>
          <div className="relative overflow-hidden text-center p-4 bg-linear-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-xs font-medium text-gray-600 mb-2">Overall Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {overallConversion.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {leads} total leads
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
