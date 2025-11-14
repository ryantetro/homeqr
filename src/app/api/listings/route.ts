import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { checkUserAccess } from '@/lib/subscription/access';
import { checkTrialLimit } from '@/lib/subscription/limits';

export async function GET(request: NextRequest) {
  try {
    // Support both cookie-based and Bearer token authentication
    let supabase = await createClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    // If no user from cookies, try Bearer token (for extension requests)
    if (!user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Verify token and get user
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const tokenSupabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        );
        const { data: { user: tokenUser }, error: tokenError } = await tokenSupabase.auth.getUser(token);
        if (tokenUser && !tokenError) {
          user = tokenUser;
          supabase = tokenSupabase;
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { data: listings, error } = await supabase
      .from('listings')
      .select('*, qrcodes(id, qr_url, scan_count)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    return NextResponse.json({
      data: listings || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: unknown) {
    console.error('Listings fetch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch listings';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

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
      console.log(`[Access Denied] User ${user.id} attempted to create listing. Reason: ${access.reason}`);
      return NextResponse.json(
        { error: 'Subscription required. Please upgrade to create listings.' },
        { status: 403 }
      );
    }

    // Check trial limits if user is in trial
    if (access.reason === 'trial') {
      const limitCheck = await checkTrialLimit(user.id, 'listings');
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: `Trial limit reached. You've created ${limitCheck.current}/${limitCheck.limit} listings. Upgrade to create unlimited listings.`,
            limit: limitCheck.limit,
            current: limitCheck.current,
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      address,
      city,
      state,
      zip,
      price,
      description,
      image_url,
      image_urls, // JSON string array of all images
      mls_id,
      bedrooms,
      bathrooms,
      square_feet,
      url, // Original listing URL
      // Additional property details
      property_type,
      property_subtype,
      year_built,
      lot_size,
      features,
      interior_features,
      exterior_features,
      parking_spaces,
      garage_spaces,
      stories,
      heating,
      cooling,
      flooring,
      fireplace_count,
      hoa_fee,
      tax_assessed_value,
      annual_tax_amount,
      price_per_sqft,
      zestimate,
      days_on_market,
      listing_date,
    } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Generate unique slug from address
    const slug = await generateUniqueSlug(
      address,
      async (slugToCheck) => {
        const { data } = await supabase
          .from('listings')
          .select('id')
          .eq('slug', slugToCheck)
          .single();
        return !!data;
      }
    );

    // Create listing with slug
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        address,
        city: city || null,
        state: state || null,
        zip: zip || null,
        price: price ? parseFloat(price) : null,
        description: description || null,
        // Store multiple images as JSON array if image_urls is provided, otherwise use single image_url
        image_url: image_urls ? image_urls : (image_url || null),
        mls_id: mls_id || null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseFloat(bathrooms) : null,
        square_feet: square_feet ? parseInt(square_feet) : null,
        url: url || null,
        // Additional property details
        property_type: property_type || null,
        property_subtype: property_subtype || null,
        year_built: year_built ? parseInt(String(year_built)) : null,
        lot_size: lot_size || null,
        features: features || null,
        interior_features: interior_features || null,
        exterior_features: exterior_features || null,
        parking_spaces: parking_spaces ? parseInt(String(parking_spaces)) : null,
        garage_spaces: garage_spaces ? parseInt(String(garage_spaces)) : null,
        stories: stories ? parseInt(String(stories)) : null,
        heating: heating || null,
        cooling: cooling || null,
        flooring: flooring || null,
        fireplace_count: fireplace_count ? parseInt(String(fireplace_count)) : null,
        hoa_fee: hoa_fee ? parseFloat(String(hoa_fee)) : null,
        tax_assessed_value: tax_assessed_value ? parseFloat(String(tax_assessed_value)) : null,
        annual_tax_amount: annual_tax_amount ? parseFloat(String(annual_tax_amount)) : null,
        price_per_sqft: price_per_sqft ? parseFloat(String(price_per_sqft)) : null,
        zestimate: zestimate ? parseFloat(String(zestimate)) : null,
        days_on_market: days_on_market ? parseInt(String(days_on_market)) : null,
        listing_date: listing_date || null,
        status: 'active',
        slug,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-generate QR code for the new listing
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const scanUrl = `${siteUrl}/api/scan/qr/${listing.id}`;
      const finalRedirectUrl = `${siteUrl}/${slug}`;

      // Import QRCode dynamically to avoid loading it on every request
      const QRCode = (await import('qrcode')).default;
      const qrDataUrl = await QRCode.toDataURL(scanUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 500,
        margin: 2,
      });

      // Create QR code record
      await supabase
        .from('qrcodes')
        .insert({
          listing_id: listing.id,
          qr_url: qrDataUrl,
          redirect_url: finalRedirectUrl,
        });
    } catch (qrError) {
      // Log error but don't fail listing creation
      console.error('Failed to auto-generate QR code:', qrError);
    }

    return NextResponse.json({ data: listing });
  } catch (error: unknown) {
    console.error('Listing creation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create listing';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
      console.log(`[Access Denied] User ${user.id} attempted to update listing. Reason: ${access.reason}`);
      return NextResponse.json(
        { error: 'Subscription required. Please upgrade to update listings.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Verify listing belongs to user
    const { data: existingListing } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      address?: string;
      city?: string | null;
      state?: string | null;
      zip?: string | null;
      price?: number | null;
      description?: string | null;
      image_url?: string | null;
      mls_id?: string | null;
      bedrooms?: number | null;
      bathrooms?: number | null;
      square_feet?: number | null;
    } = {};
    if (updates.address) updateData.address = updates.address;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.zip !== undefined) updateData.zip = updates.zip;
    if (updates.price !== undefined) updateData.price = updates.price ? parseFloat(updates.price) : null;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.image_url !== undefined) updateData.image_url = updates.image_url;
    if (updates.mls_id !== undefined) updateData.mls_id = updates.mls_id;
    if (updates.bedrooms !== undefined) updateData.bedrooms = updates.bedrooms ? parseInt(updates.bedrooms) : null;
    if (updates.bathrooms !== undefined) updateData.bathrooms = updates.bathrooms ? parseFloat(updates.bathrooms) : null;
    if (updates.square_feet !== undefined) updateData.square_feet = updates.square_feet ? parseInt(updates.square_feet) : null;

    const { data: listing, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: listing });
  } catch (error: unknown) {
    console.error('Listing update error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update listing';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
      console.log(`[Access Denied] User ${user.id} attempted to delete listing. Reason: ${access.reason}`);
      return NextResponse.json(
        { error: 'Subscription required. Please upgrade to manage listings.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Verify listing belongs to user
    const { data: existingListing } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Soft delete by setting status to 'deleted'
    const { error } = await supabase
      .from('listings')
      .update({ status: 'deleted' })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Listing deleted successfully' });
  } catch (error: unknown) {
    console.error('Listing deletion error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete listing';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}


