import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API endpoint for Chrome extension to get auth token
 * This allows the extension to authenticate requests
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Return the access token for the extension
    return NextResponse.json({
      access_token: session.access_token,
      expires_at: session.expires_at,
    });
  } catch (error: unknown) {
    console.error('Token fetch error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get token';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}



