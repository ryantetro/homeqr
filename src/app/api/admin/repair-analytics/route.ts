import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin endpoint to repair analytics data by backfilling from scan_sessions
 * This should be called when analytics are out of sync
 */
export async function POST() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated (basic security)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Repair Analytics] Starting repair process...');

    // Get all scan sessions grouped by listing and date
    const { data: scanSessions, error: sessionsError } = await supabase
      .from('scan_sessions')
      .select('listing_id, first_scan_at, session_id, scan_count');

    if (sessionsError) {
      console.error('[Repair Analytics] Error fetching scan sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch scan sessions' }, { status: 500 });
    }

    // Group by listing_id and date
    const groupedData: Record<string, Record<string, {
      sessions: Set<string>;
      totalScans: number;
    }>> = {};

    scanSessions?.forEach((session) => {
      const date = new Date(session.first_scan_at).toISOString().split('T')[0];
      
      if (!groupedData[session.listing_id]) {
        groupedData[session.listing_id] = {};
      }
      
      if (!groupedData[session.listing_id][date]) {
        groupedData[session.listing_id][date] = {
          sessions: new Set(),
          totalScans: 0,
        };
      }
      
      groupedData[session.listing_id][date].sessions.add(session.session_id);
      groupedData[session.listing_id][date].totalScans += session.scan_count;
    });

    console.log('[Repair Analytics] Grouped data:', Object.keys(groupedData).length, 'listings');

    // Get all leads to count by listing and date
    const { data: leads } = await supabase
      .from('leads')
      .select('listing_id, created_at');

    const leadsByListingDate: Record<string, Record<string, number>> = {};
    leads?.forEach((lead) => {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      
      if (!leadsByListingDate[lead.listing_id]) {
        leadsByListingDate[lead.listing_id] = {};
      }
      
      leadsByListingDate[lead.listing_id][date] = 
        (leadsByListingDate[lead.listing_id][date] || 0) + 1;
    });

    // Upsert analytics records
    let updatedCount = 0;
    let createdCount = 0;

    for (const listingId of Object.keys(groupedData)) {
      for (const date of Object.keys(groupedData[listingId])) {
        const data = groupedData[listingId][date];
        const uniqueVisitors = data.sessions.size;
        const totalScans = data.totalScans;
        const totalLeads = leadsByListingDate[listingId]?.[date] || 0;

        // Check if record exists
        const { data: existing } = await supabase
          .from('analytics')
          .select('id, total_scans')
          .eq('listing_id', listingId)
          .eq('date', date)
          .single();

        if (existing) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('analytics')
            .update({
              total_scans: totalScans,
              unique_visitors: uniqueVisitors,
              total_leads: totalLeads,
              page_views: Math.max(totalScans, existing.total_scans || 0),
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error('[Repair Analytics] Error updating:', updateError);
          } else {
            updatedCount++;
          }
        } else {
          // Create new record
          const { error: insertError } = await supabase
            .from('analytics')
            .insert({
              listing_id: listingId,
              date: date,
              total_scans: totalScans,
              unique_visitors: uniqueVisitors,
              total_leads: totalLeads,
              page_views: totalScans,
            });

          if (insertError) {
            console.error('[Repair Analytics] Error inserting:', insertError);
          } else {
            createdCount++;
          }
        }
      }
    }

    console.log('[Repair Analytics] Completed:', {
      created: createdCount,
      updated: updatedCount,
    });

    return NextResponse.json({
      success: true,
      message: 'Analytics repaired successfully',
      stats: {
        listingsProcessed: Object.keys(groupedData).length,
        recordsCreated: createdCount,
        recordsUpdated: updatedCount,
      },
    });
  } catch (error) {
    console.error('[Repair Analytics] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to repair analytics' },
      { status: 500 }
    );
  }
}

