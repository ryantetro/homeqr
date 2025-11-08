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
  // Generate new session ID
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const qrId = params.id;
    
    console.log('[Scan] ===== OLD ROUTE SCAN DETECTED =====');
    console.log('[Scan] QR ID:', qrId);
    console.log('[Scan] URL:', request.url);
    console.log('[Scan] Note: This is the old scan route. Consider regenerating QR codes to use /api/scan/qr/[id]');
    
    // Extract tracking data
    const userAgent = request.headers.get('user-agent');
    const referrer = request.headers.get('referer') || request.headers.get('referrer') || 'direct';
    const deviceType = getDeviceType(userAgent);
    const timeOfDay = new Date().getHours();
    const sessionId = getSessionId(request);

    // Handle QR code scan by listing_id (for direct scans)
    if (qrId.startsWith('qr/')) {
      const listingId = qrId.replace('qr/', '');
      
      // Track scan session
      const { data: existingSession } = await supabase
        .from('scan_sessions')
        .select('id, scan_count')
        .eq('listing_id', listingId)
        .eq('session_id', sessionId)
        .single();

      if (existingSession) {
        // Update existing session
        await supabase
          .from('scan_sessions')
          .update({
            scan_count: existingSession.scan_count + 1,
            last_scan_at: new Date().toISOString(),
            device_type: deviceType,
            time_of_day: timeOfDay,
            referrer: referrer,
          })
          .eq('id', existingSession.id);
      } else {
        // Create new session (new unique visitor)
        await supabase.from('scan_sessions').insert({
          listing_id: listingId,
          session_id: sessionId,
          device_type: deviceType,
          time_of_day: timeOfDay,
          referrer: referrer,
        });
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
      const { data: existingAnalytics } = await supabase
        .from('analytics')
        .select('id, total_scans, unique_visitors')
        .eq('listing_id', listingId)
        .eq('date', today)
        .single();

      if (existingAnalytics) {
        const { error: analyticsError } = await supabase
          .from('analytics')
          .update({
            total_scans: (existingAnalytics.total_scans || 0) + 1,
            unique_visitors: uniqueVisitors,
          })
          .eq('id', existingAnalytics.id);
        
        if (analyticsError) {
          console.error('Failed to update analytics:', analyticsError);
        }
      } else {
        const { error: insertError } = await supabase.from('analytics').insert({
          listing_id: listingId,
          date: today,
          total_scans: 1,
          unique_visitors: uniqueVisitors,
          total_leads: 0,
          page_views: 0,
        });
        
        if (insertError) {
          console.error('Failed to insert analytics:', insertError);
        }
      }

      // Update QR code scan count if it exists
      const { data: qrCode } = await supabase
        .from('qrcodes')
        .select('id, scan_count, listing_id')
        .eq('listing_id', listingId)
        .single();

      if (qrCode) {
        const { error: qrUpdateError } = await supabase
          .from('qrcodes')
          .update({ scan_count: (qrCode.scan_count || 0) + 1 })
          .eq('id', qrCode.id);
        
        if (qrUpdateError) {
          console.error('Failed to update QR code scan count:', qrUpdateError);
        }
      }

      // Set session cookie and redirect
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const response = NextResponse.redirect(`${siteUrl}/listing/${listingId}`);
      response.cookies.set('homeqr_session', sessionId, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        sameSite: 'lax',
      });
      return response;
    }

    // Handle QR code scan by QR code ID
    const { data: qrCode, error } = await supabase
      .from('qrcodes')
      .select('id, listing_id, scan_count, redirect_url')
      .eq('id', qrId)
      .single();

    if (error || !qrCode) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${siteUrl}/404`);
    }

    // Track scan session
    const { data: existingSession } = await supabase
      .from('scan_sessions')
      .select('id, scan_count')
      .eq('listing_id', qrCode.listing_id)
      .eq('session_id', sessionId)
      .single();

    if (existingSession) {
      // Update existing session
      await supabase
        .from('scan_sessions')
        .update({
          scan_count: existingSession.scan_count + 1,
          last_scan_at: new Date().toISOString(),
          device_type: deviceType,
          time_of_day: timeOfDay,
          referrer: referrer,
        })
        .eq('id', existingSession.id);
    } else {
      // Create new session (new unique visitor)
      await supabase.from('scan_sessions').insert({
        listing_id: qrCode.listing_id,
        session_id: sessionId,
        device_type: deviceType,
        time_of_day: timeOfDay,
        referrer: referrer,
      });
    }

    // Update analytics
    const today = new Date().toISOString().split('T')[0];
    
    // Get unique visitors count for today
    const { data: uniqueVisitorsData } = await supabase
      .from('scan_sessions')
      .select('session_id')
      .eq('listing_id', qrCode.listing_id)
      .gte('first_scan_at', `${today}T00:00:00Z`)
      .lt('first_scan_at', `${today}T23:59:59Z`);

    const uniqueVisitors = uniqueVisitorsData?.length || 0;

    // Update or create analytics record
    const { data: existingAnalytics } = await supabase
      .from('analytics')
      .select('id, total_scans, unique_visitors')
      .eq('listing_id', qrCode.listing_id)
      .eq('date', today)
      .single();

    if (existingAnalytics) {
      const { error: analyticsError } = await supabase
        .from('analytics')
        .update({
          total_scans: (existingAnalytics.total_scans || 0) + 1,
          unique_visitors: uniqueVisitors,
        })
        .eq('id', existingAnalytics.id);
      
      if (analyticsError) {
        console.error('Failed to update analytics:', analyticsError);
      }
    } else {
      const { error: insertError } = await supabase.from('analytics').insert({
        listing_id: qrCode.listing_id,
        date: today,
        total_scans: 1,
        unique_visitors: uniqueVisitors,
        total_leads: 0,
        page_views: 0,
      });
      
      if (insertError) {
        console.error('Failed to insert analytics:', insertError);
      }
    }

    // Update QR code scan count
    const { error: qrUpdateError } = await supabase
      .from('qrcodes')
      .update({ scan_count: (qrCode.scan_count || 0) + 1 })
      .eq('id', qrCode.id);
    
    if (qrUpdateError) {
      console.error('Failed to update QR code scan count:', qrUpdateError);
    }

    // Set session cookie and redirect
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = qrCode.redirect_url || `${siteUrl}/listing/${qrCode.listing_id}`;
    const finalRedirectUrl = redirectUrl.startsWith('http') 
      ? redirectUrl 
      : `${siteUrl}${redirectUrl.startsWith('/') ? '' : '/'}${redirectUrl}`;
    
    const response = NextResponse.redirect(finalRedirectUrl);
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



