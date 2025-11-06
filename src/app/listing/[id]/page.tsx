import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import LeadForm from '@/components/leads/LeadForm';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/format';

export default async function PublicListingPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', params.id)
    .eq('status', 'active')
    .single();

  if (!listing) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Property Details */}
          <div className="space-y-6">
            {listing.image_url && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={listing.image_url}
                  alt={listing.address}
                  className="w-full h-auto"
                />
              </div>
            )}

            <Card>
              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {listing.address}
                </h1>
                {listing.city && listing.state && (
                  <p className="text-lg text-gray-600 mb-4">
                    {listing.city}, {listing.state} {listing.zip}
                  </p>
                )}

                {listing.price && (
                  <div className="mb-6">
                    <p className="text-4xl font-bold text-gray-900">
                      {formatCurrency(listing.price)}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {listing.bedrooms && (
                    <div>
                      <p className="text-sm text-gray-600">Bedrooms</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {listing.bedrooms}
                      </p>
                    </div>
                  )}
                  {listing.bathrooms && (
                    <div>
                      <p className="text-sm text-gray-600">Bathrooms</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {listing.bathrooms}
                      </p>
                    </div>
                  )}
                  {listing.square_feet && (
                    <div>
                      <p className="text-sm text-gray-600">Square Feet</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {listing.square_feet.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {listing.description && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      Description
                    </h2>
                    <p className="text-gray-600">{listing.description}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Lead Form */}
          <div>
            <Card>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Request Information
                </h2>
                <p className="text-gray-600 mb-6">
                  Fill out the form below and we'll get back to you soon.
                </p>
                <LeadForm listingId={listing.id} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


