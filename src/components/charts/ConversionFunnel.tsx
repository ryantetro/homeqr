'use client';

import { useState, useEffect } from 'react';

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
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

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
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversion data available yet</h3>
          <p className="text-sm text-gray-600 mb-1">
            Start tracking traffic and capturing leads to see your conversion funnel.
          </p>
          <p className="text-xs text-gray-500">
            The funnel shows how visitors move from traffic to leads.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-4">
      {/* Funnel Stages */}
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const dropoff = index > 0 
            ? ((stages[index - 1].value - stage.value) / stages[index - 1].value * 100).toFixed(1)
            : null;
          
          // Calculate bar width for funnel effect - wider at top, narrower at bottom
          const barWidth = isDesktop ? Math.max(stage.percentage, 40) : 100;

          return (
            <div key={stage.label} className="relative w-full">
              {/* Funnel Stage Container - Centered */}
              <div className="flex justify-center w-full">
                <div 
                  className="relative group transition-all duration-300 hover:scale-[1.01] w-full max-w-3xl"
                >
                  {/* Main Funnel Bar - Centered with proper width */}
                  <div 
                    className="relative overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all"
                    style={{
                      width: isDesktop ? `${barWidth}%` : '100%',
                      marginLeft: isDesktop ? 'auto' : '0',
                      marginRight: isDesktop ? 'auto' : '0',
                      background: `linear-gradient(135deg, ${stage.color}08 0%, ${stage.color}15 100%)`,
                      border: `1.5px solid ${stage.color}30`,
                    }}
                  >
                    {/* Subtle gradient overlay on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${stage.color}12 0%, ${stage.color}20 100%)`,
                      }}
                    />
                    
                    {/* Content - Spread out layout (left text, right numbers) */}
                    <div className="relative px-5 sm:px-6 md:px-8 py-4 sm:py-5">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left Side - Icon, Label, Percentage */}
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <span className="text-xl sm:text-2xl shrink-0">{stage.icon}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">
                              {stage.label}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 leading-tight">
                              {stage.percentage.toFixed(1)}% of traffic
                            </p>
                          </div>
                        </div>
                        
                        {/* Right Side - Value */}
                        <div className="text-right shrink-0">
                          <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                            {stage.value}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-tight whitespace-nowrap">
                            {stage.value === 1 ? 'visitor' : 'visitors'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress indicator at bottom */}
                    <div className="h-1 w-full" style={{ backgroundColor: `${stage.color}10` }}>
                      <div 
                        className="h-full transition-all duration-700 ease-out"
                        style={{ 
                          width: `${stage.percentage}%`,
                          background: `linear-gradient(90deg, ${stage.color} 0%, ${stage.color}dd 100%)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Drop-off indicator between stages */}
              {dropoff && parseFloat(dropoff) > 0 && (
                <div className="flex items-center justify-center py-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full shadow-sm">
                    <svg className="w-3.5 h-3.5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="text-xs font-semibold text-red-700 whitespace-nowrap">
                      {dropoff}% drop-off
                    </span>
                    <span className="text-xs text-red-600 whitespace-nowrap">
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
