'use client';

import { useState } from 'react';

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

  return (
    <div className="w-full h-48 rounded-lg mb-4 overflow-hidden bg-gray-100">
      <img
        src={imageUrl}
        alt={address}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

