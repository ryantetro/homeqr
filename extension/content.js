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
// 2. DOM Fallback (when JSON fails)
// ============================================================
function fallbackDOM() {
  try {
    console.log("[HomeQR] Using DOM fallback");

  // Extract price
  const price =
    document.querySelector('[data-testid="home-details-summary-price"]')?.textContent?.trim() ||
    document.querySelector(".ds-price")?.textContent?.trim() ||
    document.querySelector('[data-testid="price"]')?.textContent?.trim() ||
    "";

  // Extract address - try multiple selectors
  const addressEl =
    document.querySelector("h1[data-testid='home-details-summary-headline']") ||
    document.querySelector("h1.ds-address-container") ||
    document.querySelector("h1[data-testid='home-details-summary-address']") ||
    document.querySelector("h1.address");
  const address = addressEl?.textContent?.trim() || "";

  // Extract city, state, zip from address line or separate elements
  let city = "";
  let state = "";
  let zip = "";
  
  const locationEl = 
    document.querySelector('[data-testid="home-details-summary-city"]') ||
    document.querySelector(".ds-address-container span") ||
    document.querySelector(".address-line");
  
  if (locationEl) {
    const locationText = locationEl.textContent?.trim() || "";
    // Try to parse "City, State ZIP" format
    const match = locationText.match(/(.+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/);
    if (match) {
      city = match[1].trim();
      state = match[2].trim();
      zip = match[3].trim();
  } else {
      // Fallback: just split by comma
      const parts = locationText.split(',').map(s => s.trim());
      if (parts.length >= 2) {
        city = parts[0];
        const stateZip = parts[1].split(/\s+/);
        state = stateZip[0] || "";
        zip = stateZip[1] || "";
      }
    }
  }

  // Extract bedrooms
  const beds = 
    document.querySelector('[data-testid="bed-bath-item-0"]')?.textContent?.trim() ||
    document.querySelector('[data-testid="bed"]')?.textContent?.trim() ||
    document.querySelector(".ds-bed-bath-living-area-row span")?.textContent?.match(/(\d+)\s*bed/i)?.[1] ||
    "";

  // Extract bathrooms
  const baths = 
    document.querySelector('[data-testid="bed-bath-item-1"]')?.textContent?.trim() ||
    document.querySelector('[data-testid="bath"]')?.textContent?.trim() ||
    document.querySelector(".ds-bed-bath-living-area-row span")?.textContent?.match(/(\d+(?:\.\d+)?)\s*bath/i)?.[1] ||
    "";

  // Extract square feet
  const sqft = 
    document.querySelector('[data-testid="bed-bath-item-2"]')?.textContent?.trim() ||
    document.querySelector('[data-testid="sqft"]')?.textContent?.trim() ||
    document.querySelector(".ds-bed-bath-living-area-row span")?.textContent?.match(/([\d,]+)\s*sqft/i)?.[1]?.replace(/,/g, '') ||
    "";

  // Extract MLS ID - search all spans for MLS text
  let mlsId = 
    document.querySelector('[data-testid="mls-id"]')?.textContent?.trim() ||
    document.querySelector(".ds-mls-id")?.textContent?.trim() ||
    "";
  
  // If not found, search all spans for MLS pattern
  if (!mlsId) {
    const allSpans = Array.from(document.querySelectorAll('span'));
    const mlsSpan = allSpans.find(span => {
      const text = span.textContent || '';
      return /MLS[#:]?\s*\d+/i.test(text);
    });
    if (mlsSpan) {
      const match = mlsSpan.textContent?.match(/MLS[#:]?\s*(\w+)/i);
      mlsId = match?.[1] || "";
    }
  }

  // Extract hero image
  const img =
    document.querySelector('img[src*="zillowstatic.com/fp"]:not([src*="zillow_web_"])')?.src ||
    document.querySelector('meta[property="og:image"]')?.content ||
    "";

  console.log("[HomeQR] DOM fallback extracted:", {
    address,
    city,
    state,
    zip,
    price,
    bedrooms: beds,
    bathrooms: baths,
    squareFeet: sqft,
    mlsId,
    hasImage: !!img,
  });

  return {
    address,
    city,
    state,
    zip,
    price,
    bedrooms: beds,
    bathrooms: baths,
    squareFeet: sqft,
    status: "",
    mlsId,
    imageUrl: img,
    imageUrls: img ? [img] : [],
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

    // Extract price with multiple fallbacks
    const priceRaw = prop.price ?? prop.listPrice ?? prop.unformattedPrice ?? prop.adTargets?.price ?? "";
    const price = formatPrice(priceRaw);

    // Extract bedrooms with multiple fallbacks
    const bedrooms = prop.bedrooms ?? prop.beds ?? prop.adTargets?.bd ?? prop.bedroomsCount ?? "";

    // Extract bathrooms with multiple fallbacks
    const bathrooms = prop.bathrooms ?? prop.baths ?? prop.adTargets?.ba ?? prop.bathroomsCount ?? "";

    // Extract square feet with multiple fallbacks
    const squareFeet = prop.livingArea ?? prop.livingAreaValue ?? prop.area ?? prop.adTargets?.sqft ?? prop.squareFeet ?? "";

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
      
      // Match patterns like: -cc_ft_1920.jpg, -cc_ft_960.jpg, etc.
      const widthMatch = url.match(/-cc_ft_(\d+)/);
      if (widthMatch) {
        const width = parseInt(widthMatch[1], 10);
        return width; // Use actual width as score
      }
      
      // Panorama variants (higher letter = higher resolution typically)
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
      
      // If no width pattern or panorama pattern, might be base URL (original resolution)
      // Check if it has any other resolution indicators
      if (url.match(/\.(jpg|jpeg|png|webp)$/i) && !url.match(/[-_](ft_|p_|thumb|small|medium|large)/i)) {
        // Base URL without resolution suffix - might be original, give high priority
        return 6000;
      }
      
      // Unknown pattern, give low priority
      return 1000;
    };

    const rawPhotos = (prop.media?.photos || prop.responsivePhotos || prop.photos || [])
      .map((p) => {
        // responsivePhotos have url field directly
        if (p.url) return p.url;
        
        // Check for mixedSources (responsivePhotos format)
        if (p.mixedSources?.jpeg?.length) {
          const j = p.mixedSources.jpeg;
          // Sort by resolution score (highest first) and take the best
          const sorted = j
            .filter(jpeg => jpeg?.url)
            .sort((a, b) => {
              const scoreA = getUrlResolutionScore(a.url);
              const scoreB = getUrlResolutionScore(b.url);
              // If scores are equal, prefer longer URLs (might have more detail)
              if (scoreA === scoreB) {
                return (b.url?.length || 0) - (a.url?.length || 0);
              }
              return scoreB - scoreA;
            });
          
          const bestUrl = sorted[0]?.url;
          if (bestUrl) {
            console.log("[HomeQR] Selected photo URL:", bestUrl.substring(0, 100), "score:", getUrlResolutionScore(bestUrl));
            return bestUrl;
          }
          // Fallback to last or first if sorting failed
          return j[j.length - 1]?.url || j[0]?.url;
        }
        
        // Fallback to other fields
        return p.hiRes || p.href || p.src;
      })
      .filter((u) => {
        if (!u || typeof u !== 'string') return false;
        
        // Must be from Zillow CDN
        if (!u.includes("zillowstatic.com")) return false;
        
        // Filter out blacklisted patterns
        if (BLACKLIST_PATTERNS.some(pattern => pattern.test(u))) {
          console.log("[HomeQR] ⛔ URL BLACKLISTED:", u);
          return false;
        }
        
        // Filter out listing page URLs (should be image URLs only)
        if (u.includes('/homedetails/') || u.includes('/homes/')) return false;
        
        return true;
      });

    const photos = uniqueUrls(rawPhotos).slice(0, 50);

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
  if (!p) return "";
  const num = Number(p);
  return isNaN(num) ? "" : `$${num.toLocaleString()}`;
}