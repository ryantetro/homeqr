'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TrialOnboardingModal from '@/components/onboarding/TrialOnboardingModal';
import WelcomeScreen from './WelcomeScreen';
import TrialExpiredModal from './TrialExpiredModal';

interface DashboardClientProps {
  subscription?: {
    status: string;
    current_period_end: string | null;
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
    const trialActivated = searchParams.get('trial') === 'activated';
    
    // Check if trial expired (past_due or period ended)
    let shouldShowExpired = false;
    if (subscription) {
      if (subscription.status === 'past_due') {
        shouldShowExpired = true;
      } else if (subscription.current_period_end) {
        const endDate = new Date(subscription.current_period_end);
        const now = new Date();
        if (endDate < now && subscription.status !== 'active') {
          shouldShowExpired = true;
        }
      }
    }

    // Show trial onboarding modal if:
    // - Not beta user
    // - No active subscription (or inactive status)
    // - Onboarding not completed
    // - Not showing welcome screen or expired modal
    const shouldShowTrialModal = !isBetaUser && 
        (!subscription || !['active', 'trialing'].includes(subscription.status)) && 
        !onboardingCompleted &&
        !trialActivated &&
        !shouldShowExpired;

    // Defer state updates to avoid cascading renders
    queueMicrotask(() => {
      if (trialActivated) {
        setShowWelcome(true);
      } else if (shouldShowExpired) {
        setShowExpiredModal(true);
      } else if (shouldShowTrialModal) {
        // Small delay to let page load
        setTimeout(() => {
          setShowTrialModal(true);
        }, 500);
      }
    });
  }, [subscription, isBetaUser, onboardingCompleted, searchParams]);

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
      {/* TrialBanner removed - don't remind users about trial status */}

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

