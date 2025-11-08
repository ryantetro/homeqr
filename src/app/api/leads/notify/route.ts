import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { lead_id, listing_id } = body;

    if (!lead_id || !listing_id) {
      return NextResponse.json(
        { error: 'lead_id and listing_id are required' },
        { status: 400 }
      );
    }

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*, users:user_id (email, full_name)')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const agent = listing.users as { email: string | null; full_name: string | null } | null;

    if (!agent?.email) {
      return NextResponse.json(
        { error: 'Agent email not found' },
        { status: 404 }
      );
    }

    // For now, we'll log the notification
    // In production, integrate with Resend, SendGrid, or Supabase Edge Functions
    console.log('📧 New Lead Notification:', {
      to: agent.email,
      agentName: agent.full_name,
      leadName: lead.name,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      propertyAddress: listing.address,
      propertyPrice: listing.price,
      source: lead.source,
      listingUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/listings/${listing_id}`,
    });

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'HomeQR <noreply@homeqr.com>',
    //   to: agent.email,
    //   subject: `New Lead: ${lead.name} - ${listing.address}`,
    //   html: emailTemplate(lead, listing, agent),
    // });

    return NextResponse.json({ success: true, sent: false });
  } catch (error: unknown) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send notification' },
      { status: 500 }
    );
  }
}

