import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import LeadForm from '@/components/leads/LeadForm';
import Card from '@/components/ui/Card';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils/format';
import ImageGallery from '@/components/listings/ImageGallery';
import AgentCard from '@/components/listings/AgentCard';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import AIEnhancements from '@/components/listings/AIEnhancements';

export default async function PublicListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // First try to get the listing without status filter to see if it exists
  // Include agent information
  // Fetch listing with explicit URL field to ensure it's included
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      id,
      address,
      city,
      state,
      zip,
      price,
      bedrooms,
      bathrooms,
      square_feet,
      description,
      image_url,
      mls_id,
      status,
      slug,
      created_at,
      updated_at,
      url,
      property_type,
      property_subtype,
      year_built,
      lot_size,
      features,
      interior_features,
      exterior_features,
      parking_spaces,
      garage_spaces,
      stories,
      heating,
      cooling,
      flooring,
      fireplace_count,
      hoa_fee,
      tax_assessed_value,
      annual_tax_amount,
      price_per_sqft,
      zestimate,
      days_on_market,
      listing_date,
      user_id,
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

  // Debug: Log URL field
  console.log('[Microsite] Listing URL field:', { 
    id: listing.id, 
    address: listing.address,
    url: listing.url, 
    urlType: typeof listing.url,
    hasUrl: !!listing.url,
    urlLength: listing.url?.length || 0
  });
  
  // Additional validation: ensure URL is a valid string
  const hasValidUrl = listing.url && typeof listing.url === 'string' && listing.url.trim().length > 0;
  
  // Force log to server console (will show in terminal, not browser)
  if (typeof window === 'undefined') {
    console.log('[Microsite Server] URL Check:', {
      id: listing.id,
      address: listing.address,
      url: listing.url,
      urlType: typeof listing.url,
      hasValidUrl,
      urlLength: listing.url?.length || 0
    });
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
          // Allow images from known property photo domains or any valid image URL
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
      } else if (typeof parsed === 'string') {
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
          allImages = [parsed];
        }
      }
    }
  } catch {
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
        allImages = [listing.image_url];
      }
    }
  }

  // Extract agent info (users is a relationship, could be array or object)
  const agent = Array.isArray(listing.users) 
    ? listing.users[0] 
    : listing.users;


  // Parse JSON fields (features, interior_features, exterior_features)
  let features: string[] = [];
  let interiorFeatures: string[] = [];
  let exteriorFeatures: string[] = [];
  
  try {
    if (listing.features) {
      const parsed = typeof listing.features === 'string' ? JSON.parse(listing.features) : listing.features;
      features = Array.isArray(parsed) ? parsed : [];
    }
  } catch {}
  
  try {
    if (listing.interior_features) {
      const parsed = typeof listing.interior_features === 'string' ? JSON.parse(listing.interior_features) : listing.interior_features;
      interiorFeatures = Array.isArray(parsed) ? parsed : [];
    }
  } catch {}
  
  try {
    if (listing.exterior_features) {
      const parsed = typeof listing.exterior_features === 'string' ? JSON.parse(listing.exterior_features) : listing.exterior_features;
      exteriorFeatures = Array.isArray(parsed) ? parsed : [];
    }
  } catch {}

  return (
    <div className="min-h-screen bg-white">
      <PageViewTracker listingId={listing.id} source="direct" />
      {/* Hero Section with Image */}
      <div className="relative w-full h-[50vh] sm:h-[55vh] md:h-[60vh] min-h-[400px] sm:min-h-[450px] md:min-h-[500px] max-h-[700px] overflow-hidden bg-gray-100">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
        
        {/* Hero Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 md:pb-12">
            <div className="max-w-3xl w-full">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg leading-tight">
                {listing.address}
              </h1>
              {listing.city && listing.state && (
                <div className="flex items-center gap-2 text-white/90 text-base sm:text-lg md:text-xl mb-4 sm:mb-6">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{listing.city}, {listing.state} {listing.zip}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                {listing.price && (
                  <div className="inline-block bg-white px-4 sm:px-6 md:px-7 py-3 sm:py-3.5 md:py-4 rounded-lg sm:rounded-xl shadow-2xl border-2 sm:border-4 border-white/80 max-w-full">
                    <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                      {formatCurrency(listing.price)}
                    </p>
                  </div>
                )}
                {hasValidUrl ? (
                  <a
                    href={listing.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-lg sm:rounded-xl shadow-xl border-2 border-white/80 font-semibold text-sm sm:text-base md:text-lg transition-all duration-200 hover:shadow-2xl hover:scale-105 whitespace-nowrap"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>View Original Listing</span>
                  </a>
                ) : (
                  // Debug: Show why button isn't showing (remove in production)
                  process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-white/80 bg-red-500/50 px-2 py-1 rounded">
                      Debug: URL missing (url={listing.url ? 'exists' : 'null'}, type={typeof listing.url})
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 md:-mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Key Stats */}
            {(listing.bedrooms || listing.bathrooms || listing.square_feet) && (
              <Card className="border-0 shadow-xl">
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-3 gap-4 sm:gap-6">
                    {listing.bedrooms && (
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{listing.bedrooms}</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Bedrooms</p>
                      </div>
                    )}
                    {listing.bathrooms && (
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                          </svg>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{listing.bathrooms}</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Bathrooms</p>
                      </div>
                    )}
                    {listing.square_feet && (
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{listing.square_feet.toLocaleString()}</p>
                        <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Sq Ft</p>
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

            {/* AI Enhancements - Hide social caption and AI labels for public microsite */}
            {(listing.ai_description || listing.ai_key_features || listing.ai_lifestyle_summary) && (
              <AIEnhancements
                aiDescription={listing.ai_description}
                aiKeyFeatures={listing.ai_key_features}
                aiLifestyleSummary={listing.ai_lifestyle_summary}
                originalDescription={listing.description}
                hideSocialCaption={true}
                showAILabels={false}
              />
            )}

            {/* Description */}
            {listing.description && !listing.ai_description && (
              <Card className="border-0 shadow-xl">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">About This Property</h2>
                  <p className="text-gray-700 leading-relaxed text-base sm:text-lg">{listing.description}</p>
                </div>
              </Card>
            )}

            {/* Property Information */}
            {(listing.year_built || listing.lot_size || listing.property_type || listing.property_subtype || listing.stories) && (
              <Card className="border-0 shadow-xl">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Property Information</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                    {listing.year_built && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Year Built</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{listing.year_built}</p>
                      </div>
                    )}
                    {listing.lot_size && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Lot Size</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{listing.lot_size}</p>
                      </div>
                    )}
                    {listing.property_type && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Property Type</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{listing.property_type}</p>
                      </div>
                    )}
                    {listing.property_subtype && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Property Subtype</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{listing.property_subtype}</p>
                      </div>
                    )}
                    {listing.stories && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Stories</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{listing.stories}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Structure Details */}
            {(listing.parking_spaces || listing.garage_spaces || listing.heating || listing.cooling || listing.flooring || listing.fireplace_count) && (
              <Card className="border-0 shadow-xl">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Structure Details</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                    {listing.parking_spaces && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Parking Spaces</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{listing.parking_spaces}</p>
                      </div>
                    )}
                    {listing.garage_spaces && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Garage Spaces</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{listing.garage_spaces}</p>
                      </div>
                    )}
                    {listing.heating && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Heating</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{listing.heating}</p>
                      </div>
                    )}
                    {listing.cooling && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Cooling</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{listing.cooling}</p>
                      </div>
                    )}
                    {listing.flooring && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Flooring</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{listing.flooring}</p>
                      </div>
                    )}
                    {listing.fireplace_count && listing.fireplace_count > 0 && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Fireplaces</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{listing.fireplace_count}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Features */}
            {(features.length > 0 || interiorFeatures.length > 0 || exteriorFeatures.length > 0) && (
              <Card className="border-0 shadow-xl">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Features</h2>
                  <div className="space-y-6">
                    {features.length > 0 && (
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">General Features</h3>
                        <div className="flex flex-wrap gap-2">
                          {features.map((feature, idx) => (
                            <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {interiorFeatures.length > 0 && (
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Interior Features</h3>
                        <div className="flex flex-wrap gap-2">
                          {interiorFeatures.map((feature, idx) => (
                            <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {exteriorFeatures.length > 0 && (
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Exterior Features</h3>
                        <div className="flex flex-wrap gap-2">
                          {exteriorFeatures.map((feature, idx) => (
                            <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Financial Information */}
            {(listing.hoa_fee || listing.tax_assessed_value || listing.annual_tax_amount || listing.price_per_sqft || listing.zestimate) && (
              <Card className="border-0 shadow-xl">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Financial Information</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                    {listing.hoa_fee && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">HOA Fee</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{formatCurrency(listing.hoa_fee)}/mo</p>
                      </div>
                    )}
                    {listing.tax_assessed_value && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Tax Assessed Value</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{formatCurrency(listing.tax_assessed_value)}</p>
                      </div>
                    )}
                    {listing.annual_tax_amount && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Annual Tax</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{formatCurrency(listing.annual_tax_amount)}</p>
                      </div>
                    )}
                    {listing.price_per_sqft && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Price per Sq Ft</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{formatCurrency(listing.price_per_sqft)}</p>
                      </div>
                    )}
                    {listing.zestimate && (
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">Zestimate®</p>
                        <p className="text-base sm:text-lg font-medium text-gray-900">{formatCurrency(listing.zestimate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Map */}
            {(listing.address || (listing.city && listing.state)) && (
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Location</h2>
                  <div className="w-full h-64 sm:h-72 md:h-80 rounded-lg overflow-hidden">
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
          <div className="space-y-4 sm:space-y-6">
            {/* Agent Information - Sticky */}
            <div className="lg:sticky lg:top-6 space-y-4 sm:space-y-6">
              {agent && (
                <AgentCard agent={agent} />
              )}

              {/* View Original Listing Button */}
              {hasValidUrl ? (
                <Card className="border-0 shadow-xl">
                  <div className="p-4 sm:p-6">
                    <a
                      href={listing.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Original Listing
                    </a>
                    <p className="text-xs sm:text-sm text-gray-500 text-center mt-3 sm:mt-4 leading-relaxed">
                      See full details, photos, and more on the original listing site
                    </p>
                  </div>
                </Card>
              ) : (
                // Debug: Show why button isn't showing (remove in production)
                process.env.NODE_ENV === 'development' && (
                  <Card className="border-2 border-red-300 bg-red-50">
                    <div className="p-4 text-xs text-red-700">
                      <strong>Debug:</strong> URL button not showing
                      <br />URL value: {listing.url ? `"${listing.url}"` : 'null'}
                      <br />URL type: {typeof listing.url}
                      <br />hasValidUrl: {String(hasValidUrl)}
                    </div>
                  </Card>
                )
              )}

              {/* Lead Form */}
              <Card className="border-0 shadow-xl">
                <div className="p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    Request Information
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                    Interested in this property? Fill out the form below and we&apos;ll get back to you soon.
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



