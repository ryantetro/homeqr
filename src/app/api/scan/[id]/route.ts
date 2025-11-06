import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const qrId = params.id;

    // Handle QR code scan by listing_id (for direct scans)
    if (qrId.startsWith('qr/')) {
      const listingId = qrId.replace('qr/', '');
      
      // Increment scan count for the QR code
      const { data: qrCode } = await supabase
        .from('qrcodes')
        .select('id, scan_count, listing_id')
        .eq('listing_id', listingId)
        .single();

      if (qrCode) {
        await supabase
          .from('qrcodes')
          .update({ scan_count: qrCode.scan_count + 1 })
          .eq('id', qrCode.id);

        // Update analytics
        const today = new Date().toISOString().split('T')[0];
        const { data: existingAnalytics } = await supabase
          .from('analytics')
          .select('id, total_scans')
          .eq('listing_id', listingId)
          .eq('date', today)
          .single();

        if (existingAnalytics) {
          await supabase
            .from('analytics')
            .update({ total_scans: existingAnalytics.total_scans + 1 })
            .eq('id', existingAnalytics.id);
        } else {
          await supabase.from('analytics').insert({
            listing_id: listingId,
            date: today,
            total_scans: 1,
          });
        }
      }

      return NextResponse.redirect(
        new URL(`/listing/${listingId}`, request.url)
      );
    }

    // Handle QR code scan by QR code ID
    const { data: qrCode, error } = await supabase
      .from('qrcodes')
      .select('id, listing_id, scan_count, redirect_url')
      .eq('id', qrId)
      .single();

    if (error || !qrCode) {
      return NextResponse.redirect(new URL('/404', request.url));
    }

    // Increment scan count
    await supabase
      .from('qrcodes')
      .update({ scan_count: qrCode.scan_count + 1 })
      .eq('id', qrCode.id);

    // Update analytics
    const today = new Date().toISOString().split('T')[0];
    const { data: existingAnalytics } = await supabase
      .from('analytics')
      .select('id, total_scans')
      .eq('listing_id', qrCode.listing_id)
      .eq('date', today)
      .single();

    if (existingAnalytics) {
      await supabase
        .from('analytics')
        .update({ total_scans: existingAnalytics.total_scans + 1 })
        .eq('id', existingAnalytics.id);
    } else {
      await supabase.from('analytics').insert({
        listing_id: qrCode.listing_id,
        date: today,
        total_scans: 1,
      });
    }

    // Redirect to listing page
    const redirectUrl = qrCode.redirect_url || `/listing/${qrCode.listing_id}`;
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error: any) {
    console.error('Scan tracking error:', error);
    return NextResponse.redirect(new URL('/404', request.url));
  }
}


