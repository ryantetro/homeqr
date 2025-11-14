'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ImageUpload from '@/components/onboarding/ImageUpload';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { PLAN_PRICES } from '@/lib/stripe/prices';
import { testimonials } from '@/lib/data/testimonials';
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
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      formDataObj.append('type', 'avatar');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      setFormData((prev) => ({ ...prev, avatar_url: url }));
      return url;
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image');
      return null;
    }
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

      // Save profile data
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              full_name: formData.full_name,
              phone: formData.phone || null,
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
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
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
                        Basic analytics
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Lead capture
                      </li>
                    </ul>
                  </div>
                </Card>

                {/* Monthly Pro - Default */}
                <Card
                  className={`cursor-pointer transition-all relative ${
                    selectedPlan === 'pro-monthly'
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan('pro-monthly')}
                >
                  <div className="absolute top-4 right-4">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Pro</h4>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        ${PLAN_PRICES.pro.monthly}
                      </span>
                      <span className="text-gray-600">/mo</span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Everything in Starter
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Advanced analytics
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

              {/* Testimonials */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">What agents are saying:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {testimonials.map((testimonial, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 italic mb-2">&ldquo;{testimonial.quote}&rdquo;</p>
                      <p className="text-xs text-gray-600 font-medium">
                        — {testimonial.author}, {testimonial.brokerage}
                      </p>
                    </div>
                  ))}
                </div>
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

