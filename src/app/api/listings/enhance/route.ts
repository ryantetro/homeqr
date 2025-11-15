/**
 * API endpoint to manually re-enhance a listing with AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enhanceListingWithAI } from '@/lib/ai/enhance-listing';
import type { ListingDataForAI } from '@/types/ai';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Verify listing belongs to user
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Prepare listing data for AI enhancement
    const listingData: ListingDataForAI = {
      address: listing.address,
      city: listing.city,
      state: listing.state,
      zip: listing.zip,
      price: listing.price,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      square_feet: listing.square_feet,
      description: listing.description,
      property_type: listing.property_type,
      property_subtype: listing.property_subtype,
      year_built: listing.year_built,
      lot_size: listing.lot_size,
      features: listing.features,
      interior_features: listing.interior_features,
      exterior_features: listing.exterior_features,
      parking_spaces: listing.parking_spaces,
      garage_spaces: listing.garage_spaces,
      stories: listing.stories,
      heating: listing.heating,
      cooling: listing.cooling,
      flooring: listing.flooring,
      fireplace_count: listing.fireplace_count,
      hoa_fee: listing.hoa_fee,
      price_per_sqft: listing.price_per_sqft,
    };

    // Enhance with AI
    const aiEnhancements = await enhanceListingWithAI(listingData);

    // Update listing
    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update(aiEnhancements)
      .eq('id', listingId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: updatedListing,
      message: aiEnhancements.ai_enhancement_status === 'completed' 
        ? 'Listing enhanced successfully' 
        : 'AI enhancement failed',
    });
  } catch (error: unknown) {
    console.error('AI enhancement error:', error);
    const message = error instanceof Error ? error.message : 'Failed to enhance listing';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

