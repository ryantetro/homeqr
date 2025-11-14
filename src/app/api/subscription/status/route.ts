import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkUserAccess } from '@/lib/subscription/access';
import { checkTrialLimit } from '@/lib/subscription/limits';

/**
 * Subscription status endpoint for Chrome extension
 * Returns subscription status, access info, and trial limit status
 * Supports both cookie-based and Bearer token authentication
 */
export async function GET(request: NextRequest) {
  try {
    let supabase = await createClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    // If no user from cookies, try Bearer token (for extension requests)
    if (!user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
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

    // Check access using our access control system
    const access = await checkUserAccess(user.id);

    // Check if any trial limit is reached
    let trialLimitReached = false;
    let limitDetails: {
      feature: string;
      current: number;
      limit: number;
    } | null = null;

    if (access.reason === 'trial') {
      // Check all trial limits
      const [listingsLimit, qrLimit, photosLimit] = await Promise.all([
        checkTrialLimit(user.id, 'listings'),
        checkTrialLimit(user.id, 'qr_codes'),
        checkTrialLimit(user.id, 'photos'),
      ]);

      // Find the first limit that's reached
      if (!listingsLimit.allowed) {
        trialLimitReached = true;
        limitDetails = {
          feature: 'listings',
          current: listingsLimit.current,
          limit: listingsLimit.limit,
        };
      } else if (!qrLimit.allowed) {
        trialLimitReached = true;
        limitDetails = {
          feature: 'qr_codes',
          current: qrLimit.current,
          limit: qrLimit.limit,
        };
      } else if (!photosLimit.allowed) {
        trialLimitReached = true;
        limitDetails = {
          feature: 'photos',
          current: photosLimit.current,
          limit: photosLimit.limit,
        };
      }
    }

    // Get user data for beta check
    const { data: userData } = await supabase
      .from('users')
      .select('is_beta_user')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      has_access: access.hasAccess,
      subscription_status: access.subscription?.status || null,
      is_beta_user: userData?.is_beta_user || false,
      trial_limit_reached: trialLimitReached,
      limit_details: limitDetails,
      reason: access.reason,
      subscription: access.subscription || null,
    });
  } catch (error: unknown) {
    console.error('Subscription status error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch subscription status';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

