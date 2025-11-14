import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import QRCode from 'qrcode';
import { checkUserAccess } from '@/lib/subscription/access';
import { checkTrialLimit } from '@/lib/subscription/limits';

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
    const { listing_id, redirect_url } = body;

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 });
    }

    // Check access
    const access = await checkUserAccess(user.id);
    if (!access.hasAccess) {
      console.log(`[Access Denied] User ${user.id} attempted to generate QR code. Reason: ${access.reason}`);
      return NextResponse.json(
        { error: 'Subscription required. Please upgrade to generate QR codes.' },
        { status: 403 }
      );
    }

    // Check trial limits if user is in trial
    if (access.reason === 'trial') {
      const limitCheck = await checkTrialLimit(user.id, 'qr_codes');
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: `Trial limit reached. You've generated ${limitCheck.current}/${limitCheck.limit} QR codes. Upgrade to generate unlimited QR codes.`,
            limit: limitCheck.limit,
            current: limitCheck.current,
          },
          { status: 403 }
        );
      }
    }

    // Verify the listing belongs to the user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, slug')
      .eq('id', listing_id)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Generate redirect URL - use slug if available, otherwise fall back to ID
    // Use request host when available to ensure QR codes point to the same domain
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    try {
      const requestUrl = new URL(request.url);
      const host = request.headers.get('host') || requestUrl.host;
      if (host) {
        const protocol = requestUrl.protocol || 'http:';
        siteUrl = `${protocol}//${host}`;
      }
    } catch {
      // Fall back to NEXT_PUBLIC_SITE_URL if URL parsing fails
    }
    
    const scanUrl = redirect_url || `${siteUrl}/api/scan/qr/${listing_id}`;
    const finalRedirectUrl = listing.slug 
      ? `${siteUrl}/${listing.slug}`
      : `${siteUrl}/listing/${listing_id}`;

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(scanUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 500,
      margin: 2,
    });

    // Check if QR code already exists for this listing
    const { data: existingQR, error: existingQRError } = await supabase
      .from('qrcodes')
      .select('id, qr_url, scan_count, redirect_url, listing_id')
      .eq('listing_id', listing_id)
      .single();

    let qrData;
    let isNewQR = false;

    if (existingQR && !existingQRError) {
      // Update existing QR code with new URL and image
      const { data, error } = await supabase
        .from('qrcodes')
        .update({
          qr_url: qrDataUrl,
          redirect_url: finalRedirectUrl,
        })
        .eq('id', existingQR.id)
        .select()
        .single();

      if (error) throw error;
      qrData = data;
    } else {
      // Create new QR code
      const { data, error } = await supabase
        .from('qrcodes')
        .insert({
          listing_id,
          qr_url: qrDataUrl,
          redirect_url: finalRedirectUrl,
        })
        .select()
        .single();

      if (error) throw error;
      qrData = data;
      isNewQR = true;
    }

    return NextResponse.json({
      id: qrData.id,
      qr_url: qrData.qr_url,
      listing_id: qrData.listing_id,
      scan_count: qrData.scan_count || 0,
      redirect_url: qrData.redirect_url,
      message: isNewQR ? 'QR code generated successfully!' : 'QR code regenerated successfully!',
      isExisting: !isNewQR,
    });
  } catch (error: unknown) {
    console.error('QR generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate QR code';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}


