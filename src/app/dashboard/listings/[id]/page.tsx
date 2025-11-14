import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { calculateConversionRate } from '@/lib/utils/analytics';
import QRCodeDisplay from '@/components/qr/QRCodeDisplay';
import LeadTable from '@/components/leads/LeadTable';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/format';
import Link from 'next/link';
import ImageGallery from '@/components/listings/ImageGallery';
import ListingActions from '@/components/listings/ListingActions';

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      url,
      qrcodes(id, qr_url, scan_count),
      leads(*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!listing) {
    notFound();
  }

  // Debug: Log URL field
  console.log('[Dashboard Listing] URL field:', { 
    id: listing.id, 
    url: listing.url, 
    urlType: typeof listing.url,
    hasUrl: !!listing.url 
  });

  const leads = listing.leads || [];
  const qrCode = listing.qrcodes?.[0] || null;

  // Get aggregated analytics data (the real source of truth)
  const { data: analyticsData } = await supabase
    .from('analytics')
    .select('total_scans, total_leads, page_views')
    .eq('listing_id', id);

  // Aggregate analytics across all dates (SINGLE source of truth)
  const totalScans = analyticsData?.reduce((sum, a) => sum + (a.total_scans || 0), 0) || 0;
  const totalLeadsFromAnalytics = analyticsData?.reduce((sum, a) => sum + (a.total_leads || 0), 0) || 0;
  const totalPageViews = analyticsData?.reduce((sum, a) => sum + (a.page_views || 0), 0) || 0;

  // Analytics is the ONLY source of truth - no fallbacks
  const displayScans = totalScans;
  const displayLeads = Math.max(totalLeadsFromAnalytics, leads.length);

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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard/listings" 
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Listings
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.address}</h1>
            {listing.city && listing.state && (
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-base">{listing.city}, {listing.state} {listing.zip}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
              {(() => {
                const status = listing.status || 'active';
                const statusConfig = {
                  active: {
                    label: 'Active',
                    className: 'bg-green-100 text-green-700 border-green-200',
                  },
                  inactive: {
                    label: 'Inactive',
                    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                  },
                  deleted: {
                    label: 'Deleted',
                    className: 'bg-gray-100 text-gray-700 border-gray-200',
                  },
                };
                const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
                return (
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${config.className}`}>
                    {config.label}
                  </span>
                );
              })()}
            </div>
            <div className="flex items-center gap-2">
              {listing.url && (
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Original Listing
                </a>
              )}
              <Link
                href={listing.slug ? `/${listing.slug}` : `/listing/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Microsite
              </Link>
              <ListingActions listingId={listing.id} currentStatus={listing.status || 'active'} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          {allImages.length > 0 && (
            <Card className="border border-gray-200 overflow-hidden">
              <ImageGallery images={allImages} address={listing.address} />
            </Card>
          )}

          {/* Key Stats - Quick Overview */}
          {(listing.price || listing.bedrooms || listing.bathrooms || listing.square_feet) && (
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {listing.price && (
                    <div className="text-center md:text-left">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(listing.price)}</p>
                    </div>
                  )}
                  {listing.bedrooms && (
                    <div className="text-center md:text-left">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bedrooms</p>
                      <p className="text-2xl font-bold text-gray-900">{listing.bedrooms}</p>
                    </div>
                  )}
                  {listing.bathrooms && (
                    <div className="text-center md:text-left">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Bathrooms</p>
                      <p className="text-2xl font-bold text-gray-900">{listing.bathrooms}</p>
                    </div>
                  )}
                  {listing.square_feet && (
                    <div className="text-center md:text-left">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Square Feet</p>
                      <p className="text-2xl font-bold text-gray-900">{listing.square_feet.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Property Details */}
          <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Property Details</h2>
            </div>
            <div className="p-8 space-y-8">
              {/* Overview Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {listing.mls_id && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">MLS ID</p>
                      <p className="text-sm font-semibold text-gray-900">{listing.mls_id}</p>
                    </div>
                  )}
                  {listing.year_built && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Year Built</p>
                      <p className="text-sm font-semibold text-gray-900">{listing.year_built}</p>
                    </div>
                  )}
                  {listing.property_type && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Property Type</p>
                      <p className="text-sm font-semibold text-gray-900">{listing.property_type}</p>
                    </div>
                  )}
                  {listing.property_subtype && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Subtype</p>
                      <p className="text-sm font-semibold text-gray-900">{listing.property_subtype}</p>
                    </div>
                  )}
                  {listing.lot_size && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Lot Size</p>
                      <p className="text-sm font-semibold text-gray-900">{listing.lot_size}</p>
                    </div>
                  )}
                  {listing.stories && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-500 mb-1">Stories</p>
                      <p className="text-sm font-semibold text-gray-900">{listing.stories}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Structure & Systems */}
              {(listing.parking_spaces || listing.garage_spaces || listing.heating || listing.cooling || listing.flooring || listing.fireplace_count) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Structure & Systems</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {listing.parking_spaces && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Parking Spaces</p>
                        <p className="text-sm font-semibold text-gray-900">{listing.parking_spaces}</p>
                      </div>
                    )}
                    {listing.garage_spaces && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Garage Spaces</p>
                        <p className="text-sm font-semibold text-gray-900">{listing.garage_spaces}</p>
                      </div>
                    )}
                    {listing.heating && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Heating</p>
                        <p className="text-sm font-semibold text-gray-900">{listing.heating}</p>
                      </div>
                    )}
                    {listing.cooling && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Cooling</p>
                        <p className="text-sm font-semibold text-gray-900">{listing.cooling}</p>
                      </div>
                    )}
                    {listing.flooring && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Flooring</p>
                        <p className="text-sm font-semibold text-gray-900">{listing.flooring}</p>
                      </div>
                    )}
                    {listing.fireplace_count && listing.fireplace_count > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Fireplaces</p>
                        <p className="text-sm font-semibold text-gray-900">{listing.fireplace_count}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Features */}
              {(() => {
                // Helper to normalize features - filter out property details that shouldn't be features
                const normalizeFeatures = (data: unknown): string[] => {
                  if (!data) return [];
                  
                  let parsed: unknown = data;
                  if (typeof data === 'string') {
                    try {
                      parsed = JSON.parse(data);
                    } catch {
                      // If not JSON, try splitting by delimiters
                      return data.split(/[,;|]/)
                        .map((f: string) => f.trim())
                        .filter((f: string) => f.length > 0 && f.length < 100);
                    }
                  }
                  
                  if (!Array.isArray(parsed)) {
                    // If it's an object, it's probably the entire property details - skip it
                    if (typeof parsed === 'object' && parsed !== null) {
                      return [];
                    }
                    return [];
                  }
                  
                  // Filter out property details that belong in other fields
                  const excludePatterns = [
                    /^Bedrooms?:?\s*\d+/i,
                    /^Bathrooms?:?\s*\d+/i,
                    /^Full bathrooms?:?\s*\d+/i,
                    /^\d+\/\d+\s*bathrooms?:?\s*\d+/i,
                    /^Heating/i,
                    /^Cooling/i,
                    /^Flooring/i,
                    /^Number of fireplaces?:?\s*\d+/i,
                    /^Fireplace features?:?/i,
                    /^Total structure area/i,
                    /^Total interior livable area/i,
                    /^Parking/i,
                    /^Garage spaces?:?\s*\d+/i,
                    /^Total spaces?:?\s*\d+/i,
                    /^Lot Size/i,
                    /^Size:/i,
                    /^Year built/i,
                    /^New construction/i,
                    /^Property type/i,
                    /^Home type/i,
                    /^Price per square foot/i,
                    /^Tax assessed value/i,
                    /^Annual tax amount/i,
                    /^Date on market/i,
                    /^Cumulative days on market/i,
                    /^Listing terms/i,
                    /^Parcel number/i,
                    /^Horses can be raised/i,
                    /^Sewer:/i,
                    /^Water:/i,
                    /^Utilities for property/i,
                    /^Security:/i,
                    /^Subdivision:/i,
                    /^Has HOA/i,
                    /^Amenities included/i,
                    /^Region:/i,
                    /^Electric utility/i,
                    /^Road surface type/i,
                  ];
                  
                  return parsed
                    .map((item: unknown) => {
                      if (typeof item === 'string') return item.trim();
                      if (typeof item === 'object' && item !== null) {
                        const obj = item as { name?: string; value?: string; label?: string };
                        return obj.name || obj.value || obj.label || String(item).trim();
                      }
                      return String(item).trim();
                    })
                    .filter((item: string) => {
                      // Filter out empty, very long strings, and property details
                      if (!item || item.length === 0 || item.length > 100) return false;
                      // Filter out property details patterns
                      return !excludePatterns.some(pattern => pattern.test(item));
                    })
                    .slice(0, 50); // Limit to 50 features max
                };
                
                const features = normalizeFeatures(listing.features);
                const interiorFeatures = normalizeFeatures(listing.interior_features);
                const exteriorFeatures = normalizeFeatures(listing.exterior_features);

                if (features.length > 0 || interiorFeatures.length > 0 || exteriorFeatures.length > 0) {
                  return (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Features</h3>
                      <div className="space-y-6">
                        {features.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-3">General Features</p>
                            <div className="flex flex-wrap gap-2">
                              {features.map((feature, idx) => (
                                <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {interiorFeatures.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-3">Interior Features</p>
                            <div className="flex flex-wrap gap-2">
                              {interiorFeatures.map((feature, idx) => (
                                <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {exteriorFeatures.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-3">Exterior Features</p>
                            <div className="flex flex-wrap gap-2">
                              {exteriorFeatures.map((feature, idx) => (
                                <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Financial Information */}
              {(listing.hoa_fee || listing.tax_assessed_value || listing.annual_tax_amount || listing.price_per_sqft || listing.zestimate) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Financial Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {listing.hoa_fee && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">HOA Fee</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(listing.hoa_fee)}/mo</p>
                      </div>
                    )}
                    {listing.tax_assessed_value && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Tax Assessed Value</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(listing.tax_assessed_value)}</p>
                      </div>
                    )}
                    {listing.annual_tax_amount && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Annual Tax</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(listing.annual_tax_amount)}</p>
                      </div>
                    )}
                    {listing.price_per_sqft && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Price per Sq Ft</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(listing.price_per_sqft)}</p>
                      </div>
                    )}
                    {listing.zestimate && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Zestimate®</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(listing.zestimate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {listing.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Description</h3>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Leads Section */}
          <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
                {leads.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {leads.length} {leads.length === 1 ? 'Lead' : 'Leads'}
                  </span>
                )}
              </div>
            </div>
            <div className="p-8">
              <LeadTable leads={leads} />
            </div>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Performance Overview */}
          <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Performance</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">QR Scans</p>
                    <p className="text-xs text-gray-500">QR code scans</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{displayScans}</p>
              </div>

              {totalPageViews > 0 && (
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Page Views</p>
                      <p className="text-xs text-gray-500">Microsite visits</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{totalPageViews}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Total Leads</p>
                    <p className="text-xs text-gray-500">Captured contacts</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{displayLeads}</p>
              </div>

              {displayScans > 0 && displayLeads > 0 && (
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">QR Scan Conversion</p>
                      <p className="text-xs text-gray-500">Leads per QR scan</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {calculateConversionRate(displayScans, displayLeads).toFixed(1)}%
                  </p>
                </div>
              )}
              {totalPageViews > 0 && displayLeads > 0 && (
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Overall Conversion</p>
                      <p className="text-xs text-gray-500">Leads per total traffic</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {calculateConversionRate(displayScans, displayLeads, {
                      includePageViews: true,
                      pageViews: totalPageViews,
                    }).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>

            {/* Listing Info */}
            <div className="px-6 pt-6 pb-6 border-t border-gray-200">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(listing.created_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* QR Code */}
          <Card className="border border-gray-200 hover:shadow-lg transition-shadow sticky top-6">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">QR Code</h2>
            </div>
            <div className="p-6">
              <QRCodeDisplay 
                listingId={listing.id} 
                existingQR={qrCode ? {
                  id: qrCode.id,
                  qr_url: qrCode.qr_url || '',
                  scan_count: qrCode.scan_count || 0,
                } : null}
                analyticsScanCount={displayScans}
                listingDetails={{
                  address: listing.address,
                  city: listing.city,
                  state: listing.state,
                  price: listing.price,
                  bedrooms: listing.bedrooms,
                  bathrooms: listing.bathrooms,
                  square_feet: listing.square_feet,
                  image_url: listing.image_url,
                }}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
