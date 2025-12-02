import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch only AI enhancement fields for efficiency
    const { data: listing, error } = await supabase
      .from('listings')
      .select('id, ai_enhancement_status, ai_description, ai_key_features, ai_lifestyle_summary, ai_social_caption, ai_enhanced_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ai_enhancement_status: listing.ai_enhancement_status,
        ai_description: listing.ai_description,
        ai_key_features: listing.ai_key_features,
        ai_lifestyle_summary: listing.ai_lifestyle_summary,
        ai_social_caption: listing.ai_social_caption,
        ai_enhanced_at: listing.ai_enhanced_at,
      },
    });
  } catch (error: unknown) {
    console.error('Listing status fetch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch listing status';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}



