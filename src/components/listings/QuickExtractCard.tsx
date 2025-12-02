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
    <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              placeholder="Paste listing URL from Zillow, Realtor.com, Redfin..."
              disabled={loading}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleExtract}
            disabled={loading || !url.trim()}
            size="sm"
            className="whitespace-nowrap shrink-0"
          >
            {loading ? 'Loading...' : 'Create'}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs text-gray-500">
          <span>Works with:</span>
          <span className="text-gray-400">Zillow</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400">Realtor.com</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400">Redfin</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400">Homes.com</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400">Trulia</span>
        </div>
      </div>
    </Card>
  );
}

