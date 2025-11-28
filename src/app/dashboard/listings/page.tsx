import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/format';
import { calculateConversionRate } from '@/lib/utils/analytics';
import Card from '@/components/ui/Card';
import ListingCardImage from '@/components/listings/ListingCardImage';
import { checkUserAccess } from '@/lib/subscription/access';
import StatusFilter from '@/components/listings/StatusFilter';
import { Suspense } from 'react';

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status || 'active';
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Check access and subscription status
  const access = await checkUserAccess(user.id);
  const isExpired = !access.hasAccess && access.reason !== 'beta';

  // Build query based on status filter
  let query = supabase
    .from('listings')
    .select('id, address, city, state, price, image_url, created_at, status, qrcodes(id, scan_count)')
    .eq('user_id', user.id);

  // Apply status filter
  if (statusFilter === 'all') {
    // Show all statuses (no filter applied)
    // Query will return all listings for the user
  } else if (statusFilter === 'active' || statusFilter === 'inactive' || statusFilter === 'deleted') {
    query = query.eq('status', statusFilter);
  } else {
    // Default to active if invalid filter
    query = query.eq('status', 'active');
  }

  const { data: listings } = await query.order('created_at', { ascending: false });

  // Get analytics for conversion rates
  const listingIds = listings?.map((l) => l.id) || [];
  const { data: analytics } = listingIds.length > 0
    ? await supabase
        .from('analytics')
        .select('listing_id, total_scans, total_leads, page_views')
        .in('listing_id', listingIds)
    : { data: null };
  
  // Aggregate analytics by listing
  const analyticsMap = new Map<string, { scans: number; leads: number; pageViews: number }>();
  analytics?.forEach((a) => {
    const existing = analyticsMap.get(a.listing_id) || { scans: 0, leads: 0, pageViews: 0 };
    analyticsMap.set(a.listing_id, {
      scans: existing.scans + (a.total_scans || 0),
      leads: existing.leads + (a.total_leads || 0),
      pageViews: existing.pageViews + (a.page_views || 0),
    });
  });

  // Create a map of listing_id to conversion rate (using already-aggregated analyticsMap)
  const conversionMap = new Map<string, number>();
  
  // Calculate conversion rate for each listing using the aggregated analytics data
  analyticsMap.forEach((totals, listingId) => {
    const rate = calculateConversionRate(totals.scans, totals.leads);
    conversionMap.set(listingId, rate);
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Properties</h1>
          <p className="mt-2 text-gray-600">
            Manage QR codes and track performance
          </p>
        </div>
        {isExpired ? (
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-2">
              {access.reason === 'no-sub' 
                ? 'No active subscription' 
                : access.subscription?.status === 'past_due'
                ? 'Payment required'
                : 'Subscription expired'}
            </p>
            <Link href="/dashboard/billing">
              <Button variant="primary" size="sm">Subscribe to Continue</Button>
            </Link>
          </div>
        ) : (
          <Link href="/dashboard/listings/new">
            <Button variant="outline" size="sm">Add Property</Button>
          </Link>
        )}
      </div>

      <Suspense fallback={<div className="mb-6 h-10" />}>
        <StatusFilter />
      </Suspense>

      {listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing: {
            id: string;
            address: string;
            city: string | null;
            state: string | null;
            price: number | null;
            image_url: string | null;
            created_at: string;
            qrcodes: Array<{ id: string; scan_count: number | null }> | null;
          }) => {
            // Parse images - check if image_url is a JSON array or single URL
            let firstImage: string | null = null;
            try {
              if (listing.image_url) {
                // Try to parse as JSON array
                const parsed = JSON.parse(listing.image_url);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  // Filter out invalid URLs and get first valid image
                  const validImages = parsed.filter((url: string) => {
                    if (!url || typeof url !== 'string') return false;
                    // Filter out listing page URLs
                    if (url.includes('/homedetails/') || url.includes('/homes/')) return false;
                    // Must be a valid image URL (check for image extension and known property photo domains)
                    const isImageFile = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
                    const isPropertyPhotoDomain = url.includes('zillowstatic.com') || 
                                                  url.includes('photos.zillowstatic.com') ||
                                                  url.includes('utahrealestate.com') ||
                                                  url.includes('realtor.com') ||
                                                  url.includes('redfin.com') ||
                                                  url.includes('homes.com') ||
                                                  url.includes('trulia.com');
                    return isImageFile && (isPropertyPhotoDomain || url.startsWith('http'));
                  });
                  if (validImages.length > 0) {
                    firstImage = validImages[0];
                  }
                } else if (typeof parsed === 'string') {
                  // Single URL - check if it's valid
                  const isImageFile = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(parsed);
                  const isPropertyPhotoDomain = parsed.includes('zillowstatic.com') || 
                                                parsed.includes('photos.zillowstatic.com') ||
                                                parsed.includes('utahrealestate.com') ||
                                                parsed.includes('realtor.com') ||
                                                parsed.includes('redfin.com') ||
                                                parsed.includes('homes.com') ||
                                                parsed.includes('trulia.com');
                  if (!parsed.includes('/homedetails/') && 
                      !parsed.includes('/homes/') &&
                      isImageFile &&
                      (isPropertyPhotoDomain || parsed.startsWith('http'))) {
                    firstImage = parsed;
                  }
                }
              }
            } catch {
              // If not JSON, treat as single image URL
              if (listing.image_url && 
                  typeof listing.image_url === 'string') {
                const isImageFile = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(listing.image_url);
                const isPropertyPhotoDomain = listing.image_url.includes('zillowstatic.com') || 
                                              listing.image_url.includes('photos.zillowstatic.com') ||
                                              listing.image_url.includes('utahrealestate.com') ||
                                              listing.image_url.includes('realtor.com') ||
                                              listing.image_url.includes('redfin.com') ||
                                              listing.image_url.includes('homes.com') ||
                                              listing.image_url.includes('trulia.com');
                if (!listing.image_url.includes('/homedetails/') && 
                    !listing.image_url.includes('/homes/') &&
                    isImageFile &&
                    (isPropertyPhotoDomain || listing.image_url.startsWith('http'))) {
                  firstImage = listing.image_url;
                }
              }
            }

            // Get proxied image URL if it's a CDN image that needs proxying
            const getProxiedImageUrl = (url: string): string => {
              if (!url) return url;
              
              // If already a proxy URL, return as-is (prevent double-proxying)
              if (url.startsWith('/api/image-proxy')) {
                return url;
              }
              
              // Proxy Zillow CDN images
              const isZillowImageCDN = (url.includes('zillowstatic.com') || 
                                       url.includes('photos.zillowstatic.com')) &&
                                      (url.includes('/photo/') || 
                                       url.includes('/photos/') ||
                                       url.includes('/image/') ||
                                       url.includes('/media/') ||
                                       /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url));
              
              if (isZillowImageCDN) {
                return `/api/image-proxy?url=${encodeURIComponent(url)}`;
              }
              
              // For other domains, return as-is (they should work directly)
              return url;
            };

            const imageUrl = firstImage ? getProxiedImageUrl(firstImage) : null;

            return (
              <Link key={listing.id} href={`/dashboard/listings/${listing.id}`}>
                <Card className="hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <ListingCardImage imageUrl={imageUrl} address={listing.address} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {listing.address}
                    </h3>
                    {listing.city && listing.state && (
                      <p className="text-sm text-gray-600 mb-2">
                        {listing.city}, {listing.state}
                      </p>
                    )}
                    {listing.price && (
                      <p className="text-xl font-bold text-gray-900 mb-4">
                        {formatCurrency(listing.price)}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Use analytics data as SINGLE source of truth */}
                        {(() => {
                          const analytics = analyticsMap.get(listing.id);
                          // Analytics is the ONLY source of truth - no fallback to qrcodes
                          const displayScans = analytics?.scans || 0;
                          const displayPageViews = analytics?.pageViews || 0;
                          const displayLeads = analytics?.leads || 0;
                          const conversionRate = conversionMap.get(listing.id) || 0;
                          
                          return (
                            <>
                              <span className="text-gray-600">
                                {displayScans} QR scans
                              </span>
                              {displayPageViews > 0 && (
                                <span className="text-gray-600">
                                  {displayPageViews} views
                                </span>
                              )}
                              {displayScans > 0 && displayLeads > 0 && conversionRate > 0 && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                  {conversionRate.toFixed(1)}% conversion
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <span className="text-gray-600">View Details →</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">
              {statusFilter === 'all'
                ? 'No listings found.'
                : statusFilter === 'active'
                ? 'No listings yet. Create your first listing to get started!'
                : `No ${statusFilter} listings found.`}
            </p>
            {statusFilter === 'active' && (
              <Link href="/dashboard/listings/new">
                <Button variant="primary">Create Your First Listing</Button>
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}


