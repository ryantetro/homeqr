import { createClient } from '@/lib/supabase/server';

export type FeatureName = 'advanced_analytics' | 'csv_export';

/**
 * Check if a user has access to a specific feature
 * All active/trialing subscriptions now have access to all features
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
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();

  // No subscription = no access
  if (!subscription) {
    return false;
  }

  // All active/trialing subscriptions have access to all features
  return subscription.status === 'active' || subscription.status === 'trialing';
}

/**
 * Get analytics retention days
 * All active/trialing subscriptions now have unlimited retention
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
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();

  // No subscription = no access (but return 30 days for display purposes)
  if (!subscription) {
    return 30;
  }

  // All active/trialing subscriptions = unlimited
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    return null; // Unlimited
  }

  // Expired/past_due = 30 days
  return 30;
}

