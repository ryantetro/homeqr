'use client';

import { useState, useEffect, useRef } from 'react';
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
  
  const isUtahRealEstateCDN = (url.includes('utahrealestate.com') || 
                               url.includes('assets.utahrealestate.com')) &&
                              /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
  
  // Reject listing pages and floorplans
  if (url.includes('/homedetails/') || 
      url.includes('/homes/') || 
      url.includes('/floorplans/')) {
    return url;
  }
  
  // For Zillow CDN images, always use proxy
  // The proxy will handle enhancement and fallback if base URLs don't exist
  if (isZillowImageCDN) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  
  // For UtahRealEstate images, use proxy to handle CORS and 404s gracefully
  if (isUtahRealEstateCDN) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  
  // For other images, return as-is
  return url;
}

export default function ImageGallery({ images, address }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const processedImages = images.map(img => getImageUrl(img));
  const mainImage = processedImages[mainImageIndex] || processedImages[0];
  const thumbnailCount = processedImages.length - 1;

  // Swipe handlers for mobile carousel
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && mainImageIndex < processedImages.length - 1) {
      setMainImageIndex(mainImageIndex + 1);
    }
    if (isRightSwipe && mainImageIndex > 0) {
      setMainImageIndex(mainImageIndex - 1);
    }
  };

  // Lightbox swipe handlers
  const onLightboxTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return; // Don't swipe if zoomed
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onLightboxTouchMove = (e: React.TouchEvent) => {
    if (isZoomed) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onLightboxTouchEnd = () => {
    if (isZoomed) return;
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && selectedImageIndex < processedImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
      setSelectedImage(processedImages[selectedImageIndex + 1]);
    }
    if (isRightSwipe && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
      setSelectedImage(processedImages[selectedImageIndex - 1]);
    }
  };

  // Hide header when lightbox is open
  useEffect(() => {
    if (selectedImage) {
      document.body.classList.add('lightbox-open');
      // Prevent body scroll when lightbox is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('lightbox-open');
      document.body.style.overflow = '';
    }

    return () => {
      document.body.classList.remove('lightbox-open');
      document.body.style.overflow = '';
    };
  }, [selectedImage]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
        setSelectedImageIndex(selectedImageIndex - 1);
        setSelectedImage(processedImages[selectedImageIndex - 1]);
      } else if (e.key === 'ArrowRight' && selectedImageIndex < processedImages.length - 1) {
        setSelectedImageIndex(selectedImageIndex + 1);
        setSelectedImage(processedImages[selectedImageIndex + 1]);
      } else if (e.key === 'Escape') {
        setSelectedImage(null);
        setIsZoomed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, selectedImageIndex, processedImages]);

  // Handle image click to open lightbox
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setSelectedImage(processedImages[index]);
    setIsZoomed(false);
  };

  // Navigate lightbox
  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedImageIndex > 0) {
      const newIndex = selectedImageIndex - 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(processedImages[newIndex]);
    } else if (direction === 'next' && selectedImageIndex < processedImages.length - 1) {
      const newIndex = selectedImageIndex + 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(processedImages[newIndex]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Image - Responsive Container with Swipe Support */}
      <div 
        className="relative w-full aspect-[16/10] md:aspect-4/3 overflow-hidden rounded-lg bg-gray-100"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={mainImage}
          alt={address}
          fill
          quality={100}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover cursor-pointer hover:opacity-95 transition-opacity duration-200 select-none"
          onClick={() => handleImageClick(mainImageIndex)}
          priority={mainImageIndex === 0}
          unoptimized={mainImage.startsWith('/api/image-proxy')}
          draggable={false}
        />
        
        {/* Swipe indicators for mobile */}
        {processedImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {processedImages.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === mainImageIndex ? 'bg-white w-6' : 'bg-white/50 w-1.5'
                }`}
              />
            ))}
          </div>
        )}

        {/* Navigation arrows for desktop */}
        {processedImages.length > 1 && (
          <>
            {mainImageIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMainImageIndex(mainImageIndex - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all duration-200 hidden md:flex"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {mainImageIndex < processedImages.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMainImageIndex(mainImageIndex + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all duration-200 hidden md:flex"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </>
        )}
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
      
      {/* Full-screen image viewer with swipe support */}
      {selectedImage && (
        <div 
          ref={lightboxRef}
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onTouchStart={onLightboxTouchStart}
          onTouchMove={onLightboxTouchMove}
          onTouchEnd={onLightboxTouchEnd}
          onClick={(e) => {
            if (e.target === lightboxRef.current && !isZoomed) {
              setSelectedImage(null);
              setIsZoomed(false);
            }
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              ref={imageRef}
              src={selectedImage}
              alt={address}
              className={`max-w-full max-h-full object-contain p-4 md:p-8 transition-transform duration-300 ${
                isZoomed ? 'scale-150 cursor-move' : 'cursor-zoom-in'
              }`}
              referrerPolicy="no-referrer"
              onClick={(e) => {
                e.stopPropagation();
                if (!isZoomed) {
                  setIsZoomed(true);
                }
              }}
              onDoubleClick={() => setIsZoomed(!isZoomed)}
              draggable={false}
            />

            {/* Image counter */}
            {processedImages.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                {selectedImageIndex + 1} / {processedImages.length}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => {
                setSelectedImage(null);
                setIsZoomed(false);
              }}
              className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white text-2xl font-bold transition-all duration-200 flex items-center justify-center backdrop-blur-sm"
              aria-label="Close"
            >
              ×
            </button>

            {/* Navigation arrows */}
            {processedImages.length > 1 && !isZoomed && (
              <>
                {selectedImageIndex > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLightbox('prev');
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {selectedImageIndex < processedImages.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLightbox('next');
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </>
            )}

            {/* Zoom hint for mobile */}
            {!isZoomed && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-medium hidden md:block">
                Double-click to zoom • Swipe to navigate
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
