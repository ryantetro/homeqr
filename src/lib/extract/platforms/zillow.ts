/**
 * Zillow-specific parser
 * Extracts from JSON cache (Apollo, gdpClientCache) and DOM fallback
 */

import * as cheerio from 'cheerio';
import type { ExtractedListingData } from '../types';
import { formatPrice, parseMaybeJSON, uniqueUrls, processImages, getUrlResolutionScore } from '../utils';
import { parseGeneric } from './generic';

export async function parseZillow(
  html: string,
  url: string
): Promise<ExtractedListingData> {
  const $ = cheerio.load(html);

  // Try to extract from JSON cache first
  const jsonData = await tryJsonCache($, html);
  if (jsonData && jsonData.address) {
    // If price is missing, try to extract from meta tags
    if (!jsonData.price) {
      const priceFromMeta = extractPriceFromMetaTags($);
      if (priceFromMeta) {
        jsonData.price = priceFromMeta;
      }
    }
    return { ...jsonData, url };
  }

  // Fallback to generic DOM parsing
  return parseGeneric(html, url);
}

/**
 * Try to extract from Zillow's JSON cache
 */
async function tryJsonCache(
  $: cheerio.CheerioAPI,
  html: string
): Promise<ExtractedListingData | null> {
  try {
    // Look for __NEXT_DATA__ script
    const nextDataScript = $('script#__NEXT_DATA__').html();
    if (!nextDataScript) {
      return null;
    }

    const parsed = parseMaybeJSON(nextDataScript);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const data = parsed as Record<string, unknown>;

    // Try to find property data in various locations
    const props = data?.props as Record<string, unknown> | undefined;
    const pageProps = props?.pageProps as Record<string, unknown> | undefined;
    
    const cache =
      (pageProps?.componentProps as Record<string, unknown> | undefined)
        ?.gdpClientCache ??
      (pageProps?.initialData as Record<string, unknown> | undefined)
        ?.gdpClientCache ??
      null;

    const parsedCache = parseMaybeJSON(cache as string | object);

    if (parsedCache && typeof parsedCache === 'object') {
      const cacheObj = parsedCache as Record<string, unknown>;
      const entries = Object.entries(cacheObj);

      // Prefer ForSalePriorityQuery / ForSaleFullRenderQuery
      const preferred = entries.find(([k]) =>
        /ForSalePriorityQuery|ForSaleFullRenderQuery/i.test(k)
      ) ||
        entries.find(([k]) =>
          /ForSalePropertyQuery|PropertyQuery/i.test(k)
        );

      if (preferred) {
        const [, entry] = preferred;
        const entryObj = entry as Record<string, unknown> | undefined;
        const dataObj = entryObj?.data as Record<string, unknown> | undefined;
        
        const prop =
          (entryObj?.property as Record<string, unknown> | undefined) ??
          (dataObj?.property as Record<string, unknown> | undefined) ??
          (entryObj?.home as Record<string, unknown> | undefined) ??
          (entryObj as Record<string, unknown> | undefined);

        if (prop && typeof prop === 'object') {
          return buildResult(prop);
        }
      }

      // Fallback: scan for any property-like node
      for (const [, entry] of entries.slice(0, 500)) {
        if (entry && typeof entry === 'object') {
          const entryObj = entry as Record<string, unknown>;
          const dataObj = entryObj.data as Record<string, unknown> | undefined;
          
          const prop =
            (entryObj.property as Record<string, unknown> | undefined) ??
            (dataObj?.property as Record<string, unknown> | undefined) ??
            (entryObj.home as Record<string, unknown> | undefined) ??
            entryObj;

          if (
            prop &&
            typeof prop === 'object' &&
            (prop.streetAddress ||
              prop.address ||
              prop.responsivePhotos ||
              prop.price)
          ) {
            return buildResult(prop);
          }
        }
      }
    }

    // Try legacy property locations
    const legacy =
      (pageProps?.initialData as Record<string, unknown> | undefined)
        ?.property ??
      pageProps?.property ??
      (pageProps?.componentProps as Record<string, unknown> | undefined)
        ?.property;

    if (legacy && typeof legacy === 'object') {
      return buildResult(legacy as Record<string, unknown>);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract price from Open Graph meta tags as fallback
 */
function extractPriceFromMetaTags($: cheerio.CheerioAPI): string | null {
  try {
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    
    // Pattern 1: "$523,900 | ..." (price at start of ogTitle)
    const priceAtStart = ogTitle.match(/^\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)/);
    if (priceAtStart) {
      return formatPrice(priceAtStart[0]);
    }
    
    // Pattern 2: "... | $523,900" (price in ogTitle after pipe)
    const priceAfterPipe = ogTitle.match(/\|\s*\$?\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)/);
    if (priceAfterPipe) {
      return formatPrice(`$${priceAfterPipe[1]}`);
    }
    
    // Pattern 3: "Listed for sale at $1595000" (ogDescription)
    const listedForSale = ogDescription.match(/listed\s+for\s+sale\s+at\s+\$?\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (listedForSale) {
      return formatPrice(`$${listedForSale[1]}`);
    }
    
    // Pattern 4: "$290,000 ∙ ..." or "... ∙ $290,000" (ogDescription with bullet)
    const priceWithBullet = ogDescription.match(/\$?\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)\s*[∙•·]/);
    if (priceWithBullet) {
      return formatPrice(`$${priceWithBullet[1]}`);
    }
    
    // Pattern 5: General price pattern in ogDescription
    const generalPrice = ogDescription.match(/\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)/);
    if (generalPrice) {
      const priceNum = parseInt(generalPrice[1].replace(/,/g, ''), 10);
      // Only accept reasonable prices (between $10,000 and $50,000,000)
      if (priceNum >= 10000 && priceNum <= 50000000) {
        return formatPrice(`$${generalPrice[1]}`);
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Build normalized result from property object
 */
function buildResult(prop: Record<string, unknown>): ExtractedListingData {
  const addr = (prop.address as Record<string, unknown>) || {};

  const address =
    (addr.streetAddress as string) ||
    (addr.street as string) ||
    (addr.line as string) ||
    (prop.streetAddress as string) ||
    '';

  const city =
    (addr.city as string) || (prop.city as string) || '';

  const state =
    (addr.state as string) || (prop.state as string) || '';

  const zip =
    (addr.zipcode as string) ||
    (addr.zipCode as string) ||
    (prop.zipcode as string) ||
    (prop.zipCode as string) ||
    '';

  // Extract price with multiple fallbacks
  const priceRaw =
    (prop.price as string | number) ??
    (prop.listPrice as string | number) ??
    (prop.unformattedPrice as string | number) ??
    (prop.priceReduction as string | number) ??
    (prop.currentPrice as string | number) ??
    (prop.askingPrice as string | number) ??
    ((prop.adTargets as Record<string, unknown>)?.price as string | number) ??
    ((prop.priceHistory as Array<Record<string, unknown>> | undefined)?.[0]?.price as string | number) ??
    '';

  let priceValue: string | number = priceRaw;
  if (priceRaw && typeof priceRaw === 'object') {
    const priceObj = priceRaw as Record<string, unknown>;
    priceValue =
      (priceObj.value as string | number) ??
      (priceObj.amount as string | number) ??
      (priceObj.price as string | number) ??
      (priceObj.listPrice as string | number) ??
      '';
  }

  // Validate price is meaningful (not 0, not empty, reasonable range)
  let price = '';
  if (priceValue) {
    const numValue = typeof priceValue === 'number' 
      ? priceValue 
      : parseInt(String(priceValue).replace(/[^0-9]/g, ''), 10);
    
    // Only use price if it's in a reasonable range ($10,000 - $50,000,000)
    if (!isNaN(numValue) && numValue >= 10000 && numValue <= 50000000) {
      price = formatPrice(priceValue);
    }
  }

  // Extract bedrooms
  const bedrooms =
    (prop.bedrooms as string | number) ??
    (prop.beds as string | number) ??
    ((prop.adTargets as Record<string, unknown>)?.bd as string | number) ??
    '';

  // Extract bathrooms
  const bathrooms =
    (prop.bathrooms as string | number) ??
    (prop.baths as string | number) ??
    ((prop.adTargets as Record<string, unknown>)?.ba as string | number) ??
    '';

  // Extract square feet
  const squareFeetRaw =
    (prop.livingArea as string | number) ??
    (prop.livingAreaValue as string | number) ??
    (prop.area as string | number) ??
    ((prop.adTargets as Record<string, unknown>)?.sqft as string | number) ??
    '';

  let squareFeet = '';
  if (squareFeetRaw) {
    const sqftNum =
      typeof squareFeetRaw === 'number'
        ? squareFeetRaw
        : parseInt(String(squareFeetRaw).replace(/[^0-9]/g, ''), 10);

    if (!isNaN(sqftNum) && sqftNum > 100 && sqftNum < 50000) {
      squareFeet = String(sqftNum);
    }
  }

  // Extract description
  const description =
    (prop.description as string) ||
    (prop.longDescription as string) ||
    (prop.summary as string) ||
    '';

  // Extract MLS ID
  const mlsId =
    (prop.mlsId as string) ||
    (prop.mlsNumber as string) ||
    (prop.mls as string) ||
    '';

  // Extract photos - prioritize listing's own photos
  const photos: string[] = [];
  const mediaPhotos = prop.media as Record<string, unknown>;
  const responsivePhotos = prop.responsivePhotos as
    | Array<Record<string, unknown>>
    | undefined;

  // Strategy: Use media.photos first (most reliable for listing's own gallery)
  // Then responsivePhotos (also listing's own)
  if (mediaPhotos?.photos && Array.isArray(mediaPhotos.photos)) {
    for (const photo of mediaPhotos.photos as Array<Record<string, unknown>>) {
      if (photo.url && typeof photo.url === 'string') {
        photos.push(photo.url);
      }
    }
  } else if (responsivePhotos && Array.isArray(responsivePhotos)) {
    for (const photo of responsivePhotos) {
      if (photo.url && typeof photo.url === 'string') {
        photos.push(photo.url);
      } else if (photo.mixedSources) {
        const mixed = photo.mixedSources as Record<string, unknown>;
        const jpeg = mixed.jpeg as Array<Record<string, unknown>> | undefined;
        if (jpeg && jpeg.length > 0 && jpeg[0].url) {
          // For mixedSources, prefer highest quality variant
          // Sort by resolution score and take the best
          const sortedJpeg = jpeg
            .filter((j): j is Record<string, unknown> & { url: string } => 
              typeof j.url === 'string'
            )
            .map((j) => ({
              url: j.url,
              score: getUrlResolutionScore(j.url),
            }))
            .sort((a, b) => b.score - a.score);
          
          if (sortedJpeg.length > 0) {
            photos.push(sortedJpeg[0].url);
          }
        }
      }
    }
  }

  // Process images: enhance to highest quality, sort by resolution, deduplicate
  const imageUrls = processImages(uniqueUrls(photos));

  return {
    address: address || '',
    city: city || '',
    state: state || '',
    zip: zip || '',
    price: price || '',
    bedrooms: bedrooms ? String(bedrooms) : '',
    bathrooms: bathrooms ? String(bathrooms) : '',
    squareFeet: squareFeet || '',
    status: (prop.homeStatus as string) || '',
    mlsId: mlsId || '',
    description: description || '',
    imageUrl: imageUrls[0] || '',
    imageUrls: imageUrls,
    url: '',
  };
}

