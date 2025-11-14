'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import type { UsageStats } from '@/types/subscription';

interface UsageNudgeProps {
  subscriptionStatus: string | null;
}

export default function UsageNudge({ subscriptionStatus }: UsageNudgeProps) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only show for trialing users
    if (subscriptionStatus !== 'trialing') {
      setLoading(false);
      return;
    }

    async function fetchUsage() {
      try {
        const response = await fetch('/api/subscription/usage');
        if (response.ok) {
          const data = await response.json();
          setUsage(data.usage);
        }
      } catch (error) {
        console.error('Failed to fetch usage:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, [subscriptionStatus]);

  if (loading || !usage || subscriptionStatus !== 'trialing') {
    return null;
  }

  // Check if any feature is approaching limit (80% or more)
  const approachingLimit = Object.values(usage).some(
    (stat) => stat.percentage >= 80 && stat.percentage < 100
  );

  // Check if any feature has reached limit
  const atLimit = Object.values(usage).some((stat) => stat.percentage >= 100);

  if (!approachingLimit && !atLimit) {
    return null;
  }

  // Find the feature closest to limit
  const closestToLimit = Object.values(usage).reduce((prev, current) =>
    current.percentage > prev.percentage ? current : prev
  );

  const handleUpgrade = () => {
    window.location.href = '/dashboard/billing';
  };

  return (
    <div
      className={`mb-6 p-4 rounded-xl shadow-lg ${
        atLimit
          ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
          : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            {atLimit ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
          <div>
            <p className="font-semibold text-lg">
              {atLimit
                ? `Trial Limit Reached: ${closestToLimit.feature.replace('_', ' ')}`
                : `Approaching Trial Limit: ${closestToLimit.current}/${closestToLimit.limit} ${closestToLimit.feature.replace('_', ' ')}`}
            </p>
            <p className="text-sm opacity-90">
              {atLimit
                ? 'Upgrade to unlock unlimited usage and continue growing your business.'
                : `You've used ${closestToLimit.percentage}% of your trial ${closestToLimit.feature.replace('_', ' ')}. Upgrade for unlimited access.`}
            </p>
            {/* Progress bar */}
            <div className="mt-2 w-full bg-white/20 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  atLimit ? 'bg-white' : 'bg-white/80'
                }`}
                style={{ width: `${Math.min(100, closestToLimit.percentage)}%` }}
              />
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleUpgrade}
          className="bg-white text-blue-600 hover:bg-blue-50 border-white font-semibold"
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
}

