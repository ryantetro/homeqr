/**
 * AI Enhancement Service
 * Enhances property listings using Gemini AI
 */

import { generateContent, isGeminiAvailable } from './gemini';
import type { ListingDataForAI, ListingAIEnhancements, AIEnhancementResult } from '@/types/ai';

/**
 * Build comprehensive prompt for AI enhancement
 */
function buildEnhancementPrompt(listingData: ListingDataForAI): string {
  const {
    address,
    city,
    state,
    zip,
    price,
    bedrooms,
    bathrooms,
    square_feet,
    description,
    property_type,
    property_subtype,
    year_built,
    lot_size,
    features,
    interior_features,
    exterior_features,
    parking_spaces,
    garage_spaces,
    stories,
    heating,
    cooling,
    flooring,
    fireplace_count,
    hoa_fee,
    price_per_sqft,
  } = listingData;

  // Parse JSON arrays if they exist
  let featuresList: string[] = [];
  let interiorFeaturesList: string[] = [];
  let exteriorFeaturesList: string[] = [];

  try {
    if (features) {
      const parsed = JSON.parse(features);
      if (Array.isArray(parsed)) featuresList = parsed;
    }
  } catch {
    // Ignore parse errors
  }

  try {
    if (interior_features) {
      const parsed = JSON.parse(interior_features);
      if (Array.isArray(parsed)) interiorFeaturesList = parsed;
    }
  } catch {
    // Ignore parse errors
  }

  try {
    if (exterior_features) {
      const parsed = JSON.parse(exterior_features);
      if (Array.isArray(parsed)) exteriorFeaturesList = parsed;
    }
  } catch {
    // Ignore parse errors
  }

  // Build property details string
  const location = [address, city, state, zip].filter(Boolean).join(', ');
  const priceStr = price ? `$${price.toLocaleString()}` : 'Price not specified';
  const specs = [
    bedrooms ? `${bedrooms} bed${bedrooms !== 1 ? 's' : ''}` : null,
    bathrooms ? `${bathrooms} bath${bathrooms !== 1 ? 's' : ''}` : null,
    square_feet ? `${square_feet.toLocaleString()} sq ft` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const prompt = `You are a professional real estate copywriter. Enhance this property listing with engaging, SEO-friendly content.

PROPERTY DETAILS:
- Address: ${location}
- Price: ${priceStr}
- Specs: ${specs || 'Not specified'}
${property_type ? `- Property Type: ${property_type}${property_subtype ? ` (${property_subtype})` : ''}` : ''}
${year_built ? `- Year Built: ${year_built}` : ''}
${lot_size ? `- Lot Size: ${lot_size}` : ''}
${stories ? `- Stories: ${stories}` : ''}
${parking_spaces ? `- Parking: ${parking_spaces} space${parking_spaces !== 1 ? 's' : ''}` : ''}
${garage_spaces ? `- Garage: ${garage_spaces} space${garage_spaces !== 1 ? 's' : ''}` : ''}
${heating ? `- Heating: ${heating}` : ''}
${cooling ? `- Cooling: ${cooling}` : ''}
${flooring ? `- Flooring: ${flooring}` : ''}
${fireplace_count ? `- Fireplaces: ${fireplace_count}` : ''}
${hoa_fee ? `- HOA Fee: $${hoa_fee}/month` : ''}
${price_per_sqft ? `- Price per sq ft: $${price_per_sqft.toFixed(2)}` : ''}

${featuresList.length > 0 ? `Features: ${featuresList.join(', ')}` : ''}
${interiorFeaturesList.length > 0 ? `Interior Features: ${interiorFeaturesList.join(', ')}` : ''}
${exteriorFeaturesList.length > 0 ? `Exterior Features: ${exteriorFeaturesList.join(', ')}` : ''}

${description ? `Original Description: ${description}` : ''}

Please provide a JSON response with the following structure:
{
  "description": "A polished, SEO-friendly property description (2-3 paragraphs, engaging and professional)",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "lifestyleSummary": "A brief paragraph about the neighborhood, lifestyle, and who this home is perfect for",
  "socialCaption": "An Instagram/Facebook-ready caption (engaging, includes emojis, under 2200 characters)"
}

IMPORTANT:
- Make the description compelling and highlight unique selling points
- Extract the top 5-7 most impressive features for keyFeatures array
- The lifestyle summary should be warm and inviting, focusing on the lifestyle benefits
- The social caption should be engaging and include relevant emojis
- All content should be professional, accurate, and avoid exaggeration
- Return ONLY valid JSON, no markdown formatting or code blocks`;

  return prompt;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(responseText: string): AIEnhancementResult {
  try {
    // Try to extract JSON from response (handle cases where it's wrapped in markdown)
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(jsonText) as {
      description?: string;
      keyFeatures?: string[];
      lifestyleSummary?: string;
      socialCaption?: string;
    };

    return {
      description: parsed.description || '',
      keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures : [],
      lifestyleSummary: parsed.lifestyleSummary || '',
      socialCaption: parsed.socialCaption || '',
    };
  } catch (error) {
    console.error('[AI Enhancement] Failed to parse AI response:', error);
    console.error('[AI Enhancement] Response text:', responseText);
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Enhance listing with AI
 */
export async function enhanceListingWithAI(
  listingData: ListingDataForAI
): Promise<ListingAIEnhancements> {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini API is not configured');
  }

  try {
    // Build prompt
    const prompt = buildEnhancementPrompt(listingData);

    // Call Gemini API
    const responseText = await generateContent(prompt);

    // Parse response
    const enhancement = parseAIResponse(responseText);

    // Return structured data for database
    return {
      ai_description: enhancement.description || null,
      ai_key_features: JSON.stringify(enhancement.keyFeatures),
      ai_lifestyle_summary: enhancement.lifestyleSummary || null,
      ai_social_caption: enhancement.socialCaption || null,
      ai_enhanced_at: new Date().toISOString(),
      ai_enhancement_status: 'completed',
    };
  } catch (error) {
    console.error('[AI Enhancement] Error enhancing listing:', error);
    return {
      ai_description: null,
      ai_key_features: null,
      ai_lifestyle_summary: null,
      ai_social_caption: null,
      ai_enhanced_at: new Date().toISOString(),
      ai_enhancement_status: 'failed',
    };
  }
}

