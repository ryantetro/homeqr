'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils/format';

interface ActivityItem {
  id: string;
  type: 'scan' | 'lead';
  listing_address: string;
  timestamp: string;
  details?: string;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
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
        .select('id, address')
        .eq('user_id', user.id);

      if (!listings || listings.length === 0) {
        setLoading(false);
        return;
      }

      const listingIds = listings.map((l) => l.id);
      const listingMap = new Map(listings.map((l) => [l.id, l.address]));

      // Get recent scans from scan_sessions
      const { data: recentScans } = await supabase
        .from('scan_sessions')
        .select('id, listing_id, first_scan_at')
        .in('listing_id', listingIds)
        .order('first_scan_at', { ascending: false })
        .limit(5);

      // Get recent leads
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('id, listing_id, name, created_at')
        .in('listing_id', listingIds)
        .order('created_at', { ascending: false })
        .limit(5);

      const activityItems: ActivityItem[] = [];

      recentScans?.forEach((scan) => {
        activityItems.push({
          id: scan.id,
          type: 'scan',
          listing_address: listingMap.get(scan.listing_id) || 'Unknown',
          timestamp: scan.first_scan_at,
        });
      });

      recentLeads?.forEach((lead) => {
        activityItems.push({
          id: lead.id,
          type: 'lead',
          listing_address: listingMap.get(lead.listing_id) || 'Unknown',
          timestamp: lead.created_at,
          details: lead.name,
        });
      });

      // Sort by timestamp and take top 5
      activityItems.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(activityItems.slice(0, 5));
      setLoading(false);
    }

    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent activity. Start generating QR codes to see activity here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div
            className={`shrink-0 w-2 h-2 rounded-full mt-2 ${
              activity.type === 'lead' ? 'bg-green-500' : 'bg-blue-500'
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {activity.type === 'lead' ? 'New Lead' : 'QR Code Scanned'}
              </p>
              <p className="text-xs text-gray-500">
                {formatDateTime(activity.timestamp)}
              </p>
            </div>
            <p className="text-sm text-gray-600 truncate">
              {activity.listing_address}
            </p>
            {activity.details && (
              <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

