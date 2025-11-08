'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { calculateConversionRate } from '@/lib/utils/analytics';
import Link from 'next/link';

interface TopPerformer {
  listing_id: string;
  address: string;
  city: string | null;
  state: string | null;
  total_scans: number;
  total_leads: number;
  conversion_rate: number;
}

export default function TopPerformers() {
  const [performers, setPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopPerformers() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's listings
      const { data: listings } = await supabase
        .from('listings')
        .select('id, address, city, state')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!listings || listings.length === 0) {
        setLoading(false);
        return;
      }

      const listingIds = listings.map((l) => l.id);

      // Calculate conversion rates for each listing
      const performers = await Promise.all(
        listings.map(async (listing) => {
          const { data: analytics } = await supabase
            .from('analytics')
            .select('total_scans, total_leads')
            .eq('listing_id', listing.id);

          const totalScans =
            analytics?.reduce((sum, a) => sum + (a.total_scans || 0), 0) || 0;
          const totalLeads =
            analytics?.reduce((sum, a) => sum + (a.total_leads || 0), 0) || 0;
          const conversionRate = calculateConversionRate(totalScans, totalLeads);

          return {
            listing_id: listing.id,
            address: listing.address,
            city: listing.city,
            state: listing.state,
            total_scans: totalScans,
            total_leads: totalLeads,
            conversion_rate: conversionRate,
          };
        })
      );

      performers.sort((a, b) => b.conversion_rate - a.conversion_rate);
      setPerformers(performers.slice(0, 5));
      setLoading(false);
    }

    fetchTopPerformers();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (performers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No performance data yet. Generate QR codes to see which properties
        perform best.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {performers.map((performer) => (
        <Link
          key={performer.listing_id}
          href={`/dashboard/listings/${performer.listing_id}`}
          className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{performer.address}</p>
              {performer.city && performer.state && (
                <p className="text-sm text-gray-600">
                  {performer.city}, {performer.state}
                </p>
              )}
            </div>
            <div className="text-right ml-4">
              <p className="text-sm font-semibold text-gray-900">
                {performer.conversion_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                {performer.total_leads} leads / {performer.total_scans} scans
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

