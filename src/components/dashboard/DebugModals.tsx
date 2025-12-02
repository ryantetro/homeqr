'use client';

import { useState, useEffect } from 'react';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import PaymentPlaceholderForm from '@/components/onboarding/PaymentPlaceholderForm';
import Button from '@/components/ui/Button';

export default function DebugModals() {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // Only show in development
    setIsDev(process.env.NODE_ENV === 'development');
    
    // Expose debug functions to window
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as any).debugShowOnboardingModal = () => setShowOnboardingModal(true);
      (window as any).debugShowPaymentForm = () => setShowPaymentForm(true);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).debugShowOnboardingModal;
        delete (window as any).debugShowPaymentForm;
      }
    };
  }, []);

  if (!isDev) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOnboardingModal(true)}
          className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
          title="Debug: Show Onboarding Modal"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Debug: Onboarding Modal
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPaymentForm(true)}
          className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
          title="Debug: Show Payment Form"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Debug: Payment Form
        </Button>
      </div>

      {/* Onboarding Modal */}
      {showOnboardingModal && (
        <OnboardingModal
          onComplete={() => {
            setShowOnboardingModal(false);
            console.log('Onboarding modal completed');
          }}
          onDismiss={() => setShowOnboardingModal(false)}
        />
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Payment Form (Debug)</h2>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <PaymentPlaceholderForm
                onPaymentComplete={() => {
                  console.log('Payment completed');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

