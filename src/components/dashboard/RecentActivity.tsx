'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils/format';

interface ActivityItem {
  id: string;
  type: 'scan' | 'visit' | 'lead';
  listing_address: string;
  timestamp: string;
  details?: string;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      console.log('[RecentActivity] Fetching activities...');
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

      // Get recent scans and visits from scan_sessions
      // Order by most recent activity (last_scan_at if available, otherwise first_scan_at)
      const { data: recentScans, error: scansError } = await supabase
        .from('scan_sessions')
        .select('id, listing_id, first_scan_at, last_scan_at, source, scan_count')
        .in('listing_id', listingIds)
        .order('first_scan_at', { ascending: false })
        .limit(50); // Get more records to ensure we have enough after filtering
      
      // Sort by most recent timestamp (last_scan_at or first_scan_at) after fetching
      if (recentScans) {
        recentScans.sort((a, b) => {
          const aTime = new Date(a.last_scan_at || a.first_scan_at).getTime();
          const bTime = new Date(b.last_scan_at || b.first_scan_at).getTime();
          return bTime - aTime; // Most recent first
        });
      }
      
      if (scansError) {
        console.error('[RecentActivity] Error fetching scans:', scansError);
      } else {
        console.log('[RecentActivity] Found scans/visits:', recentScans?.length || 0, recentScans);
      }

      // Get recent leads
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('id, listing_id, name, created_at')
        .in('listing_id', listingIds)
        .order('created_at', { ascending: false })
        .limit(5);

      const activityItems: ActivityItem[] = [];

      recentScans?.forEach((scan) => {
        // Differentiate between QR scan and microsite visit
        // QR scan: scan_count > 0 OR source is 'qr'
        // Microsite visit: scan_count === 0 AND source is NOT 'qr' (could be 'direct', 'microsite', or null)
        const scanCount = scan.scan_count ?? 0;
        const source = scan.source ?? null;
        
        // Explicit check: if source is 'qr', it's always a QR scan
        // Otherwise, if scan_count > 0, it's a QR scan
        // Otherwise (scan_count === 0 and source !== 'qr'), it's a visit
        const isQRScan = source === 'qr' || scanCount > 0;
        const isVisit = !isQRScan && scanCount === 0;
        
        console.log('[RecentActivity] Processing scan:', {
          id: scan.id,
          scan_count: scanCount,
          source: source,
          source_type: typeof source,
          isQRScan,
          isVisit,
          type: isQRScan ? 'scan' : (isVisit ? 'visit' : 'unknown'),
          listing_id: scan.listing_id,
          raw_scan: scan
        });
        
        // Add all valid activities (QR scans or microsite visits)
        if (isQRScan || isVisit) {
          // Use last_scan_at if available (for updated sessions), otherwise first_scan_at
          const timestamp = scan.last_scan_at || scan.first_scan_at;
          
          activityItems.push({
            id: scan.id,
            type: isQRScan ? 'scan' : 'visit',
            listing_address: listingMap.get(scan.listing_id) || 'Unknown',
            timestamp: timestamp,
          });
        } else {
          console.warn('[RecentActivity] Skipping scan - neither QR scan nor visit:', scan);
        }
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

      // Sort by timestamp (most recent first) and take top 5
      activityItems.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      console.log('[RecentActivity] Final activity items:', activityItems.length, activityItems.map(a => ({
        type: a.type,
        address: a.listing_address,
        timestamp: a.timestamp
      })));

      setActivities(activityItems.slice(0, 5));
      setLoading(false);
    }

    fetchActivities();
    
    // Refresh activities every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    
    return () => clearInterval(interval);
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
      {activities.map((activity) => {
        // Determine icon and colors based on activity type
        let icon, iconBgColor;
        if (activity.type === 'lead') {
          icon = (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
          iconBgColor = 'bg-green-100 text-green-600';
        } else if (activity.type === 'scan') {
          icon = (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          );
          iconBgColor = 'bg-blue-100 text-blue-600';
        } else {
          icon = (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          );
          iconBgColor = 'bg-purple-100 text-purple-600';
        }

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${iconBgColor}`}>
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  {activity.type === 'lead' 
                    ? 'New Lead' 
                    : activity.type === 'scan'
                    ? 'QR Code Scanned'
                    : 'Microsite Visit'}
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
        );
      })}
    </div>
  );
}

