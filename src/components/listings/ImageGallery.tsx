'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  address: string;
}

// Helper function to get the best quality image URL
// Use proxy for all Zillow images to ensure they load and handle CORS
function getImageUrl(url: string): string {
  if (!url) return url;
  
  // If already a proxy URL, return as-is (prevent double-proxying)
  if (url.startsWith('/api/image-proxy')) {
    return url;
  }
  
  const isZillowImageCDN = (url.includes('zillowstatic.com') || 
                           url.includes('photos.zillowstatic.com')) &&
                          /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
  
  // Reject listing pages
  if (url.includes('/homedetails/') || url.includes('/homes/')) {
    return url;
  }
  
  // For Zillow CDN images, always use proxy
  // The proxy will handle enhancement and fallback if base URLs don't exist
  if (isZillowImageCDN) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  
  // For non-Zillow images, return as-is
  return url;
}

export default function ImageGallery({ images, address }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!images || images.length === 0) {
    return null;
  }

  const processedImages = images.map(img => getImageUrl(img));
  const mainImage = processedImages[mainImageIndex] || processedImages[0];
  const thumbnailCount = processedImages.length - 1;

  return (
    <div className="space-y-4">
      {/* Main Image - Responsive Container */}
      <div className="relative w-full aspect-4/3 overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={mainImage}
          alt={address}
          fill
          quality={100}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover cursor-pointer hover:opacity-95 transition-opacity duration-200"
          onClick={() => setSelectedImage(mainImage)}
          priority={mainImageIndex === 0}
          unoptimized={mainImage.startsWith('/api/image-proxy')}
        />
      </div>

      {/* Collapsible Photo Gallery */}
      {processedImages.length > 1 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {processedImages.length} {processedImages.length === 1 ? 'Photo' : 'Photos'}
              </h3>
              <span className="text-xs text-gray-500">
                ({thumbnailCount} {thumbnailCount === 1 ? 'thumbnail' : 'thumbnails'})
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isExpanded && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                {processedImages.map((img, idx) => {
                  if (idx === mainImageIndex) return null;
                  
                  return (
                    <div 
                      key={idx}
                      className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all duration-200 group"
                      onClick={() => {
                        setMainImageIndex(idx);
                        setIsExpanded(false);
                      }}
                    >
                      <Image
                        src={img}
                        alt={`${address} - Image ${idx + 1}`}
                        fill
                        quality={95}
                        sizes="(max-width: 640px) 25vw, (max-width: 768px) 20vw, 16vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        unoptimized={img.startsWith('/api/image-proxy')}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Full-screen image viewer */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt={address}
            className="max-w-full max-h-full object-contain p-4"
            referrerPolicy="no-referrer"
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl font-bold transition-all duration-200 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
