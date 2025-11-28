'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function QuickExtractCard() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExtract = () => {
    if (!url.trim()) return;
    
    // Navigate to new listing page with URL pre-filled
    const encodedUrl = encodeURIComponent(url.trim());
    router.push(`/dashboard/listings/new?url=${encodedUrl}`);
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl hover:shadow-2xl transition-all">
      <div className="p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="shrink-0">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Add Property
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              Paste a listing URL to automatically extract property details
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && url.trim()) {
                    handleExtract();
                  }
                }}
                placeholder="https://www.zillow.com/homedetails/..."
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
            </div>
            <Button
              variant="primary"
              onClick={handleExtract}
              disabled={loading || !url.trim()}
              className="px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
            >
              {loading ? 'Loading...' : 'Create Listing'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="font-medium">Works with:</span>
            <span className="px-2 py-1 bg-white rounded-md border border-gray-200">Zillow</span>
            <span className="px-2 py-1 bg-white rounded-md border border-gray-200">Realtor.com</span>
            <span className="px-2 py-1 bg-white rounded-md border border-gray-200">Redfin</span>
            <span className="px-2 py-1 bg-white rounded-md border border-gray-200">Homes.com</span>
            <span className="px-2 py-1 bg-white rounded-md border border-gray-200">Trulia</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

