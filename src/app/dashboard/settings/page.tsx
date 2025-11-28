'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ImageUpload from '@/components/onboarding/ImageUpload';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    brokerage: '',
    license_number: '',
    calendly_url: '',
    avatar_url: null as string | null,
    logo_url: null as string | null,
  });
  const [subscription, setSubscription] = useState<{
    status: string;
    plan: string;
    current_period_end: string | null;
  } | null>(null);
  const [isBetaUser, setIsBetaUser] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadSubscription();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          brokerage: data.brokerage || '',
          license_number: data.license_number || '',
          calendly_url: data.calendly_url || '',
          avatar_url: data.avatar_url || null,
          logo_url: data.logo_url || null,
        });
        setIsBetaUser(data.is_beta_user || false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan, current_period_end')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSubscription(data);
      }
    } catch (err: any) {
      // Don't show error for subscription - it's optional
      console.error('Failed to load subscription:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          brokerage: profile.brokerage,
          license_number: profile.license_number || null,
          calendly_url: profile.calendly_url || null,
          avatar_url: profile.avatar_url || null,
          logo_url: profile.logo_url || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
      setProfile((prev) => ({
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

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your profile and account settings
        </p>
      </div>

      {/* Billing Section */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Billing & Subscription</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage your subscription, payment methods, and billing information
              </p>
            </div>
            <Link href="/dashboard/billing">
              <Button variant="primary">
                Manage Billing
              </Button>
            </Link>
          </div>

          {isBetaUser ? (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Beta User</p>
                <p className="text-xs text-blue-700">You have full access with no billing required</p>
              </div>
            </div>
          ) : subscription ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Current Plan</p>
                  <p className="text-xs text-gray-600 capitalize mt-1">
                    HomeQR Plan
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {(() => {
                      // Check if period has ended even if status is trialing
                      if (subscription.current_period_end) {
                        const endDate = new Date(subscription.current_period_end);
                        const now = new Date();
                        if (endDate < now && subscription.status === 'trialing') {
                          return 'Trial Expired';
                        }
                      }
                      return subscription.status === 'trialing' ? 'Free Trial' : 
                             subscription.status === 'active' ? 'Active' : 
                             subscription.status === 'past_due' ? 'Payment Required' : 
                             subscription.status;
                    })()}
                  </p>
                  {subscription.current_period_end && (
                    <p className="text-xs text-gray-600 mt-1">
                      {(() => {
                        const endDate = new Date(subscription.current_period_end);
                        const now = new Date();
                        if (endDate < now) {
                          return 'Expired';
                        }
                        return subscription.status === 'trialing' ? 'Trial ends' : 'Renews';
                      })()} {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No active subscription. <Link href="/dashboard/billing" className="font-medium underline hover:text-yellow-900">Start your free trial</Link> to get started.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Profile Section */}
      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Profile Information
            </h2>

            <div className="space-y-4">
              <ImageUpload
                label="Profile Photo (Headshot)"
                currentUrl={profile.avatar_url}
                onUpload={(file) => handleImageUpload('avatar', file)}
              />
              <ImageUpload
                label="Brokerage Logo"
                currentUrl={profile.logo_url}
                onUpload={(file) => handleImageUpload('logo', file)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brokerage
                </label>
                <input
                  type="text"
                  value={profile.brokerage}
                  onChange={(e) => setProfile({ ...profile, brokerage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  value={profile.license_number}
                  onChange={(e) => setProfile({ ...profile, license_number: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calendly URL
                </label>
                <input
                  type="url"
                  value={profile.calendly_url}
                  onChange={(e) => setProfile({ ...profile, calendly_url: e.target.value })}
                  placeholder="https://calendly.com/your-username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Your Calendly scheduling link for "Schedule a Showing" button
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              Profile updated successfully!
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}



