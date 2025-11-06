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
  const { listingUrl, address, city, state, zip, price, bedrooms, bathrooms, squareFeet, imageUrl, imageUrls, mlsId } = payload;

  // Get site URL and auth token from storage
  const { siteUrl, authToken } = await chrome.storage.sync.get(['siteUrl', 'authToken']);
  const baseUrl = siteUrl || 'http://localhost:3000';

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

    // Step 1: Check if listing already exists (by URL in description or by address)
    const existingListingsResponse = await fetch(`${baseUrl}/api/listings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    let listingId = null;
    let isNewListing = false;
    if (existingListingsResponse.ok) {
      const existingListingsData = await existingListingsResponse.json();
      const existingListings = existingListingsData.data || [];
      
      // Check if a listing with this URL already exists
      const existingListing = existingListings.find(listing => 
        listing.description?.includes(listingUrl) || 
        (listing.address?.toLowerCase() === address?.toLowerCase() && 
         listing.city?.toLowerCase() === city?.toLowerCase())
      );

      if (existingListing) {
        listingId = existingListing.id;
        console.log('Found existing listing:', listingId);
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
          description: `Property listing from ${listingUrl}`,
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

    // Step 3: Generate or get existing QR code for the listing
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
      throw new Error(error.error || 'Failed to generate QR code');
    }

    const qrData = await qrResponse.json();
    
    // Ensure listing_id is always included
    qrData.listing_id = listingId;
    
    // Add listing status info
    qrData.listingMessage = isNewListing ? 'New listing created.' : 'Using existing listing.';
    qrData.isNewListing = isNewListing;
    
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
      chrome.storage.sync.set({ siteUrl: 'http://localhost:3000' });
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


