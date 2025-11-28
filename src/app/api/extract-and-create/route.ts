import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractListingData } from '@/lib/extract';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { checkUserAccess } from '@/lib/subscription/access';
import { checkTrialLimit } from '@/lib/subscription/limits';
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

    // Check access
    const access = await checkUserAccess(user.id);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: 'Subscription required. Please upgrade to create listings.' },
        { status: 403 }
      );
    }

    // All limits removed - unlimited listings for all users

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Extract listing data
    const extractionResult = await extractListingData(url);

    if (!extractionResult.success || !extractionResult.data) {
      return NextResponse.json(
        {
          error:
            extractionResult.error ||
            'Could not extract listing data. Please try manual entry.',
        },
        { status: 400 }
      );
    }

    const extracted = extractionResult.data;

    // Validate we have at least an address
    if (!extracted.address || extracted.address.trim() === '') {
      return NextResponse.json(
        { error: 'Could not extract address from listing. Please try manual entry.' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(
      extracted.address,
      async (slugToCheck) => {
        const { data } = await supabase
          .from('listings')
          .select('id')
          .eq('slug', slugToCheck)
          .single();
        return !!data;
      }
    );

    // Create listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        address: extracted.address,
        city: extracted.city || null,
        state: extracted.state || null,
        zip: extracted.zip || null,
        price: extracted.price ? parseFloat(extracted.price.replace(/[^0-9.]/g, '')) : null,
        description: extracted.description || null,
        // Store imageUrls array as JSON string, or single imageUrl as string
        image_url: extracted.imageUrls && extracted.imageUrls.length > 0 
          ? JSON.stringify(extracted.imageUrls)
          : (extracted.imageUrl || null),
        mls_id: extracted.mlsId || null,
        bedrooms: extracted.bedrooms ? parseInt(extracted.bedrooms, 10) : null,
        bathrooms: extracted.bathrooms ? parseFloat(extracted.bathrooms) : null,
        square_feet: extracted.squareFeet ? parseInt(extracted.squareFeet, 10) : null,
        url: extracted.url || null,
        property_type: extracted.propertyType || null,
        property_subtype: extracted.propertySubtype || null,
        year_built: extracted.yearBuilt ? parseInt(String(extracted.yearBuilt), 10) : null,
        lot_size: extracted.lotSize || null,
        features: extracted.features || null,
        interior_features: extracted.interiorFeatures || null,
        exterior_features: extracted.exteriorFeatures || null,
        parking_spaces: extracted.parkingSpaces ? parseInt(String(extracted.parkingSpaces), 10) : null,
        garage_spaces: extracted.garageSpaces ? parseInt(String(extracted.garageSpaces), 10) : null,
        stories: extracted.stories ? parseInt(String(extracted.stories), 10) : null,
        heating: extracted.heating || null,
        cooling: extracted.cooling || null,
        flooring: extracted.flooring || null,
        fireplace_count: extracted.fireplaceCount ? parseInt(String(extracted.fireplaceCount), 10) : null,
        hoa_fee: extracted.hoaFee ? parseFloat(String(extracted.hoaFee)) : null,
        tax_assessed_value: extracted.taxAssessedValue ? parseFloat(String(extracted.taxAssessedValue)) : null,
        annual_tax_amount: extracted.annualTaxAmount ? parseFloat(String(extracted.annualTaxAmount)) : null,
        price_per_sqft: extracted.pricePerSqft ? parseFloat(String(extracted.pricePerSqft)) : null,
        zestimate: extracted.zestimate ? parseFloat(String(extracted.zestimate)) : null,
        days_on_market: extracted.daysOnMarket ? parseInt(String(extracted.daysOnMarket), 10) : null,
        listing_date: extracted.listingDate || null,
        status: 'active',
        slug,
      })
      .select()
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: listingError?.message || 'Failed to create listing' },
        { status: 500 }
      );
    }

    // Auto-generate QR code
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const scanUrl = `${siteUrl}/api/scan/qr/${listing.id}`;
      const finalRedirectUrl = `${siteUrl}/${slug}`;

      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(scanUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 500,
        margin: 2,
      });

      await supabase.from('qrcodes').insert({
        listing_id: listing.id,
        qr_url: qrDataUrl,
        redirect_url: finalRedirectUrl,
      });
    } catch (qrError) {
      console.error('Failed to auto-generate QR code:', qrError);
    }

    // Enhance listing with AI (async, non-blocking)
    enhanceListingWithAI({
      address: extracted.address,
      city: extracted.city,
      state: extracted.state,
      zip: extracted.zip,
      price: extracted.price ? parseFloat(extracted.price.replace(/[^0-9.]/g, '')) : null,
      bedrooms: extracted.bedrooms ? parseInt(extracted.bedrooms, 10) : null,
      bathrooms: extracted.bathrooms ? parseFloat(extracted.bathrooms) : null,
      square_feet: extracted.squareFeet ? parseInt(extracted.squareFeet, 10) : null,
      description: extracted.description,
      property_type: extracted.propertyType,
      property_subtype: extracted.propertySubtype,
      year_built: extracted.yearBuilt ? parseInt(String(extracted.yearBuilt), 10) : null,
      lot_size: extracted.lotSize,
      features: extracted.features,
      interior_features: extracted.interiorFeatures,
      exterior_features: extracted.exteriorFeatures,
      parking_spaces: extracted.parkingSpaces ? parseInt(String(extracted.parkingSpaces), 10) : null,
      garage_spaces: extracted.garageSpaces ? parseInt(String(extracted.garageSpaces), 10) : null,
      stories: extracted.stories ? parseInt(String(extracted.stories), 10) : null,
      heating: extracted.heating,
      cooling: extracted.cooling,
      flooring: extracted.flooring,
      fireplace_count: extracted.fireplaceCount ? parseInt(String(extracted.fireplaceCount), 10) : null,
      hoa_fee: extracted.hoaFee ? parseFloat(String(extracted.hoaFee)) : null,
      price_per_sqft: extracted.pricePerSqft ? parseFloat(String(extracted.pricePerSqft)) : null,
    } as ListingDataForAI)
      .then(async (aiEnhancements) => {
        await supabase
          .from('listings')
          .update(aiEnhancements)
          .eq('id', listing.id);
        console.log(`[AI Enhancement] Successfully enhanced listing ${listing.id}`);
      })
      .catch(async (aiError) => {
        console.error(`[AI Enhancement] Failed to enhance listing ${listing.id}:`, aiError);
        try {
          await supabase
            .from('listings')
            .update({
              ai_enhancement_status: 'failed',
              ai_enhanced_at: new Date().toISOString(),
            })
            .eq('id', listing.id);
        } catch (updateError: unknown) {
          console.error('[AI Enhancement] Failed to update status:', updateError);
        }
      });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const micrositeUrl = `${siteUrl}/${slug}`;

    return NextResponse.json({
      success: true,
      listingId: listing.id,
      micrositeUrl,
      qrUrl: `${siteUrl}/api/scan/qr/${listing.id}`,
      listing,
    });
  } catch (error: unknown) {
    console.error('Extract and create error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to extract and create listing';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

