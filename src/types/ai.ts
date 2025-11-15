/**
 * TypeScript types for AI enhancement features
 */

/**
 * Response structure from Gemini API
 */
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Structured AI enhancement result
 */
export interface AIEnhancementResult {
  description: string;
  keyFeatures: string[];
  lifestyleSummary: string;
  socialCaption: string;
}

/**
 * Database fields for AI enhancements
 */
export interface ListingAIEnhancements {
  ai_description: string | null;
  ai_key_features: string | null; // JSON string array
  ai_lifestyle_summary: string | null;
  ai_social_caption: string | null;
  ai_enhanced_at: string | null;
  ai_enhancement_status: 'pending' | 'completed' | 'failed';
}

/**
 * Listing data structure for AI enhancement
 */
export interface ListingDataForAI {
  address: string;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  square_feet?: number | null;
  description?: string | null;
  property_type?: string | null;
  property_subtype?: string | null;
  year_built?: number | null;
  lot_size?: string | null;
  features?: string | null; // JSON array
  interior_features?: string | null; // JSON array
  exterior_features?: string | null; // JSON array
  parking_spaces?: number | null;
  garage_spaces?: number | null;
  stories?: number | null;
  heating?: string | null;
  cooling?: string | null;
  flooring?: string | null;
  fireplace_count?: number | null;
  hoa_fee?: number | null;
  price_per_sqft?: number | null;
}

/**
 * Gemini API request structure
 */
export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

