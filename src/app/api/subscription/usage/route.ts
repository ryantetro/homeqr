import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUsageStats } from '@/lib/subscription/limits';
import { checkUserAccess } from '@/lib/subscription/access';

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

    // Check access
    const access = await checkUserAccess(user.id);
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: 'Subscription required' },
        { status: 403 }
      );
    }

    // Get usage stats
    const usageStats = await getUsageStats(user.id);

    return NextResponse.json({
      usage: usageStats,
      isTrial: access.reason === 'trial',
      subscriptionStatus: access.subscription?.status || null,
    });
  } catch (error: unknown) {
    console.error('Usage stats error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch usage stats';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

