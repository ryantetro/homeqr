/**
 * Test script for AI Enhancement Service
 * This tests the AI enhancement logic directly without requiring authentication
 */

// Read API key from .env.local
const fs = require('fs');
const path = require('path');

let GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
    const match = envFile.match(/GEMINI_API_KEY=(.+)/);
    if (match) {
      GEMINI_API_KEY = match[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch (error) {
    // Ignore file read errors
  }
}

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

// Test listing data
const testListingData = {
  address: '123 Main Street',
  city: 'Salt Lake City',
  state: 'UT',
  zip: '84101',
  price: 450000,
  bedrooms: 3,
  bathrooms: 2.5,
  square_feet: 1800,
  description: 'Beautiful home in downtown Salt Lake City. Recently renovated with modern finishes. Open floor plan with large kitchen. Master suite with walk-in closet. Two-car garage. Great location near shopping and restaurants.',
  property_type: 'Single Family Residence',
  year_built: 2010,
  lot_size: '0.25 acres',
  features: JSON.stringify(['Hardwood Floors', 'Granite Countertops', 'Stainless Steel Appliances', 'Central Air', 'Fireplace']),
  interior_features: JSON.stringify(['Walk-in Closet', 'Vaulted Ceilings', 'Recessed Lighting']),
  exterior_features: JSON.stringify(['Deck', 'Fenced Yard', 'Two-Car Garage']),
  parking_spaces: 2,
  garage_spaces: 2,
  stories: 2,
  heating: 'Forced Air',
  cooling: 'Central Air',
  flooring: 'Hardwood',
  fireplace_count: 1,
  price_per_sqft: 250,
};

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API directly...\n');

  const prompt = 'Say "Hello, AI is working!" in one word.';
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      console.log('✅ Gemini API is working!');
      console.log(`   Response: ${text}\n`);
      return true;
    } else {
      throw new Error('No text in response');
    }
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
    return false;
  }
}

async function testAIEnhancement() {
  console.log('🧪 Testing AI Enhancement Service...\n');

  // Build a test prompt similar to what the service uses
  const prompt = `You are a professional real estate copywriter. Enhance this property listing with engaging, SEO-friendly content.

PROPERTY DETAILS:
- Address: ${testListingData.address}, ${testListingData.city}, ${testListingData.state} ${testListingData.zip}
- Price: $${testListingData.price.toLocaleString()}
- Specs: ${testListingData.bedrooms} bed${testListingData.bedrooms !== 1 ? 's' : ''} • ${testListingData.bathrooms} bath${testListingData.bathrooms !== 1 ? 's' : ''} • ${testListingData.square_feet.toLocaleString()} sq ft
- Property Type: ${testListingData.property_type}
- Year Built: ${testListingData.year_built}
- Lot Size: ${testListingData.lot_size}
- Stories: ${testListingData.stories}
- Parking: ${testListingData.parking_spaces} space${testListingData.parking_spaces !== 1 ? 's' : ''}
- Garage: ${testListingData.garage_spaces} space${testListingData.garage_spaces !== 1 ? 's' : ''}
- Heating: ${testListingData.heating}
- Cooling: ${testListingData.cooling}
- Flooring: ${testListingData.flooring}
- Fireplaces: ${testListingData.fireplace_count}
- Price per sq ft: $${testListingData.price_per_sqft}

Features: ${JSON.parse(testListingData.features).join(', ')}
Interior Features: ${JSON.parse(testListingData.interior_features).join(', ')}
Exterior Features: ${JSON.parse(testListingData.exterior_features).join(', ')}

Original Description: ${testListingData.description}

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

  try {
    console.log('📤 Sending request to Gemini API...');
    const startTime = Date.now();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('No text in response');
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ AI Enhancement completed in ${elapsed}s\n`);

    // Try to parse JSON response
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(jsonText);
      console.log('✅ Successfully parsed AI response:\n');
      console.log('📝 Enhanced Description:');
      console.log(`   ${parsed.description?.substring(0, 200)}...\n`);
      console.log('⭐ Key Features:');
      if (Array.isArray(parsed.keyFeatures)) {
        parsed.keyFeatures.forEach((feature, i) => {
          console.log(`   ${i + 1}. ${feature}`);
        });
      }
      console.log('\n🏘️  Lifestyle Summary:');
      console.log(`   ${parsed.lifestyleSummary?.substring(0, 200)}...\n`);
      console.log('📱 Social Caption:');
      console.log(`   ${parsed.socialCaption?.substring(0, 150)}...\n`);

      return true;
    } catch (parseError) {
      console.log('⚠️  Response is not valid JSON, showing raw response:');
      console.log(responseText.substring(0, 500));
      return false;
    }
  } catch (error) {
    console.error('❌ AI Enhancement test failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting AI Integration Tests\n');
  console.log('=' .repeat(50) + '\n');

  const test1 = await testGeminiAPI();
  console.log('');

  if (test1) {
    const test2 = await testAIEnhancement();
    console.log('');

    console.log('=' .repeat(50));
    console.log('📊 Test Summary');
    console.log('=' .repeat(50));
    console.log(`Gemini API Test: ${test1 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`AI Enhancement Test: ${test2 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('');

    if (test1 && test2) {
      console.log('🎉 All tests passed! AI integration is working correctly.');
      console.log('\nNext steps:');
      console.log('1. Create a listing via Chrome extension');
      console.log('2. Check server logs for AI enhancement messages');
      console.log('3. Verify AI content in database');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
      process.exit(1);
    }
  } else {
    console.log('❌ Gemini API test failed. Cannot proceed with enhancement test.');
    process.exit(1);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ (for native fetch support)');
  console.log('   Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

runTests().catch((error) => {
  console.error('❌ Test script error:', error);
  process.exit(1);
});

