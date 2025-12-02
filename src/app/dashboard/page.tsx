import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { calculateConversionRate } from '@/lib/utils/analytics';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import ExtensionLink from '@/components/dashboard/ExtensionLink';
import TopPerformingProperties from '@/components/dashboard/TopPerformingProperties';
import OnboardingModalWrapper from '@/components/dashboard/OnboardingModalWrapper';
import DashboardClient from '@/components/dashboard/DashboardClient';
import UsageNudge from '@/components/dashboard/UsageNudge';
import ExpiredTrialOverlay from '@/components/dashboard/ExpiredTrialOverlay';
import QuickAddProperty from '@/components/dashboard/QuickAddProperty';
import DebugWelcomeButton from '@/components/dashboard/DebugWelcomeButton';
import DebugModals from '@/components/dashboard/DebugModals';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Suspense } from 'react';

export const revalidate = 0; // Force revalidation on every request to prevent caching

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user data and subscription status (no payment gating - all users can access)
  const { data: userData } = await supabase
    .from('users')
    .select('onboarding_completed, has_paid, is_beta_user, full_name')
    .eq('id', user.id)
    .single();

  // Check for active subscription (trial or paid)
  // Note: trial_started_at column may not exist if migration hasn't been run
  const { data: initialSubscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('status, plan, current_period_start, current_period_end')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .maybeSingle();
  
  let subscription = initialSubscription;

  // If no subscription found in database, check Stripe automatically
  // This handles cases where webhook hasn't fired yet or failed
  if (!subscription && stripe && user.email && !userData?.is_beta_user) {
    try {
      // Look up customer in Stripe by email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        
        // Get active subscriptions for this customer
        const stripeSubscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'all',
          limit: 10,
        });

        // Find active or trialing subscriptions
        const foundSubscription = stripeSubscriptions.data.find(
          (sub) => ['active', 'trialing', 'past_due'].includes(sub.status)
        );

        if (foundSubscription) {
          const activeSubscription = foundSubscription as unknown as {
            id: string;
            status: string;
            current_period_start: number;
            current_period_end: number;
            trial_start: number | null;
            trial_end: number | null;
            items: {
              data: Array<{
                price?: {
                  id: string;
                };
              }>;
            };
          };

          // Sync subscription to database
          const supabaseAdmin = createSupabaseAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          // All subscriptions now use single plan
          const plan = 'homeqr';

          const periodEnd = activeSubscription.current_period_end 
            ? new Date(activeSubscription.current_period_end * 1000).toISOString()
            : activeSubscription.trial_end 
            ? new Date(activeSubscription.trial_end * 1000).toISOString()
            : null;
          
          const periodStart = activeSubscription.current_period_start
            ? new Date(activeSubscription.current_period_start * 1000).toISOString()
            : activeSubscription.trial_start
            ? new Date(activeSubscription.trial_start * 1000).toISOString()
            : null;

          // Check if subscription already exists
          const { data: existing } = await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('stripe_subscription_id', activeSubscription.id)
            .maybeSingle();

          const subscriptionData = {
            user_id: user.id,
            stripe_customer_id: customer.id,
            stripe_subscription_id: activeSubscription.id,
            status: activeSubscription.status === 'trialing' ? 'trialing' : activeSubscription.status,
            plan: plan,
            current_period_start: periodStart,
            current_period_end: periodEnd,
          };

          if (existing) {
            // Update existing
            const { data: updated } = await supabaseAdmin
              .from('subscriptions')
              .update(subscriptionData)
              .eq('stripe_subscription_id', activeSubscription.id)
              .select('status, plan, current_period_start, current_period_end')
              .single();
            
            if (updated) {
              subscription = updated;
              console.log('[Dashboard] Auto-synced existing subscription from Stripe');
            }
          } else {
            // Insert new
            const { data: inserted } = await supabaseAdmin
              .from('subscriptions')
              .insert(subscriptionData)
              .select('status, plan, current_period_start, current_period_end')
              .single();
            
            if (inserted) {
              subscription = inserted;
              console.log('[Dashboard] Auto-synced new subscription from Stripe');
            }
          }
        }
      }
    } catch (error) {
      // Log error but don't fail the page load
      console.error('[Dashboard] Error auto-syncing subscription from Stripe:', error);
    }
  }

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dashboard] Subscription query:', {
      userId: user.id,
      subscriptionFound: !!subscription,
      subscriptionStatus: subscription?.status,
      subscriptionError: subscriptionError?.message,
    });
  }

  // Check if subscription is expired
  const isExpired =
    !userData?.is_beta_user &&
    subscription &&
    (subscription.status === 'past_due' ||
      (subscription.current_period_end &&
        new Date(subscription.current_period_end) < new Date() &&
        subscription.status !== 'active'));

  const showOnboarding = !userData?.onboarding_completed;

  // Get user's listings count
  const { count: listingsCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active');

  // Get user's listing IDs first
  const { data: userListings } = await supabase
    .from('listings')
    .select('id')
    .eq('user_id', user.id);
  
  const listingIds = userListings?.map((l) => l.id) || [];

  // Get ALL analytics data (SINGLE source of truth)
  const { data: allAnalytics } = await supabase
    .from('analytics')
    .select('total_scans, total_leads')
    .in('listing_id', listingIds);

  // Aggregate totals from analytics (ALL TIME) - analytics is the ONLY source of truth
  const totalScans = allAnalytics?.reduce((sum, a) => sum + (a.total_scans || 0), 0) || 0;

  // Get total leads (from analytics table, aggregated)
  const totalLeadsFromAnalytics = allAnalytics?.reduce((sum, a) => sum + (a.total_leads || 0), 0) || 0;
  
  // Also get direct count from leads table as backup
  const { count: leadsCountDirect } = listingIds.length > 0
    ? await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('listing_id', listingIds)
    : { count: 0 };
  
  const leadsCount = Math.max(totalLeadsFromAnalytics, leadsCountDirect || 0);

  // Calculate conversion rate (using all-time data) - QR scans only
  const conversionRate = calculateConversionRate(totalScans, leadsCount);

  // Get this week's scans and leads (for the "This week" cards)
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const { data: thisWeekAnalytics } = await supabase
    .from('analytics')
    .select('total_scans, total_leads')
    .in('listing_id', listingIds)
    .gte('date', thisWeekStart.toISOString().split('T')[0]);

  const thisWeekScans =
    thisWeekAnalytics?.reduce((sum, a) => sum + (a.total_scans || 0), 0) || 0;
  const thisWeekLeads =
    thisWeekAnalytics?.reduce((sum, a) => sum + (a.total_leads || 0), 0) || 0;
  
  // Get this week's microsite visits (page_views)
  const { data: thisWeekPageViews } = await supabase
    .from('analytics')
    .select('page_views')
    .in('listing_id', listingIds)
    .gte('date', thisWeekStart.toISOString().split('T')[0]);
  
  const thisWeekMicrositeVisits =
    thisWeekPageViews?.reduce((sum, a) => sum + (a.page_views || 0), 0) || 0;

  // Get ALL listings first (not just 5)
  const { data: allListingsForTop } = await supabase
    .from('listings')
    .select('id, address, city, state')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const topPerformers = await Promise.all(
    (allListingsForTop || []).map(async (listing) => {
      const { data: listingAnalytics } = await supabase
        .from('analytics')
        .select('total_scans, total_leads, page_views')
        .eq('listing_id', listing.id);

      const listingScans =
        listingAnalytics?.reduce((sum, a) => sum + (a.total_scans || 0), 0) || 0;
      const listingLeads =
        listingAnalytics?.reduce((sum, a) => sum + (a.total_leads || 0), 0) || 0;
      const listingPageViews =
        listingAnalytics?.reduce((sum, a) => sum + (a.page_views || 0), 0) || 0;
      const listingConversionRate = calculateConversionRate(listingScans, listingLeads, {
        includePageViews: true,
        pageViews: listingPageViews,
      });

      return {
        listing_id: listing.id,
        address: listing.address,
        city: listing.city,
        state: listing.state,
        total_scans: listingScans,
        total_page_views: listingPageViews,
        total_leads: listingLeads,
        conversion_rate: listingConversionRate,
      };
    })
  );

  // Sort by activity (properties with activity first)
  topPerformers.sort((a, b) => {
    const aActivity = a.total_scans + a.total_page_views + a.total_leads;
    const bActivity = b.total_scans + b.total_page_views + b.total_leads;
    
    // Properties with activity always come first
    if (aActivity === 0 && bActivity > 0) return 1;
    if (bActivity === 0 && aActivity > 0) return -1;
    if (aActivity === 0 && bActivity === 0) return 0;
    
    // Then sort by conversion rate
    if (Math.abs(b.conversion_rate - a.conversion_rate) > 0.1) {
      return b.conversion_rate - a.conversion_rate;
    }
    
    // Finally by total traffic (scans + page views)
    const aTraffic = a.total_scans + a.total_page_views;
    const bTraffic = b.total_scans + b.total_page_views;
    return bTraffic - aTraffic;
  });

  return (
    <div>
      {/* Trial Banner and Modals - Client Component */}
      <Suspense fallback={null}>
        <DashboardClient
          subscription={subscription}
          isBetaUser={userData?.is_beta_user || false}
          onboardingCompleted={userData?.onboarding_completed || false}
        />
      </Suspense>

      {/* Legacy Onboarding Modal - Only show if onboarding not completed and has subscription */}
      {showOnboarding && subscription && (
        <Suspense fallback={null}>
          <OnboardingModalWrapper />
        </Suspense>
      )}

      {/* Usage Nudge - Show for trialing users */}
      {subscription?.status === 'trialing' && !userData?.is_beta_user && (
        <UsageNudge subscriptionStatus={subscription.status} />
      )}

      {/* Dashboard Content */}
      {isExpired ? (
        <ExpiredTrialOverlay>
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h1>
            <p className="text-gray-600">
              Here&apos;s how your properties are performing
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {conversionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  {leadsCount || 0} of {totalScans} converted
                </p>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">QR Scans</p>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{thisWeekScans}</p>
                <p className="text-sm text-gray-500">Past 7 days</p>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">New Leads</p>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{thisWeekLeads}</p>
                <p className="text-sm text-gray-500">Past 7 days</p>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Microsite Visits</p>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{thisWeekMicrositeVisits}</p>
                <p className="text-sm text-gray-500">Past 7 days</p>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Properties</p>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{listingsCount || 0}</p>
                <p className="text-sm text-gray-500">Active campaigns</p>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/analytics">
                  <Button variant="primary" size="md">
                    View Analytics
                  </Button>
                </Link>
                <Link href="/dashboard/listings">
                  <Button variant="outline" size="md">
                    Manage Properties
                  </Button>
                </Link>
                <ExtensionLink />
                <DebugWelcomeButton />
                <DebugModals />
              </div>
            </div>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Recent Activity */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
                <ActivityFeed />
              </div>
            </Card>

            {/* Top Performers */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">
                  Top Performing Properties
                </h2>
                <TopPerformingProperties performers={topPerformers} />
              </div>
            </Card>
          </div>
        </ExpiredTrialOverlay>
      ) : (
        <>
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h1>
            <p className="text-gray-600">
              Here&apos;s how your properties are performing
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {conversionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  {leadsCount || 0} of {totalScans} converted
                </p>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">QR Scans</p>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{thisWeekScans}</p>
                <p className="text-sm text-gray-500">Past 7 days</p>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">New Leads</p>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{thisWeekLeads}</p>
                <p className="text-sm text-gray-500">Past 7 days</p>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Microsite Visits</p>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{thisWeekMicrositeVisits}</p>
                <p className="text-sm text-gray-500">Past 7 days</p>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Properties</p>
                    </div>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{listingsCount || 0}</p>
                <p className="text-sm text-gray-500">Active campaigns</p>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              
              {/* Add Property Input */}
              <div className="mb-4">
                <QuickAddProperty />
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/analytics">
                  <Button variant="primary" size="md">
                    View Analytics
                  </Button>
                </Link>
                <Link href="/dashboard/listings">
                  <Button variant="outline" size="md">
                    Manage Properties
                  </Button>
                </Link>
                <ExtensionLink />
                <DebugWelcomeButton />
                <DebugModals />
              </div>
            </div>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Recent Activity */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
                <ActivityFeed />
              </div>
            </Card>

            {/* Top Performers */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-5">
                  Top Performing Properties
                </h2>
                <TopPerformingProperties performers={topPerformers} />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}


