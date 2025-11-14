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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { listing_id, source } = body; // source: 'qr_scan' | 'direct' | 'microsite'

    console.log('[PageView Track] Received request:', { listing_id, source });

    if (!listing_id) {
      return NextResponse.json(
        { error: 'listing_id is required' },
        { status: 400 }
      );
    }

    // Extract tracking data
    const userAgent = request.headers.get('user-agent');
    const referrer = request.headers.get('referer') || request.headers.get('referrer') || 'direct';
    const deviceType = getDeviceType(userAgent);
    const timeOfDay = new Date().getHours();
    const sessionId = getSessionId(request);
    
    // Debug: Log cookie info
    const sessionCookie = request.cookies.get('homeqr_session');
    console.log('[PageView Track] Session cookie check:', {
      cookieExists: !!sessionCookie,
      cookieValue: sessionCookie?.value,
      generatedSessionId: sessionId,
      cookieMatches: sessionCookie?.value === sessionId,
    });

    // Track page view (for microsite visits)
    if (source === 'microsite' || source === 'direct') {
      // Update analytics with page view
      const today = new Date().toISOString().split('T')[0];
      const { data: existingAnalytics } = await supabase
        .from('analytics')
        .select('id, page_views')
        .eq('listing_id', listing_id)
        .eq('date', today)
        .maybeSingle(); // Use maybeSingle() to avoid errors when no record exists

      if (existingAnalytics) {
        // Record exists, update it
        const newPageViews = (existingAnalytics.page_views || 0) + 1;
        const { error: updateError } = await supabase
          .from('analytics')
          .update({
            page_views: newPageViews,
          })
          .eq('id', existingAnalytics.id);
        
        if (updateError) {
          console.error('[PageView Track] Failed to update analytics:', updateError);
        } else {
          console.log(`[PageView Track] Updated analytics: ${newPageViews} page views`);
        }
      } else {
        // No record exists, create one (but handle case where scan might have created it between check and insert)
        // Check if page_views column exists
        const insertData: {
          listing_id: string;
          date: string;
          total_scans: number;
          total_leads: number;
          unique_visitors: number;
          page_views?: number;
        } = {
          listing_id,
          date: today,
          total_scans: 0,
          total_leads: 0,
          unique_visitors: 0,
        };
        
        // Try to include page_views if column exists
        const { error: insertError } = await supabase.from('analytics').insert({
          ...insertData,
          page_views: 1,
        });
        
        if (insertError) {
          // Check if it's a duplicate key error (race condition - scan created record between check and insert)
          if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
            console.log('[PageView Track] Analytics record created by scan, updating instead');
            // Record was created by scan, update it
            const { data: newRecord } = await supabase
              .from('analytics')
              .select('id, page_views')
              .eq('listing_id', listing_id)
              .eq('date', today)
              .maybeSingle();
            
            if (newRecord) {
              const newPageViews = (newRecord.page_views || 0) + 1;
              const { error: updateError } = await supabase
                .from('analytics')
                .update({ page_views: newPageViews })
                .eq('id', newRecord.id);
              
              if (updateError) {
                console.error('[PageView Track] Failed to update analytics after race condition:', updateError);
              } else {
                console.log(`[PageView Track] Updated analytics after race condition: ${newPageViews} page views`);
              }
            }
          } else if (insertError.message?.includes('page_views')) {
            // Column doesn't exist, insert without it
            console.warn('[PageView Track] page_views column not found, inserting without it');
            const { error: retryError } = await supabase.from('analytics').insert(insertData);
            
            if (retryError) {
              console.error('[PageView Track] Failed to insert analytics:', retryError);
            } else {
              console.log('[PageView Track] Created new analytics record (without page_views)');
            }
          } else {
            console.error('[PageView Track] Failed to insert analytics:', insertError);
          }
        } else {
          console.log('[PageView Track] Created new analytics record: 1 page view');
        }
      }

      // Track session for unique visitor count
      // First, check if this session already exists (by session_id from cookie)
      const { data: existingSession, error: sessionLookupError } = await supabase
        .from('scan_sessions')
        .select('id, scan_count, source, first_scan_at, listing_id, session_id')
        .eq('listing_id', listing_id)
        .eq('session_id', sessionId)
        .maybeSingle();
      
      console.log('[PageView Track] Session lookup result:', {
        found: !!existingSession,
        error: sessionLookupError,
        listing_id,
        sessionId,
        existingSessionData: existingSession ? {
          id: existingSession.id,
          scan_count: existingSession.scan_count,
          source: existingSession.source,
          listing_id: existingSession.listing_id,
          session_id: existingSession.session_id,
        } : null,
      });

      if (!existingSession) {
        // No session found by cookie - check for recent QR scan session (within 5 minutes) as fallback
        // This is a safety net in case cookies aren't sent (shouldn't happen with credentials: 'include')
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        console.log('[PageView Track] Checking for recent QR scan session:', {
          listing_id,
          sessionId,
          fiveMinutesAgo,
          currentTime: new Date().toISOString(),
        });
        
        const { data: recentQRSession, error: recentQRError } = await supabase
          .from('scan_sessions')
          .select('id, scan_count, source, first_scan_at, session_id, listing_id')
          .eq('listing_id', listing_id)
          .eq('source', 'qr')
          .gt('scan_count', 0)
          .gte('first_scan_at', fiveMinutesAgo)
          .order('first_scan_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (recentQRError) {
          console.error('[PageView Track] Error checking for recent QR session:', recentQRError);
        }
        
        console.log('[PageView Track] Recent QR session check result:', {
          found: !!recentQRSession,
          session_id: recentQRSession?.session_id,
          listing_id: recentQRSession?.listing_id,
          scan_count: recentQRSession?.scan_count,
          source: recentQRSession?.source,
          first_scan_at: recentQRSession?.first_scan_at,
        });

        let qrSessionUpdated = false;
        if (recentQRSession) {
          // Found recent QR scan session - update it instead of creating new visit
          console.log('[PageView Track] Found recent QR scan session, updating instead of creating new visit:', {
            session_id: recentQRSession.session_id,
            qr_scan_count: recentQRSession.scan_count,
            first_scan_at: recentQRSession.first_scan_at,
          });

          const updateResult = await supabase
            .from('scan_sessions')
            .update({
              last_scan_at: new Date().toISOString(), // Update timestamp so it shows as recent
              device_type: deviceType,
              time_of_day: timeOfDay,
              referrer: referrer,
              // DO NOT update source or scan_count - preserve QR scan designation
            })
            .eq('id', recentQRSession.id);

          if (updateResult.error) {
            console.error('[PageView Track] Failed to update recent QR scan session:', updateResult.error);
            // Will fall through to create new session
          } else {
            console.log('[PageView Track] Updated recent QR scan session (preserved source: qr):', {
              id: recentQRSession.id,
              scan_count: recentQRSession.scan_count,
              source: recentQRSession.source,
            });
            qrSessionUpdated = true;
            // Skip creating new session - we've updated the QR scan session
            // Continue to unique visitors count update below
          }
        }
        
        if (!qrSessionUpdated) {
          // No recent QR scan session found OR update failed - create new microsite visit session
          const insertResult = await supabase.from('scan_sessions').insert({
            listing_id,
            session_id: sessionId,
            device_type: deviceType,
            time_of_day: timeOfDay,
            referrer: referrer,
            source: source || 'direct', // Track if this is from microsite visit or other
            scan_count: 0, // No scan, just page view
          });
        
        if (insertResult.error) {
          // Handle duplicate key error - session was created between check and insert (race condition)
          if (insertResult.error.code === '23505' || insertResult.error.message?.includes('duplicate key')) {
            console.log('[PageView Track] Session created by race condition, fetching and updating instead');
            // Fetch the existing session and update it
            const { data: raceSession } = await supabase
              .from('scan_sessions')
              .select('id, scan_count, source')
              .eq('listing_id', listing_id)
              .eq('session_id', sessionId)
              .maybeSingle();
            
            if (raceSession) {
              // Treat as existing session and update accordingly
              const updateData: {
                device_type: string;
                time_of_day: number;
                referrer: string;
                last_scan_at: string;
                source?: string;
              } = {
                device_type: deviceType,
                time_of_day: timeOfDay,
                referrer: referrer,
                last_scan_at: new Date().toISOString(),
              };
              
              if (raceSession.scan_count === 0) {
                updateData.source = source || raceSession.source || 'direct';
              }
              
              await supabase
                .from('scan_sessions')
                .update(updateData)
                .eq('id', raceSession.id);
              
              console.log('[PageView Track] Updated race condition session:', { 
                id: raceSession.id, 
                scan_count: raceSession.scan_count,
                source: updateData.source || raceSession.source
              });
            }
          } else {
            console.error('[PageView Track] Failed to insert scan session:', insertResult.error);
          }
        } else {
          console.log('[PageView Track] Created new scan session for page view:', { listing_id, source, sessionId, scan_count: 0 });
        }
        }
      } else {
        // Update existing session (found by cookie session_id)
        console.log('[PageView Track] Found existing session by cookie:', { 
          id: existingSession.id, 
          scan_count: existingSession.scan_count,
          current_source: existingSession.source,
          first_scan_at: existingSession.first_scan_at
        });
        
        if (existingSession.scan_count === 0) {
          // Update existing session if it was created by page view only (direct microsite visit)
          // This prevents double-counting when scan happens after page view
          const updateData: {
            device_type: string;
            time_of_day: number;
            referrer: string;
            source: string;
            last_scan_at: string;
          } = {
            device_type: deviceType,
            time_of_day: timeOfDay,
            referrer: referrer,
            source: source || existingSession.source || 'direct',
            last_scan_at: new Date().toISOString(), // Update timestamp for Recent Activity
          };
          
          const updateResult = await supabase
            .from('scan_sessions')
            .update(updateData)
            .eq('id', existingSession.id);
          
          if (updateResult.error) {
            console.error('[PageView Track] Failed to update scan session:', updateResult.error);
          } else {
            console.log('[PageView Track] Updated existing scan session:', { 
              id: existingSession.id, 
              source: updateData.source,
              scan_count: 0
            });
          }
        } else {
          // Session already has scans (QR scan happened first)
          // Don't create a separate microsite visit entry - the QR scan already represents this activity
          // Just update the timestamp so it shows as recent in Recent Activity
          // This prevents double-counting: if they scanned QR, it's a "QR Code Scanned", not a separate "Microsite Visit"
          // IMPORTANT: Preserve source as 'qr' - do not change it
          const updateResult = await supabase
            .from('scan_sessions')
            .update({ 
              last_scan_at: new Date().toISOString(), // Update timestamp so it shows as recent
              device_type: deviceType,
              time_of_day: timeOfDay,
              referrer: referrer,
              // DO NOT update source or scan_count - preserve QR scan designation
            })
            .eq('id', existingSession.id);
          
          if (updateResult.error) {
            console.error('[PageView Track] Failed to update scan session timestamp:', updateResult.error);
          } else {
            console.log('[PageView Track] Updated QR scan session timestamp (preserved source: qr):', { 
              id: existingSession.id,
              scan_count: existingSession.scan_count,
              source: existingSession.source
            });
          }
        }
      }

      // Update unique visitors count
      const { data: uniqueVisitorsData } = await supabase
        .from('scan_sessions')
        .select('session_id')
        .eq('listing_id', listing_id)
        .gte('first_scan_at', `${today}T00:00:00Z`)
        .lt('first_scan_at', `${today}T23:59:59Z`);

      const uniqueVisitors = uniqueVisitorsData?.length || 0;

      const { data: updatedAnalytics } = await supabase
        .from('analytics')
        .select('id')
        .eq('listing_id', listing_id)
        .eq('date', today)
        .single();

      if (updatedAnalytics) {
        await supabase
          .from('analytics')
          .update({ unique_visitors: uniqueVisitors })
          .eq('id', updatedAnalytics.id);
      }
    }

    // Set session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('homeqr_session', sessionId, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
    });

    return response;
  } catch (error: unknown) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}

