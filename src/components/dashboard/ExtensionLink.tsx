'use client';

import { useState, useEffect } from 'react';

export default function ExtensionLink() {
  const [paymentStatus, setPaymentStatus] = useState<{
    has_paid: boolean;
    is_beta_user: boolean;
    has_access: boolean;
    subscription?: { status: string; plan: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch('/api/payment/status');
      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data);
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!paymentStatus?.has_access) {
      e.preventDefault();
      alert(
        'Extension access requires an active subscription. Please complete payment in the onboarding flow or contact support for beta access.'
      );
      return;
    }
    
    // If has access, show download instructions
    e.preventDefault();
    const instructions = `To install the HomeQR Chrome Extension:

1. Open Chrome and go to: chrome://extensions/
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Navigate to the extension/ folder in your HomeQR project
5. Select the folder

The extension will appear in your extensions list. Pin it to your toolbar for easy access!`;
    
    alert(instructions);
  };

  if (loading) {
    return (
      <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg">
        Loading...
      </div>
    );
  }

  // Check if user has access (beta, paid, or active trial)
  // Note: past_due subscriptions should NOT have access
  const subscriptionStatus = paymentStatus?.subscription?.status;
  const hasAccess = paymentStatus?.is_beta_user || 
                    (subscriptionStatus === 'trialing') ||
                    (subscriptionStatus === 'active');

  if (!hasAccess) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Start Free Trial
      </div>
    );
  }

  return (
    <a
      href="#"
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download Extension
    </a>
  );
}

