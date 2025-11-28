/**
 * Generic DOM-based parser for listing sites
 * Works as a fallback for any platform
 */

import * as cheerio from 'cheerio';
import type { ExtractedListingData } from '../types';
import { formatPrice, extractAddressFromTitle, extractAddressFromUrl, processImages } from '../utils';

export async function parseGeneric(
  html: string,
  url: string
): Promise<ExtractedListingData> {
  const $ = cheerio.load(html);
  const title = $('title').text() || '';

  // Initialize result with defaults
  const result: ExtractedListingData = {
    address: '',
    city: '',
    state: '',
    zip: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    status: '',
    mlsId: '',
    description: '',
    imageUrl: '',
    imageUrls: [],
    url,
    title,
  };

  // Extract from JSON-LD structured data
  const jsonLdScripts = $('script[type="application/ld+json"]');
  jsonLdScripts.each((_, el) => {
    try {
      const text = $(el).text();
      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        const type = item['@type'];
        const isRealEstateType =
          type === 'Product' ||
          type === 'Place' ||
          type === 'RealEstateListing' ||
          type === 'SingleFamilyResidence' ||
          type === 'House' ||
          type === 'Apartment' ||
          (Array.isArray(type) &&
            type.some(
              (t: string) =>
                t === 'Product' || t === 'Place' || t === 'RealEstateListing'
            ));

        if (isRealEstateType) {
          // Extract address
          if (item.address) {
            const addr = item.address;
            if (typeof addr === 'object') {
              if (!result.address) result.address = addr.streetAddress || addr.street || '';
              if (!result.city) result.city = addr.addressLocality || addr.city || '';
              if (!result.state) result.state = addr.addressRegion || addr.region || addr.state || '';
              if (!result.zip) result.zip = addr.postalCode || addr.postcode || addr.zip || '';
            }
          }

          // Extract price
          if (item.offers && !result.price) {
            const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offers?.price) {
              result.price = formatPrice(offers.price);
            } else if (offers?.priceSpecification?.price) {
              result.price = formatPrice(offers.priceSpecification.price);
            }
          } else if (item.price && !result.price) {
            result.price = formatPrice(item.price);
          }

          // Extract property details
          if (item.numberOfBedrooms && !result.bedrooms) {
            result.bedrooms = String(item.numberOfBedrooms);
          } else if (item.bedrooms && !result.bedrooms) {
            result.bedrooms = String(item.bedrooms);
          }

          if (item.numberOfBathroomsTotal && !result.bathrooms) {
            result.bathrooms = String(item.numberOfBathroomsTotal);
          } else if (item.bathrooms && !result.bathrooms) {
            result.bathrooms = String(item.bathrooms);
          }

          if (item.floorSize?.value && !result.squareFeet) {
            result.squareFeet = String(item.floorSize.value);
          } else if (item.area?.value && !result.squareFeet) {
            result.squareFeet = String(item.area.value);
          }

          if (item.description && !result.description) {
            result.description = item.description;
          }
        }
      }
    } catch {
      // Continue to next script
    }
  });

  // Extract from Open Graph meta tags
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDescription = $('meta[property="og:description"]').attr('content') || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || '';

  if (ogImage && !result.imageUrl) {
    result.imageUrl = ogImage;
    result.imageUrls = [ogImage];
  }

  // Extract price from meta tags (but don't put it in address field!)
  if (!result.price && ogTitle) {
    // First, try to extract price that's NOT part of an address pattern
    // Pattern: "$523,900 | address" - extract price before the pipe
    const priceAddressPattern = ogTitle.match(/\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)\s*\|\s*/);
    if (priceAddressPattern) {
      result.price = formatPrice(`$${priceAddressPattern[1]}`);
    } else {
      // Try general price pattern, but validate it's not part of an address
      const priceMatch = ogTitle.match(/\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)/);
      if (priceMatch) {
        // Check if this price is followed by address-like text (don't use it)
        const afterPrice = ogTitle.substring(ogTitle.indexOf(priceMatch[0]) + priceMatch[0].length);
        // If followed by "|" or address-like pattern, it's part of address, skip
        if (!afterPrice.match(/^\s*\|/)) {
          result.price = formatPrice(priceMatch[0]);
        }
      }
    }
  }

  // Extract address from meta tags or title (but NOT from price!)
  if (!result.address) {
    // If ogTitle has "price | address" pattern, extract address part
    if (ogTitle.includes('|')) {
      const parts = ogTitle.split('|');
      if (parts.length > 1) {
        // Address is after the pipe
        const addressPart = parts.slice(1).join('|').trim();
        // Validate it looks like an address (has numbers and street indicators)
        if (/\d/.test(addressPart) && (/\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|pl|place|way|cir|circle|n|s|e|w|north|south|east|west)\b/i.test(addressPart) || 
            addressPart.match(/\d+\s+[A-Z]/))) {
          result.address = addressPart;
        }
      }
    }
    
    // Fallback to title/URL extraction
    if (!result.address) {
      const addressFromTitle = extractAddressFromTitle(ogTitle || title);
      const addressFromUrl = extractAddressFromUrl(url);
      result.address = addressFromTitle || addressFromUrl || '';
    }
  }

  // Extract from DOM selectors
  if (!result.price) {
    const priceText =
      $('[itemprop="price"]').attr('content') ||
      $('[data-testid*="price"]').first().text() ||
      $('[class*="price"]').first().text() ||
      '';
    if (priceText) {
      result.price = formatPrice(priceText);
    }
  }

  if (!result.address) {
    const addressText =
      $('[itemprop="streetAddress"]').text() ||
      $('[data-testid*="address"]').first().text() ||
      $('h1').first().text() ||
      '';
    if (addressText) {
      result.address = addressText.split('|')[0].split('-')[0].trim();
    }
  }

  if (!result.bedrooms) {
    const bedText =
      $('[itemprop="numberOfBedrooms"]').text() ||
      $('[data-testid*="bed"]').first().text() ||
      '';
    const bedMatch = bedText.match(/(\d+)/);
    if (bedMatch) {
      result.bedrooms = bedMatch[1];
    }
  }

  if (!result.bathrooms) {
    const bathText =
      $('[itemprop="numberOfBathroomsTotal"]').text() ||
      $('[data-testid*="bath"]').first().text() ||
      '';
    const bathMatch = bathText.match(/([\d.]+)/);
    if (bathMatch) {
      result.bathrooms = bathMatch[1];
    }
  }

  if (!result.squareFeet) {
    const sqftText =
      $('[itemprop="floorSize"]').text() ||
      $('[data-testid*="sqft"]').first().text() ||
      '';
    const sqftMatch = sqftText.match(/([\d,]+)\s*sq/i);
    if (sqftMatch) {
      result.squareFeet = sqftMatch[1].replace(/,/g, '');
    }
  }

  if (!result.description) {
    result.description =
      $('[itemprop="description"]').text() ||
      $('meta[name="description"]').attr('content') ||
      ogDescription ||
      '';
  }

  // Extract images
  const images: string[] = [];
  if (ogImage) images.push(ogImage);

  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
      images.push(src);
    }
  });

  // Process images: enhance to highest quality, sort by resolution, deduplicate
  if (images.length > 0) {
    const processedImages = processImages(images);
    result.imageUrls = processedImages;
    if (!result.imageUrl && processedImages.length > 0) {
      result.imageUrl = processedImages[0];
    }
  }

  // Ensure we have at least an address
  if (!result.address || result.address.trim() === '') {
    const addressFromTitle = extractAddressFromTitle(title);
    const addressFromUrl = extractAddressFromUrl(url);
    result.address = addressFromTitle || addressFromUrl || 'Property Listing';
  }

  return result;
}

