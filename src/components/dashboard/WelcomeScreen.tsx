'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import ExtensionInstallModal from './ExtensionInstallModal';

interface WelcomeScreenProps {
  onDismiss: () => void;
}

export default function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleDismiss} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-[fadeInUp_0.4s_ease-out]">
        {/* Decorative gradient header */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 z-10"
          aria-label="Close"
        >
          <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 sm:p-5">
          {/* Success icon with animation */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-3 shadow-lg shadow-green-200/50 animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 tracking-tight">
              Your Free Trial is Active!
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-snug">
              You&apos;re all set! Start generating QR codes and capturing leads today.
            </p>
          </div>

          {/* What's Next section - redesigned */}
          <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg">
            <div className="flex items-start gap-2.5">
              <div className="shrink-0 mt-0.5">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">What&apos;s Next?</h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-snug">
                  Your <span className="font-semibold text-gray-900">14-day free trial</span> has started. No charges until your trial ends. Explore all features risk-free!
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons - improved layout */}
          <div className="space-y-2.5">
            <Link href="/dashboard/listings/new" className="block">
              <Button 
                variant="primary" 
                className="w-full h-11 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate My First QR Code
              </Button>
            </Link>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-500 font-medium">Or</span>
              </div>
            </div>

            <a
              href="https://chromewebstore.google.com/detail/miggfgghddpmbnblcoodakemagbjlenf?utm_source=item-share-cb"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                size="md"
                className="w-full h-11 text-sm font-semibold border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>Get Chrome Extension</span>
                <svg className="w-3.5 h-3.5 ml-2 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Button>
            </a>
          </div>

          {/* Continue link - subtle */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={handleDismiss}
              className="text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
      <ExtensionInstallModal isOpen={isExtensionModalOpen} onClose={() => setIsExtensionModalOpen(false)} />
    </div>
  );
}

