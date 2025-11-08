import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import LeadForm from '@/components/leads/LeadForm';
import Card from '@/components/ui/Card';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils/format';
import ImageGallery from '@/components/listings/ImageGallery';
import AgentCard from '@/components/listings/AgentCard';
import PageViewTracker from '@/components/analytics/PageViewTracker';

export default async function PublicListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // First try to get the listing without status filter to see if it exists
  // Include agent information
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      users:user_id (
        full_name,
        email,
        phone,
        brokerage,
        avatar_url,
        logo_url,
        license_number,
        calendly_url
      )
    `)
    .eq('id', id)
    .single();

  // If listing doesn't exist or there's an error, show 404
  if (error || !listing) {
    console.error('Listing not found:', { id, error });
    notFound();
  }

  // If listing exists but is not active, still show it (or you can show a message)
  // For now, we'll show it regardless of status
  if (listing.status !== 'active') {
    console.warn('Listing found but status is not active:', { id, status: listing.status });
  }

  // Parse images - check if image_url is a JSON array or single URL
  let allImages: string[] = [];
  try {
    if (listing.image_url) {
      const parsed = JSON.parse(listing.image_url);
      if (Array.isArray(parsed)) {
        allImages = parsed.filter((url: string) => {
          if (!url || typeof url !== 'string') return false;
          if (url.includes('/homedetails/') || url.includes('/homes/') || url.includes('/alpine-ut/')) {
            return false;
          }
          return url.includes('zillowstatic.com') || url.includes('photos.zillowstatic.com');
        });
      } else if (typeof parsed === 'string' && 
                 !parsed.includes('/homedetails/') && 
                 !parsed.includes('/homes/') &&
                 (parsed.includes('zillowstatic.com') || parsed.includes('photos.zillowstatic.com'))) {
        allImages = [parsed];
      }
    }
  } catch {
    if (listing.image_url && 
        typeof listing.image_url === 'string' &&
        !listing.image_url.includes('/homedetails/') && 
        !listing.image_url.includes('/homes/') &&
        (listing.image_url.includes('zillowstatic.com') || listing.image_url.includes('photos.zillowstatic.com'))) {
      allImages = [listing.image_url];
    }
  }

  const agent = listing.users as any;

  return (
    <div className="min-h-screen bg-white">
      <PageViewTracker listingId={listing.id} source="direct" />
      {/* Hero Section with Image */}
      <div className="relative w-full h-[60vh] min-h-[500px] max-h-[700px] overflow-hidden bg-gray-100">
        {allImages.length > 0 ? (
          <div className="absolute inset-0">
            <Image
              src={allImages[0].startsWith('/api/image-proxy')
                ? allImages[0]
                : allImages[0].includes('zillowstatic.com')
                ? `/api/image-proxy?url=${encodeURIComponent(allImages[0])}`
                : allImages[0]}
              alt={listing.address}
              fill
              priority
              quality={100}
              sizes="100vw"
              className="object-cover"
              unoptimized={allImages[0].includes('zillowstatic.com')}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        ) : listing.image_url ? (
          <div className="absolute inset-0">
            <Image
              src={listing.image_url?.startsWith('/api/image-proxy')
                ? listing.image_url
                : listing.image_url?.includes('zillowstatic.com')
                ? `/api/image-proxy?url=${encodeURIComponent(listing.image_url)}`
                : listing.image_url}
              alt={listing.address}
              fill
              priority
              quality={100}
              sizes="100vw"
              className="object-cover"
              unoptimized={listing.image_url?.includes('zillowstatic.com')}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300" />
        )}
        
        {/* Hero Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 drop-shadow-lg">
                {listing.address}
              </h1>
              {listing.city && listing.state && (
                <div className="flex items-center gap-2 text-white/90 text-lg md:text-xl mb-6">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{listing.city}, {listing.state} {listing.zip}</span>
                </div>
              )}
              {listing.price && (
                <div className="inline-block bg-white px-7 py-4 rounded-xl shadow-2xl border-4 border-white/80 max-w-full">
                  <p className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                    {formatCurrency(listing.price)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Stats */}
            {(listing.bedrooms || listing.bathrooms || listing.square_feet) && (
              <Card className="border-0 shadow-xl">
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-6">
                    {listing.bedrooms && (
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{listing.bedrooms}</p>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Bedrooms</p>
                      </div>
                    )}
                    {listing.bathrooms && (
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                          </svg>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{listing.bathrooms}</p>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Bathrooms</p>
                      </div>
                    )}
                    {listing.square_feet && (
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{listing.square_feet.toLocaleString()}</p>
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Sq Ft</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Image Gallery */}
            {allImages.length > 1 && (
              <Card className="border-0 shadow-xl">
                <ImageGallery images={allImages} address={listing.address} />
              </Card>
            )}

            {/* Description */}
            {listing.description && (
              <Card className="border-0 shadow-xl">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Property</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">{listing.description}</p>
                </div>
              </Card>
            )}

            {/* Map */}
            {(listing.address || (listing.city && listing.state)) && (
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Location</h2>
                  <div className="w-full h-80 rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                        listing.address + (listing.city && listing.state ? `, ${listing.city}, ${listing.state}` : '')
                      )}&output=embed`}
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Agent & Lead Form */}
          <div className="space-y-6">
            {/* Agent Information - Sticky */}
            <div className="lg:sticky lg:top-6 space-y-6">
              {agent && (
                <AgentCard agent={agent} />
              )}

              {/* Lead Form */}
              <Card className="border-0 shadow-xl">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Request Information
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Interested in this property? Fill out the form below and we'll get back to you soon.
                  </p>
                  <LeadForm listingId={listing.id} agentName={agent?.full_name || undefined} />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



