'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ImageUpload from '@/components/onboarding/ImageUpload';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { PLAN_PRICES } from '@/lib/stripe/prices';
import Image from 'next/image';

interface TrialOnboardingModalProps {
  onComplete: () => void;
  onDismiss: () => void;
}

export default function TrialOnboardingModal({ onDismiss }: TrialOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'starter-monthly' | 'pro-monthly' | 'pro-annual'>('pro-monthly');
  const supabase = createClient();

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    brokerage: '',
    avatar_url: null as string | null,
  });

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, phone, brokerage, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            phone: profile.phone || '',
            brokerage: profile.brokerage || '',
            avatar_url: profile.avatar_url || null,
          });
        }
      }
    }
    loadProfile();
  }, [supabase]);

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`);
      }

      const { url } = await response.json();
      setFormData((prev) => ({ ...prev, avatar_url: url }));
      return url;
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return null;
    }
  };

  // Format phone number as user types
  const formatPhoneInput = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits (US phone number)
    const limited = digits.slice(0, 10);
    
    // Format as (XXX) XXX-XXXX
    if (limited.length === 0) return '';
    if (limited.length <= 3) return `(${limited}`;
    if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  };

  // Validate phone number format
  const isValidPhone = (phone: string | null | undefined): boolean => {
    if (!phone || phone.trim() === '') return true; // Optional field
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.full_name.trim()) {
        setError('Full name is required');
        return;
      }
      if (!formData.avatar_url) {
        setError('Profile photo is required');
        return;
      }
      // Validate phone if provided
      if (formData.phone && !isValidPhone(formData.phone)) {
        setError('Please enter a valid phone number (10 digits)');
        return;
      }

      // Save profile data
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Clean phone number (store digits only)
          const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : null;
          
          const { error: updateError } = await supabase
            .from('users')
            .update({
              full_name: formData.full_name,
              phone: cleanPhone || null,
              brokerage: formData.brokerage || null,
              avatar_url: formData.avatar_url,
            })
            .eq('id', user.id);

          if (updateError) throw updateError;
        }
      } catch {
        setError('Failed to save profile');
        return;
      } finally {
        setLoading(false);
      }
    }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Parse selected plan
      const [plan, billing] = selectedPlan.split('-') as ['starter' | 'pro', 'monthly' | 'annual'];
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          billing,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        
        // Handle Stripe not configured
        if (response.status === 503 || data.configured === false) {
          setError('Payment integration is coming soon! For now, contact support to enable your account or request beta access.');
          return;
        }
        
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / 2) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDismiss} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="HomeQR" width={32} height={32} className="h-8 w-8" />
            <h2 className="text-xl font-bold text-gray-900">Get Started with HomeQR</h2>
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
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of 2
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Profile Setup */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Quick Profile Setup</h3>
                <p className="text-gray-600">Let&apos;s personalize your account</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo <span className="text-red-500">*</span>
                  </label>
                  <ImageUpload
                    label="Upload Headshot"
                    currentUrl={formData.avatar_url}
                    onUpload={handleImageUpload}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      formData.phone && !isValidPhone(formData.phone)
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="(555) 123-4567"
                    maxLength={14} // (XXX) XXX-XXXX format
                  />
                  {formData.phone && !isValidPhone(formData.phone) && (
                    <p className="mt-1 text-xs text-red-600">
                      Please enter a valid 10-digit phone number
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brokerage (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.brokerage}
                    onChange={(e) => setFormData({ ...formData, brokerage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="RE/MAX, KW, etc."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Choose Plan */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h3>
                <p className="text-gray-600">Start your 14-day free trial. No credit card charged until trial ends.</p>
              </div>

              {/* ROI Message */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  💡 Most agents get 3–10 unrepresented buyers per month with HomeQR
                </p>
              </div>

              {/* Pricing Cards - 3 Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Monthly Starter */}
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedPlan === 'starter-monthly'
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan('starter-monthly')}
                >
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Starter</h4>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        ${PLAN_PRICES.starter.monthly}
                      </span>
                      <span className="text-gray-600">/mo</span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Unlimited QR codes
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Basic analytics dashboard
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Lead capture forms
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Property microsites
                      </li>
                    </ul>
                  </div>
                </Card>

                {/* Monthly Pro - Default */}
                <Card
                  className={`cursor-pointer transition-all relative transform ${
                    selectedPlan === 'pro-monthly'
                      ? 'ring-2 ring-blue-500 border-blue-500 scale-105 shadow-xl'
                      : 'border-2 border-blue-200 hover:border-blue-300 shadow-lg hover:shadow-xl'
                  } bg-gradient-to-br from-blue-50 to-indigo-50`}
                  onClick={() => setSelectedPlan('pro-monthly')}
                >
                  <div className="absolute -top-3 right-4 z-10">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Most Popular
                    </span>
                  </div>
                  <div className="p-6 pt-8">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-2xl font-bold text-gray-900">Pro</h4>
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-gray-900">
                          ${PLAN_PRICES.pro.monthly}
                        </span>
                        <span className="text-lg text-gray-600 font-medium">/mo</span>
                      </div>
                    </div>
                    <ul className="space-y-3 text-sm mb-4">
                      <li className="flex items-start gap-2.5">
                        <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">Everything in Starter</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-gray-700">
                          <span className="font-semibold text-gray-900">Advanced analytics</span>
                          <span className="text-gray-600"> — conversion funnels, time-of-day insights</span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-gray-700">
                          <span className="font-semibold text-gray-900">AI-enhanced listings</span>
                          <span className="text-gray-600"> — auto-generated descriptions & features</span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-gray-700">
                          <span className="font-semibold text-gray-900">Export leads to CSV</span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">
                          <span className="font-semibold text-gray-900">Priority support</span>
                        </span>
                      </li>
                    </ul>
                  </div>
                </Card>

                {/* Annual Pro */}
                <Card
                  className={`cursor-pointer transition-all relative ${
                    selectedPlan === 'pro-annual'
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan('pro-annual')}
                >
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                      Save 25%
                    </span>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Pro Annual</h4>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        ${PLAN_PRICES.pro.annual}
                      </span>
                      <span className="text-gray-600">/yr</span>
                      <p className="text-xs text-gray-500 mt-1">
                        ${Math.round(PLAN_PRICES.pro.annual / 12)}/mo billed annually
                      </p>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Everything in Pro
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Best value
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Priority support
                      </li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={() => currentStep === 1 ? onDismiss() : setCurrentStep(1)}
          >
            {currentStep === 1 ? 'Skip for now' : 'Back'}
          </Button>
          {currentStep === 1 ? (
            <Button type="button" variant="primary" onClick={handleNext} disabled={loading}>
              {loading ? 'Saving...' : 'Next'}
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={handleCheckout} disabled={loading}>
              {loading ? 'Processing...' : 'Secure Checkout'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

