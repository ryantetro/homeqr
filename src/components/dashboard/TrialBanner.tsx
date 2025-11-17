'use client';

import { useMemo } from 'react';
import Button from '@/components/ui/Button';

interface TrialBannerProps {
  subscription?: {
    status: string;
    current_period_end: string | null;
  } | null;
  isBetaUser: boolean;
  onStartTrial: () => void;
}

export default function TrialBanner({ subscription, isBetaUser, onStartTrial }: TrialBannerProps) {
  const daysRemaining = useMemo(() => {
    if (subscription?.status === 'trialing' && subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return null;
  }, [subscription]);

  // Don't show banner for beta users
  if (isBetaUser) {
    return null;
  }

  // Don't show banner for active paid subscriptions (not in trial)
  if (subscription?.status === 'active') {
    return null;
  }

  // Show trial countdown if trial is active
  // Check for 'trialing' status first - this takes priority
  if (subscription?.status === 'trialing') {
    // Show countdown if we have days remaining info, otherwise just show "Trial Active"
    if (daysRemaining !== null && daysRemaining !== undefined) {
      return (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg">Free Trial Active</p>
                <p className="text-sm text-blue-100">
                  {daysRemaining === 0 
                    ? 'Trial ends today' 
                    : daysRemaining === 1 
                    ? 'Trial ends tomorrow'
                    : `Trial ends in ${daysRemaining} days`}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard/billing'}
              className="bg-white text-blue-600 hover:bg-blue-50 border-white"
            >
              Manage Billing
            </Button>
          </div>
        </div>
      );
    } else {
      // Trial is active but we don't have days remaining info - still show trial active banner
      return (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg">Free Trial Active</p>
                <p className="text-sm text-blue-100">Your 14-day free trial is in progress</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard/billing'}
              className="bg-white text-blue-600 hover:bg-blue-50 border-white"
            >
              Manage Billing
            </Button>
          </div>
        </div>
      );
    }
  }

  // Show "Start Free Trial" banner ONLY if:
  // - No subscription exists, OR
  // - Subscription status is 'inactive' or 'canceled'
  // Do NOT show if trial is active ('trialing') or subscription is 'active'
  // Also don't show if status is 'past_due' (that's handled by expired modal)
  // IMPORTANT: If subscription exists but status is not one of the handled statuses,
  // don't show activation banner (might be loading or in transition)
  const shouldShowActivationBanner = !subscription || 
    (subscription.status === 'inactive' || subscription.status === 'canceled');
  
  // Double-check: Don't show activation banner if subscription exists and status is trialing or active
  // (even if the check above passed, this is a safety net)
  if (subscription && (subscription.status === 'trialing' || subscription.status === 'active')) {
    return null;
  }
  
  if (shouldShowActivationBanner) {
    return (
      <div className="mb-6 p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-xl mb-1">Activate Your 14-Day Free Trial</p>
              <p className="text-sm text-blue-100">
                Start generating QR codes and capturing leads today. No credit card required until trial ends.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onStartTrial}
            className="bg-white text-blue-600 hover:bg-blue-50 border-white font-semibold px-6 py-3 text-base"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

