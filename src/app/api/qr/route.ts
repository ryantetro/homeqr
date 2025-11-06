import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import QRCode from 'qrcode';

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

    // Verify the listing belongs to the user
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', listing_id)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Generate redirect URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const scanUrl = redirect_url || `${siteUrl}/api/scan/qr/${listing_id}`;
    const finalRedirectUrl = `${siteUrl}/listing/${listing_id}`;

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
      // Return existing QR code without regenerating
      qrData = existingQR;
      return NextResponse.json({
        id: qrData.id,
        qr_url: qrData.qr_url,
        listing_id: listing_id, // Ensure listing_id is always included
        scan_count: qrData.scan_count,
        redirect_url: qrData.redirect_url,
        message: 'Using existing QR code for this listing.',
        isExisting: true,
      });
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
      scan_count: qrData.scan_count,
      redirect_url: qrData.redirect_url,
      message: 'QR code generated successfully!',
      isExisting: false,
    });
  } catch (error: any) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}


