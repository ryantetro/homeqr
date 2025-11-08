'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ListingCardImageProps {
  imageUrl: string | null;
  address: string;
}

export default function ListingCardImage({ imageUrl, address }: ListingCardImageProps) {
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div className="w-full h-48 rounded-lg mb-4 bg-gray-100 flex items-center justify-center">
        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  // Use proxy for Zillow images to ensure they load
  const getBestImageUrl = (url: string): string => {
    if (!url) return url;
    
    // If already a proxy URL, return as-is (prevent double-proxying)
    if (url.startsWith('/api/image-proxy')) {
      return url;
    }
    
    // Use proxy for all Zillow CDN images
    if (url.includes('zillowstatic.com') || url.includes('photos.zillowstatic.com')) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    
    return url;
  };

  const optimizedUrl = getBestImageUrl(imageUrl);

  return (
    <div className="relative w-full h-48 rounded-lg mb-4 overflow-hidden bg-gray-100">
      <Image
        src={optimizedUrl}
        alt={address}
        fill
        quality={95}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
        onError={() => setImageError(true)}
        unoptimized={optimizedUrl.startsWith('/api/image-proxy')}
      />
    </div>
  );
}

