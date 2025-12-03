// HomeQR Chrome Extension - Premium Popup Script

let currentListing = null;
let siteUrl = 'https://www.home-qrcode.com';
let authToken = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  initializeSettings();
  loadInitialData();
  setupAuthListeners();
});

// Tab Navigation
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // Update active tab button
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show/hide tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(targetTab).classList.add('active');

      // Load data for specific tabs
      if (targetTab === 'listings') {
        loadListings();
      }
    });
  });

  // Dashboard link
  document.getElementById('dashboardLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${siteUrl}/dashboard` });
  });
}

// Check if extension is in development mode (unpacked) or production (Chrome Web Store)
function isDevelopmentMode() {
  try {
    const manifest = chrome.runtime.getManifest();
    // If update_url exists, it's from Chrome Web Store (production)
    // If not, it's likely an unpacked extension (development)
    return !manifest.update_url;
  } catch {
    // If we can't determine, assume production for safety
    return false;
  }
}

// Load initial data
async function loadInitialData() {
  showLoader(true);
  
  try {
    // Get storage data
    const data = await chrome.storage.sync.get(['authToken', 'siteUrl']);
    const defaultUrl = 'https://www.home-qrcode.com';
    const isDev = isDevelopmentMode();
    
    // In production, always use production URL (ignore any stored localhost)
    if (!isDev) {
      if (data.siteUrl && data.siteUrl.includes('localhost')) {
        // Clear any localhost URL from storage
        siteUrl = defaultUrl;
        chrome.storage.sync.set({ siteUrl: defaultUrl });
      } else {
        siteUrl = data.siteUrl || defaultUrl;
      }
    } else {
      // In development, allow localhost
      siteUrl = data.siteUrl || defaultUrl;
    }
    
    const previousAuthToken = authToken;
    authToken = data.authToken;

    // Update settings
    updateSettingsDisplay();

    // Load generate tab
    if (authToken) {
      // If we just got a token (wasn't there before), show success message
      if (!previousAuthToken && authToken) {
        showToast('Successfully signed in!', 'success');
      }
      await loadGenerateTab();
      // Load usage stats after generate tab loads
      setTimeout(() => loadUsageStats(), 500);
    } else {
      showAuthPrompt();
    }
  } catch (error) {
    console.error('Error loading initial data:', error);
    showToast('Error loading extension data', 'error');
  } finally {
    showLoader(false);
  }
}

// Setup listeners for auth token changes
function setupAuthListeners() {
  // Listen for storage changes (when token is stored by dashboard-content.js)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.authToken) {
      const newToken = changes.authToken.newValue;
      const oldToken = changes.authToken.oldValue;
      
      // Only refresh if token actually changed
      if (newToken !== oldToken) {
        console.log('Auth token changed, refreshing popup...');
        loadInitialData();
      }
    }
  });

  // Listen for messages from background script when token is stored
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUTH_TOKEN_STORED') {
      console.log('Auth token stored message received, refreshing popup...');
      loadInitialData().then(() => {
        sendResponse({ success: true });
      }).catch(() => {
        sendResponse({ success: true }); // Still respond even if there's an error
      });
      return true; // Keep message channel open for async response
    }
    return false;
  });

  // Listen for window focus (when user returns from sign-in tab)
  window.addEventListener('focus', () => {
    // Check if we have a token now
    chrome.storage.sync.get(['authToken'], (data) => {
      const hasToken = !!data.authToken;
      const currentlyHasToken = !!authToken;
      
      // If we didn't have a token before but do now, refresh
      if (!currentlyHasToken && hasToken) {
        console.log('Token detected on focus, refreshing popup...');
        loadInitialData();
      }
    });
  });
}

// Generate Tab
async function loadGenerateTab() {
  const generateContent = document.getElementById('generateContent');
  
  // Clear any previous listing data to prevent stale data from showing
  currentListing = null;

  try {
    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab) {
      generateContent.innerHTML = `
        <div class="status-message status-info">
          <span>Unable to access current tab. Please refresh and try again.</span>
        </div>
      `;
      return;
    }

    // Check if user is on the HomeQR dashboard/home page
    const tabUrl = tab.url || '';
    const siteUrlClean = siteUrl.replace('https://', '').replace('http://', '').replace('www.', '');
    const isDashboardPage = tabUrl.includes('/dashboard') || 
                            tabUrl.includes('/properties') ||
                            tabUrl.includes('/leads') ||
                            tabUrl.includes('/analytics') ||
                            tabUrl.includes('/settings') ||
                            tabUrl.includes('/auth/') ||
                            (tabUrl.includes(siteUrlClean) && 
                             !tabUrl.includes('/listings/') && 
                             !tabUrl.match(/\/[a-z0-9-]{10,}$/)); // Not a property slug page (slugs are usually long)
    
    if (isDashboardPage) {
      showDashboardHelpMessage();
      return;
    }

    // Always try automatic extraction first
    // The content script's fallbackDOM() works on any MLS site
    // First, try to inject the content script if it's not already there
    // This ensures it runs even if the page was loaded before the extension
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }).catch(() => {
      // Script might already be injected, that's okay
    }).then(() => {
      // Wait a moment for script to initialize, then request data
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, { type: 'GET_LISTING_INFO' }, (response) => {
          // Check for runtime errors
          if (chrome.runtime.lastError) {
            // Suppress the error message - it's expected if content script isn't ready
            const errorMsg = chrome.runtime.lastError.message;
            if (errorMsg && !errorMsg.includes('Receiving end does not exist')) {
              // Only log unexpected errors
              console.warn('Content script message error:', errorMsg);
            }
            // Content script might not be ready, try again
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { type: 'GET_LISTING_INFO' }, (response) => {
                if (chrome.runtime.lastError) {
                  // Content script not available, show manual form
                  showManualForm(tab.url);
                  return;
                }
                handleListingResponse(response, tab.url);
              });
            }, 500);
            return;
          }
          handleListingResponse(response, tab.url);
        });
      }, 100);
    }).catch((error) => {
      // If extraction fails, show manual form
      console.error('Error attempting automatic extraction:', error);
      showManualForm(tab.url);
    });
  } catch (error) {
    console.error('Error loading generate tab:', error);
    // If automatic extraction fails, show manual form as fallback
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab) {
      showManualForm(tab.url);
    } else {
      generateContent.innerHTML = `
        <div class="status-message status-error">
          <span>Error loading listing information. Please try again.</span>
        </div>
      `;
    }
  }
}

function handleListingResponse(response, url) {
  const generateContent = document.getElementById('generateContent');
  
  if (!response || !response.url) {
    // Content script didn't respond or no data - show manual form
    showManualForm(url);
    return;
  }

  // CRITICAL: Validate that the response URL matches the current tab URL
  // This prevents showing data from a different listing/page
  const responseUrl = response.url || '';
  const currentUrl = url || '';
  
  // Normalize URLs for comparison (remove trailing slashes, fragments, etc.)
  const normalizeUrl = (u) => {
    try {
      const urlObj = new URL(u);
      return urlObj.origin + urlObj.pathname.replace(/\/$/, '');
    } catch {
      return u.replace(/\/$/, '').split('#')[0].split('?')[0];
    }
  };
  
  const normalizedResponseUrl = normalizeUrl(responseUrl);
  const normalizedCurrentUrl = normalizeUrl(currentUrl);
  
  // If URLs don't match, the response is from a different page - don't use it
  if (normalizedResponseUrl !== normalizedCurrentUrl) {
    console.warn('[HomeQR] Response URL mismatch! Response:', normalizedResponseUrl, 'Current:', normalizedCurrentUrl);
    // Use current URL and show manual form with current URL
    showManualForm(currentUrl);
    return;
  }

  // Validate extracted data - check if we got useful listing information
  const hasValidAddress = response.address && 
                          response.address.trim() !== '' && 
                          response.address !== 'Property Listing';
  
  const hasUsefulData = hasValidAddress || 
                        (response.title && response.title.trim() !== '');
  
  // Check if extraction likely failed (only URL/title, no property details)
  const hasPropertyDetails = response.price || 
                             response.bedrooms || 
                             response.bathrooms || 
                             response.squareFeet || 
                             (response.imageUrls && response.imageUrls.length > 0);
  
  if (hasValidAddress || (hasUsefulData && hasPropertyDetails)) {
    // Ensure response URL matches current tab URL (use current URL as source of truth)
    const validatedResponse = {
      ...response,
      url: currentUrl // Always use the current tab URL, not the response URL
    };
    
    // We have valid extracted data - use it
    currentListing = validatedResponse;
    displayListingInfo(validatedResponse);
  } else {
    // Extraction failed or returned incomplete data - show manual form with any extracted data pre-filled
    showManualForm(url, response);
  }
}

function displayListingInfo(listing) {
  const generateContent = document.getElementById('generateContent');
  
  // Hide subscription error when displaying listing info (user might have fixed issue)
  hideSubscriptionError();
  
  const displayAddress = listing.address || listing.title || 'Property Listing';
  const locationParts = [];
  if (listing.city) locationParts.push(listing.city);
  if (listing.state) locationParts.push(listing.state);
  const location = locationParts.length > 0 ? locationParts.join(', ') : '';

  // Check if we have auto-extracted data or manual entry
  const hasAutoData = listing.address && listing.address !== 'Property Listing';

  generateContent.innerHTML = `
    ${hasAutoData ? `
      <div class="status-message status-success">
        <span>✓ Automatically detected listing information</span>
      </div>
    ` : `
      <div class="status-message status-info">
        <span>📝 Manual entry mode - Fill in the details below</span>
      </div>
    `}
    <div class="listing-info">
      <div class="listing-address">${escapeHtml(displayAddress) || 'Property Address'}</div>
      ${location ? `<div class="listing-location">${escapeHtml(location)}</div>` : ''}
      ${listing.price ? `<div class="listing-price">${escapeHtml(listing.price)}</div>` : ''}
      <div class="listing-url" style="font-size: 11px; color: #94a3b8; margin-top: 8px;">${escapeHtml(listing.url)}</div>
      <button id="generateBtn" class="btn btn-primary" style="margin-top: 16px;">
        Generate QR Code
      </button>
    </div>
    <div id="qrResult"></div>
  `;

  document.getElementById('generateBtn').addEventListener('click', generateQR);
  
  // Reload usage stats after displaying listing info
  loadUsageStats();
}

function showManualForm(url, extractedData = null) {
  const generateContent = document.getElementById('generateContent');
  
  // Pre-fill with any extracted data
  const address = extractedData?.address || '';
  const city = extractedData?.city || '';
  const state = extractedData?.state || '';
  const zip = extractedData?.zip || '';
  const price = extractedData?.price || '';
  const bedrooms = extractedData?.bedrooms || '';
  const bathrooms = extractedData?.bathrooms || '';
  const squareFeet = extractedData?.squareFeet || '';

  generateContent.innerHTML = `
    <div class="status-message status-info">
      <span>📝 Create listing manually from any website</span>
    </div>
    <div class="listing-info">
      <div style="margin-bottom: 16px;">
        <label class="settings-label" style="margin-bottom: 6px;">Listing URL</label>
        <input 
          type="text" 
          id="manualUrl" 
          value="${escapeHtml(url || '')}" 
          placeholder="https://example.com/listing"
          class="settings-value"
          style="width: 100%; padding: 10px; font-size: 13px;"
        />
      </div>
      
      <div style="margin-bottom: 16px;">
        <label class="settings-label" style="margin-bottom: 6px;">Property Address *</label>
        <input 
          type="text" 
          id="manualAddress" 
          value="${escapeHtml(address)}" 
          placeholder="123 Main St"
          class="settings-value"
          style="width: 100%; padding: 10px; font-size: 13px;"
          required
        />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div>
          <label class="settings-label" style="margin-bottom: 6px;">City</label>
          <input 
            type="text" 
            id="manualCity" 
            value="${escapeHtml(city)}" 
            placeholder="City"
            class="settings-value"
            style="width: 100%; padding: 10px; font-size: 13px;"
          />
        </div>
        <div>
          <label class="settings-label" style="margin-bottom: 6px;">State</label>
          <input 
            type="text" 
            id="manualState" 
            value="${escapeHtml(state)}" 
            placeholder="State"
            class="settings-value"
            style="width: 100%; padding: 10px; font-size: 13px;"
          />
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <label class="settings-label" style="margin-bottom: 6px;">ZIP Code</label>
        <input 
          type="text" 
          id="manualZip" 
          value="${escapeHtml(zip)}" 
          placeholder="12345"
          class="settings-value"
          style="width: 100%; padding: 10px; font-size: 13px;"
        />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div>
          <label class="settings-label" style="margin-bottom: 6px;">Price</label>
          <input 
            type="text" 
            id="manualPrice" 
            value="${escapeHtml(price)}" 
            placeholder="$500,000"
            class="settings-value"
            style="width: 100%; padding: 10px; font-size: 13px;"
          />
        </div>
        <div>
          <label class="settings-label" style="margin-bottom: 6px;">Bedrooms</label>
          <input 
            type="text" 
            id="manualBedrooms" 
            value="${escapeHtml(bedrooms)}" 
            placeholder="3"
            class="settings-value"
            style="width: 100%; padding: 10px; font-size: 13px;"
          />
        </div>
        <div>
          <label class="settings-label" style="margin-bottom: 6px;">Bathrooms</label>
          <input 
            type="text" 
            id="manualBathrooms" 
            value="${escapeHtml(bathrooms)}" 
            placeholder="2"
            class="settings-value"
            style="width: 100%; padding: 10px; font-size: 13px;"
          />
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <label class="settings-label" style="margin-bottom: 6px;">Square Feet</label>
        <input 
          type="text" 
          id="manualSquareFeet" 
          value="${escapeHtml(squareFeet)}" 
          placeholder="2000"
          class="settings-value"
          style="width: 100%; padding: 10px; font-size: 13px;"
        />
      </div>

      <button id="generateManualBtn" class="btn btn-primary">
        Generate QR Code
      </button>
    </div>
    <div id="qrResult"></div>
  `;

  document.getElementById('generateManualBtn').addEventListener('click', () => {
    generateQRFromManualForm();
  });
}

function generateQRFromManualForm() {
  const url = document.getElementById('manualUrl').value.trim();
  const address = document.getElementById('manualAddress').value.trim();

  if (!address) {
    showToast('Please enter a property address', 'error');
    return;
  }

  if (!url) {
    showToast('Please enter a listing URL', 'error');
    return;
  }

  // Build listing object from manual form
  currentListing = {
    url: url,
    address: address,
    city: document.getElementById('manualCity').value.trim(),
    state: document.getElementById('manualState').value.trim(),
    zip: document.getElementById('manualZip').value.trim(),
    price: document.getElementById('manualPrice').value.trim(),
    bedrooms: document.getElementById('manualBedrooms').value.trim(),
    bathrooms: document.getElementById('manualBathrooms').value.trim(),
    squareFeet: document.getElementById('manualSquareFeet').value.trim(),
    imageUrl: null,
    imageUrls: null,
  };

  // Use the existing generateQR function
  generateQR();
}

function generateQR() {
  if (!currentListing) return;

  const btn = document.getElementById('generateBtn');
  const qrResult = document.getElementById('qrResult');

  btn.disabled = true;
  btn.innerHTML = '<span>Generating...</span>';
  qrResult.innerHTML = '';
  showLoader(true);

  chrome.runtime.sendMessage(
    {
      type: 'GENERATE_QR',
      payload: {
        listingUrl: currentListing.url,
        address: currentListing.address || 'Property Listing',
        city: currentListing.city || '',
        state: currentListing.state || '',
        zip: currentListing.zip || '',
        price: currentListing.price || null,
        bedrooms: currentListing.bedrooms || null,
        bathrooms: currentListing.bathrooms || null,
        squareFeet: currentListing.squareFeet || null,
        mlsId: currentListing.mlsId || null,
        imageUrl: currentListing.imageUrl || null,
        imageUrls: currentListing.imageUrls || (currentListing.imageUrl ? [currentListing.imageUrl] : null),
        // Additional property details
        description: currentListing.description || null,
        propertyType: currentListing.propertyType || currentListing.homeType || null,
        propertySubtype: currentListing.propertySubtype || null,
        yearBuilt: currentListing.yearBuilt || null,
        lotSize: currentListing.lotSize || null,
        features: currentListing.features || null,
        interiorFeatures: currentListing.interiorFeatures || null,
        exteriorFeatures: currentListing.exteriorFeatures || null,
        parkingSpaces: currentListing.parkingSpaces || null,
        garageSpaces: currentListing.garageSpaces || null,
        stories: currentListing.stories || null,
        heating: currentListing.heating || null,
        cooling: currentListing.cooling || null,
        flooring: currentListing.flooring || null,
        fireplaceCount: currentListing.fireplaceCount || null,
        hoaFee: currentListing.hoaFee || null,
        taxAssessedValue: currentListing.taxAssessedValue || null,
        annualTaxAmount: currentListing.annualTaxAmount || null,
        pricePerSqft: currentListing.pricePerSqft || null,
        zestimate: currentListing.zestimate || null,
        daysOnMarket: currentListing.daysOnMarket || null,
        listingDate: currentListing.listingDate || null,
      },
    },
    (response) => {
      showLoader(false);

      // Check for runtime errors first
      if (chrome.runtime.lastError) {
        showToast('Failed to generate QR code: ' + chrome.runtime.lastError.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Generate QR Code';
        return;
      }

      // Check if response exists
      if (!response) {
        showToast('No response from extension. Please try again.', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Generate QR Code';
        return;
      }

      if (response.success && response.data) {
        // Hide subscription error on success
        hideSubscriptionError();
        
        displayQR(response.data);
        btn.innerHTML = '✓ QR Code Generated';
        btn.disabled = true;

        // Show success toast - only show "using existing" for duplicate listings
        let message = 'QR code generated successfully!';
        if (response.data.isNewListing === false && response.data.isExisting) {
          message = 'Using existing QR code for duplicate listing';
        } else if (response.data.isNewListing) {
          message = 'QR code generated successfully!';
        }
        showToast(message, 'success');
        
        // Reload usage stats after successful generation
        loadUsageStats();
      } else {
        // Check if error is subscription-related
        const errorMessage = response.error || 'Failed to generate QR code';
        if (errorMessage.includes('trial') || errorMessage.includes('subscription') || errorMessage.includes('upgrade')) {
          showSubscriptionError(errorMessage);
        } else {
          showToast(errorMessage, 'error');
        }
        btn.disabled = false;
        btn.innerHTML = 'Generate QR Code';
      }
    }
  );
}

function displayQR(qrData) {
  const qrResult = document.getElementById('qrResult');

  let statusClass = 'status-success';
  let statusIcon = '✓';
  let statusMessage = 'QR code generated successfully!';

  // Check if this is a duplicate listing (existing listing, not new)
  if (qrData.isNewListing === false && qrData.isExisting) {
    statusClass = 'status-warning';
    statusIcon = '⚠️';
    statusMessage = 'DUPLICATE: This listing already exists. Showing existing QR code.';
  } 
  // Check if this is a new listing (regardless of whether QR was auto-generated)
  else if (qrData.isNewListing) {
    if (qrData.wasAutoGenerated) {
      statusMessage = 'Success! New listing created with auto-generated QR code.';
    } else {
      statusMessage = 'Success! New listing created and QR code generated.';
    }
  } 
  // Only show "Using existing QR code" if it's NOT a new listing AND QR exists
  // This shouldn't happen in normal flow, but handle it just in case
  else if (qrData.isExisting && qrData.isNewListing !== true) {
    statusClass = 'status-info';
    statusIcon = 'ℹ️';
    statusMessage = 'Using existing QR code for this listing.';
  }

  qrResult.innerHTML = `
    <div class="status-message ${statusClass}">
      <span>${statusIcon} ${statusMessage}</span>
    </div>
    <div class="qr-container">
      <img src="${qrData.qr_url}" alt="QR Code" class="qr-image" />
      <a href="#" class="download-link" id="downloadLink">Download QR Code</a>
      <a href="${siteUrl}/dashboard/listings/${qrData.listing_id}" target="_blank" class="dashboard-link-inline">
        View listing in dashboard →
      </a>
    </div>
  `;

  document.getElementById('downloadLink').addEventListener('click', (e) => {
    e.preventDefault();
    const link = document.createElement('a');
    link.href = qrData.qr_url;
    link.download = 'homeqr.png';
    link.click();
    showToast('QR code downloaded', 'success');
  });
}

// My Listings Tab
async function loadListings() {
  const listingsContent = document.getElementById('listingsContent');

  if (!authToken) {
    listingsContent.innerHTML = `
      <div class="status-message status-warning">
        <span>Please sign in to view your listings.</span>
      </div>
      <a href="${siteUrl}/auth/login" target="_blank" class="btn btn-primary mt-2" style="text-decoration: none;">
        Sign In
      </a>
    `;
    return;
  }

  listingsContent.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⏳</div>
      <div class="empty-state-text">Loading your listings...</div>
    </div>
  `;

  showLoader(true);

  try {
    // Note: The API uses cookie-based auth, but we need to pass the token
    // The extension will need to use the token endpoint or we need to make
    // the API accept Bearer tokens for extension requests
    const response = await fetch(`${siteUrl}/api/listings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch listings');
    }

    const data = await response.json();
    const listings = data.data || [];

    if (listings.length === 0) {
      listingsContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏠</div>
          <div class="empty-state-text">No listings yet</div>
          <div style="font-size: 12px; margin-top: 8px;">Generate your first QR code from a listing page!</div>
        </div>
      `;
    } else {
      displayListings(listings);
    }
  } catch (error) {
    console.error('Error loading listings:', error);
    listingsContent.innerHTML = `
      <div class="status-message status-error">
        <span>Error loading listings. Please try again.</span>
      </div>
    `;
    showToast('Failed to load listings', 'error');
  } finally {
    showLoader(false);
  }
}

function displayListings(listings) {
  const listingsContent = document.getElementById('listingsContent');
  const listingsContainer = document.createElement('div');
  listingsContainer.className = 'listings-container';

  listings.forEach(listing => {
    const card = document.createElement('div');
    card.className = 'listing-card';
    
    // Parse images if available
    let qrImage = '';
    try {
      const images = JSON.parse(listing.image_url || '[]');
      if (Array.isArray(images) && images.length > 0) {
        qrImage = images[0];
      } else if (listing.image_url && !listing.image_url.startsWith('[')) {
        qrImage = listing.image_url;
      }
    } catch {
      if (listing.image_url) {
        qrImage = listing.image_url;
      }
    }

    // Get QR code thumbnail
    const qrCode = listing.qrcodes && listing.qrcodes.length > 0 
      ? listing.qrcodes[0] 
      : null;

    const location = [listing.city, listing.state].filter(Boolean).join(', ');

    card.innerHTML = `
      <div class="listing-card-header">
        <div>
          <div class="listing-card-address">${escapeHtml(listing.address)}</div>
          ${location ? `<div class="listing-card-location">${escapeHtml(location)}</div>` : ''}
        </div>
        ${qrCode ? `<img src="${qrCode.qr_url}" alt="QR" class="listing-card-qr" />` : ''}
      </div>
      <div class="listing-card-footer">
        ${listing.price ? `<div class="listing-card-price">$${listing.price.toLocaleString()}</div>` : ''}
        <div class="listing-card-scans">
          📊 ${qrCode ? (qrCode.scan_count || 0) : 0} scans
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      chrome.tabs.create({ url: `${siteUrl}/dashboard/listings/${listing.id}` });
    });

    listingsContainer.appendChild(card);
  });

  listingsContent.innerHTML = '';
  listingsContent.appendChild(listingsContainer);
}

// Settings Tab
function initializeSettings() {
  document.getElementById('openDashboardBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: `${siteUrl}/dashboard` });
  });

  document.getElementById('signInLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${siteUrl}/auth/login` });
  });

  // Check if extension is unpacked (development) or from Chrome Web Store (production)
  // Unpacked extensions don't have an update_url in their manifest
  const isDevelopment = (() => {
    try {
      const manifest = chrome.runtime.getManifest();
      // If update_url exists, it's from Chrome Web Store (production)
      // If not, it's likely an unpacked extension (development)
      return !manifest.update_url;
    } catch {
      // If we can't determine, assume production for safety
      return false;
    }
  })();

  // Only show environment toggle in development
  const environmentSection = document.getElementById('environmentSection');
  if (environmentSection) {
    if (isDevelopment) {
      environmentSection.style.display = 'block';
    } else {
      environmentSection.style.display = 'none';
      // In production, always use production URL and don't allow switching
      siteUrl = 'https://www.home-qrcode.com';
      chrome.storage.sync.set({ siteUrl: siteUrl });
    }
  }

  // Development mode toggle (only available in development)
  const devModeBtn = document.getElementById('devModeBtn');
  const prodModeBtn = document.getElementById('prodModeBtn');
  
  if (devModeBtn && prodModeBtn && isDevelopment) {
    devModeBtn.addEventListener('click', async () => {
      const devUrl = 'http://localhost:3000';
      await chrome.storage.sync.set({ siteUrl: devUrl });
      siteUrl = devUrl;
      updateSettingsDisplay();
      showToast('Switched to development mode (localhost:3000)', 'success');
      // Reload to apply changes
      setTimeout(() => {
        loadInitialData();
      }, 500);
    });

    prodModeBtn.addEventListener('click', async () => {
      const prodUrl = 'https://www.home-qrcode.com';
      await chrome.storage.sync.set({ siteUrl: prodUrl });
      siteUrl = prodUrl;
      updateSettingsDisplay();
      showToast('Switched to production mode', 'success');
      // Reload to apply changes
      setTimeout(() => {
        loadInitialData();
      }, 500);
    });
  }
}

function updateSettingsDisplay() {
  // Update site URL
  const siteUrlDisplay = document.getElementById('siteUrlDisplay');
  if (siteUrlDisplay) {
    const isDev = siteUrl.includes('localhost');
    siteUrlDisplay.textContent = `${siteUrl} ${isDev ? '(Development)' : '(Production)'}`;
    siteUrlDisplay.style.color = isDev ? '#10b981' : '#64748b';
  }

  // Update button states (only in development)
  const devModeBtn = document.getElementById('devModeBtn');
  const prodModeBtn = document.getElementById('prodModeBtn');
  const environmentSection = document.getElementById('environmentSection');
  
  // Only show environment controls in development
  if (environmentSection && environmentSection.style.display === 'none') {
    // In production, don't show environment info
    return;
  }
  
  if (devModeBtn && prodModeBtn) {
    const isDev = siteUrl.includes('localhost');
    if (isDev) {
      devModeBtn.classList.add('btn-primary');
      devModeBtn.classList.remove('btn-secondary');
      prodModeBtn.classList.remove('btn-primary');
      prodModeBtn.classList.add('btn-secondary');
    } else {
      prodModeBtn.classList.add('btn-primary');
      prodModeBtn.classList.remove('btn-secondary');
      devModeBtn.classList.remove('btn-primary');
      devModeBtn.classList.add('btn-secondary');
    }
  }

  // Update extension version from manifest
  const versionDisplay = document.getElementById('extensionVersionDisplay');
  if (versionDisplay) {
    try {
      const manifest = chrome.runtime.getManifest();
      const version = manifest.version || 'Unknown';
      versionDisplay.textContent = version;
    } catch (error) {
      console.error('Error getting extension version:', error);
      versionDisplay.textContent = 'Unknown';
    }
  }

  // Update auth status
  const authStatusDisplay = document.getElementById('authStatusDisplay');
  const signInLink = document.getElementById('signInLink');

  if (authToken) {
    authStatusDisplay.innerHTML = `
      <span class="auth-status authenticated">✓ Authenticated</span>
    `;
    signInLink.style.display = 'none';
  } else {
    authStatusDisplay.innerHTML = `
      <span class="auth-status unauthenticated">Not signed in</span>
    `;
    signInLink.style.display = 'block';
    signInLink.href = `${siteUrl}/auth/login`;
  }
}

function showAuthPrompt() {
  const generateContent = document.getElementById('generateContent');
  generateContent.innerHTML = `
    <div class="status-message status-warning">
      <span><strong>Please sign in first</strong></span>
    </div>
    <div style="margin-top: 16px;">
      <p style="font-size: 14px; color: #64748b; margin-bottom: 12px;">
        Visit your dashboard to sign in to your HomeQR account.
      </p>
      <a href="${siteUrl}/auth/login" target="_blank" class="btn btn-primary" style="text-decoration: none; margin-bottom: 8px; display: inline-block;">
        Sign In
      </a>
      <div style="margin-top: 12px;">
        <button id="refreshAuthBtn" class="btn btn-secondary" style="width: 100%; font-size: 12px; padding: 8px;">
          Check Sign-In Status
        </button>
      </div>
      <p style="font-size: 11px; color: #94a3b8; margin-top: 8px; text-align: center;">
        After signing in, click this button to refresh
      </p>
    </div>
  `;
  
  // Add click handler for refresh button
  const refreshBtn = document.getElementById('refreshAuthBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadInitialData();
    });
  }
}

function showDashboardHelpMessage() {
  const generateContent = document.getElementById('generateContent');
  generateContent.innerHTML = `
    <div style="text-align: center; padding: 24px 16px;">
      <div style="font-size: 48px; margin-bottom: 16px;">🏠</div>
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #1e293b;">
        How to Use HomeQR Extension
      </h3>
      <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px;">
        The HomeQR extension works best when you're viewing a property listing page. Here's how to get started:
      </p>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: left;">
        <div style="display: flex; align-items: start; margin-bottom: 16px;">
          <div style="background: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; margin-right: 12px;">
            1
          </div>
          <div>
            <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">Visit a Property Listing</div>
            <div style="font-size: 13px; color: #64748b;">
              Navigate to a property listing on Zillow, Realtor.com, Redfin, or other MLS sites
            </div>
          </div>
        </div>
        
        <div style="display: flex; align-items: start; margin-bottom: 16px;">
          <div style="background: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; margin-right: 12px;">
            2
          </div>
          <div>
            <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">Open the Extension</div>
            <div style="font-size: 13px; color: #64748b;">
              Click the HomeQR icon in your browser toolbar while on the listing page
            </div>
          </div>
        </div>
        
        <div style="display: flex; align-items: start;">
          <div style="background: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; margin-right: 12px;">
            3
          </div>
          <div>
            <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">Generate QR Code</div>
            <div style="font-size: 13px; color: #64748b;">
              The extension will automatically detect the property details and generate a QR code
            </div>
          </div>
        </div>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 20px;">
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">
          Supported sites: Zillow, Realtor.com, Redfin, Homes.com, Trulia, and more
        </p>
        <button id="viewPropertiesBtn" class="btn btn-primary" style="width: 100%; font-size: 13px; padding: 10px;">
          View My Properties
        </button>
      </div>
    </div>
  `;
  
  // Add click handler for view properties button
  const viewPropertiesBtn = document.getElementById('viewPropertiesBtn');
  if (viewPropertiesBtn) {
    viewPropertiesBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: `${siteUrl}/dashboard/listings` });
    });
  }
}

// Load and display usage stats
async function loadUsageStats() {
  const usageStatsContainer = document.getElementById('usageStats');
  if (!usageStatsContainer || !authToken || !siteUrl) {
    return;
  }

  try {
    // Validate siteUrl before making request
    if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
      usageStatsContainer.style.display = 'none';
      return;
    }

    const response = await fetch(`${siteUrl}/api/subscription/usage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      // Hide usage stats if not available (401, 403, etc.)
      usageStatsContainer.style.display = 'none';
      return;
    }

    const data = await response.json();
    
    // Only show for trialing users
    if (!data.isTrial || !data.usage) {
      usageStatsContainer.style.display = 'none';
      return;
    }

    const { qr_codes, listings, photos } = data.usage;
    
    // Calculate percentages
    const qrPercent = Math.round((qr_codes.current / qr_codes.limit) * 100);
    const listingsPercent = Math.round((listings.current / listings.limit) * 100);
    const photosPercent = Math.round((photos.current / photos.limit) * 100);
    
    // Determine warning level (80%+)
    const qrWarning = qrPercent >= 80;
    const listingsWarning = listingsPercent >= 80;
    const photosWarning = photosPercent >= 80;

    usageStatsContainer.innerHTML = `
      <div class="usage-stats-header" style="font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 8px;">
        Trial Usage
      </div>
      <div class="usage-stat-item" style="margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
          <span style="color: #64748b;">Listings used:</span>
          <span style="font-weight: 600; color: ${listingsWarning ? '#ef4444' : '#475569'};">${listings.current}/${listings.limit}</span>
        </div>
        <div class="usage-progress" style="height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; width: ${listingsPercent}%; background: ${listingsWarning ? '#ef4444' : '#3b82f6'}; transition: width 0.3s;"></div>
        </div>
      </div>
      <div class="usage-stat-item" style="margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
          <span style="color: #64748b;">QR codes generated:</span>
          <span style="font-weight: 600; color: ${qrWarning ? '#ef4444' : '#475569'};">${qr_codes.current}/${qr_codes.limit}</span>
        </div>
        <div class="usage-progress" style="height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; width: ${qrPercent}%; background: ${qrWarning ? '#ef4444' : '#3b82f6'}; transition: width 0.3s;"></div>
        </div>
      </div>
      <div class="usage-stat-item" style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
          <span style="color: #64748b;">Photos uploaded:</span>
          <span style="font-weight: 600; color: ${photosWarning ? '#ef4444' : '#475569'};">${photos.current}/${photos.limit}</span>
        </div>
        <div class="usage-progress" style="height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; width: ${photosPercent}%; background: ${photosWarning ? '#ef4444' : '#3b82f6'}; transition: width 0.3s;"></div>
        </div>
      </div>
    `;
    
    usageStatsContainer.style.display = 'block';
  } catch (error) {
    // Silently fail - usage stats are optional
    // Network errors, CORS issues, or auth issues are handled gracefully
    // Don't log to console to avoid cluttering extension console
    usageStatsContainer.style.display = 'none';
  }
}

// Show subscription error message
function showSubscriptionError(errorMessage) {
  const subscriptionErrorContainer = document.getElementById('subscriptionError');
  const generateContent = document.getElementById('generateContent');
  
  if (!subscriptionErrorContainer) return;

  subscriptionErrorContainer.innerHTML = `
    <div class="subscription-error-content" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
      <div style="display: flex; align-items: start; gap: 8px;">
        <span style="font-size: 18px;">⚠️</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #991b1b; font-size: 13px; margin-bottom: 4px;">
            ${escapeHtml(errorMessage)}
          </div>
          <a href="${siteUrl}/dashboard/billing" target="_blank" class="btn btn-primary" style="text-decoration: none; display: inline-block; margin-top: 8px; padding: 6px 12px; font-size: 12px;">
            Open Dashboard to Upgrade
          </a>
        </div>
      </div>
    </div>
  `;
  
  subscriptionErrorContainer.style.display = 'block';
  
  // Hide generate content when subscription error is shown
  if (generateContent) {
    generateContent.style.opacity = '0.5';
    generateContent.style.pointerEvents = 'none';
  }
}

// Hide subscription error
function hideSubscriptionError() {
  const subscriptionErrorContainer = document.getElementById('subscriptionError');
  const generateContent = document.getElementById('generateContent');
  
  if (subscriptionErrorContainer) {
    subscriptionErrorContainer.style.display = 'none';
  }
  
  if (generateContent) {
    generateContent.style.opacity = '1';
    generateContent.style.pointerEvents = 'auto';
  }
}

// Toast Notification System
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Loading Overlay
function showLoader(show) {
  const loader = document.getElementById('loader');
  if (show) {
    loader.classList.add('show');
  } else {
    loader.classList.remove('show');
  }
}

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
