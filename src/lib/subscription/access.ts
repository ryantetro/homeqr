import { createClient } from '@/lib/supabase/server';
import type { AccessResult, SubscriptionStatus } from '@/types/subscription';

/**
 * Check if a user has access to premium features
 * Beta users always have access
 * Active and trialing subscriptions have access
 * Past due and expired subscriptions do not have access
 */
export async function checkUserAccess(userId: string): Promise<AccessResult> {
  const supabase = await createClient();

  // Check if user is beta user (bypasses all checks)
  const { data: userData } = await supabase
    .from('users')
    .select('is_beta_user')
    .eq('id', userId)
    .single();

  if (userData?.is_beta_user) {
    return {
      hasAccess: true,
      reason: 'beta',
      subscription: null,
    };
  }

  // Get subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, status, plan, current_period_end, trial_started_at')
    .eq('user_id', userId)
    .maybeSingle();

  // No subscription = no access
  if (!subscription) {
    return {
      hasAccess: false,
      reason: 'no-sub',
      subscription: null,
    };
  }

  const status = subscription.status as SubscriptionStatus;

  // Active subscription = full access
  if (status === 'active') {
    return {
      hasAccess: true,
      reason: 'active',
      subscription: {
        id: subscription.id,
        status: subscription.status as SubscriptionStatus,
        plan: subscription.plan,
        current_period_end: subscription.current_period_end,
        trial_started_at: subscription.trial_started_at || null,
      },
    };
  }

  // Trialing subscription = trial access
  if (status === 'trialing') {
    return {
      hasAccess: true,
      reason: 'trial',
      subscription: {
        id: subscription.id,
        status: subscription.status as SubscriptionStatus,
        plan: subscription.plan,
        current_period_end: subscription.current_period_end,
        trial_started_at: subscription.trial_started_at || null,
      },
    };
  }

  // Past due = expired, no access
  if (status === 'past_due') {
    return {
      hasAccess: false,
      reason: 'past_due',
      subscription: {
        id: subscription.id,
        status: subscription.status as SubscriptionStatus,
        plan: subscription.plan,
        current_period_end: subscription.current_period_end,
        trial_started_at: subscription.trial_started_at || null,
      },
    };
  }

  // Check if subscription period has ended (for inactive/canceled subscriptions)
  if (subscription.current_period_end) {
    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    if (endDate < now) {
      return {
        hasAccess: false,
        reason: 'expired',
        subscription: {
          id: subscription.id,
          status: subscription.status as SubscriptionStatus,
          plan: subscription.plan,
          current_period_end: subscription.current_period_end,
          trial_started_at: subscription.trial_started_at || null,
        },
      };
    }
  }

  // Inactive or other status = no access
  return {
    hasAccess: false,
    reason: 'expired',
    subscription: {
      id: subscription.id,
      status: subscription.status as SubscriptionStatus,
      plan: subscription.plan,
      current_period_end: subscription.current_period_end,
      trial_started_at: subscription.trial_started_at || null,
    },
  };
}

/**
 * Get subscription status for a user
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();

  return (subscription?.status as SubscriptionStatus) || null;
}

/**
 * Check if user is in trial period
 */
export async function isTrialUser(userId: string): Promise<boolean> {
  const access = await checkUserAccess(userId);
  return access.reason === 'trial';
}

/**
 * Check if user has active paid subscription (not trial)
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const access = await checkUserAccess(userId);
  return access.reason === 'active' || access.reason === 'beta';
}

