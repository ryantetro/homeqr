import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUsageStats } from '@/lib/subscription/limits';
import { checkUserAccess } from '@/lib/subscription/access';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

