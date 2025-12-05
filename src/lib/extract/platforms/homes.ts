/**
 * Homes.com-specific parser
 * Uses generic DOM parsing (can be enhanced with Homes.com-specific selectors)
 */

import type { ExtractedListingData } from '../types';
import { parseGeneric } from './generic';

export async function parseHomes(
  html: string,
  url: string
): Promise<ExtractedListingData> {
  return parseGeneric(html, url);
}






