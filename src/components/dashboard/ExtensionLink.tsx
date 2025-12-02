'use client';

import { useState, useEffect } from 'react';
import ExtensionInstallModal from './ExtensionInstallModal';

export default function ExtensionLink() {
  const [paymentStatus, setPaymentStatus] = useState<{
    has_paid: boolean;
    is_beta_user: boolean;
    has_access: boolean;
    subscription?: { status: string; plan: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    e.preventDefault();
    
    if (!paymentStatus?.has_access) {
      alert(
        'Extension access requires an active subscription. Please complete payment in the onboarding flow or contact support for beta access.'
      );
      return;
    }
    
    // Open Chrome Web Store directly
    window.open('https://chromewebstore.google.com/detail/miggfgghddpmbnblcoodakemagbjlenf?utm_source=item-share-cb', '_blank');
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
    <>
      <a
        href="https://chromewebstore.google.com/detail/miggfgghddpmbnblcoodakemagbjlenf?utm_source=item-share-cb"
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all cursor-pointer group"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span className="font-semibold">Get Chrome Extension</span>
        <svg className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
      <ExtensionInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

