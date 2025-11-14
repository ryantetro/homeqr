/**
 * HomeQR Extension Test Suite
 * 
 * This test suite uses the SAME extraction logic as the extension
 * to ensure accurate testing of extraction capabilities.
 * 
 * Usage:
 * 1. Load this script in the browser console on a listing page
 * 2. Run: testExtraction()
 * 3. Review the results
 */

// Test configuration (kept for reference)
// const TEST_CONFIG = {
//   requiredFields: ['address'],
//   importantFields: ['price', 'bedrooms', 'bathrooms', 'images'],
//   optionalFields: ['squareFeet', 'propertyType', 'mlsId', 'description']
// };

// ============================================================
// Helper: Format price (same as extension)
// ============================================================
function formatPrice(p) {
  if (!p && p !== 0) return "";
  
  // Handle string prices like "$1,575,000" or "1575000"
  if (typeof p === 'string') {
    // Remove $, commas, and whitespace
    const cleaned = p.replace(/[$,]/g, '').trim();
    const num = Number(cleaned);
    if (!isNaN(num) && num > 0) {
      return `$${num.toLocaleString()}`;
    }
  }
  
  // Handle number prices
  if (typeof p === 'number') {
    if (isNaN(p) || p <= 0) return "";
    return `$${p.toLocaleString()}`;
  }
  
  // Handle object prices { value: 1575000, currency: "USD" }
  if (typeof p === 'object' && p !== null) {
    const value = p.value ?? p.amount ?? p.price ?? p;
    return formatPrice(value);
  }
  
  return "";
}

// ============================================================
// Helper: Extract price from meta tags (same as extension)
// ============================================================
function extractPriceFromMetaTags() {
  const ogTitle = document.querySelector('meta[property="og:title"]')?.content || "";
  const ogDescription = document.querySelector('meta[property="og:description"]')?.content || "";
  
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
    const priceNum = parseInt(generalPrice[1].replace(/,/g, ''));
    // Only accept reasonable prices (between $10,000 and $50,000,000)
    if (priceNum >= 10000 && priceNum <= 50000000) {
      return formatPrice(`$${generalPrice[1]}`);
    }
  }
  
  return null;
}

// ============================================================
// Helper: Extract address from meta tags (same as extension)
// ============================================================
function extractAddressFromMetaTags() {
  const ogTitle = document.querySelector('meta[property="og:title"]')?.content || "";
  const ogDescription = document.querySelector('meta[property="og:description"]')?.content || "";
  
  let extractedAddress = null;
  let extractedCity = null;
  let extractedState = null;
  let extractedZip = null;
  
  // Pattern 1: "$523,900 | 414 N 100 E American Fork UT 84003" (price | address in ogTitle)
  const priceAddressPattern = ogTitle.match(/\$\s*[\d,]+\s*\|\s*(.+)/);
  if (priceAddressPattern) {
    const addressPart = priceAddressPattern[1].trim();
    // Try to parse full address: "414 N 100 E American Fork UT 84003"
    const fullAddressMatch = addressPart.match(/^(\d+\s+[^,]+(?:[NS]|[EW]|[North]|[South]|[East]|[West])?[^,]*),?\s*([^,]+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/);
    if (fullAddressMatch) {
      extractedAddress = fullAddressMatch[1].trim();
      extractedCity = fullAddressMatch[2].trim();
      extractedState = fullAddressMatch[3].trim();
      extractedZip = fullAddressMatch[4].trim();
    } else {
      // Try pattern without comma: "414 N 100 E American Fork UT 84003"
      const noCommaMatch = addressPart.match(/^(\d+\s+[^A-Z]+?)\s+([A-Z][^A-Z]+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (noCommaMatch) {
        extractedAddress = noCommaMatch[1].trim();
        extractedCity = noCommaMatch[2].trim();
        extractedState = noCommaMatch[3].trim();
        extractedZip = noCommaMatch[4].trim();
      } else {
        // Fallback: split by comma if present
        if (addressPart.includes(',')) {
          extractedAddress = addressPart.split(',')[0].trim();
          const remaining = addressPart.substring(addressPart.indexOf(',') + 1).trim();
          const cityStateZip = remaining.match(/^([^,]+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/);
          if (cityStateZip) {
            extractedCity = cityStateZip[1].trim();
            extractedState = cityStateZip[2].trim();
            extractedZip = cityStateZip[3].trim();
          }
        } else {
          // No comma - parse by finding state code
          const parts = addressPart.split(/\s+/);
          if (parts.length >= 5) {
            let stateIdx = -1;
            for (let i = 0; i < parts.length; i++) {
              if (/^[A-Z]{2}$/.test(parts[i]) && i > 0 && i < parts.length - 1) {
                if (/^\d{5}(?:-\d{4})?$/.test(parts[i + 1])) {
                  stateIdx = i;
                  break;
                }
              }
            }
            if (stateIdx > 0 && stateIdx < parts.length - 1) {
              let cityStartIdx = stateIdx - 1;
              for (let i = stateIdx - 1; i >= 0; i--) {
                if (/^\d+$/.test(parts[i]) || /^[NS]|[EW]$/i.test(parts[i])) {
                  cityStartIdx = i + 1;
                  break;
                }
              }
              extractedAddress = parts.slice(0, cityStartIdx).join(' ');
              extractedCity = parts.slice(cityStartIdx, stateIdx).join(' ');
              extractedState = parts[stateIdx];
              extractedZip = parts[stateIdx + 1];
            } else {
              extractedAddress = addressPart;
            }
          } else {
            extractedAddress = addressPart;
          }
        }
      }
    }
  }
  
  // Pattern 2: "1816 S Yuma St, Salt Lake City, UT 84109 - For Sale" (address in ogTitle)
  if (!extractedAddress) {
    const addressInTitle = ogTitle.match(/^([^|]+?)(?:\s*-\s*|$)/);
    if (addressInTitle) {
      const addressText = addressInTitle[1].trim();
      if (/\d/.test(addressText) && (/\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|pl|place|way|cir|circle)\b/i.test(addressText) || 
          /\b(n|s|e|w|north|south|east|west)\b/i.test(addressText))) {
        const fullAddressMatch = addressText.match(/^(.+?),\s*([^,]+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/);
        if (fullAddressMatch) {
          extractedAddress = fullAddressMatch[1].trim();
          extractedCity = fullAddressMatch[2].trim();
          extractedState = fullAddressMatch[3].trim();
          extractedZip = fullAddressMatch[4].trim();
        } else {
          extractedAddress = addressText;
        }
      }
    }
  }
  
  // Pattern 3: Address in ogDescription
  if (!extractedAddress && ogDescription) {
    const addressInDesc = ogDescription.match(/located\s+at\s+([^\.]+?)(?:\.|$)/i);
    if (addressInDesc) {
      const addressText = addressInDesc[1].trim();
      const fullAddressMatch = addressText.match(/^(.+?),\s*([^,]+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/);
      if (fullAddressMatch) {
        extractedAddress = fullAddressMatch[1].trim();
        extractedCity = fullAddressMatch[2].trim();
        extractedState = fullAddressMatch[3].trim();
        extractedZip = fullAddressMatch[4].trim();
      }
    }
  }
  
  return {
    address: extractedAddress,
    city: extractedCity,
    state: extractedState,
    zip: extractedZip
  };
}

// ============================================================
// Helper: Check if URL is a valid property image (same as extension)
// ============================================================
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http')) return false;
  
  // Expanded blacklist for non-property images
  const blacklist = [
    '/logo', '/icon', '/avatar', '/agent', '/profile',
    '-logo-', 'logo-default', 'homes-logo',
    '/ad', '/advertisement', '/sponsored', '/banner',
    'facebook', 'twitter', 'instagram', 'youtube',
    'google-analytics', 'pixel', 'tracking',
    'teads.tv', 'ispot.tv', 'track?', 'tracking',
    '/app_icon/', '/app-icon/', 'NewAppIcon', 'app_icon.png',
    'browserIcons', 'AppIcon',
    '/spacer/', 'spacer.gif', 'spacer.png',
    'staticmap', 'maps.google.com/maps/api/staticmap',
    'maps.google.com', 'google.com/maps',
    '.svg'
  ];
  
  if (blacklist.some(pattern => url.toLowerCase().includes(pattern))) {
    return false;
  }
  
  // Domain-based filtering
  const trackingDomains = [
    'teads.tv', 'ispot.tv', 'doubleclick.net', 'googlesyndication.com',
    'facebook.com', 'twitter.com', 'linkedin.com'
  ];
  
  const urlDomain = url.toLowerCase();
  if (trackingDomains.some(domain => urlDomain.includes(domain))) {
    return false;
  }
  
  // Must be an image file (exclude SVG)
  if (!/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)) {
    return false;
  }
  
  // Filter out very small images
  const sizeMatch = url.match(/(\d+)x(\d+)/);
  if (sizeMatch) {
    const w = parseInt(sizeMatch[1]);
    const h = parseInt(sizeMatch[2]);
    if (w < 200 || h < 200) return false;
  }
  
  // Check for width/height parameters
  const widthParam = url.match(/[?&_](?:w|width)=(\d+)/);
  const heightParam = url.match(/[?&_](?:h|height)=(\d+)/);
  if (widthParam) {
    const w = parseInt(widthParam[1]);
    if (w < 200) return false;
  }
  if (heightParam) {
    const h = parseInt(heightParam[1]);
    if (h < 200) return false;
  }
  
  return true;
}

/**
 * Run extraction test on current page using extension's extraction logic
 */
async function testExtraction() {
  console.log('🧪 Starting HomeQR Extraction Test (using extension logic)...\n');
  
  const results = {
    site: window.location.hostname,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    extraction: {},
    validation: {},
    score: 0,
    maxScore: 0
  };

  try {
    // Test JSON-LD structured data
    const jsonLdData = testJSONLD();
    results.extraction.jsonLd = jsonLdData;
    
    // Test meta tags (raw)
    const metaData = testMetaTags();
    results.extraction.metaTags = metaData;
    
    // Test DOM selectors using extension's extraction logic
    const domData = testDOMSelectors();
    results.extraction.domSelectors = domData;
    
    // Validate results
    results.validation = validateExtraction(results.extraction);
    results.score = results.validation.score;
    results.maxScore = results.validation.maxScore;
    
    // Display results
    displayResults(results);
    
    return results;
  } catch (error) {
    console.error('❌ Test failed:', error);
    results.error = error.message;
    return results;
  }
}

/**
 * Test JSON-LD structured data extraction
 */
function testJSONLD() {
  const results = {
    found: false,
    types: [],
    address: null,
    price: null,
    bedrooms: null,
    bathrooms: null,
    squareFeet: null
  };
  
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        const type = item['@type'];
        if (type && (
          type === 'Product' || 
          type === 'Place' || 
          type === 'RealEstateListing' ||
          type === 'SingleFamilyResidence' ||
          type === 'House' ||
          type === 'Apartment' ||
          type === 'LocalBusiness'
        )) {
          results.found = true;
          results.types.push(type);
          
          if (item.address) {
            const addr = item.address;
            if (typeof addr === 'object') {
              results.address = addr.streetAddress || addr.street || addr.addressLine1;
            } else if (typeof addr === 'string') {
              results.address = addr;
            }
          }
          
          if (item.offers?.price) {
            results.price = formatPrice(item.offers.price);
          } else if (item.price) {
            results.price = formatPrice(item.price);
          }
          
          if (item.numberOfBedrooms) {
            results.bedrooms = String(item.numberOfBedrooms);
          }
          
          if (item.numberOfBathroomsTotal || item.numberOfBathrooms) {
            results.bathrooms = String(item.numberOfBathroomsTotal || item.numberOfBathrooms);
          }
          
          if (item.floorSize?.value) {
            results.squareFeet = String(item.floorSize.value);
          }
        }
      }
    } catch {
      // Continue
    }
  }
  
  return results;
}

/**
 * Test meta tags extraction (raw meta tags)
 */
function testMetaTags() {
  const results = {
    ogTitle: null,
    ogImage: null,
    ogDescription: null,
    metaDescription: null
  };
  
  results.ogTitle = document.querySelector('meta[property="og:title"]')?.content;
  results.ogImage = document.querySelector('meta[property="og:image"]')?.content;
  results.ogDescription = document.querySelector('meta[property="og:description"]')?.content;
  results.metaDescription = document.querySelector('meta[name="description"]')?.content;
  
  return results;
}

/**
 * Test DOM selector extraction using extension's logic
 */
function testDOMSelectors() {
  const results = {
    address: null,
    price: null,
    bedrooms: null,
    bathrooms: null,
    squareFeet: null,
    images: []
  };
  
  // Extract address - try meta tags first (same as extension)
  const metaAddress = extractAddressFromMetaTags();
  if (metaAddress.address) {
    const isStructuredAddress = /\d/.test(metaAddress.address) && 
                                 (/\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|pl|place|way|cir|circle|n|s|e|w|north|south|east|west)\b/i.test(metaAddress.address) ||
                                  metaAddress.city);
    if (isStructuredAddress) {
      results.address = metaAddress.address;
    }
  }
  
  // Fallback to DOM if meta didn't work
  if (!results.address) {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
    if (ogTitle && !ogTitle.includes('Home') && !ogTitle.includes('Listing') && !ogTitle.includes('Dream Property')) {
      results.address = ogTitle.split('|')[0].split('-')[0].trim();
    }
  }
  
  if (!results.address) {
    results.address = 
      document.querySelector('[itemprop="streetAddress"]')?.textContent?.trim() ||
      document.querySelector('h1[data-testid*="address"]')?.textContent?.trim() ||
      document.querySelector('h1.address')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim() ||
      "";
    
    // Clean up address
    if (results.address) {
      results.address = results.address
        .split('|')[0].split('-')[0].trim()
        .replace(/\s*MLS.*$/i, '').trim()
        .replace(/\s*for sale.*$/i, '').trim()
        .replace(/\s*\$[\d,]+.*$/i, '').trim()
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim();
      
      // Filter out generic addresses
      const genericPatterns = [
        /^your\s+dream\s+property/i,
        /^property\s+listing/i,
        /^home\s+for\s+sale/i,
        /^listing/i
      ];
      
      if (genericPatterns.some(pattern => pattern.test(results.address))) {
        results.address = "";
      }
    }
  }
  
  // Extract price - try DOM first, then meta tags (same as extension)
  const priceEl = document.querySelector('[itemprop="price"]');
  if (priceEl) {
    const priceValue = priceEl.getAttribute('content') || priceEl.textContent?.trim();
    if (priceValue) {
      results.price = formatPrice(priceValue);
    }
  }
  
  if (!results.price) {
    results.price =
      document.querySelector('[data-testid="price"]')?.textContent?.trim() ||
      document.querySelector('[data-testid*="Price"]')?.textContent?.trim() ||
      document.querySelector('.price, .listing-price, .property-price')?.textContent?.trim() ||
      "";
    
    if (results.price) {
      results.price = results.price
        .replace(/Price cut.*?(\d)/i, '$1')
        .replace(/Est\.\s*/i, '')
        .replace(/\/mo.*$/i, '')
        .trim();
      
      const priceMatch = results.price.match(/\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)/);
      if (priceMatch) {
        results.price = `$${priceMatch[1]}`;
      }
    }
  }
  
  // Try meta tags as fallback (same as extension)
  if (!results.price) {
    const metaPrice = extractPriceFromMetaTags();
    if (metaPrice) {
      results.price = metaPrice;
    }
  }
  
  // Extract bedrooms - with validation and meta cross-check (same as extension)
  results.bedrooms =
    document.querySelector('[data-testid*="bed"]')?.textContent?.match(/(\d+)/)?.[1] ||
    document.querySelector('[itemprop="numberOfBedrooms"]')?.textContent?.trim() ||
    "";
  
  if (!results.bedrooms) {
    const bedMatch = document.body.textContent?.match(/(\d+)\s*bed(?:room)?s?/i);
    results.bedrooms = bedMatch?.[1] || "";
  }
  
  // Validate and cross-check with meta description
  if (results.bedrooms) {
    const bedNum = parseInt(results.bedrooms);
    if (bedNum < 1 || bedNum > 20) {
      results.bedrooms = "";
    } else {
      const ogDescription = document.querySelector('meta[property="og:description"]')?.content || "";
      if (ogDescription) {
        const metaBedMatch = ogDescription.match(/(\d+)\s+bed(?:room)?s?/i);
        if (metaBedMatch) {
          const metaBedNum = parseInt(metaBedMatch[1]);
          if (metaBedNum !== bedNum && metaBedNum >= 1 && metaBedNum <= 20) {
            if (ogDescription.includes('bed') && ogDescription.includes('bath')) {
              results.bedrooms = String(metaBedNum);
            }
          }
        }
      }
    }
  } else {
    // Try meta description as fallback
    const ogDescription = document.querySelector('meta[property="og:description"]')?.content || "";
    if (ogDescription) {
      const metaBedMatch = ogDescription.match(/(\d+)\s+bed(?:room)?s?/i);
      if (metaBedMatch) {
        const metaBedNum = parseInt(metaBedMatch[1]);
        if (metaBedNum >= 1 && metaBedNum <= 20) {
          results.bedrooms = String(metaBedNum);
        }
      }
    }
  }
  
  // Extract bathrooms
  results.bathrooms =
    document.querySelector('[data-testid*="bath"]')?.textContent?.match(/([\d.]+)/)?.[1] ||
    document.querySelector('[itemprop="numberOfBathroomsTotal"]')?.textContent?.trim() ||
    "";
  
  if (!results.bathrooms) {
    const bathMatch = document.body.textContent?.match(/([\d.]+)\s*bath(?:room)?s?/i);
    results.bathrooms = bathMatch?.[1] || "";
  }
  
  // Extract square feet
  const sqftEl = document.querySelector('[itemprop="floorSize"]') || 
                 document.querySelector('[data-testid*="sqft"]') ||
                 document.querySelector('[data-testid*="square"]');
  if (sqftEl) {
    const sqftText = sqftEl.textContent || sqftEl.getAttribute('content') || "";
    const sqftMatch = sqftText.match(/([\d,]+)/);
    if (sqftMatch) {
      results.squareFeet = sqftMatch[1].replace(/,/g, '');
    }
  }
  
  if (!results.squareFeet) {
    const sqftMatch = document.body.textContent?.match(/([\d,]+)\s*sq\.?\s*ft\.?/i);
    if (sqftMatch) {
      results.squareFeet = sqftMatch[1].replace(/,/g, '');
    }
  }
  
  // Extract images using extension's filtering logic
  const images = Array.from(document.querySelectorAll('img'));
  const getImageUrl = (img) => {
    return img.src || 
           img.getAttribute('data-src') || 
           img.getAttribute('data-lazy-src') ||
           img.getAttribute('data-original') ||
           img.getAttribute('data-url') ||
           '';
  };
  
  results.images = images
    .map(getImageUrl)
    .filter(url => url && isValidImageUrl(url))
    .slice(0, 20); // Limit to 20 images
  
  return results;
}

/**
 * Validate extraction results
 */
function validateExtraction(extraction) {
  const validation = {
    required: {},
    important: {},
    optional: {},
    score: 0,
    maxScore: 0
  };
  
  // Check required fields
  let hasAddress = false;
  if (extraction.jsonLd?.address || extraction.domSelectors?.address) {
    hasAddress = true;
    validation.score += 10;
  }
  validation.maxScore += 10;
  validation.required.address = hasAddress;
  
  // Check important fields
  const importantFields = ['price', 'bedrooms', 'bathrooms', 'images'];
  for (const field of importantFields) {
    let found = false;
    if (extraction.jsonLd?.[field] || extraction.domSelectors?.[field]) {
      // For images, check if array has items
      if (field === 'images') {
        found = extraction.domSelectors?.images?.length > 0;
      } else {
        found = true;
      }
      if (found) validation.score += 5;
    }
    validation.maxScore += 5;
    validation.important[field] = found;
  }
  
  // Check optional fields
  const optionalFields = ['squareFeet', 'propertyType', 'mlsId'];
  for (const field of optionalFields) {
    let found = false;
    if (extraction.jsonLd?.[field] || extraction.domSelectors?.[field]) {
      found = true;
      validation.score += 2;
    }
    validation.maxScore += 2;
    validation.optional[field] = found;
  }
  
  return validation;
}

/**
 * Display test results
 */
function displayResults(results) {
  console.log('\n📊 Test Results');
  console.log('='.repeat(50));
  console.log(`Site: ${results.site}`);
  console.log(`URL: ${results.url}`);
  console.log(`Score: ${results.score}/${results.maxScore} (${Math.round(results.score/results.maxScore*100)}%)`);
  console.log('\n✅ Required Fields:');
  console.log(`  Address: ${results.validation.required.address ? '✅' : '❌'}`);
  console.log('\n📋 Important Fields:');
  Object.entries(results.validation.important).forEach(([field, found]) => {
    console.log(`  ${field}: ${found ? '✅' : '❌'}`);
  });
  console.log('\n📝 Optional Fields:');
  Object.entries(results.validation.optional).forEach(([field, found]) => {
    console.log(`  ${field}: ${found ? '✅' : '❌'}`);
  });
  console.log('\n🔍 Extraction Details:');
  console.log('  JSON-LD:', results.extraction.jsonLd?.found ? '✅ Found' : '❌ Not found');
  console.log('  Meta Tags:', results.extraction.metaTags?.ogTitle ? '✅ Found' : '❌ Not found');
  console.log('  DOM Selectors:', results.extraction.domSelectors?.address ? '✅ Found' : '❌ Not found');
  console.log('='.repeat(50));
  
  // Copy results to clipboard (if available)
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2))
      .then(() => console.log('\n📋 Results copied to clipboard!'))
      .catch(() => console.log('\n⚠️ Could not copy to clipboard'));
  }
}

// Helper function to show detailed results
function showDetailedResults(result) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 DETAILED TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\n📍 Site: ${result.site}`);
  console.log(`🔗 URL: ${result.url}`);
  console.log(`📅 Tested: ${new Date(result.timestamp).toLocaleString()}`);
  console.log(`\n🎯 Score: ${result.score}/${result.maxScore} (${Math.round(result.score/result.maxScore*100)}%)\n`);
  
  console.log('✅ REQUIRED FIELDS (10 points):');
  console.log(`   Address: ${result.validation.required.address ? '✅ FOUND' : '❌ MISSING'}`);
  
  console.log('\n📋 IMPORTANT FIELDS (5 points each, 20 total):');
  Object.entries(result.validation.important).forEach(([field, found]) => {
    const icon = found ? '✅' : '❌';
    const status = found ? 'FOUND' : 'MISSING';
    console.log(`   ${field}: ${icon} ${status}`);
  });
  
  console.log('\n📝 OPTIONAL FIELDS (2 points each, 6 total):');
  Object.entries(result.validation.optional).forEach(([field, found]) => {
    const icon = found ? '✅' : '❌';
    const status = found ? 'FOUND' : 'MISSING';
    console.log(`   ${field}: ${icon} ${status}`);
  });
  
  console.log('\n🔍 EXTRACTION METHODS:');
  console.log(`   JSON-LD: ${result.extraction.jsonLd?.found ? '✅ Found' : '❌ Not found'}`);
  if (result.extraction.jsonLd?.found) {
    console.log(`      Types: ${result.extraction.jsonLd.types.join(', ') || 'N/A'}`);
  }
  console.log(`   Meta Tags: ${result.extraction.metaTags?.ogTitle ? '✅ Found' : '❌ Not found'}`);
  console.log(`   DOM Selectors: ${result.extraction.domSelectors?.address ? '✅ Found' : '❌ Not found'}`);
  
  console.log('\n📦 EXTRACTED DATA:');
  if (result.extraction.domSelectors) {
    const ds = result.extraction.domSelectors;
    console.log(`   Address: ${ds.address || 'Not found'}`);
    console.log(`   Price: ${ds.price || 'Not found'}`);
    console.log(`   Bedrooms: ${ds.bedrooms || 'Not found'}`);
    console.log(`   Bathrooms: ${ds.bathrooms || 'Not found'}`);
    console.log(`   Square Feet: ${ds.squareFeet || 'Not found'}`);
    console.log(`   Images: ${ds.images?.length || 0} found`);
  }
  
  console.log('\n' + '='.repeat(60));
  return result;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testExtraction, testJSONLD, testMetaTags, testDOMSelectors };
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('🧪 HomeQR Test Suite loaded!');
  console.log('✅ Using extension extraction logic');
  console.log('Run testExtraction() to test the current page');
  console.log('Run showDetailedResults(await testExtraction()) to see detailed breakdown');
}
