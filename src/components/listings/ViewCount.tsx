'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ViewCountProps {
  listingId: string;
}

export default function ViewCount({ listingId }: ViewCountProps) {
  const [viewCount, setViewCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchViewCount() {
      const supabase = createClient();
      
      // Get unique visitors for this listing (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: sessions, error } = await supabase
        .from('scan_sessions')
        .select('session_id')
        .eq('listing_id', listingId)
        .gte('first_scan_at', sevenDaysAgo.toISOString());

      if (!error && sessions) {
        const uniqueSessions = new Set(sessions.map((s) => s.session_id));
        setViewCount(uniqueSessions.size);
      }
    }

    fetchViewCount();
  }, [listingId]);

  if (viewCount === null || viewCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      <span>
        {viewCount} {viewCount === 1 ? 'person' : 'people'} viewed this property this week
      </span>
    </div>
  );
}

