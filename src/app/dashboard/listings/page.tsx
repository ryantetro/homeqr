import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils/format';
import Card from '@/components/ui/Card';
import ListingCardImage from '@/components/listings/ListingCardImage';

export default async function ListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: listings } = await supabase
    .from('listings')
    .select('id, address, city, state, price, image_url, created_at, qrcodes(id, scan_count)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Listings</h1>
          <p className="mt-2 text-gray-600">
            Manage your property listings and QR codes
          </p>
        </div>
        <Link href="/dashboard/listings/new">
          <Button variant="primary">Create New Listing</Button>
        </Link>
      </div>

      {listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing: any) => {
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
                    // Must be an actual image URL from Zillow's CDN
                    return url.includes('zillowstatic.com') || url.includes('photos.zillowstatic.com');
                  });
                  if (validImages.length > 0) {
                    firstImage = validImages[0];
                  }
                } else if (typeof parsed === 'string') {
                  // Single URL - check if it's valid
                  if (!parsed.includes('/homedetails/') && 
                      !parsed.includes('/homes/') &&
                      (parsed.includes('zillowstatic.com') || parsed.includes('photos.zillowstatic.com'))) {
                    firstImage = parsed;
                  }
                }
              }
            } catch {
              // If not JSON, treat as single image URL
              if (listing.image_url && 
                  typeof listing.image_url === 'string' &&
                  !listing.image_url.includes('/homedetails/') && 
                  !listing.image_url.includes('/homes/') &&
                  (listing.image_url.includes('zillowstatic.com') || listing.image_url.includes('photos.zillowstatic.com'))) {
                firstImage = listing.image_url;
              }
            }

            // Get proxied image URL if it's a Zillow CDN image
            const getProxiedImageUrl = (url: string): string => {
              if (!url) return url;
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
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        {listing.qrcodes?.[0]?.scan_count || 0} scans
                      </span>
                      <span>View Details →</span>
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
              No listings yet. Create your first listing to get started!
            </p>
            <Link href="/dashboard/listings/new">
              <Button variant="primary">Create Your First Listing</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}


