/**
 * Realtor.com-specific parser
 * Uses structured data and DOM parsing
 */

import type { ExtractedListingData } from '../types';
import { parseGeneric } from './generic';

export async function parseRealtor(
  html: string,
  url: string
): Promise<ExtractedListingData> {
  // Realtor.com uses structured data well, so generic parser should work
  // Can be enhanced with Realtor-specific selectors if needed
  return parseGeneric(html, url);
}



