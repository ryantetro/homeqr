'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Activity {
  id: string;
  type: 'scan' | 'lead' | 'view';
  listing_id: string;
  listing_address: string;
  listing_city?: string;
  listing_state?: string;
  timestamp: string;
  lead_name?: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's listing IDs
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('user_id', user.id);

      if (!listings || listings.length === 0) {
        setLoading(false);
        return;
      }

      const listingIds = listings.map(l => l.id);

      // Fetch recent scans
      const { data: scans } = await supabase
        .from('scan_sessions')
        .select(`
          id,
          listing_id,
          created_at,
          listings(address, city, state)
        `)
        .in('listing_id', listingIds)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent leads
      const { data: leads } = await supabase
        .from('leads')
        .select(`
          id,
          listing_id,
          name,
          created_at,
          listings(address, city, state)
        `)
        .in('listing_id', listingIds)
        .order('created_at', { ascending: false })
        .limit(10);

      // Combine and sort activities
      const combined: Activity[] = [
        ...(scans || []).map(scan => ({
          id: scan.id,
          type: 'scan' as const,
          listing_id: scan.listing_id,
          listing_address: (scan.listings as any)?.address || 'Unknown',
          listing_city: (scan.listings as any)?.city,
          listing_state: (scan.listings as any)?.state,
          timestamp: scan.created_at,
        })),
        ...(leads || []).map(lead => ({
          id: lead.id,
          type: 'lead' as const,
          listing_id: lead.listing_id,
          listing_address: (lead.listings as any)?.address || 'Unknown',
          listing_city: (lead.listings as any)?.city,
          listing_state: (lead.listings as any)?.state,
          timestamp: lead.created_at,
          lead_name: lead.name,
        })),
      ];

      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(combined.slice(0, 10));
      setLoading(false);
    }

    fetchActivities();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'scan':
        return { emoji: '📱', bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300' };
      case 'lead':
        return { emoji: '🎯', bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300' };
      case 'view':
        return { emoji: '👁️', bgColor: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-300' };
      default:
        return { emoji: '📊', bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300' };
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <p className="text-gray-500 text-sm mb-1">No activity yet</p>
        <p className="text-gray-400 text-xs">Activity will appear as people interact with your listings</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => {
        const { emoji, bgColor, textColor, borderColor } = getActivityIcon(activity.type);
        
        return (
          <Link
            key={activity.id}
            href={`/dashboard/listings/${activity.listing_id}`}
            className="block group"
          >
            <div className={`flex items-start gap-3 p-3 rounded-lg border-2 ${borderColor} ${bgColor} hover:shadow-md transition-all`}>
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bgColor} border-2 ${borderColor}`}>
                <span className="text-xl">{emoji}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {activity.type === 'lead' && activity.lead_name ? (
                      <p className="text-sm font-semibold text-gray-900">
                        <span className="text-green-700">New Lead:</span> {activity.lead_name}
                      </p>
                    ) : activity.type === 'scan' ? (
                      <p className="text-sm font-semibold text-gray-900">
                        <span className="text-blue-700">QR Code Scanned</span>
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900">
                        <span className="text-purple-700">Page View</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-600 mt-0.5 truncate">
                      📍 {activity.listing_address}
                      {activity.listing_city && activity.listing_state && (
                        <span>, {activity.listing_city}, {activity.listing_state}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
              </div>

              {/* Arrow indicator on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
