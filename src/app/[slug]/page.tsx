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

  // Images (keep your safety filters)
  let allImages: string[] = [];
  try {
    if (listing.image_url) {
      const parsed = JSON.parse(listing.image_url);
      if (Array.isArray(parsed)) {
        allImages = parsed.filter((url: string) => {
          if (!url || typeof url !== 'string') return false;
          if (
            url.includes('/homedetails/') ||
            url.includes('/homes/') ||
            url.includes('/alpine-ut/')
          ) {
            return false;
          }
          return (
            url.includes('zillowstatic.com') ||
            url.includes('photos.zillowstatic.com')
          );
        });
      } else if (
        typeof parsed === 'string' &&
        !parsed.includes('/homedetails/') &&
        !parsed.includes('/homes/') &&
        (parsed.includes('zillowstatic.com') ||
          parsed.includes('photos.zillowstatic.com'))
      ) {
        allImages = [parsed];
      }
    }
  } catch {
    if (
      listing.image_url &&
      typeof listing.image_url === 'string' &&
      !listing.image_url.includes('/homedetails/') &&
      !listing.image_url.includes('/homes/') &&
      (listing.image_url.includes('zillowstatic.com') ||
        listing.image_url.includes('photos.zillowstatic.com'))
    ) {
      allImages = [listing.image_url];
    }
  }

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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            {price && (
              <div className="text-lg font-bold text-gray-900">{price}</div>
            )}
            {chips.length > 0 && (
              <div className="mt-0.5 text-xs text-gray-600">{chips.slice(0, 3).join(' • ')}</div>
            )}
          </div>
          <a
            href="#lead"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 active:bg-blue-800"
          >
            Request Info
          </a>
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full h-[62vh] min-h-[520px] max-h-[760px] overflow-hidden">
        {/* Photo */}
        {allImages[0] ? (
          <Image
            src={allImages[0].startsWith('/api/image-proxy')
              ? allImages[0]
              : allImages[0].includes('zillowstatic.com') 
              ? `/api/image-proxy?url=${encodeURIComponent(allImages[0])}`
              : allImages[0]}
            alt={title}
            fill
            priority
            quality={100}
            sizes="100vw"
            className="object-cover"
            unoptimized={allImages[0].includes('zillowstatic.com')}
          />
        ) : listing.image_url ? (
          // Fallback to string URL (non-optimized)
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.image_url} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-gray-200 to-gray-300" />
        )}

        {/* Overlays */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-3 lg:items-end">
              <div className="lg:col-span-2">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-xl">
                  {title}
                </h1>
                {cityLine && (
                  <p className="mt-2 text-white/90 text-lg md:text-xl">
                    {cityLine}
                  </p>
                )}

                {/* Chips */}
                {chips.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {chips.slice(0, 6).map(chip)}
                  </div>
                )}
              </div>

              {/* Price & Primary CTAs */}
              <div className="flex flex-col items-stretch justify-end gap-3">
                {price && (
                  <div className="inline-flex items-center justify-between rounded-2xl bg-white/90 px-6 py-4 shadow-xl ring-1 ring-black/5 backdrop-blur">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Asking Price
                      </div>
                      <div className="text-3xl font-extrabold text-gray-900">
                        {price}
                      </div>
                      {estMonthly && (
                        <div className="mt-1 text-xs text-gray-600">
                          Est. {formatCurrency(estMonthly)}/mo*
                        </div>
                      )}
                    </div>
                    <span className="ml-6 hidden h-10 w-px bg-gray-200 md:block" />
                    <div className="ml-6 flex flex-col gap-2">
                      <a
                        href="#lead"
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 cursor-pointer"
                      >
                        Request info
                      </a>
                      {agent?.calendly_url && (
                        <a
                          href={agent.calendly_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow ring-1 ring-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                          Book a tour
                        </a>
                      )}
                      {hasValidUrl && (
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-gray-900 shadow ring-1 ring-gray-200 hover:bg-gray-50 cursor-pointer"
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
             <div className="mt-4 flex items-center gap-3 text-white/90">
               <ShareButton title={title} />
               <span className="text-xs">Status: {listing.status ?? 'active'}</span>
             </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 pt-8 pb-24 sm:px-6 lg:grid-cols-3 lg:px-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            {allImages.length > 1 && (
              <Card className="border-0 shadow-xl overflow-hidden">
                <ImageGallery images={allImages} address={listing.address} />
              </Card>
            )}

            {/* Highlights (auto-extract first 4 punchy lines from description) */}
            {listing.description && (
              <Card className="border-0 shadow-xl">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Property Highlights
                  </h2>
                  <ul className="mt-4 grid list-disc gap-2 pl-6 text-gray-800 leading-relaxed">
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
                  <details className="mt-6 group">
                    <summary className="cursor-pointer text-sm font-semibold text-blue-700 hover:underline">
                      Read full description
                    </summary>
                    <p className="mt-3 text-gray-700 whitespace-pre-line">
                      {listing.description}
                    </p>
                  </details>
                </div>
              </Card>
            )}

            {/* Specs */}
            <Card className="border-0 shadow-xl">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Details & Specs
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
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
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Take a Virtual Tour
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-3">
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
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900">Location</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {title}
                    {cityLine ? ` — ${cityLine}` : ''}
                  </p>
                  <div className="mt-4 h-80 w-full overflow-hidden rounded-xl ring-1 ring-gray-200">
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
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900">Next Steps</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
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
                      className="group rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:bg-gray-50"
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        {x.t} →
                      </div>
                      <div className="mt-1 text-sm text-gray-600">{x.d}</div>
                    </a>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT – sticky */}
          <aside className="space-y-6 lg:sticky lg:top-6">
            {agent && <AgentCard agent={agent} />}

            {/* View Original Listing Button */}
            {hasValidUrl && (
              <Card className="border-0 shadow-xl">
                <div className="p-6">
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
                  <p className="text-xs text-gray-500 text-center mt-3 leading-relaxed">
                    See full details, photos, and more on the original listing site
                  </p>
                </div>
              </Card>
            )}

            {/* Lead Form */}
            <Card id="lead" className="border-0 shadow-xl">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Request Information
                </h2>
                <p className="mt-1 text-gray-600">
                  Tell us how we can help and an agent will follow up quickly.
                </p>

                {/* Social proof */}
                <div className="mt-4 space-y-2">
                  <ViewCount listingId={listing.id} />
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                    <span>Fast response • No obligation</span>
                  </div>
                  <p className="text-xs text-blue-700 font-medium">
                    ⚡ Contact agent today for best availability
                  </p>
                </div>

                <div className="mt-6">
                  <LeadForm listingId={listing.id} agentName={agent?.full_name || undefined} />
                </div>

                {/* Trust badges */}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {agent?.brokerage && <span>Brokerage: {agent.brokerage}</span>}
                  {agent?.license_number && (
                    <span>Lic #{agent.license_number}</span>
                  )}
                  <span>Secure • Private</span>
                </div>
              </div>
            </Card>

            {/* Simple affordability box (optional) */}
            {price && estMonthly && (
              <Card className="border-0 shadow-xl">
                <div className="p-6">
                  <div className="text-sm font-semibold text-gray-900">
                    Estimate your payment
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-gray-900">
                    {formatCurrency(estMonthly)} <span className="text-sm font-normal text-gray-500">/mo*</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    *Approximation with 20% down, 6.5% APR, taxes & insurance.
                  </p>
                  <a
                    href="#lead"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
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
