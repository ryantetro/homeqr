// Subscription and access control types

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'inactive' | 'canceled' | null;

export type AccessReason = 'beta' | 'active' | 'trial' | 'no-sub' | 'expired' | 'past_due';

export interface AccessResult {
  hasAccess: boolean;
  reason: AccessReason;
  subscription?: {
    id: string;
    status: SubscriptionStatus;
    plan: string;
    current_period_end: string | null;
    trial_started_at: string | null;
  } | null;
}

export type TrialFeature = 'qr_codes' | 'listings' | 'photos';

export interface TrialLimits {
  qr_codes: number;
  listings: number;
  photos: number;
  analytics_retention_days: number;
}

export interface TrialUsage {
  feature: TrialFeature;
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
}

export interface UsageStats {
  qr_codes: TrialUsage;
  listings: TrialUsage;
  photos: TrialUsage;
}

