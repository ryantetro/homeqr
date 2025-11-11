import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import BillingClient from '@/components/dashboard/BillingClient';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Get user data
  const { data: userData } = await supabase
    .from('users')
    .select('is_beta_user')
    .eq('id', user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing</h1>
        <p className="text-gray-600">Manage your subscription and payment methods</p>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          {userData?.is_beta_user ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Beta User</h3>
              <p className="text-gray-600">
                You&apos;re on a beta account with full access. No billing required.
              </p>
            </div>
          ) : subscription ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">{subscription.plan} Plan</p>
                    <p className="text-sm text-gray-600">
                      Status: <span className="capitalize font-medium">{subscription.status}</span>
                    </p>
                    {subscription.current_period_end && (
                      <p className="text-sm text-gray-600 mt-1">
                        {subscription.status === 'trialing' 
                          ? `Trial ends: ${new Date(subscription.current_period_end).toLocaleDateString()}`
                          : `Renews: ${new Date(subscription.current_period_end).toLocaleDateString()}`
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <BillingClient />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No active subscription</p>
              <Link href="/dashboard">
                <Button>Start Free Trial</Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

