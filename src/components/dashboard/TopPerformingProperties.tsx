import Link from 'next/link';
import Button from '@/components/ui/Button';

interface TopPerformer {
  listing_id: string;
  address: string;
  city: string | null;
  state: string | null;
  total_scans: number;
  total_page_views: number;
  total_leads: number;
  conversion_rate: number;
}

interface TopPerformingPropertiesProps {
  performers: TopPerformer[];
}

export default function TopPerformingProperties({ performers }: TopPerformingPropertiesProps) {
  if (performers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium mb-1">No properties yet</p>
        <p className="text-gray-400 text-sm mb-4">Create your first listing to see performance data</p>
        <Link href="/dashboard/listings/new">
          <Button variant="primary" size="sm">
            Add Property
          </Button>
        </Link>
      </div>
    );
  }

  const rankColors = ['text-yellow-600 bg-yellow-100', 'text-gray-600 bg-gray-200', 'text-amber-700 bg-amber-100'];
  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-3">
      {performers.slice(0, 5).map((listing, index) => {
        return (
          <Link
            href={`/dashboard/listings/${listing.listing_id}`}
            key={listing.listing_id}
            className="block group"
          >
            <div className="relative p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all bg-white">
              {/* Rank Badge */}
              {index < 3 && (
                <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full ${rankColors[index]} flex items-center justify-center text-lg font-bold shadow-md border-2 border-white`}>
                  {rankEmojis[index]}
                </div>
              )}
              {index >= 3 && (
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold border-2 border-white">
                  {index + 1}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex-1 pl-4">
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {listing.address}
                  </p>
                  {listing.city && listing.state && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      📍 {listing.city}, {listing.state}
                    </p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-gray-600">
                      👁️ {listing.total_scans} scans
                    </span>
                    {listing.total_page_views > 0 && (
                      <span className="text-xs text-gray-600">
                        🌐 {listing.total_page_views} views
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      🎯 {listing.total_leads} leads
                    </span>
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="text-right pl-4">
                  <div className={`inline-flex items-center px-3 py-2 rounded-lg ${
                    listing.conversion_rate >= 20 ? 'bg-green-100' :
                    listing.conversion_rate >= 10 ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    <p className={`text-2xl font-bold ${
                      listing.conversion_rate >= 20 ? 'text-green-700' :
                      listing.conversion_rate >= 10 ? 'text-blue-700' :
                      'text-gray-700'
                    }`}>
                      {listing.conversion_rate.toFixed(0)}%
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">
                    Conversion
                  </p>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

