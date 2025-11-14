'use client';

import { useEffect } from 'react';

interface PageViewTrackerProps {
  listingId: string;
  source?: 'microsite' | 'direct';
}

export default function PageViewTracker({ listingId, source = 'microsite' }: PageViewTrackerProps) {
  useEffect(() => {
    // Track page view
    async function trackPageView() {
      try {
        console.log('[PageView] Tracking page view for listing:', listingId, 'source:', source);
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies so session can be matched
          body: JSON.stringify({
            listing_id: listingId,
            source: source,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[PageView] Failed to track page view:', response.status, errorData);
        } else {
          console.log('[PageView] Successfully tracked page view');
        }
      } catch (error) {
        // Silently fail - don't block page load
        console.error('[PageView] Failed to track page view:', error);
      }
    }

    trackPageView();
  }, [listingId, source]);

  // This component doesn't render anything
  return null;
}

