'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OnboardingModal from '@/components/onboarding/OnboardingModal';

export default function OnboardingModalWrapper() {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If payment was successful, refresh to update payment status
    if (searchParams.get('payment') === 'success') {
      // Remove the query parameter
      router.replace('/dashboard');
      // Refresh the page after a short delay to ensure webhook has processed
      setTimeout(() => {
        router.refresh();
      }, 2000);
    }
  }, [searchParams, router]);

  const handleComplete = () => {
    setIsOpen(false);
    router.refresh();
  };

  const handleDismiss = () => {
    setIsOpen(false);
    // Modal will show again on next visit if not completed
  };

  if (!isOpen) return null;

  return (
    <OnboardingModal onComplete={handleComplete} onDismiss={handleDismiss} />
  );
}

