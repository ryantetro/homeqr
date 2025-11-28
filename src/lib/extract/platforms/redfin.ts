/**
 * Redfin-specific parser
 * Uses generic DOM parsing (can be enhanced with Redfin-specific selectors)
 */

import type { ExtractedListingData } from '../types';
import { parseGeneric } from './generic';

export async function parseRedfin(
  html: string,
  url: string
): Promise<ExtractedListingData> {
  return parseGeneric(html, url);
}



