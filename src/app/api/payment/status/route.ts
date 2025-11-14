import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data including beta status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_beta_user')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Failed to fetch user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch payment status' },
        { status: 500 }
      );
    }

    // Check for active subscription (including trialing, but NOT past_due)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, plan, current_period_end, trial_started_at')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .maybeSingle();

    // Determine if user has access:
    // - Beta users always have access
    // - Users with active or trialing subscriptions have access
    // - past_due subscriptions do NOT have access (trial expired, payment failed)
    const hasActiveSubscription = subscription && 
                                  (subscription.status === 'active' || subscription.status === 'trialing');
    const hasAccess = !!(userData.is_beta_user || hasActiveSubscription);

    // Derive has_paid from subscription status (active = paid, trialing = not paid yet)
    const hasPaid = subscription?.status === 'active';

    return NextResponse.json({
      has_paid: hasPaid,
      is_beta_user: userData.is_beta_user || false,
      has_access: hasAccess,
      subscription: subscription || null,
    });
  } catch (error: unknown) {
    console.error('Payment status error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

