import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
  } catch (error: any) {
    console.error('Listings fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch listings' },
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
    } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

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
        image_url: image_url || null,
        // Store multiple images as JSON in description or use image_url field
        // For now, we'll store the JSON array in image_url if image_urls is provided
        ...(image_urls ? { image_url: image_urls } : { image_url: image_url || null }),
        mls_id: mls_id || null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseFloat(bathrooms) : null,
        square_feet: square_feet ? parseInt(square_feet) : null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: listing });
  } catch (error: any) {
    console.error('Listing creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create listing' },
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
    const updateData: any = {};
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
  } catch (error: any) {
    console.error('Listing update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update listing' },
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
  } catch (error: any) {
    console.error('Listing deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete listing' },
      { status: 500 }
    );
  }
}


