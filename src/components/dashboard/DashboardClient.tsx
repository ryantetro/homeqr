'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TrialBanner from './TrialBanner';
import TrialOnboardingModal from '@/components/onboarding/TrialOnboardingModal';
import WelcomeScreen from './WelcomeScreen';
import TrialExpiredModal from './TrialExpiredModal';

interface DashboardClientProps {
  subscription?: {
    status: string;
    current_period_end: string | null;
    trial_started_at: string | null;
  } | null;
  isBetaUser: boolean;
  onboardingCompleted: boolean;
}

export default function DashboardClient({ 
  subscription, 
  isBetaUser, 
  onboardingCompleted 
}: DashboardClientProps) {
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for trial activation redirect
    if (searchParams.get('trial') === 'activated') {
      setShowWelcome(true);
      return;
    }

    // Check if trial expired (past_due or period ended)
    if (subscription) {
      if (subscription.status === 'past_due') {
        setShowExpiredModal(true);
        return;
      }
      
      // Check if trial period has ended
      if (subscription.current_period_end) {
        const endDate = new Date(subscription.current_period_end);
        const now = new Date();
        if (endDate < now && subscription.status !== 'active') {
          setShowExpiredModal(true);
          return;
        }
      }
    }

    // Show trial onboarding modal if:
    // - Not beta user
    // - No active subscription (or inactive status)
    // - Onboarding not completed
    // - Not showing welcome screen or expired modal
    if (!isBetaUser && 
        (!subscription || !['active', 'trialing'].includes(subscription.status)) && 
        !onboardingCompleted &&
        !showWelcome &&
        !showExpiredModal) {
      // Small delay to let page load
      const timer = setTimeout(() => {
        setShowTrialModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [subscription, isBetaUser, onboardingCompleted, searchParams, showWelcome, showExpiredModal]);

  const handleStartTrial = () => {
    setShowTrialModal(true);
  };

  const handleTrialModalComplete = () => {
    setShowTrialModal(false);
  };

  const handleWelcomeDismiss = async () => {
    setShowWelcome(false);
    // Mark onboarding as completed
    await fetch('/api/onboarding/complete', { method: 'POST' });
    window.location.href = '/dashboard';
  };

  const handleReactivate = () => {
    setShowExpiredModal(false);
    setShowTrialModal(true);
  };

  return (
    <>
      <TrialBanner
        subscription={subscription}
        isBetaUser={isBetaUser}
        onStartTrial={handleStartTrial}
      />

      {showTrialModal && (
        <TrialOnboardingModal
          onComplete={handleTrialModalComplete}
          onDismiss={() => setShowTrialModal(false)}
        />
      )}

      {showWelcome && (
        <WelcomeScreen onDismiss={handleWelcomeDismiss} />
      )}

      {showExpiredModal && (
        <TrialExpiredModal
          onReactivate={handleReactivate}
          onDismiss={() => setShowExpiredModal(false)}
        />
      )}
    </>
  );
}

