import { createClient } from '@/lib/supabase/server';
import { calculateConversionRate } from '@/lib/utils/analytics';
import ScanChart from '@/components/charts/ScanChart';
import ConversionChart from '@/components/charts/ConversionChart';
import TimeOfDayChart from '@/components/charts/TimeOfDayChart';
import DeviceChart from '@/components/charts/DeviceChart';
import LeadSourceChart from '@/components/charts/LeadSourceChart';
import ConversionFunnel from '@/components/charts/ConversionFunnel';
import ComparisonChart from '@/components/charts/ComparisonChart';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import TopPerformingProperties from '@/components/dashboard/TopPerformingProperties';
import Card from '@/components/ui/Card';
import { formatDate } from '@/lib/utils/format';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's listings
  const { data: listings } = await supabase
    .from('listings')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const listingIds = listings?.map((l) => l.id) || [];

  // Get analytics data for the last 30 days (or all time if less than 30 days of data)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get ALL analytics data (not just last 30 days) to show complete picture
  const { data: analytics } = await supabase
    .from('analytics')
    .select('*')
    .in('listing_id', listingIds)
    .order('date', { ascending: true });


  // Get all scan sessions for detailed tracking
  const { data: allScanSessions } = await supabase
    .from('scan_sessions')
    .select('*')
    .in('listing_id', listingIds);

  // Debug: Show which listings have scan sessions
  const scanSessionsByListing = allScanSessions?.reduce((acc, session) => {
    acc[session.listing_id] = (acc[session.listing_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Debug: Show which listings have scan sessions but NO analytics
  const listingsWithScanSessionsButNoAnalytics = Object.keys(scanSessionsByListing || {}).filter(
    listingId => !analytics?.some(a => a.listing_id === listingId)
  );
  
  // Only log if there are issues
  if (listingsWithScanSessionsButNoAnalytics.length > 0) {
    console.warn('[Analytics Page] Listings with scan sessions BUT NO analytics records:', 
      listingsWithScanSessionsButNoAnalytics.length,
      listingsWithScanSessionsButNoAnalytics
    );
  }

  // Build traffic source breakdown (visits + leads)
  const trafficSourceBreakdown: Record<string, { visits: number; leads: number }> = {
    qr_scan: { visits: 0, leads: 0 },
    direct: { visits: 0, leads: 0 },
  };

  // Count visits from scan sessions
  // QR Scan: User scanned the QR code (source = 'qr')
  // Direct: User visited the microsite URL directly (clicked a link, typed URL, etc.)
  allScanSessions?.forEach((session) => {
    const source = session.source === 'qr' ? 'qr_scan' : 'direct';
    trafficSourceBreakdown[source].visits += 1;
  });

  // Aggregate data by date
  const chartData: Record<string, { scans: number; leads: number; pageViews: number }> = {};
  
  analytics?.forEach((item) => {
    const date = item.date;
    if (!chartData[date]) {
      chartData[date] = { scans: 0, leads: 0, pageViews: 0 };
    }
    chartData[date].scans += item.total_scans || 0;
    chartData[date].leads += item.total_leads || 0;
    chartData[date].pageViews += item.page_views || 0;
  });

  // Fill in missing dates for the last 30 days to show complete timeline
  const last30Days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last30Days.push(date.toISOString().split('T')[0]);
  }

  // Ensure we have data for all last 30 days (even if 0)
  last30Days.forEach((date) => {
    if (!chartData[date]) {
      chartData[date] = { scans: 0, leads: 0, pageViews: 0 };
    }
  });

  const chartDataArray = Object.entries(chartData)
    .filter(([date]) => last30Days.includes(date)) // Only show last 30 days in chart
    .map(([date, values]) => ({
      date: formatDate(date),
      scans: values.scans,
      leads: values.leads,
      pageViews: values.pageViews,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate overall totals (from ALL time, not just last 30 days)
  // Analytics is the SINGLE source of truth - no fallback to qrcodes
  const totalScans = analytics?.reduce((sum, a) => sum + (a.total_scans || 0), 0) || 0;
  const totalLeads = analytics?.reduce((sum, a) => sum + (a.total_leads || 0), 0) || 0;
  const totalPageViews = analytics?.reduce((sum, a) => sum + (a.page_views || 0), 0) || 0;
  const totalUniqueVisitors = new Set(allScanSessions?.map((s) => s.session_id) || []).size;

  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics Page] Total Scans:', totalScans, 'Total Leads:', totalLeads);
  }
  
  // Calculate conversion rates - QR scan conversion and overall conversion
  const qrScanConversionRate = calculateConversionRate(totalScans, totalLeads);
  const overallConversionRate = calculateConversionRate(totalScans, totalLeads, {
    includePageViews: true,
    pageViews: totalPageViews,
  });

  // Get device breakdown from scan sessions
  const deviceBreakdown: Record<string, number> = {};
  allScanSessions?.forEach((session) => {
    const device = session.device_type || 'unknown';
    deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
  });

  // Get lead source breakdown
  const { data: allLeads } = await supabase
    .from('leads')
    .select('source')
    .in('listing_id', listingIds);

  // Count leads by source
  allLeads?.forEach((lead) => {
    const source = lead.source || 'direct';
    if (trafficSourceBreakdown[source]) {
      trafficSourceBreakdown[source].leads += 1;
    } else {
      trafficSourceBreakdown[source] = { visits: 0, leads: 1 };
    }
  });

  // Get time of day data from scan sessions
  const timeOfDayData: number[] = new Array(24).fill(0);
  allScanSessions?.forEach((session) => {
    const hour = session.time_of_day;
    if (hour !== null && hour >= 0 && hour < 24) {
      timeOfDayData[hour] = (timeOfDayData[hour] || 0) + 1;
    }
  });

  // Get top performers (listings with highest conversion rates)
  const { data: allListings } = await supabase
    .from('listings')
    .select('id, address, city, state')
    .in('id', listingIds);

  const topPerformers = await Promise.all(
    (allListings || []).map(async (listing) => {
      const { data: listingAnalytics } = await supabase
        .from('analytics')
        .select('total_scans, total_leads, page_views, date')
        .eq('listing_id', listing.id);

      // Debug logging removed - too verbose

      const listingScans =
        listingAnalytics?.reduce((sum, a) => sum + (a.total_scans || 0), 0) || 0;
      const listingLeads =
        listingAnalytics?.reduce((sum, a) => sum + (a.total_leads || 0), 0) || 0;
      const listingPageViews =
        listingAnalytics?.reduce((sum, a) => sum + (a.page_views || 0), 0) || 0;
      const listingConversionRate = calculateConversionRate(listingScans, listingLeads, {
        includePageViews: true,
        pageViews: listingPageViews,
      });

      return {
        listing_id: listing.id,
        address: listing.address,
        city: listing.city,
        state: listing.state,
        total_scans: listingScans,
        total_page_views: listingPageViews,
        total_leads: listingLeads,
        conversion_rate: listingConversionRate,
      };
    })
  );

  // Sort by: 1) Has activity, 2) Conversion rate, 3) Total traffic (scans + page views)
  topPerformers.sort((a, b) => {
    const aActivity = a.total_scans + a.total_page_views + a.total_leads;
    const bActivity = b.total_scans + b.total_page_views + b.total_leads;
    
    // First, prioritize properties with activity
    if (aActivity === 0 && bActivity > 0) return 1;
    if (bActivity === 0 && aActivity > 0) return -1;
    if (aActivity === 0 && bActivity === 0) return 0;
    
    // Then sort by conversion rate
    if (Math.abs(b.conversion_rate - a.conversion_rate) > 0.1) {
      return b.conversion_rate - a.conversion_rate;
    }
    
    // Finally, sort by total traffic (scans + page views) as tiebreaker
    const aTraffic = a.total_scans + a.total_page_views;
    const bTraffic = b.total_scans + b.total_page_views;
    return bTraffic - aTraffic;
  });

  // Debug logging removed - too verbose

  // Calculate comparison periods (this week vs last week)
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - (now.getDay() || 7) + 1); // Monday
  thisWeekStart.setHours(0, 0, 0, 0);
  
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  lastWeekEnd.setHours(23, 59, 59, 999);

  const thisWeekAnalytics = analytics?.filter((a) => {
    const date = new Date(a.date);
    return date >= thisWeekStart;
  }) || [];

  const lastWeekAnalytics = analytics?.filter((a) => {
    const date = new Date(a.date);
    return date >= lastWeekStart && date <= lastWeekEnd;
  }) || [];

  const thisWeekData = {
    scans: thisWeekAnalytics.reduce((sum, a) => sum + (a.total_scans || 0), 0),
    leads: thisWeekAnalytics.reduce((sum, a) => sum + (a.total_leads || 0), 0),
    pageViews: thisWeekAnalytics.reduce((sum, a) => sum + (a.page_views || 0), 0),
  };

  const lastWeekData = {
    scans: lastWeekAnalytics.reduce((sum, a) => sum + (a.total_scans || 0), 0),
    leads: lastWeekAnalytics.reduce((sum, a) => sum + (a.total_leads || 0), 0),
    pageViews: lastWeekAnalytics.reduce((sum, a) => sum + (a.page_views || 0), 0),
  };

  // Get geographic insights
  const { data: listingsWithLocation } = await supabase
    .from('listings')
    .select('id, city, state, price')
    .in('id', listingIds);

  const geographicInsights: Record<string, { scans: number; leads: number; listings: number }> = {};
  listingsWithLocation?.forEach((listing) => {
    const key = listing.city && listing.state 
      ? `${listing.city}, ${listing.state}` 
      : listing.state || 'Unknown';
    
    if (!geographicInsights[key]) {
      geographicInsights[key] = { scans: 0, leads: 0, listings: 0 };
    }
    geographicInsights[key].listings += 1;
    
    const listingAnalytics = analytics?.filter(a => a.listing_id === listing.id) || [];
    geographicInsights[key].scans += listingAnalytics.reduce((sum, a) => sum + (a.total_scans || 0), 0);
    geographicInsights[key].leads += listingAnalytics.reduce((sum, a) => sum + (a.total_leads || 0), 0);
  });

  // Debug logging removed - too verbose

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">
          Track your QR code scans and lead generation performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <Card className="bg-linear-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Conversion Rate</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {qrScanConversionRate.toFixed(1)}%
            </p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1 leading-tight">
              {totalLeads} leads / {totalScans} QR scans
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 leading-tight">
              Overall: {overallConversionRate.toFixed(1)}% ({totalLeads} / {totalScans + totalPageViews} total)
            </p>
          </div>
        </Card>
        <Card className="bg-linear-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-purple-500 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">QR Scans</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalScans}</p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1 leading-tight">Total QR code scans</p>
          </div>
        </Card>
        <Card className="bg-linear-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Page Views</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalPageViews}</p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1 leading-tight">Microsite visits</p>
          </div>
        </Card>
        <Card className="bg-linear-to-br from-green-50 to-green-100 border-green-200">
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Total Leads</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalLeads}</p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1 leading-tight">Captured contacts</p>
          </div>
        </Card>
        <Card className="bg-linear-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Unique Visitors</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalUniqueVisitors}</p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1 leading-tight">Distinct visitors</p>
          </div>
        </Card>
        <Card className="bg-linear-to-br from-gray-50 to-gray-100 border-gray-200">
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gray-500 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-700 leading-tight">Active Listings</p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {listingIds.length}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-1 leading-tight">Properties tracked</p>
          </div>
        </Card>
      </div>

      {/* Main Charts - Full Width for Conversion Rate */}
      <div className="mb-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Conversion Rate Over Time
            </h2>
            {chartDataArray.length > 0 ? (
              <ConversionChart data={chartDataArray} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Scans & Leads Chart - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Activity Over Time (Last 30 Days)
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600">QR Scans: {totalScans}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">Leads: {totalLeads}</span>
                  </div>
                </div>
              </div>
              {chartDataArray.length > 0 ? (
                <div className="-mx-2 -mb-2">
                  <ScanChart data={chartDataArray} />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data available yet. Start generating QR codes to see analytics.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 lg:space-y-0">
          <Card className="bg-linear-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">This Week</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{thisWeekData.scans}</p>
              <p className="text-[10px] sm:text-xs text-gray-600">QR scans</p>
              {lastWeekData.scans > 0 && (
                <div className="mt-2 flex items-center gap-1">
                  {thisWeekData.scans >= lastWeekData.scans ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  <span className={`text-xs font-semibold ${thisWeekData.scans >= lastWeekData.scans ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(thisWeekData.scans - lastWeekData.scans)} vs last week
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-linear-to-br from-green-50 to-green-100 border-green-200">
            <div className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">This Week</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{thisWeekData.leads}</p>
              <p className="text-[10px] sm:text-xs text-gray-600">New leads</p>
              {lastWeekData.leads > 0 && (
                <div className="mt-2 flex items-center gap-1">
                  {thisWeekData.leads >= lastWeekData.leads ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  <span className={`text-xs font-semibold ${thisWeekData.leads >= lastWeekData.leads ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(thisWeekData.leads - lastWeekData.leads)} vs last week
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-linear-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Avg. Daily</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {chartDataArray.length > 0 ? Math.round(totalScans / Math.min(chartDataArray.length, 30)) : 0}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600">Scans per day</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Conversion Funnel & Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Conversion Funnel
              </h2>
              <ConversionFunnel
                scans={totalScans}
                pageViews={totalPageViews}
                uniqueVisitors={totalUniqueVisitors}
                leads={totalLeads}
              />
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Traffic & Lead Sources
            </h2>
            <LeadSourceChart data={trafficSourceBreakdown} />
          </div>
        </Card>
      </div>

      {/* Device & Time of Day */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Device Types
            </h2>
            <DeviceChart data={deviceBreakdown} />
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                {Object.values(deviceBreakdown).reduce((sum, count) => sum + count, 0)} total sessions
              </p>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Activity by Time of Day
                </h2>
                <p className="text-sm text-gray-600">
                  Peak: {(() => {
                    const peakHour = timeOfDayData.reduce((maxIdx, val, idx, arr) => val > arr[maxIdx] ? idx : maxIdx, 0);
                    if (peakHour >= 0 && peakHour < 6) return 'Night';
                    if (peakHour >= 6 && peakHour < 12) return 'Morning';
                    if (peakHour >= 12 && peakHour < 18) return 'Afternoon';
                    return 'Evening';
                  })()}
                </p>
              </div>
              <TimeOfDayChart data={timeOfDayData} />
            </div>
          </Card>
        </div>
      </div>

      {/* Week-over-Week Comparison */}
      <Card className="mb-6">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Week-over-Week Performance
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
              <div>
                <span className="text-gray-600">This Week: </span>
                <span className="font-semibold text-gray-900">{thisWeekData.scans} scans</span>
              </div>
              <div>
                <span className="text-gray-600">Last Week: </span>
                <span className="font-semibold text-gray-900">{lastWeekData.scans} scans</span>
              </div>
              <div className={`font-semibold ${
                thisWeekData.scans >= lastWeekData.scans ? 'text-green-600' : 'text-red-600'
              }`}>
                {thisWeekData.scans >= lastWeekData.scans ? '↑' : '↓'} 
                {Math.abs(thisWeekData.scans - lastWeekData.scans)} scans
                {lastWeekData.scans > 0 && (
                  <span className="ml-1">
                    ({((thisWeekData.scans - lastWeekData.scans) / lastWeekData.scans * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          </div>
          <ComparisonChart
            currentPeriod={thisWeekData}
            previousPeriod={lastWeekData}
            periodType="week"
          />
        </div>
      </Card>

      {/* Performance by Location & Top Properties */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {Object.keys(geographicInsights).length > 0 && (
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">📍</span>
                <h2 className="text-lg font-semibold text-gray-900">
                  Performance by Location
                </h2>
              </div>
              <div className="space-y-3">
                {(() => {
                  const locationsWithActivity = Object.entries(geographicInsights)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    .filter(([_location, data]) => {
                      // Only show locations with actual activity
                      return (data.scans > 0 || data.leads > 0);
                    })
                    .sort((a, b) => {
                      // Deprioritize "Unknown" location
                      if (a[0] === 'Unknown' && b[0] !== 'Unknown') return 1;
                      if (b[0] === 'Unknown' && a[0] !== 'Unknown') return -1;
                      
                      // Sort by total activity (scans + leads)
                      const aActivity = a[1].scans + a[1].leads;
                      const bActivity = b[1].scans + b[1].leads;
                      
                      if (bActivity !== aActivity) {
                        return bActivity - aActivity;
                      }
                      
                      // Tiebreaker: sort by leads
                      return b[1].leads - a[1].leads;
                    })
                    .slice(0, 5);

                  if (locationsWithActivity.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <p className="text-gray-500 text-sm mb-2">No location data yet</p>
                        <p className="text-gray-400 text-xs">Activity will appear here once you have scans</p>
                      </div>
                    );
                  }

                  return locationsWithActivity.map(([location, data], index) => {
                    const conversionRate = calculateConversionRate(data.scans, data.leads);
                    const isTopPerformer = index === 0 && (data.scans > 0 || data.leads > 0);
                    
                    return (
                      <div
                        key={location}
                        className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                          isTopPerformer
                            ? 'border-green-300 bg-linear-to-br from-green-50 to-green-100'
                            : 'border-gray-200 bg-white hover:border-blue-200'
                        }`}
                      >
                        {isTopPerformer && (
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                            <span>🏆</span> #1
                          </div>
                        )}
                        
                        {/* Location Header */}
                        <div className="flex items-start justify-between mb-3">
                    <div>
                            <p className="font-semibold text-gray-900 text-base">{location}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {data.listings} {data.listings === 1 ? 'property' : 'properties'}
                            </p>
                          </div>
                          {conversionRate > 0 && (
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-600">{conversionRate.toFixed(1)}%</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Conversion</p>
                            </div>
                          )}
                        </div>

                        {/* Metrics Row */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 rounded-lg">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-sm font-semibold text-blue-900">{data.scans}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 rounded-lg">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm font-semibold text-green-900">{data.leads}</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">🏆</span>
              <h2 className="text-lg font-semibold text-gray-900">
                Top Performing Properties
              </h2>
            </div>
            <TopPerformingProperties performers={topPerformers} />
          </div>
        </Card>
      </div>

      {/* Recent Activity - Full Width */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">⚡</span>
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            <span className="ml-auto text-xs text-gray-500">Live updates</span>
          </div>
          <ActivityFeed />
        </div>
      </Card>
    </div>
  );
}



