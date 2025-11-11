'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [brokerage, setBrokerage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('User already registered')) {
            throw new Error('An account with this email already exists. Please sign in instead.');
          } else if (signUpError.message.includes('Password')) {
            throw new Error('Password must be at least 6 characters long.');
          } else {
            throw signUpError;
          }
        }

        // Update user profile with brokerage if user exists
        if (data.user) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ brokerage })
            .eq('id', data.user.id);

          if (updateError) {
            console.warn('Failed to update user brokerage:', updateError);
            // Don't block signup if brokerage update fails
          }
        }

        // Check if email confirmation is required
        if (data.user && !data.session) {
          setError('Please check your email to confirm your account before signing in.');
          setLoading(false);
          return;
        }

        // Redirect to dashboard for new users (immediate access)
        router.push('/dashboard');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // Provide more specific error messages
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please try again.');
          } else if (signInError.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and confirm your account before signing in.');
          } else {
            throw signInError;
          }
        }

        if (data.user) {
          router.push('/dashboard');
          router.refresh();
        }
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const message = err instanceof Error ? err.message : 'An error occurred. Please check your credentials and try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {mode === 'signup' && (
        <>
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            />
          </div>
          <div>
            <label htmlFor="brokerage" className="block text-sm font-semibold text-gray-700 mb-1">
              Brokerage (Optional)
            </label>
            <input
              id="brokerage"
              type="text"
              value={brokerage}
              onChange={(e) => setBrokerage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            />
          </div>
        </>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
        />
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
          {error}
        </div>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 mt-1 py-2.5"
        disabled={loading}
      >
        {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
      </Button>
    </form>
  );
}


