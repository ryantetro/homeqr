import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listing_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Get all listings for the user
    const { data: listings } = await supabase
      .from('listings')
      .select('id')
      .eq('user_id', user.id);

    if (!listings || listings.length === 0) {
      return NextResponse.json({
        analytics: [],
        deviceBreakdown: {},
        timeOfDayData: [],
        topPerformers: [],
      });
    }

    const listingIds = listings.map((l) => l.id);
    const filterListingIds = listingId
      ? listingIds.filter((id) => id === listingId)
      : listingIds;

    // Get analytics data
    let analyticsQuery = supabase
      .from('analytics')
      .select('*')
      .in('listing_id', filterListingIds)
      .order('date', { ascending: true });

    if (startDate) {
      analyticsQuery = analyticsQuery.gte('date', startDate);
    }
    if (endDate) {
      analyticsQuery = analyticsQuery.lte('date', endDate);
    }

    const { data: analytics } = await analyticsQuery;

    // Get device breakdown from scan_sessions
    const { data: scanSessions } = await supabase
      .from('scan_sessions')
      .select('device_type, listing_id')
      .in('listing_id', filterListingIds);

    const deviceBreakdown: Record<string, number> = {};
    scanSessions?.forEach((session) => {
      const device = session.device_type || 'unknown';
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    });

    // Get time of day data
    const { data: timeSessions } = await supabase
      .from('scan_sessions')
      .select('time_of_day, listing_id')
      .in('listing_id', filterListingIds)
      .not('time_of_day', 'is', null);

    const timeOfDayData: number[] = new Array(24).fill(0);
    timeSessions?.forEach((session) => {
      const hour = session.time_of_day;
      if (hour !== null && hour >= 0 && hour < 24) {
        timeOfDayData[hour] = (timeOfDayData[hour] || 0) + 1;
      }
    });

    // Get top performers (listings with highest conversion rates)
    const { data: allListings } = await supabase
      .from('listings')
      .select('id, address, city, state')
      .in('id', filterListingIds);

    const topPerformers = await Promise.all(
      (allListings || []).map(async (listing) => {
        const { data: listingAnalytics } = await supabase
          .from('analytics')
          .select('total_scans, total_leads')
          .eq('listing_id', listing.id);

        const totalScans =
          listingAnalytics?.reduce((sum, a) => sum + a.total_scans, 0) || 0;
        const totalLeads =
          listingAnalytics?.reduce((sum, a) => sum + a.total_leads, 0) || 0;
        const conversionRate =
          totalScans > 0 ? (totalLeads / totalScans) * 100 : 0;

        return {
          listing_id: listing.id,
          address: listing.address,
          city: listing.city,
          state: listing.state,
          total_scans: totalScans,
          total_leads: totalLeads,
          conversion_rate: conversionRate,
        };
      })
    );

    topPerformers.sort((a, b) => b.conversion_rate - a.conversion_rate);

    return NextResponse.json({
      analytics: analytics || [],
      deviceBreakdown,
      timeOfDayData,
      topPerformers: topPerformers.slice(0, 10), // Top 10
    });
  } catch (error: unknown) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

