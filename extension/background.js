// Background service worker for HomeQR Chrome Extension

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GENERATE_QR') {
    handleGenerateQR(message.payload)
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        sendResponse(handleError(error, 'QR Generation'));
      });
    return true; // Keep the message channel open for async response
  }
  
  if (message.type === 'STORE_AUTH_TOKEN') {
    // Store auth token
    chrome.storage.sync.set({ authToken: message.token }, () => {
      // Notify popup if it's open
      chrome.runtime.sendMessage({
        type: 'AUTH_TOKEN_STORED',
        token: message.token
      }).catch(() => {
        // Popup might not be open, that's okay
      });
      sendResponse({ success: true });
    });
    return true;
  }
  
  // Handle cache retrieval
  if (message.type === 'GET_CACHED_QR') {
    chrome.storage.local.get(`qr_${message.listingId}`, (result) => {
      const cached = result[`qr_${message.listingId}`];
      if (cached && (Date.now() - cached.cached_at < 24 * 60 * 60 * 1000)) {
        sendResponse({ success: true, data: cached });
      } else {
        sendResponse({ success: false, error: 'No cached QR code found' });
      }
    });
    return true;
  }
});

async function handleGenerateQR(payload) {
  const { 
    listingUrl, address, city, state, zip, price, bedrooms, bathrooms, squareFeet, 
    imageUrl, imageUrls, mlsId, description, propertyType, propertySubtype, yearBuilt,
    lotSize, features, interiorFeatures, exteriorFeatures, parkingSpaces, garageSpaces,
    stories, heating, cooling, flooring, fireplaceCount, hoaFee, taxAssessedValue,
    annualTaxAmount, pricePerSqft, zestimate, daysOnMarket, listingDate
  } = payload;

  // Get site URL and auth token from storage
  const { siteUrl, authToken } = await chrome.storage.sync.get(['siteUrl', 'authToken']);
  const baseUrl = siteUrl || 'https://www.home-qrcode.com';

  try {
    // Try to get token from storage first
    let access_token = authToken;

    // If no token in storage, try to fetch it from API
    if (!access_token) {
      const tokenResponse = await fetch(`${baseUrl}/api/extension/token`, {
        method: 'GET',
        credentials: 'include',
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        access_token = tokenData.access_token;
        // Store it for future use
        if (access_token) {
          chrome.storage.sync.set({ authToken: access_token });
        }
      }
    }

    if (!access_token) {
      throw new Error('Please sign in to HomeQR first. Go to your dashboard at ' + baseUrl + ' and sign in, then refresh this page and try again.');
    }

    // Step 0: Check subscription status before proceeding
    const subscriptionStatusResponse = await fetch(`${baseUrl}/api/subscription/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (subscriptionStatusResponse.ok) {
      const statusData = await subscriptionStatusResponse.json();
      
      // Check if access is denied
      if (!statusData.has_access || statusData.subscription_status === 'past_due' || statusData.trial_limit_reached) {
        let errorMessage = 'Your trial has ended. Open dashboard to upgrade and continue generating QR codes.';
        
        if (statusData.trial_limit_reached && statusData.limit_details) {
          const { feature, current, limit } = statusData.limit_details;
          const featureName = feature === 'listings' ? 'listings' : feature === 'qr_codes' ? 'QR codes' : 'photos';
          errorMessage = `Trial limit reached. You've used ${current}/${limit} ${featureName}. Upgrade to continue.`;
        } else if (statusData.subscription_status === 'past_due') {
          errorMessage = 'Your trial has ended. Open dashboard to upgrade and continue generating QR codes.';
        } else if (!statusData.has_access) {
          errorMessage = 'Subscription required. Open dashboard to start your free trial.';
        }
        
        throw new Error(errorMessage);
      }
    } else {
      // If subscription check fails, log but don't block (graceful degradation)
      console.warn('Failed to check subscription status, proceeding anyway');
    }

    // Step 1: Check if listing already exists (by URL field directly, or by address)
    // Only check if we have a valid listingUrl
    let listingId = null;
    let isNewListing = false;
    
    if (listingUrl) {
      const existingListingsResponse = await fetch(`${baseUrl}/api/listings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (existingListingsResponse.ok) {
        const existingListingsData = await existingListingsResponse.json();
        const existingListings = existingListingsData.data || [];
        
        // Check if a listing with this URL already exists (check url field directly)
        const existingListing = existingListings.find(listing => 
          listing.url === listingUrl || 
          (listing.url && listing.url.trim() === listingUrl.trim())
        );

        // Fallback: check by address+city if URL match fails
        if (!existingListing && address && address !== 'Property Listing') {
          const addressMatch = existingListings.find(listing => 
            listing.address?.toLowerCase() === address?.toLowerCase() && 
            listing.city?.toLowerCase() === city?.toLowerCase()
          );
          
          if (addressMatch) {
            listingId = addressMatch.id;
            console.log('Found existing listing by address:', listingId);
          }
        } else if (existingListing) {
          listingId = existingListing.id;
          console.log('Found existing listing by URL:', listingId);
        }
      }
    }

    // Step 2: Create listing if it doesn't exist
    if (!listingId) {
      // Don't create if we don't have at least an address
      if (!address || address === 'Property Listing') {
        throw new Error('Could not extract property address from this page. Please make sure you are on a valid property listing page.');
      }

      const listingResponse = await fetch(`${baseUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          address: address,
          city: city || null,
          state: state || null,
          zip: zip || null,
          price: price ? parseFloat(String(price).replace(/[^0-9.]/g, '')) : null,
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
          bathrooms: bathrooms ? parseFloat(bathrooms) : null,
          square_feet: squareFeet ? parseInt(String(squareFeet).replace(/[^0-9]/g, '')) : null,
          mls_id: mlsId || null,
          image_url: imageUrl || null,
          image_urls: imageUrls && imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
          url: listingUrl || null,
          description: description || `Property listing from ${listingUrl}`,
          // Additional property details
          property_type: propertyType || null,
          property_subtype: propertySubtype || null,
          year_built: yearBuilt ? parseInt(String(yearBuilt).replace(/[^0-9]/g, '')) : null,
          lot_size: lotSize || null,
          features: features && Array.isArray(features) ? JSON.stringify(features) : null,
          interior_features: interiorFeatures && Array.isArray(interiorFeatures) ? JSON.stringify(interiorFeatures) : null,
          exterior_features: exteriorFeatures && Array.isArray(exteriorFeatures) ? JSON.stringify(exteriorFeatures) : null,
          parking_spaces: parkingSpaces ? parseInt(String(parkingSpaces).replace(/[^0-9]/g, '')) : null,
          garage_spaces: garageSpaces ? parseInt(String(garageSpaces).replace(/[^0-9]/g, '')) : null,
          stories: stories ? parseInt(String(stories).replace(/[^0-9]/g, '')) : null,
          heating: heating || null,
          cooling: cooling || null,
          flooring: flooring || null,
          fireplace_count: fireplaceCount ? parseInt(String(fireplaceCount).replace(/[^0-9]/g, '')) : null,
          hoa_fee: hoaFee ? parseFloat(String(hoaFee).replace(/[^0-9.]/g, '')) : null,
          tax_assessed_value: taxAssessedValue ? parseFloat(String(taxAssessedValue).replace(/[^0-9.]/g, '')) : null,
          annual_tax_amount: annualTaxAmount ? parseFloat(String(annualTaxAmount).replace(/[^0-9.]/g, '')) : null,
          price_per_sqft: pricePerSqft ? parseFloat(String(pricePerSqft).replace(/[^0-9.]/g, '')) : null,
          zestimate: zestimate ? parseFloat(String(zestimate).replace(/[^0-9.]/g, '')) : null,
          days_on_market: daysOnMarket ? parseInt(String(daysOnMarket).replace(/[^0-9]/g, '')) : null,
          listing_date: listingDate || null,
        }),
      });

      if (!listingResponse.ok) {
        const error = await listingResponse.json();
        throw new Error(error.error || 'Failed to create listing');
      }

      const listingData = await listingResponse.json();
      listingId = listingData.data.id;
      isNewListing = true;
    }

    // Step 3: Get or generate QR code for the listing
    // The QR endpoint will return existing QR code if it exists (from auto-generation)
    // or create a new one if it doesn't
    const qrResponse = await fetch(`${baseUrl}/api/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        listing_id: listingId,
      }),
    });

    if (!qrResponse.ok) {
      const error = await qrResponse.json();
      throw new Error(error.error || 'Failed to get/generate QR code');
    }

    const qrData = await qrResponse.json();
    
    // Ensure listing_id is always included
    qrData.listing_id = listingId;
    
    // Add listing status info
    qrData.listingMessage = isNewListing 
      ? 'New listing created with auto-generated QR code.' 
      : 'Using existing listing.';
    qrData.isNewListing = isNewListing;
    
    // If this is a new listing, the QR code was auto-generated by the listings API
    // (even though the QR API will return isExisting: true because it finds the auto-generated QR)
    if (isNewListing) {
      qrData.wasAutoGenerated = true;
    }
    
    // Cache QR code data for offline access
    try {
      const cacheKey = `qr_${listingId}`;
      await chrome.storage.local.set({
        [cacheKey]: {
          qr_url: qrData.qr_url,
          listing_id: listingId,
          scan_count: qrData.scan_count,
          cached_at: Date.now(),
        }
      });
    } catch (cacheError) {
      console.log('Failed to cache QR code:', cacheError);
    }
    
    return qrData;
  } catch (error) {
    console.error('QR generation error:', error);
    throw error;
  }
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('HomeQR extension installed');
  
  // Set default site URL if not already set
  chrome.storage.sync.get(['siteUrl'], (data) => {
    if (!data.siteUrl) {
      chrome.storage.sync.set({ siteUrl: 'https://www.home-qrcode.com' });
    }
  });
});

// Improved error handling wrapper
function handleError(error, context) {
  const errorMessage = error.message || 'An unexpected error occurred';
  console.error(`[HomeQR ${context}]`, error);
  
  // Return user-friendly error message
  return {
    success: false,
    error: errorMessage.includes('Unauthorized') 
      ? 'Please sign in to HomeQR. Visit your dashboard and sign in, then try again.'
      : errorMessage.includes('Failed to fetch')
      ? 'Unable to connect to HomeQR server. Please check your internet connection.'
      : errorMessage,
  };
}


