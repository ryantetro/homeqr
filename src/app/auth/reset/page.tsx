'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

export default function ResetPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (resetError) throw resetError;

      setMessage('Check your email for a password reset link');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-10 transition-transform hover:scale-105">
            <Image
              src="/logo.png"
              alt="HomeQR"
              width={120}
              height={120}
              className="h-32 w-32 mx-auto object-contain"
              priority
            />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {message}
              </div>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

