'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';

interface WelcomeScreenProps {
  onDismiss: () => void;
}

export default function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDismiss} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Free Trial is Active!</h2>
          <p className="text-gray-600">
            You&apos;re all set! Start generating QR codes and capturing leads today.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">🎉 What&apos;s Next?</p>
            <p className="text-sm text-blue-700">
              Your 14-day free trial has started. No charges until your trial ends. Explore all features risk-free!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/listings/new" className="block">
            <Button variant="primary" className="w-full">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Generate My First QR Code
            </Button>
          </Link>
          
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-600 mb-1">Or install the extension:</p>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-700 font-medium mb-1">Chrome Extension</p>
              <p className="text-xs text-gray-500">
                1. Go to chrome://extensions/
              </p>
              <p className="text-xs text-gray-500">
                2. Enable Developer mode
              </p>
              <p className="text-xs text-gray-500">
                3. Load unpacked from extension/ folder
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleDismiss}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

