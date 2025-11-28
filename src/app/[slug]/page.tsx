// app/(site)/listings/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import LeadForm from '@/components/leads/LeadForm';
import Card from '@/components/ui/Card';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils/format';
import ImageGallery from '@/components/listings/ImageGallery';
import AgentCard from '@/components/listings/AgentCard';
import ShareButton from '@/components/listings/ShareButton';
import ViewCount from '@/components/listings/ViewCount';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import AIEnhancements from '@/components/listings/AIEnhancements';

// Small helpers
const formatNumber = (n?: number | null) =>
  typeof n === 'number' ? n.toLocaleString() : undefined;

const chip = (label: string) => (
  <span
    key={label}
    className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-md"
  >
    {label}
  </span>
);

export default async function SlugListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  // Listing + agent
  const { data: listing, error } = await supabase
    .from('listings')
    .select(
      `
      *,
      url,
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
    `
    )
    .eq('slug', slug)
    .single();

  if (error || !listing) {
    console.error('Listing not found by slug:', { slug, error });
    notFound();
  }
  if (listing.status !== 'active') {
    console.warn('Listing found but status is not active:', {
      slug,
      status: listing.status,
    });
  }

  // Debug: Log URL field
  console.log('[Slug Microsite] Listing URL field:', { 
    id: listing.id, 
    slug,
    address: listing.address,
    url: listing.url, 
    urlType: typeof listing.url,
    hasUrl: !!listing.url,
    urlLength: listing.url?.length || 0
  });
  
  // Additional validation: ensure URL is a valid string
  const hasValidUrl = listing.url && typeof listing.url === 'string' && listing.url.trim().length > 0;

  // Parse images - handle multiple formats: JSON array string, array object, or single URL string
  let allImages: string[] = [];
  
  if (listing.image_url) {
    try {
      let parsed: unknown = listing.image_url;
      
      // If it's already an array (from Supabase JSONB), use it directly
      if (Array.isArray(parsed)) {
        allImages = parsed;
      } 
      // If it's a string, try to parse as JSON
      else if (typeof parsed === 'string') {
        // Try parsing as JSON first
        try {
          parsed = JSON.parse(parsed);
        } catch {
          // If parsing fails, treat as single URL string
          parsed = listing.image_url;
        }
        
        // Handle parsed result
        if (Array.isArray(parsed)) {
          allImages = parsed;
        } else if (typeof parsed === 'string') {
          allImages = [parsed];
        }
      }
    } catch (error) {
      console.error('[Slug Microsite] Error parsing image_url:', error);
      // Fallback: treat as single URL string
      if (typeof listing.image_url === 'string') {
        allImages = [listing.image_url];
      }
    }
  }
  
  // Filter and validate images
  allImages = allImages
    .filter((url: string) => {
      if (!url || typeof url !== 'string') return false;
      
      // Reject listing pages, floorplans, and invalid URLs
      if (url.includes('/homedetails/') || 
          url.includes('/homes/') || 
          url.includes('/alpine-ut/') ||
          url.includes('/floorplans/') || // Filter out floorplan URLs (often 404)
          !url.startsWith('http')) {
        return false;
      }
      
      // Check if it's a valid image file
      const isImageFile = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
      if (!isImageFile) return false;
      
      // Allow images from known property photo domains
      const isPropertyPhotoDomain = 
        url.includes('zillowstatic.com') || 
        url.includes('photos.zillowstatic.com') ||
        url.includes('utahrealestate.com') ||
        url.includes('assets.utahrealestate.com') ||
        url.includes('realtor.com') ||
        url.includes('redfin.com') ||
        url.includes('homes.com') ||
        url.includes('trulia.com');
      
      return isPropertyPhotoDomain || url.startsWith('http');
    })
    .slice(0, 50); // Limit to 50 images max

  const agent = listing.users as {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    brokerage: string | null;
    avatar_url: string | null;
    logo_url: string | null;
    license_number: string | null;
    calendly_url: string | null;
  } | null;

  // Derive a few display bits
  const title = listing.address || 'Property';
  const cityLine =
    listing.city && listing.state
      ? `${listing.city}, ${listing.state} ${listing.zip ?? ''}`.trim()
      : '';
  const price = listing.price ? formatCurrency(listing.price) : undefined;
  const chips: string[] = [
    listing.bedrooms ? `${listing.bedrooms} bd` : '',
    listing.bathrooms ? `${listing.bathrooms} ba` : '',
    listing.square_feet ? `${formatNumber(listing.square_feet)} sqft` : '',
    listing.lot_size_acres
      ? `${formatNumber(listing.lot_size_acres)} ac`
      : listing.lot_size_sqft
      ? `${formatNumber(listing.lot_size_sqft)} lot sqft`
      : '',
    listing.year_built ? `Built ${listing.year_built}` : '',
  ].filter(Boolean) as string[];

  // Simple mortgage calc (client could replace later)
  const estMonthly =
    listing.price && typeof listing.price === 'number'
      ? Math.round((listing.price * 0.8 * 0.065) / 12 + 250 + 150)
      : undefined;

  // JSON-LD for SEO (basic)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SingleFamilyResidence',
    name: title,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.zip,
      addressCountry: 'US',
    },
    numberOfRooms: listing.bedrooms,
    floorSize: listing.square_feet
      ? { '@type': 'QuantitativeValue', value: listing.square_feet, unitCode: 'FTK' }
      : undefined,
    offers: listing.price
      ? {
          '@type': 'Offer',
          price: listing.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        }
      : undefined,
    image: allImages?.slice(0, 10),
  };

  return (
    <div className="min-h-screen bg-white">
      <PageViewTracker listingId={listing.id} source="microsite" />
      {/* SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Sticky mobile bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/85 shadow-2xl border-t lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 gap-3">
          <div className="flex-1 min-w-0">
            {price && (
              <div className="text-base md:text-lg font-bold text-gray-900 truncate">{price}</div>
            )}
            {chips.length > 0 && (
              <div className="mt-0.5 text-xs text-gray-600 truncate">{chips.slice(0, 2).join(' • ')}</div>
            )}
          </div>
          {agent?.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-200 min-w-[44px] min-h-[44px]"
              aria-label="Call agent"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>
          )}
          <a
            href="#lead"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 active:bg-blue-800 min-h-[44px] shrink-0"
          >
            Request Info
          </a>
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full h-[40vh] md:h-[50vh] min-h-[300px] md:min-h-[400px] max-h-[500px] md:max-h-[600px] overflow-hidden">
        {/* Photo */}
        {allImages[0] ? (
          <Image
            src={allImages[0].startsWith('/api/image-proxy')
              ? allImages[0]
              : (allImages[0].includes('zillowstatic.com') || allImages[0].includes('utahrealestate.com'))
              ? `/api/image-proxy?url=${encodeURIComponent(allImages[0])}`
              : allImages[0]}
            alt={title}
            fill
            priority
            quality={100}
            sizes="100vw"
            className="object-cover"
            unoptimized={(allImages[0].includes('zillowstatic.com') || allImages[0].includes('utahrealestate.com'))}
          />
        ) : listing.image_url ? (
          // Fallback to string URL (non-optimized)
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={listing.image_url.includes('zillowstatic.com') || listing.image_url.includes('utahrealestate.com')
              ? `/api/image-proxy?url=${encodeURIComponent(listing.image_url)}`
              : listing.image_url} 
            alt={title} 
            className="absolute inset-0 h-full w-full object-cover" 
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300" />
        )}
        
        {/* Tap to view gallery hint for mobile */}
        {allImages.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-medium md:hidden">
            Tap image to view gallery
          </div>
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Mobile Price Container - Bottom Right */}
        {price && (
          <div className="absolute bottom-1 right-4 md:hidden z-10">
            <div className="flex flex-col items-end rounded-lg bg-white/95 px-2.5 py-1.5 shadow-lg ring-1 ring-black/5 backdrop-blur">
              <div className="text-right">
                <div className="text-base font-extrabold text-gray-900 leading-tight">
                  {price}
                </div>
                {estMonthly && (
                  <div className="mt-0.5 text-[9px] text-gray-600 leading-tight">
                    {formatCurrency(estMonthly)}/mo*
                  </div>
                )}
              </div>
              <a
                href="#lead"
                className="mt-1.5 inline-flex items-center justify-center rounded-md bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md hover:bg-blue-700 cursor-pointer min-h-[28px]"
              >
                Request info
              </a>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
            <div className="grid gap-3 md:gap-4 lg:grid-cols-3 lg:items-end">
              <div className="lg:col-span-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-xl leading-tight">
                  {title}
                </h1>
                {cityLine && (
                  <p className="mt-1.5 text-white/90 text-sm sm:text-base md:text-lg">
                    {cityLine}
                  </p>
                )}

                {/* Chips */}
                {chips.length > 0 && (
                  <div className="mt-2 md:mt-3 flex flex-wrap gap-1.5">
                    {chips.slice(0, 4).map(chip)}
                  </div>
                )}
              </div>

              {/* Price & Primary CTAs - Desktop Only */}
              <div className="hidden md:flex flex-col items-stretch justify-end gap-2 md:gap-3 mt-4 lg:mt-0">
                {price && (
                  <div className="inline-flex flex-col md:flex-row items-stretch md:items-center justify-between rounded-lg md:rounded-2xl bg-white/95 md:bg-white/90 px-2 md:px-6 py-1 md:py-4 shadow-md md:shadow-xl ring-1 ring-black/5 backdrop-blur">
                    <div className="flex-1 min-w-0">
                      <div className="hidden md:block text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Asking Price
                      </div>
                      <div className="text-base md:text-3xl font-extrabold text-gray-900 leading-tight">
                        {price}
                      </div>
                      {estMonthly && (
                        <div className="mt-0.5 md:mt-1 text-[10px] md:text-xs text-gray-600 leading-tight">
                          {formatCurrency(estMonthly)}/mo*
                        </div>
                      )}
                    </div>
                    <span className="my-1 md:my-0 md:ml-6 hidden md:block h-10 w-px bg-gray-200" />
                    <div className="flex flex-row md:flex-col gap-1 md:gap-2 md:ml-6 mt-1 md:mt-0">
                      <a
                        href="#lead"
                        className="flex-1 md:flex-none inline-flex items-center justify-center rounded-md md:rounded-xl bg-blue-600 px-2 md:px-5 py-1.5 md:py-2.5 text-[10px] md:text-sm font-semibold text-white shadow-md md:shadow-lg hover:bg-blue-700 cursor-pointer min-h-[32px] md:min-h-[44px]"
                      >
                        Request info
                      </a>
                      {agent?.calendly_url && (
                        <a
                          href={agent.calendly_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 md:flex-none inline-flex items-center justify-center rounded-md md:rounded-xl bg-white px-2 md:px-5 py-1.5 md:py-2.5 text-[10px] md:text-sm font-semibold text-gray-900 shadow ring-1 ring-gray-200 hover:bg-gray-50 cursor-pointer min-h-[32px] md:min-h-[44px]"
                        >
                          Book tour
                        </a>
                      )}
                      {hasValidUrl && (
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hidden md:inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-gray-900 shadow ring-1 ring-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Original Listing
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

             {/* Share row */}
             <div className="mt-2 flex items-center gap-3 text-white/90">
               <ShareButton title={title} />
               <span className="text-xs">Status: {listing.status ?? 'active'}</span>
             </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:gap-5 px-4 pt-4 md:pt-5 pb-20 md:pb-16 sm:px-6 lg:grid-cols-12 lg:px-8">
          {/* LEFT COLUMN - Request Information */}
          <aside className="lg:col-span-3 space-y-4 md:space-y-5 lg:sticky lg:top-4 lg:h-fit">
            <Card id="lead" className="border-0 shadow-xl">
              <div className="p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                  Request Information
                </h2>
                <p className="mt-1.5 text-sm md:text-base text-gray-600">
                  Tell us how we can help and an agent will follow up quickly.
                </p>

                {/* Social proof */}
                <div className="mt-3 space-y-1.5">
                  <ViewCount listingId={listing.id} />
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                    <span>Fast response • No obligation</span>
                  </div>
                  <p className="text-sm text-blue-700 font-medium">
                    ⚡ Contact agent today for best availability
                  </p>
                </div>

                <div className="mt-4">
                  <LeadForm listingId={listing.id} agentName={agent?.full_name || undefined} />
                </div>

                {/* Trust badges */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  {agent?.brokerage && <span>Brokerage: {agent.brokerage}</span>}
                  {agent?.license_number && (
                    <span>Lic #{agent.license_number}</span>
                  )}
                  <span>Secure • Private</span>
                </div>
              </div>
            </Card>
          </aside>

          {/* MIDDLE COLUMN - Property Details */}
          <div className="lg:col-span-6 space-y-4 md:space-y-5">
            {/* Gallery */}
            {allImages.length > 1 && (
              <Card className="border-0 shadow-xl overflow-hidden">
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

            {/* Highlights (auto-extract first 4 punchy lines from description) */}
            {listing.description && !listing.ai_description && (
              <Card className="border-0 shadow-xl">
                <div className="p-4 md:p-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Property Highlights
                  </h2>
                  <ul className="mt-3 grid list-disc gap-1.5 pl-5 text-sm md:text-base text-gray-800 leading-relaxed">
                    {listing.description
                      .split(/[\.\n]/)
                      .map((s: string) => s.trim())
                      .filter(Boolean)
                      .slice(0, 6)
                      .map((line: string, i: number) => (
                        <li key={i}>{line}</li>
                      ))}
                  </ul>

                  {/* Full description (collapsible) */}
                  <details className="mt-4 group">
                    <summary className="cursor-pointer text-sm font-semibold text-blue-700 hover:underline">
                      Read full description
                    </summary>
                    <p className="mt-2 text-gray-700 whitespace-pre-line text-sm">
                      {listing.description}
                    </p>
                  </details>
                </div>
              </Card>
            )}

            {/* Specs */}
            <Card className="border-0 shadow-xl">
              <div className="p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                  Details & Specs
                </h2>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {[
                    ['Type', listing.property_type || 'Single Family Residence'],
                    ['Year Built', listing.year_built],
                    ['Stories', listing.stories],
                    ['Garage', listing.garage_spaces ? `${listing.garage_spaces} car` : undefined],
                    ['Heating', listing.heating ?? '—'],
                    ['Cooling', listing.cooling ?? '—'],
                    ['HOA', listing.hoa_fee ? formatCurrency(listing.hoa_fee) + '/mo' : 'No HOA'],
                    ['MLS', listing.mls_id || listing.mls_number],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div
                        key={k as string}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <span className="text-sm font-medium text-gray-600">{k}</span>
                        <span className="text-sm font-semibold text-gray-900">{String(v ?? '—')}</span>
                      </div>
                    ))}
                </div>
              </div>
            </Card>

            {/* Virtual tour */}
            {(listing.virtual_tour_url ||
              listing.matterport_url ||
              listing.video_url) && (
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="p-4 md:p-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    Take a Virtual Tour
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {listing.virtual_tour_url && (
                      <a
                        className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-black"
                        href={listing.virtual_tour_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Virtual Tour
                      </a>
                    )}
                    {listing.matterport_url && (
                      <a
                        className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-900 shadow hover:bg-gray-200"
                        href={listing.matterport_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Matterport
                      </a>
                    )}
                    {listing.video_url && (
                      <a
                        className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-900 shadow hover:bg-gray-200"
                        href={listing.video_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Watch Video
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Map */}
            {(listing.address || (listing.city && listing.state)) && (
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="p-4 md:p-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Location</h2>
                  <p className="mt-1 text-xs text-gray-600">
                    {title}
                    {cityLine ? ` — ${cityLine}` : ''}
                  </p>
                  <div className="mt-3 h-64 md:h-72 w-full overflow-hidden rounded-xl ring-1 ring-gray-200">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                        `${listing.address ?? ''} ${listing.city ?? ''} ${listing.state ?? ''} ${listing.zip ?? ''}`.trim()
                      )}&output=embed`}
                      title="Map location"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* FAQ / next steps */}
            <Card className="border-0 shadow-xl">
              <div className="p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Next Steps</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {[
                    {
                      t: 'Book a tour',
                      d: 'See the property in person or virtually.',
                      href: agent?.calendly_url || '#lead',
                    },
                    {
                      t: 'Ask about financing',
                      d: 'We’ll connect you with a local lender.',
                      href: '#lead',
                    },
                    {
                      t: 'Request disclosures',
                      d: 'Get property disclosures and comps.',
                      href: '#lead',
                    },
                  ].map((x) => (
                    <a
                      key={x.t}
                      href={x.href}
                      className="group rounded-lg border border-gray-200 p-3 hover:border-gray-300 hover:bg-gray-50"
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        {x.t} →
                      </div>
                      <div className="mt-0.5 text-xs text-gray-600">{x.d}</div>
                    </a>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN - Agent Card */}
          <aside className="lg:col-span-3 space-y-4 md:space-y-5 lg:sticky lg:top-4 lg:h-fit">
            {agent && <AgentCard agent={agent} />}

            {/* View Original Listing Button */}
            {hasValidUrl && (
              <Card className="border-0 shadow-xl">
                <div className="p-4 md:p-5">
                  <a
                    href={listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Original Listing
                  </a>
                  <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
                    See full details, photos, and more on the original listing site
                  </p>
                </div>
              </Card>
            )}

            {/* Simple affordability box (optional) */}
            {price && estMonthly && (
              <Card className="border-0 shadow-xl">
                <div className="p-4 md:p-5">
                  <div className="text-sm md:text-base font-semibold text-gray-900">
                    Estimate your payment
                  </div>
                  <div className="mt-1.5 text-xl md:text-2xl font-extrabold text-gray-900">
                    {formatCurrency(estMonthly)} <span className="text-sm font-normal text-gray-500">/mo*</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    *Approximation with 20% down, 6.5% APR, taxes & insurance.
                  </p>
                  <a
                    href="#lead"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                  >
                    Get pre-approval help
                  </a>
                </div>
              </Card>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
