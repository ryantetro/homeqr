/**
 * Type definitions for URL-based listing extraction
 * All types are strictly defined - no `any` types allowed
 */

export type SupportedPlatform =
  | 'zillow'
  | 'realtor'
  | 'redfin'
  | 'homes'
  | 'trulia'
  | 'utahrealestate'
  | 'generic';

export type ExtractionState = 'idle' | 'extracting' | 'success' | 'error' | 'partial';

export interface ExtractedListingData {
  address: string;
  city: string;
  state: string;
  zip: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  status: string;
  mlsId: string;
  description: string;
  imageUrl: string;
  imageUrls: string[];
  url: string;
  title?: string;
  // Additional property details (optional)
  propertyType?: string | null;
  propertySubtype?: string | null;
  yearBuilt?: string | null;
  lotSize?: string | null;
  features?: string[] | null;
  interiorFeatures?: string[] | null;
  exteriorFeatures?: string[] | null;
  parkingSpaces?: string | null;
  garageSpaces?: string | null;
  stories?: string | null;
  heating?: string | null;
  cooling?: string | null;
  flooring?: string | null;
  fireplaceCount?: string | null;
  hoaFee?: string | null;
  taxAssessedValue?: string | null;
  annualTaxAmount?: string | null;
  pricePerSqft?: string | null;
  zestimate?: string | null;
  daysOnMarket?: string | null;
  listingDate?: string | null;
}

export interface ExtractionResult {
  success: boolean;
  data?: ExtractedListingData;
  error?: string;
  extractedFields?: string[];
  missingFields?: string[];
  validation?: {
    isValid: boolean;
    issues: Array<{
      field: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      originalValue?: string;
      suggestedValue?: string;
    }>;
    confidence: number; // 0-100
  };
}

export type PlatformParser = (
  html: string,
  url: string
) => Promise<ExtractedListingData>;

export interface PlatformConfig {
  name: SupportedPlatform;
  domains: string[];
  parser: PlatformParser;
}

