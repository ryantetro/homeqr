'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import TrialOnboardingModal from '@/components/onboarding/TrialOnboardingModal';

interface ExpiredTrialOverlayProps {
  children: React.ReactNode;
}

export default function ExpiredTrialOverlay({ children }: ExpiredTrialOverlayProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  return (
    <>
      <div className="relative">
        {/* Blurred content */}
        <div className="blur-sm pointer-events-none select-none">{children}</div>

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="max-w-md mx-auto p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Trial Has Ended</h2>
            <p className="text-gray-600 mb-6">
              Upgrade to continue generating QR codes, viewing full analytics, and capturing leads.
            </p>
            <div className="space-y-3">
              <Button variant="primary" onClick={handleUpgrade} className="w-full">
                Upgrade to Continue
              </Button>
              <p className="text-sm text-gray-500">
                Your existing QR codes and data are safe. Upgrade anytime to reactivate.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showUpgradeModal && (
        <TrialOnboardingModal
          onComplete={() => setShowUpgradeModal(false)}
          onDismiss={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
}

