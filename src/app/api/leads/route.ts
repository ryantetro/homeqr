import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        listing_id,
        name,
        email: email || null,
        phone: phone || null,
        message: message || null,
        source: 'qr_scan',
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



