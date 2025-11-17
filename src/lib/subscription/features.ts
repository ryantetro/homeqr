import { createClient } from '@/lib/supabase/server';

export type FeatureName = 'advanced_analytics' | 'csv_export';

/**
 * Check if a user has access to a specific feature
 * Pro plan users have access to all features
 * Starter plan users have limited features
 * Beta users have access to all features
 */
export async function hasFeature(userId: string, feature: FeatureName): Promise<boolean> {
  const supabase = await createClient();

  // Check if user is beta user (bypasses all checks)
  const { data: userData } = await supabase
    .from('users')
    .select('is_beta_user')
    .eq('id', userId)
    .single();

  if (userData?.is_beta_user) {
    return true;
  }

  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .maybeSingle();

  // No subscription = no access to Pro features
  if (!subscription) {
    return false;
  }

  // Only Pro plan has access to advanced features
  if (subscription.plan !== 'pro') {
    return false;
  }

  // Must be active or trialing
  return subscription.status === 'active' || subscription.status === 'trialing';
}

/**
 * Get analytics retention days based on plan
 * Starter: 30 days
 * Pro: Unlimited (null)
 */
export async function getAnalyticsRetentionDays(userId: string): Promise<number | null> {
  const supabase = await createClient();

  // Check if user is beta user (unlimited)
  const { data: userData } = await supabase
    .from('users')
    .select('is_beta_user')
    .eq('id', userId)
    .single();

  if (userData?.is_beta_user) {
    return null; // Unlimited
  }

  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .maybeSingle();

  // No subscription = 30 days (trial limit)
  if (!subscription) {
    return 30;
  }

  // Pro plan = unlimited
  if (subscription.plan === 'pro' && (subscription.status === 'active' || subscription.status === 'trialing')) {
    return null; // Unlimited
  }

  // Starter plan = 30 days
  return 30;
}

