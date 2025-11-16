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
      
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-[fadeInUp_0.4s_ease-out]">
        {/* Decorative gradient header */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 z-10"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 sm:p-10">
          {/* Success icon with animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-lg shadow-green-200/50 animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              Your Free Trial is Active!
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
              You&apos;re all set! Start generating QR codes and capturing leads today.
            </p>
          </div>

          {/* What's Next section - redesigned */}
          <div className="mb-8 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">What&apos;s Next?</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Your <span className="font-semibold text-gray-900">14-day free trial</span> has started. No charges until your trial ends. Explore all features risk-free!
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons - improved layout */}
          <div className="space-y-4">
            <Link href="/dashboard/listings/new" className="block">
              <Button 
                variant="primary" 
                className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate My First QR Code
              </Button>
            </Link>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsExtensionModalOpen(true)}
              className="w-full h-14 text-base font-semibold border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Install Chrome Extension
            </Button>
          </div>

          {/* Continue link - subtle */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button
              onClick={handleDismiss}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200"
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

