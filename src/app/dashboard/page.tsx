import { createClient } from '@/lib/supabase/server';
import StatsCard from '@/components/dashboard/StatsCard';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

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

  // Get total scans
  let totalScans = 0;
  if (listingIds.length > 0) {
    const { data: scansData } = await supabase
      .from('qrcodes')
      .select('scan_count')
      .in('listing_id', listingIds);
    totalScans = scansData?.reduce((sum, qr) => sum + (qr.scan_count || 0), 0) || 0;
  }

  // Get total leads
  let leadsCount = 0;
  if (listingIds.length > 0) {
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('listing_id', listingIds);
    leadsCount = count || 0;
  }

  // Get recent listings
  const { data: recentListings } = await supabase
    .from('listings')
    .select('id, address, price, created_at, qrcodes(scan_count)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="mt-3 text-lg text-gray-600">
          Welcome back! Here's what's happening with your listings.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatsCard
          title="Active Listings"
          value={listingsCount || 0}
          icon="🏠"
          subtitle="Total properties"
        />
        <StatsCard
          title="Total Scans"
          value={totalScans}
          icon="📱"
          subtitle="QR code scans"
        />
        <StatsCard
          title="Total Leads"
          value={leadsCount || 0}
          icon="👥"
          subtitle="Captured leads"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard/listings/new">
              <Button variant="primary" size="lg">Create New Listing</Button>
            </Link>
            <Link href="/dashboard/listings">
              <Button variant="outline" size="lg">View All Listings</Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="outline" size="lg">View Analytics</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Listings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">
            Recent Listings
          </h2>
        </div>
        <div className="p-8">
          {recentListings && recentListings.length > 0 ? (
            <div className="space-y-3">
              {recentListings.map((listing: any) => (
                <Link
                  key={listing.id}
                  href={`/dashboard/listings/${listing.id}`}
                  className="block p-5 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 hover:shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
                        {listing.address}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1.5 font-medium">
                        {listing.price ? formatCurrency(listing.price) : 'Price not set'}
                      </p>
                    </div>
                    <div className="text-right ml-6">
                      <p className="text-sm font-semibold text-gray-900">
                        {listing.qrcodes?.[0]?.scan_count || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">scans</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <span className="text-3xl">🏠</span>
              </div>
              <p className="text-gray-600 text-lg mb-6 font-medium">
                No listings yet. Create your first listing to get started!
              </p>
              <Link href="/dashboard/listings/new" className="inline-block">
                <Button variant="primary" size="lg">Create Listing</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


