'use client';

import Button from '@/components/ui/Button';

interface TrialExpiredModalProps {
  onReactivate: () => void;
  onDismiss?: () => void;
}

export default function TrialExpiredModal({ onReactivate, onDismiss }: TrialExpiredModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDismiss} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Required</h2>
          <p className="text-gray-600">
            Your subscription has expired or payment is required. Subscribe to continue generating QR codes and capturing leads.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Your existing QR codes and data remain safe</li>
              <li>You can view your dashboard and analytics</li>
              <li>Generate new QR codes after reactivating</li>
            </ul>
          </div>

          <Button
            variant="primary"
            onClick={onReactivate}
            className="w-full"
          >
            Subscribe Now → Stripe Checkout
          </Button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-full text-sm text-gray-600 hover:text-gray-900 text-center"
            >
              Maybe later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

