import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper to detect device type from User-Agent
function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  }
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

// Helper to get session ID from cookie or generate one
function getSessionId(request: NextRequest): string {
  const sessionCookie = request.cookies.get('homeqr_session');
  if (sessionCookie?.value) {
    return sessionCookie.value;
  }
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: listingId } = await params;
    
    console.log('[QR Scan] ===== SCAN DETECTED =====');
    console.log('[QR Scan] Listing ID:', listingId);
    console.log('[QR Scan] URL:', request.url);
    console.log('[QR Scan] User-Agent:', request.headers.get('user-agent'));
    console.log('[QR Scan] Referer:', request.headers.get('referer'));
    
    // Extract tracking data
    const userAgent = request.headers.get('user-agent');
    const referrer = request.headers.get('referer') || request.headers.get('referrer') || 'direct';
    const deviceType = getDeviceType(userAgent);
    const timeOfDay = new Date().getHours();
    const sessionId = getSessionId(request);

    // Get listing to check for slug
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, slug')
      .eq('id', listingId)
      .single();
    
    if (listingError || !listing) {
      console.error('[QR Scan] Listing not found:', listingId, listingError);
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${siteUrl}/404`);
    }
    
    console.log('[QR Scan] Listing found:', listing.id, 'slug:', listing.slug);

    // Track scan session - use upsert to handle existing sessions
    const { data: existingSession, error: checkError } = await supabase
      .from('scan_sessions')
      .select('id, scan_count')
      .eq('listing_id', listingId)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existingSession) {
      // Update existing session
      const { error: updateError } = await supabase
        .from('scan_sessions')
        .update({
          scan_count: (existingSession.scan_count || 0) + 1,
          last_scan_at: new Date().toISOString(),
          device_type: deviceType,
          time_of_day: timeOfDay,
          referrer: referrer,
        })
        .eq('id', existingSession.id);
      
      if (updateError) {
        console.error('[QR Scan] Failed to update scan session:', updateError);
      } else {
        console.log('[QR Scan] Updated existing scan session:', existingSession.id);
      }
    } else {
      // Insert new session - use upsert to prevent duplicate key errors
      const { error: insertError } = await supabase
        .from('scan_sessions')
        .upsert({
          listing_id: listingId,
          session_id: sessionId,
          device_type: deviceType,
          time_of_day: timeOfDay,
          referrer: referrer,
          source: 'qr',
          scan_count: 1,
        }, {
          onConflict: 'listing_id,session_id',
          ignoreDuplicates: false,
        });
      
      if (insertError) {
        // If still fails, try to update (race condition)
        const { error: retryError } = await supabase
          .from('scan_sessions')
          .update({
            scan_count: 1,
            last_scan_at: new Date().toISOString(),
            device_type: deviceType,
            time_of_day: timeOfDay,
            referrer: referrer,
          })
          .eq('listing_id', listingId)
          .eq('session_id', sessionId);
        
        if (retryError) {
          console.error('[QR Scan] Failed to insert/update scan session:', insertError, retryError);
        } else {
          console.log('[QR Scan] Created/updated scan session via retry');
        }
      } else {
        console.log('[QR Scan] Created new scan session for listing:', listingId);
      }
    }

    // Get QR code record (for updating scan_count for backwards compatibility)
    const { data: qrCode, error: qrCodeError } = await supabase
      .from('qrcodes')
      .select('id, scan_count, listing_id')
      .eq('listing_id', listingId)
      .single();
    
    if (qrCodeError) {
      console.warn('[QR Scan] QR code not found in database (may be old QR code):', qrCodeError);
    } else {
      console.log('[QR Scan] Found QR code record:', qrCode.id, 'current scan count:', qrCode.scan_count);
    }

    // Update analytics regardless of whether QR code exists
    const today = new Date().toISOString().split('T')[0];
    
    // Get unique visitors count for today
    const { data: uniqueVisitorsData } = await supabase
      .from('scan_sessions')
      .select('session_id')
      .eq('listing_id', listingId)
      .gte('first_scan_at', `${today}T00:00:00Z`)
      .lt('first_scan_at', `${today}T23:59:59Z`);

    const uniqueVisitors = uniqueVisitorsData?.length || 0;

    // Update or create analytics record
    const { data: existingAnalytics, error: fetchError } = await supabase
      .from('analytics')
      .select('id, total_scans, unique_visitors')
      .eq('listing_id', listingId)
      .eq('date', today)
      .maybeSingle(); // Use maybeSingle() to avoid errors when no record exists

    if (existingAnalytics) {
      // Record exists, update it
      const newScanCount = (existingAnalytics.total_scans || 0) + 1;
      const { error: analyticsError } = await supabase
        .from('analytics')
        .update({
          total_scans: newScanCount,
          unique_visitors: uniqueVisitors,
        })
        .eq('id', existingAnalytics.id);
      
      if (analyticsError) {
        console.error('[QR Scan] Failed to update analytics:', analyticsError);
      } else {
        console.log(`[QR Scan] Updated analytics: ${newScanCount} scans, ${uniqueVisitors} unique visitors`);
      }
    } else {
      // No record exists, create one (but handle race condition if page view created it)
      const insertData: {
        listing_id: string;
        date: string;
        total_scans: number;
        unique_visitors: number;
        total_leads: number;
        page_views?: number;
      } = {
        listing_id: listingId,
        date: today,
        total_scans: 1,
        unique_visitors: uniqueVisitors,
        total_leads: 0,
      };
      
      // Try to include page_views if column exists
      const { error: insertError } = await supabase.from('analytics').insert({
        ...insertData,
        page_views: 0,
      });
      
      if (insertError) {
        // Check if it's a duplicate key error (race condition - page view created record between check and insert)
        if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
          console.log('[QR Scan] Analytics record created by page view, updating instead');
          // Record was created by page view, update it
          const { data: newRecord } = await supabase
            .from('analytics')
            .select('id, total_scans')
            .eq('listing_id', listingId)
            .eq('date', today)
            .maybeSingle();
          
          if (newRecord) {
            const newScanCount = (newRecord.total_scans || 0) + 1;
            const { error: updateError } = await supabase
              .from('analytics')
              .update({
                total_scans: newScanCount,
                unique_visitors: uniqueVisitors,
              })
              .eq('id', newRecord.id);
            
            if (updateError) {
              console.error('[QR Scan] Failed to update analytics after race condition:', updateError);
            } else {
              console.log(`[QR Scan] Updated analytics after race condition: ${newScanCount} scans, ${uniqueVisitors} unique visitors`);
            }
          }
        } else if (insertError.message?.includes('page_views')) {
          // Column doesn't exist, insert without it
          console.warn('[QR Scan] page_views column not found, inserting without it');
          const { error: retryError } = await supabase.from('analytics').insert(insertData);
          
          if (retryError) {
            // If still fails, might be duplicate key again
            if (retryError.code === '23505' || retryError.message?.includes('duplicate key')) {
              console.log('[QR Scan] Analytics record created by page view (retry), updating instead');
              const { data: newRecord } = await supabase
                .from('analytics')
                .select('id, total_scans')
                .eq('listing_id', listingId)
                .eq('date', today)
                .maybeSingle();
              
              if (newRecord) {
                const newScanCount = (newRecord.total_scans || 0) + 1;
                await supabase
                  .from('analytics')
                  .update({
                    total_scans: newScanCount,
                    unique_visitors: uniqueVisitors,
                  })
                  .eq('id', newRecord.id);
              }
            } else {
              console.error('[QR Scan] Failed to insert analytics:', retryError);
            }
          } else {
            console.log(`[QR Scan] Created new analytics record (without page_views): 1 scan, ${uniqueVisitors} unique visitors`);
          }
        } else {
          console.error('[QR Scan] Failed to insert analytics:', insertError);
        }
      } else {
        console.log(`[QR Scan] Created new analytics record: 1 scan, ${uniqueVisitors} unique visitors`);
      }
    }

    // Update QR code scan count if it exists
    if (qrCode) {
      const { error: qrUpdateError } = await supabase
        .from('qrcodes')
        .update({ scan_count: (qrCode.scan_count || 0) + 1 })
        .eq('id', qrCode.id);
      
      if (qrUpdateError) {
        console.error('[QR Scan] Failed to update QR code scan count:', qrUpdateError);
      } else {
        console.log('[QR Scan] Updated QR code scan count to:', (qrCode.scan_count || 0) + 1);
      }
    } else {
      console.log('[QR Scan] No QR code record found - scan still tracked in analytics');
    }

    // Set session cookie and redirect
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = listing?.slug 
      ? `${siteUrl}/${listing.slug}`
      : `${siteUrl}/listing/${listingId}`;
    
    console.log('[QR Scan] Redirecting to:', redirectUrl);
    console.log('[QR Scan] ===== SCAN TRACKING COMPLETE =====');
    
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('homeqr_session', sessionId, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
    });
    return response;
  } catch (error: unknown) {
    console.error('Scan tracking error:', error);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${siteUrl}/404`);
  }
}

