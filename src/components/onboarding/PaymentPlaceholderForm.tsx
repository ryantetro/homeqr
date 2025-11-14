'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import ExtensionInstallModal from '@/components/dashboard/ExtensionInstallModal';

interface PaymentPlaceholderFormProps {
  onPaymentComplete?: () => void;
}

export default function PaymentPlaceholderForm({ onPaymentComplete }: PaymentPlaceholderFormProps) {
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{
    has_paid: boolean;
    is_beta_user: boolean;
    has_access: boolean;
  } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    checkPaymentStatus();
    
    // Check for Stripe redirect success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      // Refresh payment status after successful payment
      setTimeout(() => {
        checkPaymentStatus();
        if (onPaymentComplete) {
          onPaymentComplete();
        }
      }, 1000);
    }
  }, [onPaymentComplete]);

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch('/api/payment/status');
      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data);
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
    }
  };

  const handleStripeCheckout = async () => {
    setLoading(true);
    try {
      // Check if Stripe is configured
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'starter' }), // Default plan
      });

      if (response.ok) {
        const { url } = await response.json();
        if (url) {
          // Redirect to Stripe Checkout
          window.location.href = url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } else {
        // Stripe not configured, show placeholder message
        alert('Payment integration is coming soon! For now, contact support to enable your account.');
      }
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      alert('Payment integration is coming soon! For now, contact support to enable your account.');
    } finally {
      setLoading(false);
    }
  };

  // If user already has access (beta or paid), show download instructions
  if (paymentStatus && paymentStatus.has_access) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold text-green-800">
              {paymentStatus.is_beta_user ? 'Beta Access Active' : 'Payment Confirmed'}
            </p>
          </div>
          <p className="text-sm text-green-700">
            You can now download and use the HomeQR Chrome extension!
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Download Extension</h3>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsExtensionModalOpen(true)}
            className="w-full"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Install Chrome Extension
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Click the button above to see installation instructions
          </p>
        </div>
      </div>
    );
  }

  // Show payment form (placeholder or Stripe)
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 font-medium mb-2">
          Extension Access Required
        </p>
        <p className="text-sm text-blue-700">
          To download and use the HomeQR Chrome extension, you&apos;ll need an active subscription.
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">Payment Information</h3>
        
        {/* Placeholder form fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Number
            </label>
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                placeholder="123"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Payment integration coming soon!</strong> For now, contact support to enable your account or request beta access.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={handleStripeCheckout}
          disabled={loading}
          className="w-full mt-4"
        >
          {loading ? 'Processing...' : 'Continue to Payment (Stripe Checkout)'}
        </Button>
      </div>
      <ExtensionInstallModal isOpen={isExtensionModalOpen} onClose={() => setIsExtensionModalOpen(false)} />
    </div>
  );
}

