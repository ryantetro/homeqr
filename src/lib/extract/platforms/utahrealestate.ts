/**
 * UtahRealEstate.com-specific parser
 * Extracts from meta tags and DOM with URE-specific patterns
 */

import * as cheerio from 'cheerio';
import type { ExtractedListingData } from '../types';
import { formatPrice, extractAddressFromTitle, extractAddressFromUrl, processImages } from '../utils';

export async function parseUtahRealEstate(
  html: string,
  url: string
): Promise<ExtractedListingData> {
  const $ = cheerio.load(html);
  const title = $('title').text() || '';

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

  // Extract from Open Graph meta tags (URE uses this pattern: "$price | address")
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDescription = $('meta[property="og:description"]').attr('content') || '';

  // Pattern: "$523,900 | 414 N 100 E American Fork UT 84003"
  const priceAddressPattern = ogTitle.match(/\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)\s*\|\s*(.+)/);
  if (priceAddressPattern) {
    // Extract price
    result.price = formatPrice(`$${priceAddressPattern[1]}`);

    // Extract address from the part after the pipe
    const addressPart = priceAddressPattern[2].trim();
    
    // Try to parse full address: "548 N 850 W Provo UT 84601"
    // Pattern: street (may have directional) city state zip
    // First try with comma: "548 N 850 W, Provo, UT 84601"
    const fullAddressMatch = addressPart.match(/^(\d+\s+[^,]+(?:[NS]|[EW]|[North]|[South]|[East]|[West])?[^,]*),?\s*([^,]+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/);
    if (fullAddressMatch) {
      result.address = fullAddressMatch[1].trim();
      result.city = fullAddressMatch[2].trim();
      result.state = fullAddressMatch[3].trim();
      result.zip = fullAddressMatch[4].trim();
    } else {
      // Try pattern without comma: "548 N 850 W Provo UT 84601"
      // Match: number + street + city + state + zip
      const noCommaMatch = addressPart.match(/^(\d+\s+[^A-Z]+?)\s+([A-Z][^A-Z]+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (noCommaMatch) {
        result.address = noCommaMatch[1].trim();
        result.city = noCommaMatch[2].trim();
        result.state = noCommaMatch[3].trim();
        result.zip = noCommaMatch[4].trim();
      } else {
        // Try to find state and zip at the end: "548 N 850 W Provo UT 84601"
        const stateZipMatch = addressPart.match(/\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
        if (stateZipMatch) {
          const beforeStateZip = addressPart.substring(0, addressPart.indexOf(stateZipMatch[0])).trim();
          // Try to find where city starts (usually after street number/directional)
          const parts = beforeStateZip.split(/\s+/);
          // Find where city likely starts (after street number and directional)
          let cityStartIdx = 0;
          for (let i = 0; i < parts.length; i++) {
            if (/^\d+$/.test(parts[i]) || /^[NS]|[EW]$/i.test(parts[i])) {
              cityStartIdx = i + 1;
            } else if (i > 0 && /^[A-Z]/.test(parts[i]) && !/^[NS]|[EW]$/i.test(parts[i])) {
              // Likely start of city name
              if (cityStartIdx === 0) cityStartIdx = i;
              break;
            }
          }
          result.address = parts.slice(0, cityStartIdx).join(' ');
          result.city = parts.slice(cityStartIdx).join(' ');
          result.state = stateZipMatch[1];
          result.zip = stateZipMatch[2];
        } else {
          // Fallback: use the whole thing as address
          result.address = addressPart;
        }
      }
    }
  }

  // Extract from page title if address not found
  if (!result.address) {
    const addressFromTitle = extractAddressFromTitle(title);
    const addressFromUrl = extractAddressFromUrl(url);
    result.address = addressFromTitle || addressFromUrl || '';
  }

  // Extract price from meta tags if not already found
  if (!result.price && ogTitle) {
    const priceMatch = ogTitle.match(/\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)/);
    if (priceMatch) {
      result.price = formatPrice(priceMatch[0]);
    }
  }

  // Extract property details from DOM
  // Look for "2 Beds", "1 Baths", "726 Sq. Ft." pattern
  const propertyText = $('body').text();
  
  // Extract bedrooms
  const bedMatch = propertyText.match(/(\d+)\s+Beds?/i);
  if (bedMatch) {
    result.bedrooms = bedMatch[1];
  }

  // Extract bathrooms
  const bathMatch = propertyText.match(/(\d+(?:\.\d+)?)\s+Baths?/i);
  if (bathMatch) {
    result.bathrooms = bathMatch[1];
  }

  // Extract square feet
  const sqftMatch = propertyText.match(/([\d,]+)\s+Sq\.?\s*Ft\.?/i);
  if (sqftMatch) {
    result.squareFeet = sqftMatch[1].replace(/,/g, '');
  }

  // Extract MLS ID
  const mlsMatch = propertyText.match(/MLS[#:]?\s*(\d+)/i);
  if (mlsMatch) {
    result.mlsId = mlsMatch[1];
  } else {
    // Try to extract from URL
    const urlMatch = url.match(/\/(\d+)$/);
    if (urlMatch) {
      result.mlsId = urlMatch[1];
    }
  }

  // Extract description
  const descMatch = ogDescription || $('meta[name="description"]').attr('content') || '';
  if (descMatch) {
    result.description = descMatch;
  } else {
    // Try to find description in page content
    const descText = $('p').first().text() || '';
    if (descText.length > 50) {
      result.description = descText.substring(0, 500);
    }
  }

  // Extract images from gallery
  const images: string[] = [];
  
  // Try Open Graph image first
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    images.push(ogImage);
  }

  // Extract from gallery items (URE uses data-src on li elements)
  $('[data-src]').each((_, el) => {
    const src = $(el).attr('data-src');
    if (src && 
        src.startsWith('http') && 
        src.includes('utahrealestate.com') &&
        !src.includes('/floorplans/') && // Exclude floorplan URLs (often 404)
        !src.includes('logo')) {
      images.push(src);
    }
  });

  // Also check img elements
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (src && 
        src.startsWith('http') && 
        src.includes('utahrealestate.com') && 
        !src.includes('logo') &&
        !src.includes('/floorplans/')) { // Exclude floorplan URLs
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

