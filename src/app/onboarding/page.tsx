'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ImageUpload from '@/components/onboarding/ImageUpload';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Image from 'next/image';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    brokerage: '',
    license_number: '',
    calendly_url: '',
    avatar_url: null as string | null,
    logo_url: null as string | null,
  });

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Load existing profile data
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          brokerage: profile.brokerage || '',
          license_number: profile.license_number || '',
          calendly_url: profile.calendly_url || '',
          avatar_url: profile.avatar_url || null,
          logo_url: profile.logo_url || null,
        });
      }
    }
    checkUser();
  }, [router, supabase]);

  const handleImageUpload = async (type: 'avatar' | 'logo', file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`);
      }

      const { url } = await response.json();
      setFormData((prev) => ({
        ...prev,
        [type === 'avatar' ? 'avatar_url' : 'logo_url']: url,
      }));
      return url;
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          brokerage: formData.brokerage || null,
          license_number: formData.license_number || null,
          calendly_url: formData.calendly_url || null,
          avatar_url: formData.avatar_url || null,
          logo_url: formData.logo_url || null,
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to save profile'
      );
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Image
              src="/logo.png"
              alt="HomeQR"
              width={64}
              height={64}
              className="h-16 w-16 mx-auto object-contain"
              priority
            />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            Set up your agent profile to get started
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Basic Info</span>
            <span>Branding</span>
            <span>License</span>
            <span>Calendar</span>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Basic Information
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brokerage
                  </label>
                  <input
                    type="text"
                    value={formData.brokerage}
                    onChange={(e) =>
                      setFormData({ ...formData, brokerage: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Branding */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Agent Branding
                </h2>
                <ImageUpload
                  label="Headshot (Profile Photo)"
                  currentUrl={formData.avatar_url}
                  onUpload={(file) => handleImageUpload('avatar', file)}
                />
                <ImageUpload
                  label="Brokerage Logo"
                  currentUrl={formData.logo_url}
                  onUpload={(file) => handleImageUpload('logo', file)}
                />
              </div>
            )}

            {/* Step 3: License */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  License Information
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        license_number: e.target.value,
                      })
                    }
                    placeholder="e.g., CA-123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Adding your license number adds credibility to your
                    profile
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Calendar */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Calendar Integration
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calendly URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.calendly_url}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        calendly_url: e.target.value,
                      })
                    }
                    placeholder="https://calendly.com/your-username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Add your Calendly link to enable "Schedule a Showing" on
                    your property pages
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
              >
                Previous
              </Button>
              {step < 4 ? (
                <Button type="button" variant="primary" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Complete Setup'}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

