/**
 * Shared utilities for listing extraction
 */

import type { SupportedPlatform, ExtractedListingData } from './types';

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): SupportedPlatform {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('zillow.com')) return 'zillow';
  if (urlLower.includes('realtor.com')) return 'realtor';
  if (urlLower.includes('redfin.com')) return 'redfin';
  if (urlLower.includes('homes.com')) return 'homes';
  if (urlLower.includes('trulia.com')) return 'trulia';
  if (urlLower.includes('utahrealestate.com')) return 'utahrealestate';
  
  return 'generic';
}

/**
 * Check if platform is supported
 */
export function isSupportedPlatform(url: string): boolean {
  const platform = detectPlatform(url);
  return platform !== 'generic' || url.includes('zillow.com') || url.includes('realtor.com');
}

/**
 * Format price from various input types
 */
export function formatPrice(price: string | number | null | undefined): string {
  if (!price && price !== 0) return '';
  
  // Handle string prices like "$1,575,000" or "1575000"
  if (typeof price === 'string') {
    const cleaned = price.replace(/[$,]/g, '').trim();
    const num = Number(cleaned);
    if (!isNaN(num) && num > 0) {
      return `$${num.toLocaleString()}`;
    }
  }
  
  // Handle number prices
  if (typeof price === 'number') {
    if (isNaN(price) || price <= 0) return '';
    return `$${price.toLocaleString()}`;
  }
  
  return '';
}

/**
 * Extract address from title
 */
export function extractAddressFromTitle(title: string): string {
  if (!title) return '';
  // Zillow titles are usually: "123 Main St, City, State ZIP | MLS #12345 | Zillow"
  const match = title.match(/^([^|]+)/);
  if (match) {
    return match[1].trim();
  }
  return '';
}

/**
 * Extract address from URL
 */
export function extractAddressFromUrl(url: string): string {
  if (!url) return '';
  // Zillow URLs: /homedetails/123-Main-St-City-ST-12345/12345678_zpid/
  const match = url.match(/\/homedetails\/([^/]+)\//);
  if (match) {
    // Replace hyphens with spaces and format
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
  return '';
}

/**
 * Parse JSON string repeatedly until it's an object
 */
export function parseMaybeJSON(input: string | object): object | null {
  let out: string | object = input;
  
  // We only allow a couple of passes to avoid pathological cases
  for (let i = 0; i < 2; i++) {
    if (typeof out === 'string') {
      const trimmed = out.trim();
      if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
      ) {
        try {
          out = JSON.parse(trimmed);
          continue;
        } catch {
          return null;
        }
      }
    }
    break;
  }
  
  return typeof out === 'object' && out !== null ? out : null;
}

/**
 * Deduplicate URLs
 */
export function uniqueUrls(urls: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  return urls.filter((u): u is string => {
    if (!u) return false;
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

/**
 * Track which fields were successfully extracted
 */
export function getExtractedFields(data: ExtractedListingData): string[] {
  const fields: string[] = [];
  
  if (data.address) fields.push('address');
  if (data.city) fields.push('city');
  if (data.state) fields.push('state');
  if (data.zip) fields.push('zip');
  if (data.price) fields.push('price');
  if (data.bedrooms) fields.push('bedrooms');
  if (data.bathrooms) fields.push('bathrooms');
  if (data.squareFeet) fields.push('squareFeet');
  if (data.description) fields.push('description');
  if (data.imageUrls && data.imageUrls.length > 0) fields.push('images');
  if (data.mlsId) fields.push('mlsId');
  
  return fields;
}

/**
 * Get missing required fields
 */
export function getMissingFields(data: ExtractedListingData): string[] {
  const required = ['address'];
  const missing: string[] = [];
  
  for (const field of required) {
    if (!data[field as keyof ExtractedListingData] || 
        String(data[field as keyof ExtractedListingData]).trim() === '') {
      missing.push(field);
    }
  }
  
  return missing;
}

/**
 * Score image quality based on URL (higher = better quality)
 * Matches extension logic for consistency
 */
export function getUrlResolutionScore(url: string): number {
  if (!url || typeof url !== 'string') return 0;
  
  // 1. Panorama variants: -p_e (highest) > -p_d > -p_c > -p_b > -p_a (lowest)
  const panoramaMatch = url.match(/-p_([a-e])\./i);
  if (panoramaMatch) {
    const letter = panoramaMatch[1].toLowerCase();
    const scores: Record<string, number> = { e: 5000, d: 4000, c: 3000, b: 2000, a: 1000 };
    return scores[letter] || 1000;
  }
  
  // 2. Width in path: /1920x1080/, /3840x2160/, etc.
  const pathSizeMatch = url.match(/\/(\d+)x(\d+)\//);
  if (pathSizeMatch) {
    const area = parseInt(pathSizeMatch[1]) * parseInt(pathSizeMatch[2]);
    return Math.min(area / 100, 5000); // Cap at reasonable score
  }
  
  // 3. Query parameters: ?w=1920, ?width=3840
  const queryWidthMatch = url.match(/[?&](?:w|width)=(\d+)/);
  if (queryWidthMatch) {
    return Math.min(parseInt(queryWidthMatch[1]) / 10, 5000);
  }
  
  // 4. Underscore width: _w1920, _width3840
  const underscoreWidthMatch = url.match(/_w(?:idth)?(\d+)/);
  if (underscoreWidthMatch) {
    return Math.min(parseInt(underscoreWidthMatch[1]) / 10, 5000);
  }
  
  // 5. Zillow -cc_ft_ patterns: -cc_ft_1920, -cc_ft_3840 (higher = better)
  const ccFtMatch = url.match(/-cc_ft_(\d+)/);
  if (ccFtMatch) {
    const width = parseInt(ccFtMatch[1], 10);
    // Higher widths get higher scores
    if (width >= 3840) return 5000;
    if (width >= 1920) return 4000;
    if (width >= 960) return 3000;
    if (width >= 640) return 2000;
    return 1000;
  }
  
  // 6. Quality indicators in URL
  if (url.includes('xlarge') || url.includes('full') || url.includes('hd')) return 4000;
  if (url.includes('large')) return 3000;
  if (url.includes('medium')) return 2000;
  if (url.includes('small') || url.includes('thumb')) return 1000;
  
  // 7. Base URL without resolution indicators (often original/highest quality)
  if (url.match(/\.(jpg|jpeg|png|webp)$/i) && !url.match(/[-_](ft_|p_|thumb|small|medium|large|w\d+)/i)) {
    return 6000; // Highest priority for base URLs
  }
  
  // Unknown pattern, give low priority
  return 1000;
}

/**
 * Enhance image URL to highest resolution
 * Matches extension logic: removes panorama suffixes, enhances -cc_ft_ patterns
 */
export function enhanceImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  
  // BEST: Remove panorama suffix to get original/base resolution
  // Base URLs without -p_ suffix are often the original high-resolution images
  // This works for both Zillow and UtahRealEstate (URE -p_e URLs redirect, base URLs work)
  if (url.includes('-p_')) {
    const baseUrl = url.replace(/-p_[a-e]\.jpg/i, '.jpg');
    // Return base URL - this is often the highest quality original image
    return baseUrl;
  }
  
  // FALLBACK: If no panorama suffix, try adding -p_e (highest panorama variant)
  // But only if URL doesn't already have resolution indicators
  if (url.match(/\.jpg$/i) && !url.match(/[-_](p_|cc_ft_|large|xlarge|hd|full|w\d+)/i)) {
    const enhanced = url.replace(/\.jpg$/i, '-p_e.jpg');
    return enhanced;
  }
  
  // Try to enhance -cc_ft_ width patterns to highest resolution
  const ccFtMatch = url.match(/-cc_ft_(\d+)/);
  if (ccFtMatch) {
    const currentWidth = parseInt(ccFtMatch[1], 10);
    // Try higher resolutions if we have a low-res version
    if (currentWidth < 3840) {
      return url.replace(/-cc_ft_\d+/, '-cc_ft_3840');
    }
    if (currentWidth < 1920) {
      return url.replace(/-cc_ft_\d+/, '-cc_ft_1920');
    }
  }
  
  return url;
}

/**
 * Process and prioritize images by quality
 * Sorts by resolution score, deduplicates by canonical URL, enhances to highest quality
 */
export function processImages(images: string[]): string[] {
  if (!images || images.length === 0) return [];
  
  // Step 1: Enhance URLs to highest resolution
  const enhanced = images.map((url) => ({
    url: enhanceImageUrl(url),
    originalUrl: url,
    score: getUrlResolutionScore(enhanceImageUrl(url)),
  }));
  
  // Step 2: Sort by score (highest first)
  enhanced.sort((a, b) => {
    if (a.score === b.score) {
      // If same score, prefer longer URLs (often more specific)
      return (b.url.length) - (a.url.length);
    }
    return b.score - a.score;
  });
  
  // Step 3: Deduplicate using canonical URLs (same photo, different resolutions)
  // This ensures we only keep the highest quality version of each unique photo
  const canonicalPhotos = new Map<string, typeof enhanced[0]>();
  
  for (const item of enhanced) {
    if (!item || !item.url) continue;
    
    // Create canonical URL by removing resolution parameters
    let canonical = item.url
      .replace(/-p_[a-e]\.jpg/i, '.jpg') // Remove panorama suffix
      .replace(/-cc_ft_\d+/g, '') // Remove width parameters
      .replace(/[?&]w=\d+/g, '') // Remove query width params
      .replace(/[?&]width=\d+/g, '') // Remove query width params
      .replace(/_w\d+/g, '') // Remove width suffix
      .replace(/\/\d+x\d+\//g, '/') // Remove path dimensions
      .split('?')[0]; // Remove query string
    
    // If we haven't seen this canonical URL, or this version has higher quality
    const existing = canonicalPhotos.get(canonical);
    if (!existing || existing.score < item.score) {
      canonicalPhotos.set(canonical, item);
    }
  }
  
  // Step 4: Convert back to array, sort by quality again, and limit
  const deduplicated = Array.from(canonicalPhotos.values())
    .sort((a, b) => b.score - a.score)
    .map((item) => item.url)
    .slice(0, 30); // Limit to top 30 high-quality photos
  
  return deduplicated;
}

