import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkUserAccess } from '@/lib/subscription/access';

const VALID_STATUSES = ['new', 'contacted', 'qualified', 'converted'];

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check access
    const access = await checkUserAccess(user.id);
    if (!access.hasAccess) {
      console.log(`[Access Denied] User ${user.id} attempted to update lead. Reason: ${access.reason}`);
      return NextResponse.json(
        { error: 'Subscription required. Please upgrade to manage leads.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { lead_id, status, lead_ids } = body;

    // Validate status
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Bulk update
    if (lead_ids && Array.isArray(lead_ids)) {
      // Verify user owns these leads
      const { data: userListings } = await supabase
        .from('listings')
        .select('id')
        .eq('user_id', user.id);

      const listingIds = userListings?.map((l) => l.id) || [];

      const { data: leads } = await supabase
        .from('leads')
        .select('listing_id')
        .in('id', lead_ids)
        .in('listing_id', listingIds);

      if (!leads || leads.length !== lead_ids.length) {
        return NextResponse.json(
          { error: 'Some leads not found or access denied' },
          { status: 403 }
        );
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update({ status: status || 'contacted' })
        .in('id', lead_ids);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update leads' },
          { status: 500 }
        );
      }

      return NextResponse.json({ updated: lead_ids.length });
    }

    // Single update
    if (lead_id && status) {
      // Verify user owns this lead
      const { data: userListings } = await supabase
        .from('listings')
        .select('id')
        .eq('user_id', user.id);

      const listingIds = userListings?.map((l) => l.id) || [];

      const { data: lead } = await supabase
        .from('leads')
        .select('listing_id')
        .eq('id', lead_id)
        .in('listing_id', listingIds)
        .single();

      if (!lead) {
        return NextResponse.json(
          { error: 'Lead not found or access denied' },
          { status: 403 }
        );
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', lead_id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update lead' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'lead_id and status, or lead_ids required' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('Lead update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update lead' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { listing_id, name, email, phone, message } = body;

    if (!listing_id || !name) {
      return NextResponse.json(
        { error: 'listing_id and name are required' },
        { status: 400 }
      );
    }

    // Verify listing exists
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Determine source from referrer or default
    const referer = request.headers.get('referer') || '';
    const source = referer.includes('/listing/') || referer.includes('/[slug]')
      ? 'microsite'
      : 'qr_scan';

    // Get session ID to find most recent scan timestamp
    const sessionCookie = request.cookies.get('homeqr_session');
    let scanTimestamp: string | undefined = undefined;
    
    if (sessionCookie?.value && source === 'qr_scan') {
      // Try to find the most recent scan for this session
      const { data: recentScan } = await supabase
        .from('scan_sessions')
        .select('first_scan_at, last_scan_at')
        .eq('listing_id', listing_id)
        .eq('session_id', sessionCookie.value)
        .order('first_scan_at', { ascending: false })
        .limit(1)
        .single();
      
      if (recentScan?.first_scan_at) {
        scanTimestamp = recentScan.first_scan_at;
      } else if (recentScan?.last_scan_at) {
        scanTimestamp = recentScan.last_scan_at;
      }
    }

    // Create lead (message is optional, can be used for scheduleTour preference)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        listing_id,
        name,
        email: email || null,
        phone: phone || null,
        message: message || null,
        source: source,
        status: 'new',
        scan_timestamp: scanTimestamp || new Date().toISOString(),
      })
      .select()
      .single();

    if (leadError) {
      console.error('Lead creation error:', leadError);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    // Update analytics
    const today = new Date().toISOString().split('T')[0];
    const { data: existingAnalytics } = await supabase
      .from('analytics')
      .select('id, total_leads')
      .eq('listing_id', listing_id)
      .eq('date', today)
      .single();

    if (existingAnalytics) {
      await supabase
        .from('analytics')
        .update({ total_leads: existingAnalytics.total_leads + 1 })
        .eq('id', existingAnalytics.id);
    } else {
      await supabase.from('analytics').insert({
        listing_id,
        date: today,
        total_leads: 1,
      });
    }

    // Send notification (non-blocking)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/leads/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          listing_id,
        }),
      }).catch((err) => {
        console.warn('Notification failed (non-blocking):', err);
      });
    } catch (err) {
      // Don't block lead creation if notification fails
      console.warn('Notification error (non-blocking):', err);
    }

    return NextResponse.json({
      id: lead.id,
      listing_id: lead.listing_id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      created_at: lead.created_at,
    });
  } catch (error: unknown) {
    console.error('Lead creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create lead' },
      { status: 500 }
    );
  }
}



