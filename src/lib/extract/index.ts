/**
 * Main extraction module
 * Routes to platform-specific parsers
 */

import axios from 'axios';
import type {
  SupportedPlatform,
  ExtractedListingData,
  ExtractionResult,
} from './types';
import { isValidUrl, detectPlatform, isSupportedPlatform } from './utils';
import { parseZillow } from './platforms/zillow';
import { parseRealtor } from './platforms/realtor';
import { parseRedfin } from './platforms/redfin';
import { parseHomes } from './platforms/homes';
import { parseTrulia } from './platforms/trulia';
import { parseUtahRealEstate } from './platforms/utahrealestate';
import { parseGeneric } from './platforms/generic';
import { getExtractedFields, getMissingFields } from './utils';
import { fetchWithBrowser, requiresBrowser } from './browser';
import { validateAndClean, type ValidationResult } from './validation';

/**
 * Fetch HTML using axios with improved headers
 */
async function fetchWithAxios(url: string): Promise<string> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'Referer': 'https://www.google.com/', // Add referer to look more legitimate
    },
    timeout: 30000, // 30 second timeout
    maxRedirects: 5,
    validateStatus: (status) => status < 500, // Don't throw on 4xx, we'll handle it
  });

  // Handle non-200 status codes
  if (response.status !== 200) {
    if (response.status === 403) {
      throw new Error('Access denied. The listing site may be blocking automated requests.');
    }
    if (response.status === 404) {
      throw new Error('Listing page not found. Please check the URL.');
    }
    if (response.status === 429) {
      throw new Error('Rate limited. Please wait a moment and try again.');
    }
    throw new Error(`Failed to fetch listing page (status ${response.status})`);
  }

  return response.data as string;
}

/**
 * Extract listing data from a URL
 */
export async function extractListingData(
  url: string
): Promise<ExtractionResult> {
  // Validate URL
  if (!isValidUrl(url)) {
    return {
      success: false,
      error: 'Invalid URL format',
    };
  }

  // Check if platform is supported
  if (!isSupportedPlatform(url)) {
    return {
      success: false,
      error:
        'Unsupported platform. Supported: Zillow, Realtor.com, Redfin, Homes.com, Trulia, UtahRealEstate',
    };
  }

  try {
    let html: string;

    // Use Puppeteer for sites with heavy bot protection
    if (requiresBrowser(url)) {
      try {
        html = await fetchWithBrowser(url);
      } catch (browserError: unknown) {
        const browserMessage =
          browserError instanceof Error
            ? browserError.message
            : 'Browser extraction failed';
        console.error('[Extract] Browser extraction failed, falling back to axios:', browserMessage);

        // Fallback to axios if browser fails
        try {
          const response = await fetchWithAxios(url);
          html = response;
        } catch (axiosError: unknown) {
          return {
            success: false,
            error: `Failed to extract listing: ${browserMessage}. Please try the Chrome extension instead.`,
          };
        }
      }
    } else {
      // Use axios for sites without heavy protection
      html = await fetchWithAxios(url);
    }

    if (!html || typeof html !== 'string') {
      return {
        success: false,
        error: 'Failed to fetch listing page',
      };
    }

    // Detect platform and parse first - we'll check for blocks after parsing
    // This allows us to extract data even if there are some block indicators
    const platform = detectPlatform(url);
    let data: ExtractedListingData;

    switch (platform) {
      case 'zillow':
        data = await parseZillow(html, url);
        break;
      case 'realtor':
        data = await parseRealtor(html, url);
        break;
      case 'redfin':
        data = await parseRedfin(html, url);
        break;
      case 'homes':
        data = await parseHomes(html, url);
        break;
      case 'trulia':
        data = await parseTrulia(html, url);
        break;
      case 'utahrealestate':
        data = await parseUtahRealEstate(html, url);
        break;
      default:
        data = await parseGeneric(html, url);
    }

    // Validate and clean extracted data
    const validation = validateAndClean(data);
    
    // Check if validation detected a block page
    const blockPageIssue = validation.issues.find(
      issue => issue.message.includes('blocked access') || issue.message.includes('Chrome extension')
    );
    if (blockPageIssue) {
      return {
        success: false,
        error: blockPageIssue.message,
        extractedFields: [],
      };
    }
    
    // Use cleaned data
    const cleanedData = validation.cleanedData;
    
    // Check if we got meaningful data
    const extractedFields = getExtractedFields(cleanedData);
    const missingFields = getMissingFields(cleanedData);

    // Check for block pages only if we couldn't extract meaningful data
    if (missingFields.length > 0 && extractedFields.length === 0) {
      const htmlLower = html.toLowerCase();
      const isBlocked = 
        htmlLower.includes('access to this page has been denied') ||
        htmlLower.includes('px-captcha') ||
        (htmlLower.includes('captcha') && (htmlLower.includes('verify') || htmlLower.includes('robot'))) ||
        (htmlLower.includes('cloudflare') && htmlLower.includes('checking')) ||
        htmlLower.includes('checking your browser') ||
        htmlLower.includes('please verify you are a human') ||
        htmlLower.includes('unusual traffic') ||
        (htmlLower.includes('denied') && htmlLower.includes('zillow')) ||
        (htmlLower.includes('blocked') && (htmlLower.includes('automated') || htmlLower.includes('bot')));
      
      if (isBlocked) {
        return {
          success: false,
          error: 'The listing site is blocking automated access. Please use the Chrome extension instead, which runs in your browser and can access the page directly. Alternatively, you can manually enter the listing details.',
          extractedFields: [],
        };
      }
      
      return {
        success: false,
        error: 'Could not extract listing data. Please try the Chrome extension or manual entry.',
      };
    }

    return {
      success: true,
      data: cleanedData,
      extractedFields,
      missingFields: missingFields.length > 0 ? missingFields : undefined,
      validation: {
        isValid: validation.isValid,
        issues: validation.issues,
        confidence: validation.confidence,
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to extract listing data';

    // Handle specific error types
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Extraction timed out. Please try again.',
        };
      }
      if (error.response?.status === 403 || error.response?.status === 404) {
        return {
          success: false,
          error: 'Could not access listing page. Please check the URL.',
        };
      }
    }

    return {
      success: false,
      error: message,
    };
  }
}

