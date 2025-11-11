// ============================================================
// HomeQR Chrome Extension – Zillow Listing Extractor (v4.0)
// Updated: 2025-11-05
// Supports: ForSalePriorityQuery, ForSaleFullRenderQuery,
//           PropertyQuery, Apollo cache, DOM fallback
// ============================================================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "GET_LISTING_INFO") return;

  console.log("[HomeQR] GET_LISTING_INFO received");
  console.log("[HomeQR] URL:", location.href);

  detectListing()
    .then((info) => {
      console.log("[HomeQR] Extraction SUCCESS:", {
        address: info.address,
        price: info.price,
        images: info.imageUrls.length,
      });
      sendResponse(info);
    })
    .catch((err) => {
      console.error("[HomeQR] Extraction FAILED:", err);
      sendResponse({
        url: location.href,
        title: document.title,
        imageUrls: [],
      });
    });

  return true; // Keep message channel open for async response
});

// ============================================================
// MAIN: Detect and extract listing data
// ============================================================
async function detectListing() {
  const url = location.href;
  const title = document.title;

  try {
    // 1. Try JSON cache (priority order)
    const json = await tryJsonCache();
    if (json && json.address) {
      console.log("[HomeQR] ✅ Using JSON cache data");
      return { ...json, url, title };
    }
  } catch (err) {
    console.log("[HomeQR] ⚠️ JSON extraction failed, falling back to DOM:", err.message);
  }

  // 2. DOM fallback
  try {
    const domData = fallbackDOM();
    // Ensure we have at least an address from title or URL if DOM extraction fails
    if (!domData.address || domData.address.trim() === "") {
      const addressFromTitle = extractAddressFromTitle(title);
      const addressFromUrl = extractAddressFromUrl(url);
      domData.address = addressFromTitle || addressFromUrl || "Property Listing";
      console.log("[HomeQR] ⚠️ No address found in DOM, using:", domData.address);
    }
    return { ...domData, url, title };
  } catch (err) {
    console.error("[HomeQR] ❌ DOM extraction failed:", err);
    // Last resort: try to extract from title/URL
    const addressFromTitle = extractAddressFromTitle(title);
    const addressFromUrl = extractAddressFromUrl(url);
    return {
      address: addressFromTitle || addressFromUrl || "Property Listing",
      city: "",
      state: "",
      zip: "",
      price: "",
      bedrooms: "",
      bathrooms: "",
      squareFeet: "",
      status: "",
      mlsId: "",
      imageUrl: "",
      imageUrls: [],
      url,
      title,
    };
  }
}

// ============================================================
// Helper: Extract address from page title
// ============================================================
function extractAddressFromTitle(title) {
  if (!title) return "";
  // Zillow titles are usually: "123 Main St, City, State ZIP | MLS #12345 | Zillow"
  // Extract everything before the first pipe
  const match = title.match(/^([^|]+)/);
  if (match) {
    return match[1].trim();
  }
  return "";
}

// ============================================================
// Helper: Extract address from URL
// ============================================================
function extractAddressFromUrl(url) {
  if (!url) return "";
  // Zillow URLs: /homedetails/123-Main-St-City-ST-12345/12345678_zpid/
  const match = url.match(/\/homedetails\/([^\/]+)\//);
  if (match) {
    // Replace hyphens with spaces and format
    return match[1].replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }
  return "";
}

// ============================================================
// Utility: Parse JSON string repeatedly until it's an object
// ============================================================
function parseMaybeJSON(input) {
  let out = input;
  // We only allow a couple of passes to avoid pathological cases
  for (let i = 0; i < 2; i++) {
    if (typeof out === 'string') {
      const trimmed = out.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          out = JSON.parse(trimmed);
          continue;
        } catch {
          // If parse fails, bail out and return the original
          return input;
        }
      }
    }
    break;
  }
  return out;
}

// ============================================================
// Utility: Deduplicate URLs
// ============================================================
function uniqueUrls(urls) {
  const seen = new Set();
  return urls.filter(u => {
    if (!u) return false;
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

// ============================================================
// 1. JSON Cache Extraction (gdpClientCache + Apollo)
// ============================================================
async function tryJsonCache() {
  try {
    console.log("[HomeQR] Attempting JSON cache extraction...");
    
    const script = document.querySelector("script#__NEXT_DATA__");
    if (!script?.textContent) {
      console.log("[HomeQR] ⚠️ __NEXT_DATA__ script not found");
      return null;
    }

    let data;
    try {
      data = JSON.parse(script.textContent);
    } catch {
      console.log("[HomeQR] ⚠️ Failed to parse __NEXT_DATA__");
      return null;
    }

    // 1) Read raw cache (can be object OR string)
    let cache = data?.props?.pageProps?.componentProps?.gdpClientCache
             ?? data?.props?.pageProps?.initialData?.gdpClientCache
             ?? null;

    // 2) Parse if the cache is a string (common on Zillow)
    cache = parseMaybeJSON(cache);

    // 3) If still not an object, try "legacy" spots or Apollo
    if (!cache || typeof cache !== 'object') {
      const legacy =
        data?.props?.pageProps?.initialData?.property ??
        data?.props?.pageProps?.property ??
        data?.props?.pageProps?.componentProps?.property ??
        data?.props?.pageProps?.initialData?.homeInfo ??
        data?.props?.pageProps?.homeInfo ??
        data?.props?.pageProps?.initialData?.forSaleFullRenderQuery?.property ??
        data?.props?.pageProps?.initialData?.forSalePriorityQuery?.property;

      if (legacy) {
        console.log("[HomeQR] ✅ Found legacy property in pageProps");
        return buildResult(legacy);
      }

      const apollo =
        window.__APOLLO_STATE__ ??
        data?.props?.apolloState ??
        data?.apolloState;

      if (apollo && typeof apollo === 'object') {
        console.log("[HomeQR] ✅ Found Apollo cache");
        const key = Object.keys(apollo).find(k => /ForSale|Property:|Home:/i.test(k));
        if (key && apollo[key]) {
          console.log("[HomeQR] ✅ Extracting from Apollo key:", key);
          return buildResult(apollo[key]);
        }
      }

      console.log("[HomeQR] ⚠️ No property data found in JSON cache");
      return null;
    }

    console.log("[HomeQR] ✅ Found gdpClientCache (parsed)");
    const keys = Object.keys(cache);
    console.log("[HomeQR] Cache key count:", keys.length);

    // 4) Find the GraphQL entry that contains the property
    const entries = Object.entries(cache);

    // Prefer ForSalePriorityQuery / ForSaleFullRenderQuery
    const preferred = entries.find(([k]) =>
      /ForSalePriorityQuery|ForSaleFullRenderQuery/i.test(k)
    ) || entries.find(([k]) =>
      /ForSalePropertyQuery|PropertyQuery/i.test(k)
    );

    if (preferred) {
      const [key, entry] = preferred;
      console.log("[HomeQR] ✅ Found query key:", key.substring(0, 80) + "...");
      const prop = entry?.property ?? entry?.data?.property ?? entry?.home ?? entry;
      if (prop) {
        console.log("[HomeQR] ✅ Extracting property data");
        return buildResult(prop);
      }
    }

    // 5) Fallback: scan for any "property-like" node
    console.log("[HomeQR] Searching cache entries for property data...");
    for (const [, entry] of entries.slice(0, 500)) {
      if (entry && typeof entry === 'object') {
        const prop = entry.property ?? entry.data?.property ?? entry.home ?? entry;
        if (prop && (prop.streetAddress || prop.address || prop.responsivePhotos || prop.price)) {
          console.log("[HomeQR] ✅ Found property in fallback search");
          return buildResult(prop);
        }
      }
    }

    console.log("[HomeQR] ⚠️ No property data found in JSON cache");
    return null;
  } catch (err) {
    console.log("[HomeQR] ⚠️ Error during JSON cache extraction:", err?.message);
    return null;
  }
}

// ============================================================
// 2. DOM Fallback (GENERIC - works on any listing site)
// ============================================================
function fallbackDOM() {
  try {
    console.log("[HomeQR] Using generic DOM fallback");

  // ============================================================
  // STEP 1: Try JSON-LD structured data (most reliable, works on many sites)
  // ============================================================
  let address = "", city = "", state = "", zip = "", price = "";
  let bedrooms = "", bathrooms = "", squareFeet = "";
  
  const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      if (data['@type'] === 'Product' || data['@type'] === 'Place' || data['@type'] === 'RealEstateListing') {
        // Extract address
        if (data.address) {
          address = data.address.streetAddress || data.address.addressLocality || address;
          city = data.address.addressLocality || city;
          state = data.address.addressRegion || state;
          zip = data.address.postalCode || zip;
        }
        // Extract price
        if (data.offers?.price) {
          price = formatPrice(data.offers.price);
        }
        // Extract property details
        if (data.numberOfBedrooms) bedrooms = String(data.numberOfBedrooms);
        if (data.numberOfBathroomsTotal) bathrooms = String(data.numberOfBathroomsTotal);
        if (data.floorSize?.value) squareFeet = String(data.floorSize.value);
        console.log("[HomeQR] ✅ Found JSON-LD structured data");
        break;
      }
    } catch {
      // Continue to next script
    }
  }

  // ============================================================
  // STEP 2: Try Open Graph and other meta tags
  // ============================================================
  if (!address) {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
    if (ogTitle && !ogTitle.includes('Home') && !ogTitle.includes('Listing')) {
      // Try to extract address from OG title
      address = ogTitle.split('|')[0].split('-')[0].trim();
    }
  }

  // ============================================================
  // STEP 3: Generic DOM selectors (works across many sites)
  // ============================================================
  
  // Extract price - try many common patterns (Zillow-specific first)
  if (!price) {
    // Zillow-specific price selectors (most reliable)
    price =
      document.querySelector('[data-testid="price"]')?.textContent?.trim() ||
      document.querySelector('[data-testid*="Price"]')?.textContent?.trim() ||
      document.querySelector('[data-testid*="price"]')?.textContent?.trim() ||
      document.querySelector('span[data-testid*="price"]')?.textContent?.trim() ||
      // Zillow class-based selectors
      document.querySelector('.ds-price')?.textContent?.trim() ||
      document.querySelector('[class*="Price"]')?.textContent?.trim() ||
      document.querySelector('[class*="price"]')?.textContent?.trim() ||
      // Generic selectors
      document.querySelector('.price, .listing-price, .property-price')?.textContent?.trim() ||
      document.querySelector('span[class*="price"], div[class*="price"]')?.textContent?.trim() ||
      "";
    
    // Clean up price (remove "Price cut", "Est.", etc.)
    if (price) {
      // Remove common prefixes/suffixes
      price = price
        .replace(/Price cut.*?(\d)/i, '$1') // Remove "Price cut: $25K" prefix
        .replace(/Est\.\s*/i, '') // Remove "Est." prefix
        .replace(/\/mo.*$/i, '') // Remove "/mo" suffix
        .replace(/Get pre-qualified.*$/i, '') // Remove "Get pre-qualified" text
        .trim();
      
      // Extract just the price number with $ and commas
      const priceMatch = price.match(/\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)/);
      if (priceMatch) {
        price = `$${priceMatch[1]}`;
      }
    }
    
    // If still no price, search body text for price patterns (more aggressive)
    if (!price) {
      // Look for price patterns in the main content area
      const mainContent = document.querySelector('main') || document.body;
      const pricePatterns = [
        /\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)\s*(?:Price|For sale|Listed)/i,
        /(?:Price|Listed|Asking):\s*\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)/i,
        /\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|dollars?)?/i,
      ];
      
      for (const pattern of pricePatterns) {
        const match = mainContent.textContent?.match(pattern);
        if (match) {
          price = `$${match[1]}`;
          console.log("[HomeQR] ✅ Found price via text pattern:", price);
          break;
        }
      }
      
      // Last resort: find largest price number on page
      if (!price) {
        const allPrices = mainContent.textContent?.match(/\$\s*([\d,]+(?:,\d{3})*(?:\.\d{2})?)/g) || [];
        if (allPrices.length > 0) {
          // Sort by numeric value (largest first) - listing price is usually the largest
          const sortedPrices = allPrices
            .map(p => {
              const num = parseInt(p.replace(/[^0-9]/g, ''));
              return { text: p, num };
            })
            .filter(p => p.num > 10000) // Filter out small numbers (like $8,373/mo)
            .sort((a, b) => b.num - a.num);
          
          if (sortedPrices.length > 0) {
            price = sortedPrices[0].text.trim();
            console.log("[HomeQR] ✅ Found price via largest number:", price);
          }
        }
      }
    }
    
    if (price) {
      console.log("[HomeQR] ✅ Price extracted from DOM:", price);
    } else {
      console.log("[HomeQR] ⚠️ No price found in DOM");
    }
  }

  // Extract address - try many common patterns
  if (!address) {
    const addressEl =
      document.querySelector('h1[data-testid*="address"], h1[data-testid*="Address"]') ||
      document.querySelector('h1.address, h1[class*="address"]') ||
      document.querySelector('[data-testid*="address"], [data-testid*="Address"]') ||
      document.querySelector('.address, [class*="address"]') ||
      document.querySelector('h1') ||
      document.querySelector('[itemprop="streetAddress"]');
    address = addressEl?.textContent?.trim() || "";
    
    // Clean up address (remove common suffixes)
    if (address) {
      address = address.split('|')[0].split('-')[0].trim();
      address = address.replace(/\s*MLS.*$/i, '').trim();
    }
  }

  // Extract city, state, zip - parse from address or find separate elements
  if (!city || !state || !zip) {
    // Try to parse from full address string
    if (address) {
      const addressParts = address.split(',').map(s => s.trim());
      if (addressParts.length >= 3) {
        city = city || addressParts[1];
        const stateZipMatch = addressParts[2].match(/([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/);
        if (stateZipMatch) {
          state = state || stateZipMatch[1];
          zip = zip || stateZipMatch[2];
        } else {
          const parts = addressParts[2].split(/\s+/);
          state = state || parts[0] || "";
          zip = zip || parts[1] || "";
        }
      }
    }
    
    // Try separate location elements
    if (!city || !state) {
      const locationEl = 
        document.querySelector('[data-testid*="city"], [data-testid*="City"]') ||
        document.querySelector('[class*="city"], [class*="City"]') ||
        document.querySelector('[itemprop="addressLocality"]');
      if (locationEl) {
        const locationText = locationEl.textContent?.trim() || "";
        const match = locationText.match(/(.+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/);
        if (match) {
          city = city || match[1].trim();
          state = state || match[2].trim();
          zip = zip || match[3].trim();
        } else {
          const parts = locationText.split(',').map(s => s.trim());
          if (parts.length >= 2) {
            city = city || parts[0];
            const stateZip = parts[1].split(/\s+/);
            state = state || stateZip[0] || "";
            zip = zip || stateZip[1] || "";
          }
        }
      }
    }
  }

  // Extract bedrooms - try many common patterns
  if (!bedrooms) {
    bedrooms =
      document.querySelector('[data-testid*="bed"], [data-testid*="Bed"]')?.textContent?.match(/(\d+)/)?.[1] ||
      document.querySelector('[class*="bed"], [class*="Bed"]')?.textContent?.match(/(\d+)\s*bed/i)?.[1] ||
      document.querySelector('[itemprop="numberOfBedrooms"]')?.textContent?.trim() ||
      "";
    
    // If not found, search body text for bed pattern
    if (!bedrooms) {
      const bedMatch = document.body.textContent?.match(/(\d+)\s*bed(?:room)?s?/i);
      bedrooms = bedMatch?.[1] || "";
    }
  }

  // Extract bathrooms - try many common patterns
  if (!bathrooms) {
    bathrooms =
      document.querySelector('[data-testid*="bath"], [data-testid*="Bath"]')?.textContent?.match(/([\d.]+)/)?.[1] ||
      document.querySelector('[class*="bath"], [class*="Bath"]')?.textContent?.match(/([\d.]+)\s*bath/i)?.[1] ||
      document.querySelector('[itemprop="numberOfBathroomsTotal"]')?.textContent?.trim() ||
      "";
    
    // If not found, search body text for bath pattern
    if (!bathrooms) {
      const bathMatch = document.body.textContent?.match(/([\d.]+)\s*bath(?:room)?s?/i);
      bathrooms = bathMatch?.[1] || "";
    }
  }

  // Extract square feet - try many common patterns (Zillow-specific first)
  if (!squareFeet) {
    // Zillow-specific selectors
    const sqftElement = 
      document.querySelector('[data-testid*="sqft"]') ||
      document.querySelector('[data-testid*="Sqft"]') ||
      document.querySelector('[data-testid*="area"]') ||
      document.querySelector('[class*="sqft"]') ||
      document.querySelector('[class*="Sqft"]') ||
      document.querySelector('[class*="area"]') ||
      document.querySelector('[class*="square"]') ||
      document.querySelector('[itemprop="floorSize"]');
    
    if (sqftElement) {
      const text = sqftElement.textContent || "";
      // Look for pattern like "2,063 sqft" or "2063 sqft" - get the number before "sq"
      const match = text.match(/([\d,]+)\s*sq/i);
      if (match) {
        squareFeet = match[1].replace(/,/g, '');
        console.log("[HomeQR] ✅ Square feet extracted from element:", squareFeet);
      } else {
        // If no "sq" in text, try to find the largest number (square feet is usually the largest)
        const numbers = text.match(/([\d,]+)/g);
        if (numbers && numbers.length > 0) {
          // Filter out small numbers (like 3 for bathrooms) and get the largest
          const nums = numbers
            .map(n => parseInt(n.replace(/,/g, '')))
            .filter(n => n > 100); // Square feet should be > 100
          if (nums.length > 0) {
            squareFeet = String(Math.max(...nums));
            console.log("[HomeQR] ✅ Square feet extracted (largest number):", squareFeet);
          }
        }
      }
    }
    
    // If still not found, search body text for sqft pattern (more specific)
    if (!squareFeet) {
      const mainContent = document.querySelector('main') || document.body;
      const sqftPatterns = [
        /([\d,]+)\s*sq\.?\s*ft\.?/i,
        /([\d,]+)\s*sqft/i,
        /([\d,]+)\s*sq\s*ft/i,
        /Square\s*[Ff]eet[:\s]+([\d,]+)/i,
        /([\d,]+)\s*sf/i,
      ];
      
      for (const pattern of sqftPatterns) {
        const match = mainContent.textContent?.match(pattern);
        if (match) {
          const num = match[1].replace(/,/g, '');
          // Validate it's a reasonable square footage (between 100 and 50,000)
          const sqftNum = parseInt(num);
          if (sqftNum > 100 && sqftNum < 50000) {
            squareFeet = num;
            console.log("[HomeQR] ✅ Square feet extracted via text pattern:", squareFeet);
            break;
          }
        }
      }
    }
    
    if (squareFeet) {
      console.log("[HomeQR] ✅ Square feet extracted from DOM:", squareFeet);
    } else {
      console.log("[HomeQR] ⚠️ No square feet found in DOM");
    }
  }

  // Extract MLS ID - search all spans for MLS text
  let mlsId = 
    document.querySelector('[data-testid="mls-id"]')?.textContent?.trim() ||
    document.querySelector(".ds-mls-id")?.textContent?.trim() ||
    "";
  
  // If not found, search all spans for MLS pattern
  if (!mlsId) {
    const allSpans = Array.from(document.querySelectorAll('span, div, p'));
    const mlsSpan = allSpans.find(span => {
      const text = span.textContent || '';
      return /MLS[#:]?\s*[A-Z0-9]+/i.test(text);
    });
    if (mlsSpan) {
      const match = mlsSpan.textContent?.match(/MLS[#:]?\s*([A-Z0-9-]+)/i);
      mlsId = match?.[1] || "";
    }
  }
  
  // Also try to find MLS in the page URL or meta tags
  if (!mlsId) {
    const urlMatch = window.location.href.match(/mls[#:]?([A-Z0-9-]+)/i);
    if (urlMatch) {
      mlsId = urlMatch[1];
    }
  }

  // ============================================================
  // STEP 5: Extract additional property details
  // ============================================================
  
  // Extract property type
  let propertyType = "";
  const propertyTypeEl = 
    document.querySelector('[data-testid*="property-type"], [data-testid*="PropertyType"]') ||
    document.querySelector('[class*="property-type"], [class*="PropertyType"]') ||
    document.querySelector('[itemprop="category"]');
  if (propertyTypeEl) {
    const text = propertyTypeEl.textContent?.trim() || "";
    // Clean up - remove JSON artifacts
    if (text && !text.startsWith('{') && !text.includes('"')) {
      propertyType = text.split(',')[0].split('|')[0].trim();
    }
  }
  // Try JSON-LD
  if (!propertyType) {
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data['@type'] === 'RealEstateListing' && data.category) {
          propertyType = typeof data.category === 'string' ? data.category : data.category.name || "";
          break;
        }
      } catch {}
    }
  }
  // Try text pattern - be more specific
  if (!propertyType) {
    const mainContent = document.querySelector('main') || document.body;
    const typeMatch = mainContent.textContent?.match(/(?:Property Type|Home Type|Type)[:\s]+([A-Za-z\s]+?)(?:\s|$|,|\n)/i);
    if (typeMatch) {
      const type = typeMatch[1].trim();
      // Filter out common false positives
      if (type && type.length < 50 && !type.includes('{') && !type.includes('"')) {
        propertyType = type;
      }
    }
  }

  // Extract year built
  let yearBuilt = "";
  const yearBuiltEl = 
    document.querySelector('[data-testid*="year-built"], [data-testid*="YearBuilt"]') ||
    document.querySelector('[class*="year-built"], [class*="YearBuilt"]') ||
    document.querySelector('[itemprop="yearBuilt"]');
  if (yearBuiltEl) {
    const yearMatch = yearBuiltEl.textContent?.match(/(\d{4})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      if (year > 1800 && year <= new Date().getFullYear() + 1) {
        yearBuilt = String(year);
      }
    }
  }
  // Try text pattern
  if (!yearBuilt) {
    const mainContent = document.querySelector('main') || document.body;
    const yearMatch = mainContent.textContent?.match(/(?:Year Built|Built|Built in)[:\s]+(\d{4})/i);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      if (year > 1800 && year <= new Date().getFullYear() + 1) {
        yearBuilt = String(year);
      }
    }
  }

  // Extract lot size
  let lotSize = "";
  const lotSizeEl = 
    document.querySelector('[data-testid*="lot-size"], [data-testid*="LotSize"]') ||
    document.querySelector('[class*="lot-size"], [class*="LotSize"]') ||
    document.querySelector('[itemprop="lotSize"]');
  if (lotSizeEl) {
    const text = lotSizeEl.textContent?.trim() || "";
    // Clean up - remove JSON artifacts and extract just the size
    if (text && !text.startsWith('{') && !text.includes('"size"')) {
      const sizeMatch = text.match(/([\d.,]+\s*(?:acres?|sq\s*ft|sqft|square\s*feet|sq\s*meters?))/i);
      if (sizeMatch) {
        lotSize = sizeMatch[1].trim();
      } else {
        lotSize = text.split(',')[0].split('|')[0].trim();
      }
    }
  }
  // Try text pattern - be more specific
  if (!lotSize) {
    const mainContent = document.querySelector('main') || document.body;
    const lotMatch = mainContent.textContent?.match(/(?:Lot Size|Lot)[:\s]+([\d.,]+\s*(?:acres?|sq\s*ft|sqft|square\s*feet))/i);
    if (lotMatch) {
      lotSize = lotMatch[1].trim();
    }
  }

  // Extract stories
  let stories = "";
  const storiesEl = 
    document.querySelector('[data-testid*="stories"], [data-testid*="Stories"]') ||
    document.querySelector('[class*="stories"], [class*="Stories"]');
  if (storiesEl) {
    const storiesMatch = storiesEl.textContent?.match(/(\d+)/);
    if (storiesMatch) {
      stories = storiesMatch[1];
    }
  }
  // Try text pattern
  if (!stories) {
    const mainContent = document.querySelector('main') || document.body;
    const storiesMatch = mainContent.textContent?.match(/(?:Stories|Story)[:\s]+(\d+)/i);
    if (storiesMatch) {
      stories = storiesMatch[1];
    }
  }

  // Extract parking spaces
  let parkingSpaces = "";
  const parkingEl = 
    document.querySelector('[data-testid*="parking"], [data-testid*="Parking"]') ||
    document.querySelector('[class*="parking"], [class*="Parking"]');
  if (parkingEl) {
    const text = parkingEl.textContent || "";
    const parkingMatch = text.match(/(\d+)\s*(?:total\s*)?(?:parking\s*)?(?:space|spaces)/i);
    if (parkingMatch) {
      parkingSpaces = parkingMatch[1];
    } else {
      // Try to find number at start
      const numMatch = text.match(/^(\d+)/);
      if (numMatch) {
        parkingSpaces = numMatch[1];
      }
    }
  }
  // Try text pattern - look for "X total spaces" or "Parking: X"
  if (!parkingSpaces) {
    const mainContent = document.querySelector('main') || document.body;
    const parkingMatch = mainContent.textContent?.match(/(?:Parking|Parking Spaces|Total Spaces)[:\s]+(\d+)/i);
    if (parkingMatch) {
      parkingSpaces = parkingMatch[1];
    } else {
      // Try "X total spaces" pattern
      const totalMatch = mainContent.textContent?.match(/(\d+)\s+total\s+spaces/i);
      if (totalMatch) {
        parkingSpaces = totalMatch[1];
      }
    }
  }

  // Extract garage spaces
  let garageSpaces = "";
  const garageEl = 
    document.querySelector('[data-testid*="garage"], [data-testid*="Garage"]') ||
    document.querySelector('[class*="garage"], [class*="Garage"]');
  if (garageEl) {
    const garageMatch = garageEl.textContent?.match(/(\d+)\s*(?:garage|car)/i);
    if (garageMatch) {
      garageSpaces = garageMatch[1];
    }
  }
  // Try text pattern
  if (!garageSpaces) {
    const mainContent = document.querySelector('main') || document.body;
    const garageMatch = mainContent.textContent?.match(/(?:Garage|Garage Spaces)[:\s]+(\d+)/i);
    if (garageMatch) {
      garageSpaces = garageMatch[1];
    }
  }

  // Extract heating
  let heating = "";
  const heatingEl = 
    document.querySelector('[data-testid*="heating"], [data-testid*="Heating"]') ||
    document.querySelector('[class*="heating"], [class*="Heating"]');
  if (heatingEl) {
    const text = heatingEl.textContent?.trim() || "";
    // Clean up - remove UI artifacts like "Factor3/10Show"
    if (text && !text.includes('Factor') && !text.includes('Show') && text.length < 100) {
      heating = text.split(',')[0].split('|')[0].trim();
    }
  }
  // Try text pattern - be more specific
  if (!heating) {
    const mainContent = document.querySelector('main') || document.body;
    const heatingMatch = mainContent.textContent?.match(/(?:Heating|Heat)[:\s]+([A-Za-z\s/]+?)(?:\s|$|,|\n)/i);
    if (heatingMatch) {
      const heat = heatingMatch[1].trim();
      // Filter out common false positives
      if (heat && heat.length < 50 && !heat.includes('Factor') && !heat.includes('Show')) {
        heating = heat;
      }
    }
  }

  // Extract cooling
  let cooling = "";
  const coolingEl = 
    document.querySelector('[data-testid*="cooling"], [data-testid*="Cooling"]') ||
    document.querySelector('[class*="cooling"], [class*="Cooling"]');
  if (coolingEl) {
    const text = coolingEl.textContent?.trim() || "";
    // Clean up - "on" is not very descriptive, try to get more detail
    if (text && text !== "on" && text.length < 100) {
      cooling = text.split(',')[0].split('|')[0].trim();
    }
  }
  // Try text pattern - be more specific
  if (!cooling) {
    const mainContent = document.querySelector('main') || document.body;
    const coolingMatch = mainContent.textContent?.match(/(?:Cooling|AC|Air Conditioning)[:\s]+([A-Za-z\s/]+?)(?:\s|$|,|\n)/i);
    if (coolingMatch) {
      const cool = coolingMatch[1].trim();
      // Filter out common false positives
      if (cool && cool.length < 50 && cool !== "on") {
        cooling = cool;
      }
    }
  }

  // Extract flooring
  let flooring = "";
  const flooringEl = 
    document.querySelector('[data-testid*="flooring"], [data-testid*="Flooring"]') ||
    document.querySelector('[class*="flooring"], [class*="Flooring"]');
  if (flooringEl) {
    flooring = flooringEl.textContent?.trim() || "";
  }
  // Try text pattern
  if (!flooring) {
    const mainContent = document.querySelector('main') || document.body;
    const flooringMatch = mainContent.textContent?.match(/(?:Flooring|Floors)[:\s]+([^\n,]+?)(?:\s|$|,)/i);
    if (flooringMatch) {
      flooring = flooringMatch[1].trim();
    }
  }

  // Extract fireplace count
  let fireplaceCount = "";
  const fireplaceEl = 
    document.querySelector('[data-testid*="fireplace"], [data-testid*="Fireplace"]') ||
    document.querySelector('[class*="fireplace"], [class*="Fireplace"]');
  if (fireplaceEl) {
    const fireplaceMatch = fireplaceEl.textContent?.match(/(\d+)/);
    if (fireplaceMatch) {
      fireplaceCount = fireplaceMatch[1];
    }
  }
  // Try text pattern
  if (!fireplaceCount) {
    const mainContent = document.querySelector('main') || document.body;
    const fireplaceMatch = mainContent.textContent?.match(/(?:Fireplace|Fireplaces)[:\s]+(\d+)/i);
    if (fireplaceMatch) {
      fireplaceCount = fireplaceMatch[1];
    }
  }

  // Extract HOA fee
  let hoaFee = "";
  const hoaEl = 
    document.querySelector('[data-testid*="hoa"], [data-testid*="HOA"]') ||
    document.querySelector('[class*="hoa"], [class*="HOA"]');
  if (hoaEl) {
    const text = hoaEl.textContent || "";
    const hoaMatch = text.match(/\$([\d,]+)/);
    if (hoaMatch) {
      hoaFee = hoaMatch[1].replace(/,/g, '');
    }
  }
  // Try text pattern - look for "$XXX monthly HOA fee" or "HOA: $XXX"
  if (!hoaFee) {
    const mainContent = document.querySelector('main') || document.body;
    const hoaMatch = mainContent.textContent?.match(/(?:HOA|HOA Fee)[:\s]+\$([\d,]+)/i);
    if (hoaMatch) {
      hoaFee = hoaMatch[1].replace(/,/g, '');
    } else {
      // Try "$XXX monthly HOA fee" pattern
      const monthlyMatch = mainContent.textContent?.match(/\$([\d,]+)\s+monthly\s+HOA/i);
      if (monthlyMatch) {
        hoaFee = monthlyMatch[1].replace(/,/g, '');
      }
    }
  }

  // Extract price per sqft
  let pricePerSqft = "";
  if (price && squareFeet) {
    const priceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
    const sqftNum = parseFloat(squareFeet.replace(/[^0-9.]/g, ''));
    if (priceNum > 0 && sqftNum > 0) {
      pricePerSqft = String(Math.round(priceNum / sqftNum));
    }
  }
  // Try direct extraction
  if (!pricePerSqft) {
    const mainContent = document.querySelector('main') || document.body;
    const pricePerSqftMatch = mainContent.textContent?.match(/(?:Price per Sq Ft|Price\/SqFt)[:\s]+\$([\d,]+)/i);
    if (pricePerSqftMatch) {
      pricePerSqft = pricePerSqftMatch[1].replace(/,/g, '');
    }
  }

  // Extract description
  let description = "";
  const descEl = 
    document.querySelector('[data-testid*="description"], [data-testid*="Description"]') ||
    document.querySelector('[class*="description"], [class*="Description"]') ||
    document.querySelector('[itemprop="description"]') ||
    document.querySelector('meta[name="description"]');
  if (descEl) {
    description = descEl.textContent || descEl.content || "";
    // No truncation - keep full description
  }
  // Try JSON-LD
  if (!description) {
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data.description) {
          description = data.description;
          // No truncation - keep full description
          break;
        }
      } catch {}
    }
  }

  // Extract features (try to find feature lists)
  let features = [];
  let interiorFeatures = [];
  let exteriorFeatures = [];
  
  // Try to find feature sections
  const featureSections = Array.from(document.querySelectorAll('[class*="feature"], [data-testid*="feature"]'));
  for (const section of featureSections) {
    const text = section.textContent?.toLowerCase() || "";
    const items = Array.from(section.querySelectorAll('li, span, div')).map(el => el.textContent?.trim()).filter(Boolean);
    
    if (text.includes('interior')) {
      interiorFeatures = items;
    } else if (text.includes('exterior')) {
      exteriorFeatures = items;
    } else if (items.length > 0) {
      features = items;
    }
  }
  
  // Also try to find features in common property detail sections
  const detailSections = Array.from(document.querySelectorAll('[class*="detail"], [class*="spec"], [class*="amenity"]'));
  for (const section of detailSections) {
    const text = section.textContent?.toLowerCase() || "";
    if (text.includes('feature') || text.includes('amenity')) {
      const items = Array.from(section.querySelectorAll('li, [class*="item"]')).map(el => el.textContent?.trim()).filter(Boolean);
      if (items.length > 0 && features.length === 0) {
        features = items;
      }
    }
  }
  
  // Try JSON-LD for features
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      if (data.amenityFeature && Array.isArray(data.amenityFeature)) {
        features = data.amenityFeature.map(a => a.name || a).filter(Boolean);
      }
    } catch {}
  }

  // ============================================================
  // STEP 6: Extract images (GENERIC - works on any site)
  // ============================================================
  
  // Helper: Get image URL from element (handles lazy loading)
  const getImageUrl = (img) => {
    return img.src || 
           img.getAttribute('data-src') || 
           img.getAttribute('data-lazy-src') ||
           img.getAttribute('data-original') ||
           img.getAttribute('data-url') ||
           img.getAttribute('srcset')?.split(',')[0]?.trim().split(' ')[0] ||
           '';
  };

  // Helper: Check if URL is a valid property image
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    if (!url.startsWith('http')) return false;
    
    // Filter out common non-property images
    const blacklist = [
      '/logo', '/icon', '/avatar', '/agent', '/profile',
      '/ad', '/advertisement', '/sponsored', '/banner',
      'facebook', 'twitter', 'instagram', 'youtube',
      'google-analytics', 'pixel', 'tracking'
    ];
    
    if (blacklist.some(pattern => url.toLowerCase().includes(pattern))) {
      return false;
    }
    
    // Must be an image file
    if (!/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)) {
      return false;
    }
    
    // Filter out very small images (likely icons)
    const sizeMatch = url.match(/(\d+)x(\d+)/);
    if (sizeMatch) {
      const w = parseInt(sizeMatch[1]);
      const h = parseInt(sizeMatch[2]);
      if (w < 200 || h < 200) return false;
    }
    
    return true;
  };

  // Helper: Score image quality (higher = better)
  const getImageScore = (url) => {
    if (!url) return 0;
    
    // Large dimensions in URL
    const sizeMatch = url.match(/(\d+)x(\d+)/);
    if (sizeMatch) {
      const area = parseInt(sizeMatch[1]) * parseInt(sizeMatch[2]);
      return Math.min(area / 1000, 100); // Cap at reasonable score
    }
    
    // Width parameters
    const widthMatch = url.match(/[?&_](?:w|width)=(\d+)/);
    if (widthMatch) {
      return Math.min(parseInt(widthMatch[1]) / 10, 100);
    }
    
    // Common quality indicators
    if (url.includes('large') || url.includes('full') || url.includes('hd')) return 80;
    if (url.includes('medium')) return 50;
    if (url.includes('small') || url.includes('thumb')) return 20;
    
    // Default: assume decent quality
    return 50;
  };

  // Strategy 1: Try Open Graph image
  let allImages = [];
  const ogImage = document.querySelector('meta[property="og:image"]')?.content;
  if (ogImage && isValidImageUrl(ogImage)) {
    allImages.push(ogImage);
  }

  // Strategy 2: Try JSON-LD images
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      if (data.image) {
        const images = Array.isArray(data.image) ? data.image : [data.image];
        images.forEach(img => {
          const url = typeof img === 'string' ? img : img.url || img.contentUrl;
          if (url && isValidImageUrl(url)) {
            allImages.push(url);
          }
        });
      }
    } catch {
      // Continue
    }
  }

  // Strategy 3: Extract from gallery/photo containers (prioritize Zillow-specific selectors)
  const gallerySelectors = [
    // Zillow-specific gallery selectors (most reliable)
    '[data-testid="home-details-photo-gallery"]',
    '[data-testid*="photo-gallery"]',
    '[data-testid*="PhotoGallery"]',
    '.media-stream',
    '.zsg-photo-gallery',
    '[class*="photo-gallery"]',
    '[class*="PhotoGallery"]',
    '[class*="MediaStream"]',
    // Generic gallery selectors
    '[class*="gallery"]', '[class*="photo"]', '[class*="image"]',
    '[id*="gallery"]', '[id*="photo"]', '[id*="image"]',
    '[data-testid*="gallery"]', '[data-testid*="photo"]', '[data-testid*="image"]',
    '.carousel', '.slider', '.swiper'
  ];
  
  let galleryContainer = null;
  for (const selector of gallerySelectors) {
    const found = document.querySelector(selector);
    if (found) {
      galleryContainer = found;
      console.log(`[HomeQR] ✅ Found gallery container with selector: ${selector}`);
      break;
    }
  }

  // Strategy 4: Get all images from page (or from gallery if found)
  const root = galleryContainer || document.body;
  const allImgElements = Array.from(root.querySelectorAll('img'));
  
  console.log(`[HomeQR] Found ${allImgElements.length} total images ${galleryContainer ? 'in gallery' : 'on page'}`);
  
  // Filter out images from unwanted sections (more aggressive for Zillow)
  const blacklistedSections = [
    'similar', 'recommended', 'nearby', 'neighborhood', 'homes-for-you',
    'ad-', 'advertisement', 'sponsored', 'social', 'share', 'agent',
    'logo', 'icon', 'avatar', 'profile', 'header', 'footer', 'nav'
  ];
  
  // Zillow-specific section headings to exclude
  const blacklistedHeadings = [
    'Similar homes', 'Homes for you', 'Nearby homes', 'Recommended for you',
    'More homes', 'Other listings', 'You may also like'
  ];
  
  const extractedImages = allImgElements
    .filter(img => {
      // Check if in blacklisted section
      let parent = img.parentElement;
      let depth = 0;
      while (parent && depth < 6) {
        const className = parent.className?.toLowerCase() || '';
        const id = parent.id?.toLowerCase() || '';
        const textContent = parent.textContent?.toLowerCase() || '';
        
        // Check for blacklisted sections
        if (blacklistedSections.some(section => 
          className.includes(section) || id.includes(section)
        )) {
          return false;
        }
        
        // Check for blacklisted headings (like "Similar homes", "Homes for you")
        if (blacklistedHeadings.some(heading => 
          textContent.includes(heading.toLowerCase())
        )) {
          // Check if this is actually a heading element
          const tagName = parent.tagName?.toLowerCase();
          if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || 
              tagName === 'h4' || className.includes('heading') || className.includes('title')) {
            return false;
          }
        }
        
        parent = parent.parentElement;
        depth++;
      }
      return true;
    })
    .map(getImageUrl)
    .filter(isValidImageUrl)
    .map(url => ({ url, score: getImageScore(url) }))
    // Deduplicate by URL (normalize query strings)
    .reduce((acc, item) => {
      const baseUrl = item.url.split('?')[0].split('#')[0];
      const existing = acc.find(i => i.url.split('?')[0].split('#')[0] === baseUrl);
      if (!existing || item.score > existing.score) {
        if (existing) {
          const index = acc.indexOf(existing);
          acc[index] = item;
        } else {
          acc.push(item);
        }
      }
      return acc;
    }, [])
    // Sort by score (highest first)
    .sort((a, b) => b.score - a.score)
    // Limit to top 30 images
    .slice(0, 30)
    .map(item => item.url);

  // Combine all strategies
  allImages = uniqueUrls([...allImages, ...extractedImages]).slice(0, 30);
  
  console.log(`[HomeQR] After filtering: ${allImages.length} images`);

  // Get hero image (first one or from meta tag)
  const heroImg = allImages[0] || 
    document.querySelector('meta[property="og:image"]')?.content ||
    "";

  console.log("[HomeQR] Generic DOM fallback extracted:", {
    address,
    city,
    state,
    zip,
    price,
    bedrooms,
    bathrooms,
    squareFeet,
    mlsId,
    propertyType,
    yearBuilt,
    lotSize,
    stories,
    parkingSpaces,
    garageSpaces,
    heating,
    cooling,
    flooring,
    fireplaceCount,
    hoaFee,
    pricePerSqft,
    description,
    featuresCount: features.length,
    interiorFeaturesCount: interiorFeatures.length,
    exteriorFeaturesCount: exteriorFeatures.length,
    imageCount: allImages.length,
    hasImage: !!heroImg,
  });

  if (allImages.length > 0) {
    console.log("[HomeQR] 📸 Found", allImages.length, "images via generic extraction");
    allImages.slice(0, 5).forEach((url, idx) => {
      console.log(`[HomeQR]   Image ${idx + 1}:`, url.substring(0, 100));
    });
  }

  return {
    address,
    city,
    state,
    zip,
    price,
    bedrooms,
    bathrooms,
    squareFeet,
    status: "",
    mlsId,
    // Additional property details
    propertyType: propertyType || null,
    propertySubtype: null, // Not easily extractable from DOM
    yearBuilt: yearBuilt || null,
    lotSize: lotSize || null,
    features: features.length > 0 ? features : null,
    interiorFeatures: interiorFeatures.length > 0 ? interiorFeatures : null,
    exteriorFeatures: exteriorFeatures.length > 0 ? exteriorFeatures : null,
    parkingSpaces: parkingSpaces || null,
    garageSpaces: garageSpaces || null,
    stories: stories || null,
    heating: heating || null,
    cooling: cooling || null,
    flooring: flooring || null,
    fireplaceCount: fireplaceCount || null,
    hoaFee: hoaFee || null,
    taxAssessedValue: null, // Not easily extractable from DOM
    annualTaxAmount: null, // Not easily extractable from DOM
    pricePerSqft: pricePerSqft || null,
    zestimate: null, // Zillow-specific, not in DOM fallback
    daysOnMarket: null, // Not easily extractable from DOM
    listingDate: null, // Not easily extractable from DOM
    description: description || null,
    imageUrl: heroImg,
    imageUrls: allImages,
  };
  } catch (err) {
    console.error("[HomeQR] Error in DOM fallback:", err);
    throw err; // Re-throw to be caught by detectListing
  }
}

// ============================================================
// Helper: Build normalized result from any property object
// ============================================================
function buildResult(prop) {
  try {
    if (!prop) {
      console.log("[HomeQR] ⚠️ buildResult called with null/undefined property");
      return null;
    }

    // Debug: Log all price-related fields
    const priceFields = {
      price: prop.price,
      listPrice: prop.listPrice,
      unformattedPrice: prop.unformattedPrice,
      adTargets_price: prop.adTargets?.price,
      priceHistory: prop.priceHistory,
      latestPrice: prop.latestPrice,
      currentPrice: prop.currentPrice,
      homeInfo_price: prop.homeInfo?.price,
      homeInfo_listPrice: prop.homeInfo?.listPrice,
      propertyDetails_price: prop.propertyDetails?.price,
    };
    console.log("[HomeQR] Price fields in property object:", priceFields);
    
    // Debug: Log all square feet-related fields
    const sqftFields = {
      livingArea: prop.livingArea,
      livingAreaValue: prop.livingAreaValue,
      area: prop.area,
      adTargets_sqft: prop.adTargets?.sqft,
      squareFeet: prop.squareFeet,
      totalArea: prop.totalArea,
      finishedArea: prop.finishedArea,
      finishedSquareFeet: prop.finishedSquareFeet,
      homeInfo_livingArea: prop.homeInfo?.livingArea,
      homeInfo_squareFeet: prop.homeInfo?.squareFeet,
      propertyDetails_livingArea: prop.propertyDetails?.livingArea,
      propertyDetails_squareFeet: prop.propertyDetails?.squareFeet,
    };
    console.log("[HomeQR] Square feet fields in property object:", sqftFields);
    
    console.log("[HomeQR] Building result from property object:", {
      hasPrice: !!(prop.price || prop.adTargets?.price || prop.listPrice || prop.unformattedPrice),
      hasBedrooms: !!(prop.bedrooms || prop.beds || prop.adTargets?.bd),
      hasBathrooms: !!(prop.bathrooms || prop.baths || prop.adTargets?.ba),
      hasSquareFeet: !!(prop.livingArea || prop.livingAreaValue || prop.area || prop.adTargets?.sqft),
      hasAddress: !!prop.address,
      hasPhotos: !!(prop.media?.photos || prop.responsivePhotos || prop.photos),
    });

    const addr = prop.address || {};
    
    // Extract address components with multiple fallbacks
    const address = addr.streetAddress || addr.street || addr.line || prop.streetAddress || "";
    const city = addr.city || prop.city || "";
    const state = addr.state || prop.state || "";
    const zip = addr.zipcode || addr.zipCode || prop.zipcode || prop.zipCode || "";

    // Extract price with multiple fallbacks - check many possible locations
    const priceRaw = 
      prop.price ?? 
      prop.listPrice ?? 
      prop.unformattedPrice ?? 
      prop.adTargets?.price ?? 
      prop.priceHistory?.[0]?.price ?? 
      prop.latestPrice?.price ?? 
      prop.currentPrice ?? 
      prop.priceHistory?.currentPrice ?? 
      prop.homeInfo?.price ?? 
      prop.homeInfo?.listPrice ?? 
      prop.propertyDetails?.price ?? 
      prop.propertyDetails?.listPrice ?? 
      "";
    
    // If price is an object, try to extract the value
    let priceValue = priceRaw;
    if (priceRaw && typeof priceRaw === 'object') {
      priceValue = priceRaw.value ?? priceRaw.amount ?? priceRaw.price ?? "";
    }
    
    const price = formatPrice(priceValue);
    
    // Log price extraction for debugging
    if (!price && priceRaw) {
      console.log("[HomeQR] ⚠️ Price found but couldn't format:", priceRaw, typeof priceRaw);
    } else if (price) {
      console.log("[HomeQR] ✅ Price extracted:", price);
    } else {
      console.log("[HomeQR] ⚠️ No price found in property object");
    }

    // Extract bedrooms with multiple fallbacks
    const bedrooms = prop.bedrooms ?? prop.beds ?? prop.adTargets?.bd ?? prop.bedroomsCount ?? "";

    // Extract bathrooms with multiple fallbacks
    const bathrooms = prop.bathrooms ?? prop.baths ?? prop.adTargets?.ba ?? prop.bathroomsCount ?? "";

    // Extract square feet with multiple fallbacks
    const squareFeetRaw = 
      prop.livingArea ?? 
      prop.livingAreaValue ?? 
      prop.area ?? 
      prop.adTargets?.sqft ?? 
      prop.squareFeet ?? 
      prop.totalArea ?? 
      prop.finishedArea ?? 
      prop.finishedSquareFeet ?? 
      prop.homeInfo?.livingArea ?? 
      prop.homeInfo?.squareFeet ?? 
      prop.propertyDetails?.livingArea ?? 
      prop.propertyDetails?.squareFeet ?? 
      "";
    
    // Convert to string and validate
    let squareFeet = "";
    if (squareFeetRaw) {
      const sqftNum = typeof squareFeetRaw === 'number' 
        ? squareFeetRaw 
        : parseInt(String(squareFeetRaw).replace(/[^0-9]/g, ''));
      
      // Validate it's a reasonable square footage (between 100 and 50,000)
      if (!isNaN(sqftNum) && sqftNum > 100 && sqftNum < 50000) {
        squareFeet = String(sqftNum);
        console.log("[HomeQR] ✅ Square feet extracted from JSON:", squareFeet);
      } else {
        console.log("[HomeQR] ⚠️ Square feet value invalid:", squareFeetRaw, "->", sqftNum);
      }
    } else {
      console.log("[HomeQR] ⚠️ No square feet found in property object");
    }

    // Extract status and type
    const status = prop.homeStatus ?? prop.listingTypeDimension ?? prop.status ?? prop.homeType ?? "";
    const homeType = prop.homeType ?? prop.hdpTypeDimension ?? "";
    const listingType = prop.listingTypeDimension ?? "";

    // Extract MLS ID and ZPID
    const mlsId = prop.mlsId ?? prop.mlsNumber ?? prop.mls ?? "";
    const zpid = prop.zpid ?? "";
    const zestimate = prop.zestimate ?? prop.adTargets?.zestimate ?? "";

    // Extract additional property details
    const yearBuilt = prop.yearBuilt ?? prop.yearBuiltEffective ?? prop.adTargets?.yrblt ?? "";
    const lotSize = prop.lotSize ?? prop.lotAreaValue ?? "";
    const lotUnits = prop.lotAreaUnits ?? "";
    const lat = prop.latitude ?? prop.lat ?? prop.geo?.latitude ?? "";
    const lng = prop.longitude ?? prop.lng ?? prop.geo?.longitude ?? "";
    const taxesYear = prop.taxHistory?.[0]?.time ?? "";
    const taxes = prop.taxHistory?.[0]?.value ?? "";
    
    // Extract property type and subtype
    const propertyType = prop.homeType ?? prop.hdpTypeDimension ?? prop.propertyType ?? "";
    const propertySubtype = prop.propertySubType ?? prop.homeSubType ?? "";
    
    // Extract features (array of strings) - ensure they're clean arrays
    // Helper to normalize features to array of strings
    const normalizeFeatures = (data) => {
      if (!data) return [];
      if (Array.isArray(data)) {
        return data
          .map(item => {
            if (typeof item === 'string') return item.trim();
            if (typeof item === 'object' && item !== null) {
              return item.name || item.value || item.label || String(item).trim();
            }
            return String(item).trim();
          })
          .filter(item => item && item.length > 0 && item.length < 100); // Filter out very long strings (likely objects)
      }
      if (typeof data === 'string') {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            return normalizeFeatures(parsed);
          }
        } catch {}
        // If not JSON, split by common delimiters
        return data.split(/[,;|]/).map(s => s.trim()).filter(s => s && s.length > 0 && s.length < 100);
      }
      return [];
    };
    
    const features = normalizeFeatures(prop.features ?? prop.highlights ?? prop.amenities);
    const interiorFeatures = normalizeFeatures(prop.interiorFeatures ?? prop.interiorAmenities);
    const exteriorFeatures = normalizeFeatures(prop.exteriorFeatures ?? prop.exteriorAmenities);
    
    // Extract parking details
    const parkingSpaces = prop.parkingSpaces ?? prop.parkingTotal ?? "";
    const garageSpaces = prop.garageSpaces ?? prop.attachedGarage ?? "";
    
    // Extract structure details
    const stories = prop.stories ?? prop.numberOfStories ?? "";
    const heating = prop.heating ?? prop.heatingType ?? "";
    const cooling = prop.cooling ?? prop.coolingType ?? "";
    const flooring = prop.flooring ?? prop.flooringType ?? "";
    const fireplaceCount = prop.fireplaceCount ?? prop.numberOfFireplaces ?? "";
    
    // Extract HOA and financial details
    const hoaFee = prop.hoaFee ?? prop.monthlyHoaFee ?? "";
    const taxAssessedValue = prop.taxAssessedValue ?? prop.assessedValue ?? "";
    const annualTaxAmount = prop.annualTaxAmount ?? prop.taxAmount ?? "";
    const pricePerSqft = prop.pricePerSquareFoot ?? prop.pricePerSqft ?? "";
    const daysOnMarket = prop.daysOnMarket ?? prop.dom ?? "";
    const listingDate = prop.listingDate ?? prop.dateListed ?? "";
    
    // Extract description
    const description = prop.description ?? prop.longDescription ?? prop.summary ?? "";

    // Blacklist patterns for logo images and other non-property images
    const BLACKLIST_PATTERNS = [
      /\/zillow_web_/i,      // Zillow logo variants (zillow_web_95_35, zillow_web_48_23, etc.)
      /\/agent\//i,
      /\/logo\//i,
      /\/partner\//i,
      /\/showcase\//i,
      /\/bedrock\//i,
      /\/HomeDollar\//i,
      /\/Zillow-Home-Loans\//i,
    ];

    // Extract photos - handle responsivePhotos with mixedSources structure
    // Helper function to extract resolution score from URL for sorting
    // Higher score = higher resolution
    const getUrlResolutionScore = (url) => {
      if (!url || typeof url !== 'string') return 0;
      
      // 1. Path-based sizes: /1024x768/, /2048x1536/, /3840x2160/
      const pathSizeMatch = url.match(/\/(\d+)x\d+\//);
      if (pathSizeMatch) {
        const width = parseInt(pathSizeMatch[1], 10);
        return width; // Use actual width as score
      }
      
      // 2. Width parameters: _w1024, _w2048, _w3840
      const widthParamMatch = url.match(/_w(\d+)/);
      if (widthParamMatch) {
        const width = parseInt(widthParamMatch[1], 10);
        return width;
      }
      
      // 3. Query parameters: ?w=2048, ?width=2048
      const queryWidthMatch = url.match(/[?&](?:w|width)=(\d+)/);
      if (queryWidthMatch) {
        const width = parseInt(queryWidthMatch[1], 10);
        return width;
      }
      
      // 4. Suffix patterns: -large, -xlarge, -xxlarge, -hd, -full
      if (url.includes('-full')) return 5000;
      if (url.includes('-xxlarge')) return 4000;
      if (url.includes('-hd')) return 3500;
      if (url.includes('-xlarge')) return 3000;
      if (url.includes('-large')) return 2000;
      
      // 5. Match patterns like: -cc_ft_1920.jpg, -cc_ft_960.jpg, etc.
      const widthMatch = url.match(/-cc_ft_(\d+)/);
      if (widthMatch) {
        const width = parseInt(widthMatch[1], 10);
        return width; // Use actual width as score
      }
      
      // 6. Panorama variants (higher letter = higher resolution typically)
      // -p_a.jpg = lowest, -p_b.jpg, -p_c.jpg, -p_d.jpg, -p_e.jpg = highest
      if (url.includes('-p_')) {
        const panoramaMatch = url.match(/-p_([a-e])\.jpg/);
        if (panoramaMatch) {
          const letter = panoramaMatch[1];
          // Convert letter to score: a=1000, b=2000, c=3000, d=4000, e=5000
          return 1000 + ((letter.charCodeAt(0) - 97) * 1000);
        }
        // If it's a panorama but no letter match, assume mid-range
        return 3000;
      }
      
      // 7. If no width pattern or panorama pattern, might be base URL (original resolution)
      // Check if it has any other resolution indicators
      if (url.match(/\.(jpg|jpeg|png|webp)$/i) && !url.match(/[-_](ft_|p_|thumb|small|medium|large|w\d+)/i)) {
        // Base URL without resolution suffix - might be original, give high priority
        return 6000;
      }
      
      // Unknown pattern, give low priority
      return 1000;
    };
    
    // Helper function to try enhancing URL to highest resolution
    // Strategy: Try to get original resolution by removing panorama suffix first
    // If that doesn't work, try highest panorama variant
    const enhanceImageUrl = (url) => {
      if (!url || typeof url !== 'string') return url;
      
      // BEST: Try removing panorama suffix to get original/base resolution
      // Base URLs without -p_ suffix are often the original high-resolution images
      if (url.includes('-p_')) {
        const baseUrl = url.replace(/-p_[a-e]\.jpg/i, '.jpg');
        console.log("[HomeQR] 🎯 Trying base URL (original resolution, no panorama suffix):", baseUrl.substring(0, 100));
        // Return base URL - this is often the highest quality original image
        return baseUrl;
      }
      
      // FALLBACK: If no panorama suffix, try adding -p_e (highest panorama variant)
      // But only if URL doesn't already have resolution indicators
      if (url.match(/\.jpg$/i) && !url.match(/[-_](p_|cc_ft_|large|xlarge|hd|full|w\d+)/i)) {
        const enhanced = url.replace(/\.jpg$/i, '-p_e.jpg');
        console.log("[HomeQR] 🔄 Enhanced base URL: added -p_e suffix (highest panorama)");
        return enhanced;
      }
      
      // Try to enhance -cc_ft_ width patterns
      const ccFtMatch = url.match(/-cc_ft_(\d+)/);
      if (ccFtMatch) {
        const currentWidth = parseInt(ccFtMatch[1], 10);
        if (currentWidth < 3840) {
          // Try to upgrade to maximum width
          const enhanced = url.replace(/-cc_ft_\d+/, '-cc_ft_3840');
          console.log(`[HomeQR] 🔄 Enhanced width URL: ${currentWidth} → 3840 (maximum)`);
          return enhanced;
        }
      }
      
      return url; // Return original if no enhancement possible
    };

    // Extract photos - prioritize listing's own photos over all photos
    // Strategy: Use media.photos first (most reliable for listing's own gallery)
    // Then responsivePhotos (also listing's own)
    // Avoid prop.photos which might include similar homes
    let photoSource = null;
    if (prop.media?.photos && Array.isArray(prop.media.photos) && prop.media.photos.length > 0) {
      photoSource = prop.media.photos;
      console.log("[HomeQR] ✅ Using media.photos (listing's own gallery):", photoSource.length, "photos");
    } else if (prop.responsivePhotos && Array.isArray(prop.responsivePhotos) && prop.responsivePhotos.length > 0) {
      photoSource = prop.responsivePhotos;
      console.log("[HomeQR] ✅ Using responsivePhotos (listing's own gallery):", photoSource.length, "photos");
    } else if (prop.photos && Array.isArray(prop.photos) && prop.photos.length > 0) {
      // Only use prop.photos as last resort, and filter more aggressively
      photoSource = prop.photos;
      console.log("[HomeQR] ⚠️ Using prop.photos (fallback, may include similar homes):", photoSource.length, "photos");
    } else {
      photoSource = [];
      console.log("[HomeQR] ⚠️ No photos found in property object");
    }

    // Get listing ZPID to validate photos belong to this listing
    const listingZpid = prop.zpid || prop.zpidValue || "";
    
    const rawPhotos = (photoSource || [])
      .map((p) => {
        // responsivePhotos have url field directly
        if (p.url) {
          const score = getUrlResolutionScore(p.url);
          console.log("[HomeQR] 📸 Photo URL:", p.url.substring(0, 80), "score:", score);
          
          // Try to enhance the URL to higher resolution
          const enhanced = enhanceImageUrl(p.url);
          if (enhanced !== p.url) {
            const enhancedScore = getUrlResolutionScore(enhanced);
            console.log("[HomeQR] 🚀 Enhanced direct URL:", enhanced.substring(0, 80), "score:", enhancedScore);
            return { url: enhanced, score: enhancedScore };
          }
          
          return { url: p.url, score };
        }
        
        // Check for mixedSources (responsivePhotos format)
        if (p.mixedSources?.jpeg?.length) {
          const j = p.mixedSources.jpeg;
          console.log(`[HomeQR] 📸 Found ${j.length} JPEG variants in mixedSources`);
          
          // Sort by resolution score (highest first) and take the best
          const sorted = j
            .filter(jpeg => jpeg?.url)
            .map(jpeg => ({
              url: jpeg.url,
              score: getUrlResolutionScore(jpeg.url)
            }))
            .sort((a, b) => {
              // If scores are equal, prefer longer URLs (might have more detail)
              if (a.score === b.score) {
                return (b.url?.length || 0) - (a.url?.length || 0);
              }
              return b.score - a.score;
            });
          
          // Log all variants with scores
          sorted.forEach((item, idx) => {
            console.log(`[HomeQR]   Variant ${idx + 1}:`, item.url.substring(0, 80), "score:", item.score);
          });
          
          const best = sorted[0];
          if (best?.url) {
            console.log("[HomeQR] ✅ Selected best photo URL:", best.url.substring(0, 100), "score:", best.score);
            
            // Try to enhance the URL to higher resolution
            const enhanced = enhanceImageUrl(best.url);
            if (enhanced !== best.url) {
              console.log("[HomeQR] 🚀 Using enhanced URL:", enhanced.substring(0, 100));
              return { url: enhanced, score: getUrlResolutionScore(enhanced) };
            }
            
            return best;
          }
          // Fallback to last or first if sorting failed
          const fallback = j[j.length - 1]?.url || j[0]?.url;
          if (fallback) {
            return { url: fallback, score: getUrlResolutionScore(fallback) };
          }
        }
        
        // Fallback to other fields
        const fallbackUrl = p.hiRes || p.href || p.src;
        if (fallbackUrl) {
          return { url: fallbackUrl, score: getUrlResolutionScore(fallbackUrl) };
        }
        return null;
      })
      .filter((item) => {
        if (!item || !item.url || typeof item.url !== 'string') return false;
        const u = item.url;
        
        // Must be from Zillow CDN
        if (!u.includes("zillowstatic.com") && !u.includes("photos.zillowstatic.com")) return false;
        
        // Filter out blacklisted patterns
        if (BLACKLIST_PATTERNS.some(pattern => pattern.test(u))) {
          console.log("[HomeQR] ⛔ URL BLACKLISTED:", u);
          return false;
        }
        
        // Filter out listing page URLs (should be image URLs only)
        if (u.includes('/homedetails/') || u.includes('/homes/') || u.includes('/alpine-ut/')) return false;
        
        // Validate photo belongs to this listing by checking ZPID in URL
        // Zillow photo URLs typically contain the property identifier
        // Format: /fp/{propertyId}-{photoId}...
        if (listingZpid && u.includes('/fp/')) {
          // Extract property ID from photo URL (first part before dash)
          const photoPropMatch = u.match(/\/fp\/([a-z0-9]+)-/i);
          if (photoPropMatch) {
            const photoPropId = photoPropMatch[1];
            // If ZPID is numeric, check if photo property ID matches
            // If ZPID is alphanumeric, check if it's in the URL
            const zpidStr = String(listingZpid);
            if (!u.includes(zpidStr) && !photoPropId.includes(zpidStr.substring(0, 8))) {
              // Photo might be from a different listing, but be lenient
              // Only filter if we're very confident it's wrong
              console.log("[HomeQR] ⚠️ Photo property ID doesn't match listing ZPID:", photoPropId, "vs", zpidStr);
            }
          }
        }
        
        // Ensure it's an actual image file (jpg, jpeg, png, webp)
        if (!u.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) {
          console.log("[HomeQR] ⛔ Not an image file:", u);
          return false;
        }

        return true;
      })
      // Sort all photos by score (highest first) to ensure best quality
      .sort((a, b) => {
        if (a.score === b.score) {
          return (b.url?.length || 0) - (a.url?.length || 0);
        }
        return b.score - a.score;
      });

    // Deduplicate photos using canonical URLs (same photo, different resolutions)
    // This ensures we only keep the highest quality version of each unique photo
    const canonicalPhotos = new Map();
    for (const item of rawPhotos) {
      if (!item || !item.url) continue;
      
      // Create canonical URL by removing resolution parameters
      // This helps identify the same photo at different resolutions
      let canonical = item.url
        .replace(/-p_[a-e]\.jpg/i, '.jpg') // Remove panorama suffix
        .replace(/-cc_ft_\d+/g, '') // Remove width parameters
        .replace(/[?&]w=\d+/g, '') // Remove query width params
        .replace(/[?&]width=\d+/g, '') // Remove query width params
        .replace(/_w\d+/g, '') // Remove width suffix
        .replace(/\/\d+x\d+\//g, '/') // Remove path dimensions
        .split('?')[0]; // Remove query string
      
      // If we haven't seen this canonical URL, or this version has higher quality
      if (!canonicalPhotos.has(canonical) || 
          (canonicalPhotos.get(canonical).score < item.score)) {
        canonicalPhotos.set(canonical, item);
      }
    }
    
    // Convert back to array and sort by quality again
    const deduplicatedPhotos = Array.from(canonicalPhotos.values())
      .sort((a, b) => b.score - a.score)
      .map(item => item.url);

    // Limit to top 30 high-quality photos (reasonable limit for gallery)
    const photos = deduplicatedPhotos.slice(0, 30);
    
    // Log final photo selection
    if (photos.length > 0) {
      console.log(`[HomeQR] 📊 Final photo selection: ${photos.length} images`);
      photos.slice(0, 3).forEach((url, idx) => {
        const score = getUrlResolutionScore(url);
        console.log(`[HomeQR]   Photo ${idx + 1}:`, url.substring(0, 100), "score:", score);
      });
    }

    const result = {
      address,
      city,
      state,
      zip,
      price,
      bedrooms,
      bathrooms,
      squareFeet,
      status,
      homeType,
      listingType,
      mlsId,
      zpid,
      zestimate,
      yearBuilt,
      lotSize,
      lotUnits,
      latitude: lat,
      longitude: lng,
      taxesYear,
      taxes,
      propertyType,
      propertySubtype,
      features: Array.isArray(features) ? features : [],
      interiorFeatures: Array.isArray(interiorFeatures) ? interiorFeatures : [],
      exteriorFeatures: Array.isArray(exteriorFeatures) ? exteriorFeatures : [],
      parkingSpaces,
      garageSpaces,
      stories,
      heating,
      cooling,
      flooring,
      fireplaceCount,
      hoaFee,
      taxAssessedValue,
      annualTaxAmount,
      pricePerSqft,
      daysOnMarket,
      listingDate,
      description,
      imageUrl: photos[0] ?? "",
      imageUrls: photos,
    };

    console.log("[HomeQR] Extracted data:", {
      address: result.address,
      city: result.city,
      state: result.state,
      zip: result.zip,
      price: result.price,
      bedrooms: result.bedrooms,
      bathrooms: result.bathrooms,
      squareFeet: result.squareFeet,
      yearBuilt: result.yearBuilt,
      lotSize: result.lotSize,
      imageCount: result.imageUrls.length,
    });

    return result;
  } catch (err) {
    console.error("[HomeQR] ❌ Error in buildResult:", err);
    // Return minimal result with address from title if available
    return {
      address: extractAddressFromTitle(document.title) || extractAddressFromUrl(location.href) || "Property Listing",
      city: "",
      state: "",
      zip: "",
      price: "",
      bedrooms: "",
      bathrooms: "",
      squareFeet: "",
      status: "",
      homeType: "",
      listingType: "",
      mlsId: "",
      zpid: "",
      zestimate: "",
      yearBuilt: "",
      lotSize: "",
      lotUnits: "",
      latitude: "",
      longitude: "",
      taxesYear: "",
      taxes: "",
      imageUrl: "",
      imageUrls: [],
    };
  }
}

// ============================================================
// Helper: Format price
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