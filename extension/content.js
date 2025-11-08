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

  // Extract bedrooms - try multiple selectors and patterns
  let beds = 
    document.querySelector('[data-testid="bed-bath-item-0"]')?.textContent?.trim() ||
    document.querySelector('[data-testid="bed"]')?.textContent?.trim() ||
    document.querySelector(".ds-bed-bath-living-area-row span")?.textContent?.match(/(\d+)\s*bed/i)?.[1] ||
    "";
  
  // If not found, search all text for bed pattern
  if (!beds) {
    const bedMatch = document.body.textContent?.match(/(\d+)\s*bed(?:room)?s?/i);
    beds = bedMatch?.[1] || "";
  }

  // Extract bathrooms - try multiple selectors and patterns
  let baths = 
    document.querySelector('[data-testid="bed-bath-item-1"]')?.textContent?.trim() ||
    document.querySelector('[data-testid="bath"]')?.textContent?.trim() ||
    document.querySelector(".ds-bed-bath-living-area-row span")?.textContent?.match(/(\d+(?:\.\d+)?)\s*bath/i)?.[1] ||
    "";
  
  // If not found, search all text for bath pattern
  if (!baths) {
    const bathMatch = document.body.textContent?.match(/(\d+(?:\.\d+)?)\s*bath(?:room)?s?/i);
    baths = bathMatch?.[1] || "";
  }

  // Extract square feet - try multiple selectors and patterns
  let sqft = 
    document.querySelector('[data-testid="bed-bath-item-2"]')?.textContent?.trim() ||
    document.querySelector('[data-testid="sqft"]')?.textContent?.trim() ||
    document.querySelector(".ds-bed-bath-living-area-row span")?.textContent?.match(/([\d,]+)\s*sqft/i)?.[1]?.replace(/,/g, '') ||
    "";
  
  // If not found, search all text for sqft pattern
  if (!sqft) {
    const sqftMatch = document.body.textContent?.match(/([\d,]+)\s*sq\.?\s*ft\.?/i);
    sqft = sqftMatch?.[1]?.replace(/,/g, '') || "";
  }

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

  // Extract and filter images from the page
  // Use getUrlResolutionScore to prioritize high-quality images
  const getUrlResolutionScore = (url) => {
    if (!url) return 0;
    
    // Base URLs (no suffix) - highest priority (original resolution)
    if (/\/fp\/[a-f0-9]+\.jpg$/i.test(url)) return 6000;
    
    // Panorama variants (best to worst)
    if (url.includes('-p_e.jpg')) return 5000;
    if (url.includes('-p_d.jpg')) return 4000;
    if (url.includes('-p_c.jpg')) return 3000;
    if (url.includes('-p_b.jpg')) return 2000;
    if (url.includes('-p_a.jpg')) return 1000;
    
    // Width-based patterns (-cc_ft_XXXX)
    const ccFtMatch = url.match(/-cc_ft_(\d+)/);
    if (ccFtMatch) {
      const width = parseInt(ccFtMatch[1], 10);
      return width; // Use actual width as score
    }
    
    // Other patterns
    if (url.includes('-h_g.jpg')) return 500; // Gallery thumbnails - low priority
    if (url.includes('-thumb')) return 100;
    if (url.includes('-small')) return 200;
    
    // Default for unrecognized patterns
    return 100;
  };

  // Extract base image ID (hash) from URL for deduplication
  const getBaseImageId = (url) => {
    const match = url.match(/\/fp\/([a-f0-9]+)/i);
    return match ? match[1] : null;
  };

  // Get all images from the page
  const allImgElements = Array.from(document.querySelectorAll('img'));
  
  console.log(`[HomeQR] Found ${allImgElements.length} total images on page`);
  
  // Filter out images from unwanted sections (less aggressive)
  const blacklistedSections = [
    'similar-homes', 'similar-listings', 'neighborhood-photos', 
    'nearby-homes', 'recommended-listings', 'ad-', 'advertisement-', 'sponsored-'
  ];
  
  const allImages = allImgElements
    .filter(img => {
      // Only filter if we're very confident it's in a blacklisted section
      let parent = img.parentElement;
      let depth = 0;
      while (parent && depth < 3) { // Reduced depth check
        const className = parent.className?.toLowerCase() || '';
        const id = parent.id?.toLowerCase() || '';
        
        // Only filter if className or id explicitly contains blacklisted section
        // Don't filter based on text content (too aggressive)
        if (blacklistedSections.some(section => 
          className.includes(section) || id.includes(section)
        )) {
          console.log(`[HomeQR] Filtered image from blacklisted section: ${className || id}`);
          return false;
        }
        
        parent = parent.parentElement;
        depth++;
      }
      return true;
    })
    .map(img => {
      // Try multiple sources for lazy-loaded images
      return img.src || 
             img.getAttribute('data-src') || 
             img.getAttribute('data-lazy-src') ||
             img.getAttribute('data-original') ||
             img.getAttribute('srcset')?.split(',')[0]?.trim().split(' ')[0] ||
             '';
    })
    .filter(url => {
      if (!url || typeof url !== 'string') return false;
      // Must be from Zillow CDN
      if (!url.includes('zillowstatic.com')) return false;
      // Filter out logos and non-property images
      if (url.includes('zillow_web_') || url.includes('/logo') || url.includes('/icon')) return false;
      // Must be actual photo URLs (fp = full photo)
      if (!url.includes('/fp/') && !url.includes('/photos/')) return false;
      // Filter out listing page URLs
      if (url.includes('/homedetails/') || url.includes('/homes/')) return false;
      // Filter out very low resolution thumbnails (but be less strict)
      const score = getUrlResolutionScore(url);
      if (score < 300) return false; // Reduced threshold from 500 to 300
      return true;
    })
    // Score each image
    .map(url => ({ url, score: getUrlResolutionScore(url), baseId: getBaseImageId(url) }))
    // Group by base image ID and keep highest resolution variant
    .reduce((acc, item) => {
      if (!item.baseId) {
        acc.push(item);
        return acc;
      }
      const existing = acc.find(i => i.baseId === item.baseId);
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
    // Limit to top 30 images (main gallery typically has 20-30 photos max)
    .slice(0, 30)
    // Extract URLs
    .map(item => item.url)
  
  console.log(`[HomeQR] After filtering: ${allImages.length} images`);

  // Get hero image (first one or from meta tag)
  const heroImg = allImages[0] || 
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
    imageCount: allImages.length,
    hasImage: !!heroImg,
  });

  if (allImages.length > 0) {
    console.log("[HomeQR] 📸 Found", allImages.length, "images via DOM fallback");
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
    bedrooms: beds,
    bathrooms: baths,
    squareFeet: sqft,
    status: "",
    mlsId,
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

    const rawPhotos = (prop.media?.photos || prop.responsivePhotos || prop.photos || [])
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
        if (!u.includes("zillowstatic.com")) return false;
        
        // Filter out blacklisted patterns
        if (BLACKLIST_PATTERNS.some(pattern => pattern.test(u))) {
          console.log("[HomeQR] ⛔ URL BLACKLISTED:", u);
          return false;
        }
        
        // Filter out listing page URLs (should be image URLs only)
        if (u.includes('/homedetails/') || u.includes('/homes/')) return false;

        return true;
      })
      // Sort all photos by score (highest first) to ensure best quality
      .sort((a, b) => {
        if (a.score === b.score) {
          return (b.url?.length || 0) - (a.url?.length || 0);
        }
        return b.score - a.score;
      })
      // Extract just the URLs
      .map(item => item.url);

    const photos = uniqueUrls(rawPhotos).slice(0, 50);
    
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