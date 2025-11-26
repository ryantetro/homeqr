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
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeValid, setPromoCodeValid] = useState<boolean | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState<{ percentOff?: number; amountOff?: string } | null>(null);
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

  const validatePromoCode = async (code: string) => {
    if (!code.trim()) {
      setPromoCodeValid(null);
      setPromoDiscount(null);
      return;
    }

    setValidatingPromo(true);
    try {
      const response = await fetch('/api/stripe/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();
      
      if (data.valid) {
        setPromoCodeValid(true);
        setPromoDiscount({
          percentOff: data.coupon.percentOff,
          amountOff: data.coupon.amountOff,
        });
      } else {
        setPromoCodeValid(false);
        setPromoDiscount(null);
      }
    } catch {
      setPromoCodeValid(false);
      setPromoDiscount(null);
    } finally {
      setValidatingPromo(false);
    }
  };

  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    setPromoCode(code);
    if (code.trim()) {
      // Debounce validation
      const timeoutId = setTimeout(() => {
        validatePromoCode(code);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setPromoCodeValid(null);
      setPromoDiscount(null);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Parse selected plan
      const [plan, billing] = selectedPlan.split('-') as ['starter' | 'pro', 'monthly' | 'annual'];
      
      // Validate promo code if provided
      let promotionCodeId: string | undefined;
      if (promoCode.trim()) {
        if (promoCodeValid !== true) {
          setError('Please enter a valid promotion code or remove it');
          setLoading(false);
          return;
        }
        // Get promotion code ID
        const validateResponse = await fetch('/api/stripe/validate-promo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: promoCode.trim() }),
        });
        const validateData = await validateResponse.json();
        if (validateData.valid) {
          promotionCodeId = validateData.promotionCodeId;
        }
      }
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          billing,
          promotionCode: promotionCodeId,
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
      
      <div className="relative bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 md:gap-3">
            <Image src="/logo.png" alt="HomeQR" width={32} height={32} className="h-6 w-6 md:h-8 md:w-8" />
            <h2 className="text-base md:text-xl font-bold text-gray-900">Get Started with HomeQR</h2>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className={`px-3 md:px-4 ${currentStep === 2 ? 'pt-2 pb-2 md:pt-3 md:pb-2' : 'pt-3 md:pt-4'}`}>
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className="text-xs md:text-sm font-medium text-gray-600">
              Step {currentStep} of 2
            </span>
            <span className="text-xs md:text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
            <div
              className="bg-blue-600 h-1.5 md:h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${currentStep === 2 ? 'p-2 md:p-4' : 'p-4 md:p-6'}`}>
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
            <div className="space-y-2 md:space-y-2">
              <div>
                <h3 className="text-base md:text-xl font-bold text-gray-900 mb-0.5 md:mb-0.5">Choose Your Plan</h3>
                <p className="text-xs md:text-sm text-gray-600 leading-tight">Start your 14-day free trial. No credit card charged until trial ends.</p>
              </div>

              {/* Discount Code Input */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={handlePromoCodeChange}
                      placeholder="Enter discount code"
                      className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 ${
                        promoCodeValid === false
                          ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-400'
                          : promoCodeValid === true
                          ? 'border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-400'
                          : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-400'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {validatingPromo && (
                        <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}
                      {promoCodeValid === true && !validatingPromo && (
                        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {promoCodeValid === false && !validatingPromo && promoCode.trim() && (
                        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
                {promoCodeValid === true && promoDiscount && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 border border-green-200 rounded-lg">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-800 font-semibold">
                        {promoDiscount.percentOff ? `${promoDiscount.percentOff}% off` : promoDiscount.amountOff ? `${promoDiscount.amountOff} off` : 'Discount applied'}
                      </span>
                    </div>
                  </div>
                )}
                {promoCodeValid === false && promoCode.trim() && !validatingPromo && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-red-700">Invalid discount code</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Cards - 3 Options */}
              <div className="grid grid-cols-3 gap-1.5 md:gap-3">
                {/* Monthly Starter */}
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedPlan === 'starter-monthly'
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlan('starter-monthly')}
                >
                  <div className="p-2 md:p-4">
                    <h4 className="text-xs md:text-lg font-bold text-gray-900 mb-1 md:mb-1.5">Starter</h4>
                    <div className="mb-2 md:mb-3">
                      <span className="text-base md:text-2xl font-bold text-gray-900">
                        ${PLAN_PRICES.starter.monthly}
                      </span>
                      <span className="text-[10px] md:text-sm text-gray-600">/mo</span>
                    </div>
                    <ul className="space-y-0.5 md:space-y-1.5 text-[9px] md:text-xs text-gray-600 mb-2 md:mb-2">
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="leading-tight">Unlimited QR codes</span>
                      </li>
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="leading-tight">Unlimited listings</span>
                      </li>
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="leading-tight">Unlimited photos</span>
                      </li>
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="leading-tight">Basic analytics</span>
                      </li>
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="leading-tight">Lead forms</span>
                      </li>
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="leading-tight">Microsites</span>
                      </li>
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="leading-tight">AI listings</span>
                      </li>
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="leading-tight">Extension</span>
                      </li>
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="leading-tight">30-day retention</span>
                      </li>
                    </ul>
                  </div>
                </Card>

                {/* Monthly Pro - Default */}
                <Card
                  className={`cursor-pointer transition-all relative ${
                    selectedPlan === 'pro-monthly'
                      ? 'ring-2 ring-blue-500 border-blue-500 shadow-xl'
                      : 'border-2 border-blue-200 hover:border-blue-300 shadow-lg hover:shadow-xl'
                  } bg-gradient-to-br from-blue-50 to-indigo-50`}
                  onClick={() => setSelectedPlan('pro-monthly')}
                >
                  <div className="absolute -top-1.5 md:-top-2.5 right-1.5 md:right-3 z-10">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[8px] md:text-xs font-bold px-1.5 md:px-3 py-0.5 md:py-1 rounded-full shadow-md flex items-center gap-0.5 md:gap-1">
                      <svg className="w-2 h-2 md:w-3 md:h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="hidden sm:inline">Most Popular</span>
                      <span className="sm:hidden">Popular</span>
                    </span>
                  </div>
                  <div className="p-2 md:p-4 pt-4 md:pt-6">
                    <div className="flex items-center gap-1 md:gap-1.5 mb-1 md:mb-1.5">
                      <h4 className="text-xs md:text-lg font-bold text-gray-900">Pro</h4>
                      <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div className="mb-2 md:mb-3">
                      <div className="flex items-baseline gap-0.5 md:gap-1">
                        <span className="text-lg md:text-3xl font-extrabold text-gray-900">
                          ${PLAN_PRICES.pro.monthly}
                        </span>
                        <span className="text-[10px] md:text-sm text-gray-600 font-medium">/mo</span>
                      </div>
                    </div>
                    <ul className="space-y-0.5 md:space-y-1.5 text-[9px] md:text-xs mb-2 md:mb-2">
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-green-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 leading-tight">Everything in Starter</span>
                      </li>
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-gray-700 leading-tight">
                          <span className="font-semibold text-gray-900">Advanced analytics</span>
                          <span className="text-gray-600 hidden md:inline"> — funnels, insights</span>
                        </span>
                      </li>
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-gray-700 leading-tight">
                          <span className="font-semibold text-gray-900">Export CSV</span>
                        </span>
                      </li>
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-green-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 leading-tight">
                          <span className="font-semibold text-gray-900">Unlimited retention</span>
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
                  <div className="absolute top-1.5 md:top-3 right-1.5 md:right-3 z-10">
                    <span className="bg-green-100 text-green-800 text-[8px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 rounded-full shadow-sm">
                      Save 25%
                    </span>
                  </div>
                  <div className="p-2 md:p-4">
                    <h4 className="text-xs md:text-lg font-bold text-gray-900 mb-1 md:mb-1.5 pr-14 md:pr-20">Pro Annual</h4>
                    <div className="mb-2 md:mb-3">
                      <span className="text-base md:text-2xl font-bold text-gray-900">
                        ${PLAN_PRICES.pro.annual}
                      </span>
                      <span className="text-[10px] md:text-sm text-gray-600">/yr</span>
                      <p className="text-[9px] md:text-xs text-gray-500 mt-0.5 leading-tight">
                        ${Math.round(PLAN_PRICES.pro.annual / 12)}/mo billed annually
                      </p>
                    </div>
                    <ul className="space-y-0.5 md:space-y-1.5 text-[9px] md:text-xs text-gray-600 mb-2 md:mb-2">
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="leading-tight">Everything in Pro</span>
                      </li>
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="leading-tight">Best value</span>
                      </li>
                      <li className="flex items-start gap-1 md:gap-1.5">
                        <svg className="w-2.5 h-2.5 md:w-4 md:h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="leading-tight">Priority support</span>
                      </li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 md:p-4 border-t border-gray-200 bg-gray-50 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs md:text-sm h-8 md:h-10 px-3 md:px-5"
            onClick={() => currentStep === 1 ? onDismiss() : setCurrentStep(1)}
          >
            {currentStep === 1 ? 'Skip for now' : 'Back'}
          </Button>
          {currentStep === 1 ? (
            <Button 
              type="button" 
              variant="primary" 
              size="sm"
              className="text-xs md:text-sm h-8 md:h-10 px-3 md:px-5"
              onClick={handleNext} 
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Next'}
            </Button>
          ) : (
            <Button 
              type="button" 
              variant="primary" 
              size="sm"
              className="text-xs md:text-sm h-8 md:h-10 px-3 md:px-5"
              onClick={handleCheckout} 
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Secure Checkout'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

