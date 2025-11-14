import { createClient } from '@/lib/supabase/server';
import type { TrialLimits, TrialFeature, TrialUsage } from '@/types/subscription';

export const TRIAL_LIMITS: TrialLimits = {
  qr_codes: 5,
  listings: 5,
  photos: 50,
  analytics_retention_days: 7,
};

/**
 * Get current usage for a specific feature
 */
export async function getTrialUsage(
  userId: string,
  feature: TrialFeature
): Promise<number> {
  const supabase = await createClient();

  switch (feature) {
    case 'qr_codes': {
      // Count QR codes for user's listings
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (!listings || listings.length === 0) return 0;

      const listingIds = listings.map((l) => l.id);
      const { count } = await supabase
        .from('qrcodes')
        .select('*', { count: 'exact', head: true })
        .in('listing_id', listingIds);

      return count || 0;
    }

    case 'listings': {
      const { count } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');

      return count || 0;
    }

    case 'photos': {
      // Count photos by checking user-uploads storage bucket
      // For now, we'll estimate based on listings with images
      // In production, you might want to track this more precisely
      const { data: listings } = await supabase
        .from('listings')
        .select('image_url')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (!listings) return 0;

      // Count listings with images (each listing can have multiple images in JSON array)
      let photoCount = 0;
      for (const listing of listings) {
        if (listing.image_url) {
          try {
            // Check if it's a JSON array
            const parsed = JSON.parse(listing.image_url as string);
            if (Array.isArray(parsed)) {
              photoCount += parsed.length;
            } else {
              photoCount += 1;
            }
          } catch {
            // Not JSON, treat as single image
            photoCount += 1;
          }
        }
      }

      return photoCount;
    }

    default:
      return 0;
  }
}

/**
 * Get remaining trial usage for a feature
 */
export async function getRemainingTrialUsage(
  userId: string,
  feature: TrialFeature
): Promise<number> {
  const limit = TRIAL_LIMITS[feature];
  const current = await getTrialUsage(userId, feature);
  return Math.max(0, limit - current);
}

/**
 * Check if user has reached trial limit for a feature
 */
export async function checkTrialLimit(
  userId: string,
  feature: TrialFeature
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  const limit = TRIAL_LIMITS[feature];
  const current = await getTrialUsage(userId, feature);
  const remaining = Math.max(0, limit - current);

  return {
    allowed: current < limit,
    current,
    limit,
    remaining,
  };
}

/**
 * Get full usage stats for a user
 */
export async function getUsageStats(userId: string): Promise<{
  qr_codes: TrialUsage;
  listings: TrialUsage;
  photos: TrialUsage;
}> {
  const [qrUsage, listingUsage, photoUsage] = await Promise.all([
    getTrialUsage(userId, 'qr_codes'),
    getTrialUsage(userId, 'listings'),
    getTrialUsage(userId, 'photos'),
  ]);

  return {
    qr_codes: {
      feature: 'qr_codes',
      current: qrUsage,
      limit: TRIAL_LIMITS.qr_codes,
      remaining: Math.max(0, TRIAL_LIMITS.qr_codes - qrUsage),
      percentage: Math.round((qrUsage / TRIAL_LIMITS.qr_codes) * 100),
    },
    listings: {
      feature: 'listings',
      current: listingUsage,
      limit: TRIAL_LIMITS.listings,
      remaining: Math.max(0, TRIAL_LIMITS.listings - listingUsage),
      percentage: Math.round((listingUsage / TRIAL_LIMITS.listings) * 100),
    },
    photos: {
      feature: 'photos',
      current: photoUsage,
      limit: TRIAL_LIMITS.photos,
      remaining: Math.max(0, TRIAL_LIMITS.photos - photoUsage),
      percentage: Math.round((photoUsage / TRIAL_LIMITS.photos) * 100),
    },
  };
}

