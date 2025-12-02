'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function QuickAddProperty() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleExtract = () => {
    if (!url.trim()) return;
    
    // Navigate to new listing page with URL pre-filled
    const encodedUrl = encodeURIComponent(url.trim());
    router.push(`/dashboard/listings/new?url=${encodedUrl}`);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex-1 relative min-w-0">
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
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
          />
        </div>
        <Button
          variant="primary"
          onClick={handleExtract}
          disabled={loading || !url.trim()}
          size="sm"
          className="shrink-0"
        >
          {loading ? 'Adding...' : 'Add'}
        </Button>
        <div className="relative shrink-0">
          <button
            type="button"
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            onFocus={() => setShowInfo(true)}
            onBlur={() => setShowInfo(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Learn more about adding properties"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {/* Tooltip */}
          {showInfo && (
            <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none">
              <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
              <p className="font-medium mb-1.5">Quick Add Property</p>
              <p className="text-gray-300 leading-relaxed">
                Paste any property listing URL from Zillow, Realtor.com, Redfin, Homes.com, or Trulia. 
                We&apos;ll automatically extract the property details and create your listing.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Helper text below */}
      <p className="text-xs text-gray-500 px-1">
        Works with Zillow, Realtor.com, Redfin, Homes.com, Trulia, and other MLS sites
      </p>
    </div>
  );
}

