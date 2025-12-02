'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import PaymentPlaceholderForm from './PaymentPlaceholderForm';
import Image from 'next/image';
import ExtensionInstallModal from '@/components/dashboard/ExtensionInstallModal';

interface OnboardingModalProps {
  onComplete: () => void;
  onDismiss: () => void;
}

export default function OnboardingModal({ onComplete, onDismiss }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const totalSteps = 6;
  const supabase = createClient();

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
      });

      if (response.ok) {
        onComplete();
      } else {
        console.error('Failed to mark onboarding as complete');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="HomeQR"
              width={32}
              height={32}
              className="h-7 w-7"
            />
            <h2 className="text-lg font-bold text-gray-900">Welcome to HomeQR</h2>
          </div>
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-xs text-gray-500">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1.5">
                  Welcome to HomeQR!
                </h3>
                <p className="text-sm text-gray-600">
                  Let&apos;s get you set up in just a few steps
                </p>
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Generate QR Codes Instantly</p>
                    <p className="text-xs text-gray-600">Create QR codes for any property listing with our Chrome extension</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-green-50 rounded-lg">
                  <svg className="w-4 h-4 text-green-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Track Leads & Analytics</p>
                    <p className="text-xs text-gray-600">See who&apos;s interested and convert more leads</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-purple-50 rounded-lg">
                  <svg className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Beautiful Property Microsites</p>
                    <p className="text-xs text-gray-600">Share professional listing pages that capture leads</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Extension Download */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1.5">
                  Download Chrome Extension
                </h3>
                <p className="text-sm text-gray-600">
                  Our Chrome extension lets you generate QR codes directly from any property listing page
                </p>
              </div>
              <div className="mt-4">
                <a
                  href="https://chromewebstore.google.com/detail/miggfgghddpmbnblcoodakemagbjlenf?utm_source=item-share-cb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full group"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span>Get Chrome Extension</span>
                    <svg className="w-4 h-4 ml-2 opacity-70 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Button>
                </a>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Opens Chrome Web Store in a new tab
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Personalization */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1.5">
                  Personalize Your Profile
                </h3>
                <p className="text-sm text-gray-600">
                  Make your listings stand out with your branding
                </p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Profile Photo</p>
                      <p className="text-xs text-gray-600">Add your headshot to build trust</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Brokerage Logo</p>
                      <p className="text-xs text-gray-600">Display your brokerage branding</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Contact Information</p>
                      <p className="text-xs text-gray-600">Add phone, email, and Calendly link</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> You can update your profile anytime from Settings in the dashboard.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Understanding Listings */}
          {currentStep === 4 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1.5">
                  Understanding Listings
                </h3>
                <p className="text-sm text-gray-600">
                  Learn how to create and manage your property listings
                </p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Creating Listings</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    There are two easy ways to create listings from Zillow, Realtor.com, Redfin, or any listing site. Both methods automatically extract property details.
                  </p>
                  
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-800 mb-1.5">Method 1: Paste Listing URL</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-xs text-gray-700 ml-2">
                      <li>Copy the URL from any property listing page</li>
                      <li>Go to your dashboard&apos;s Quick Actions section</li>
                      <li>Paste the URL in the &quot;Add Property&quot; field</li>
                      <li>Click &quot;Add&quot; - your listing is created automatically!</li>
                    </ol>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-gray-800 mb-1.5">Method 2: Chrome Extension</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-xs text-gray-700 ml-2">
                      <li>Visit any property listing page</li>
                      <li>Click the HomeQR extension icon</li>
                      <li>Click &quot;Generate QR Code&quot;</li>
                      <li>Your listing is created automatically!</li>
                    </ol>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1.5">QR Code Generation</h4>
                  <p className="text-xs text-gray-600">
                    Each listing automatically gets a unique QR code. Download it to print on signs, flyers, or marketing materials.
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Managing Listings</h4>
                  <p className="text-xs text-gray-600">
                    View all your listings in the dashboard. Edit details, view analytics, and manage QR codes from one place.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Understanding Microsites */}
          {currentStep === 5 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1.5">
                  Understanding Microsites
                </h3>
                <p className="text-sm text-gray-600">
                  Beautiful, shareable property pages that capture leads
                </p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1.5">What are Microsites?</h4>
                  <p className="text-xs text-gray-700">
                    Each listing gets a beautiful, professional microsite page. When someone scans your QR code or visits the link, they see a branded property page with your contact information.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-900 mb-0.5">Shareable Links</p>
                    <p className="text-[10px] text-gray-600">Share microsite URLs via text, email, or social media</p>
                  </div>
                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-900 mb-0.5">Lead Capture</p>
                    <p className="text-[10px] text-gray-600">Built-in contact forms capture interested buyers</p>
                  </div>
                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-900 mb-0.5">Mobile Optimized</p>
                    <p className="text-[10px] text-gray-600">Looks great on any device</p>
                  </div>
                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-900 mb-0.5">Your Branding</p>
                    <p className="text-[10px] text-gray-600">Features your photo, logo, and contact info</p>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-800">
                    <strong>Pro Tip:</strong> View any of your listings in the dashboard and click &quot;View Microsite&quot; to see how it looks to potential buyers!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Understanding Analytics */}
          {currentStep === 6 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1.5">
                  Understanding Analytics
                </h3>
                <p className="text-sm text-gray-600">
                  Track your marketing performance and optimize your strategy
                </p>
              </div>
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <div className="text-xl font-bold text-blue-600 mb-0.5">👁️</div>
                    <p className="text-xs font-semibold text-gray-900">Scans</p>
                    <p className="text-[10px] text-gray-600">QR code scans</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <div className="text-xl font-bold text-green-600 mb-0.5">🎯</div>
                    <p className="text-xs font-semibold text-gray-900">Leads</p>
                    <p className="text-[10px] text-gray-600">Contact form submissions</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <div className="text-xl font-bold text-purple-600 mb-0.5">📊</div>
                    <p className="text-xs font-semibold text-gray-900">Conversion</p>
                    <p className="text-[10px] text-gray-600">Lead conversion rate</p>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1.5">Key Metrics</h4>
                  <ul className="space-y-1.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span><strong>Total Scans:</strong> How many times your QR codes were scanned</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span><strong>Total Leads:</strong> How many people submitted contact forms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600">•</span>
                      <span><strong>Conversion Rate:</strong> Percentage of visitors who become leads</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600">•</span>
                      <span><strong>Top Properties:</strong> See which listings perform best</span>
                    </li>
                  </ul>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Insight:</strong> Use analytics to see which marketing channels work best and optimize your QR code placement!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-3">
            <button
              onClick={onDismiss}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Skip for now
            </button>
            <Button
              type="button"
              variant="primary"
              onClick={nextStep}
              disabled={loading}
            >
              {currentStep === totalSteps
                ? loading
                  ? 'Completing...'
                  : 'Get Started'
                : 'Next'}
            </Button>
          </div>
        </div>
      </div>
      <ExtensionInstallModal isOpen={isExtensionModalOpen} onClose={() => setIsExtensionModalOpen(false)} />
    </div>
  );
}

