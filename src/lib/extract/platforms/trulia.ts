/**
 * Trulia-specific parser
 * Uses generic DOM parsing (can be enhanced with Trulia-specific selectors)
 */

import type { ExtractedListingData } from '../types';
import { parseGeneric } from './generic';

export async function parseTrulia(
  html: string,
  url: string
): Promise<ExtractedListingData> {
  return parseGeneric(html, url);
}




