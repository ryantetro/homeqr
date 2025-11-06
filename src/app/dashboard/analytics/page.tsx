import { createClient } from '@/lib/supabase/server';
import ScanChart from '@/components/charts/ScanChart';
import Card from '@/components/ui/Card';
import { formatDate } from '@/lib/utils/format';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's listings
  const { data: listings } = await supabase
    .from('listings')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const listingIds = listings?.map((l) => l.id) || [];

  // Get analytics data for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: analytics } = await supabase
    .from('analytics')
    .select('*')
    .in('listing_id', listingIds)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // Aggregate data by date
  const chartData: Record<string, { scans: number; leads: number }> = {};
  
  analytics?.forEach((item) => {
    const date = item.date;
    if (!chartData[date]) {
      chartData[date] = { scans: 0, leads: 0 };
    }
    chartData[date].scans += item.total_scans || 0;
    chartData[date].leads += item.total_leads || 0;
  });

  const chartDataArray = Object.entries(chartData)
    .map(([date, values]) => ({
      date: formatDate(date),
      scans: values.scans,
      leads: values.leads,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get top listings by scans
  const { data: topListings } = await supabase
    .from('listings')
    .select('id, address, qrcodes(scan_count)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">
          Track your QR code scans and lead generation performance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Scans & Leads Over Time (Last 30 Days)
            </h2>
            {chartDataArray.length > 0 ? (
              <ScanChart data={chartDataArray} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No data available yet. Start generating QR codes to see analytics.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Top Performing Listings
            </h2>
            {topListings && topListings.length > 0 ? (
              <div className="space-y-4">
                {topListings.map((listing: any) => (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {listing.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {listing.qrcodes?.[0]?.scan_count || 0} scans
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                No listings yet. Create your first listing to get started.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}


