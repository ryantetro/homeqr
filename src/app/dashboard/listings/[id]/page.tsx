import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import QRCodeDisplay from '@/components/qr/QRCodeDisplay';
import LeadTable from '@/components/leads/LeadTable';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/format';
import Link from 'next/link';
import ImageGallery from '@/components/listings/ImageGallery';

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
    .select('*, qrcodes(id, qr_url, scan_count), leads(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!listing) {
    notFound();
  }

  const leads = listing.leads || [];
  const qrCode = listing.qrcodes?.[0] || null;

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
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Status</p>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                Active
              </span>
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
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listing.mls_id && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">MLS ID</p>
                    <p className="text-base font-medium text-gray-900">{listing.mls_id}</p>
                  </div>
                )}
                {listing.year_built && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Year Built</p>
                    <p className="text-base font-medium text-gray-900">{listing.year_built}</p>
                  </div>
                )}
                {listing.lot_size && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Lot Size</p>
                    <p className="text-base font-medium text-gray-900">{listing.lot_size}</p>
                  </div>
                )}
                {listing.home_type && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Home Type</p>
                    <p className="text-base font-medium text-gray-900">{listing.home_type}</p>
                  </div>
                )}
              </div>

              {listing.description && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
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
                    <p className="text-sm font-medium text-gray-900">Total Scans</p>
                    <p className="text-xs text-gray-500">QR code views</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{qrCode?.scan_count || 0}</p>
              </div>
              
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
                <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
              </div>
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
              <QRCodeDisplay listingId={listing.id} existingQR={qrCode} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
