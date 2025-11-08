// HomeQR Chrome Extension - Premium Popup Script

let currentListing = null;
let siteUrl = 'http://localhost:3000';
let authToken = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  initializeSettings();
  loadInitialData();
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

// Load initial data
async function loadInitialData() {
  showLoader(true);
  
  try {
    // Get storage data
    const data = await chrome.storage.sync.get(['authToken', 'siteUrl']);
    siteUrl = data.siteUrl || 'http://localhost:3000';
    authToken = data.authToken;

    // Update settings
    updateSettingsDisplay();

    // Load generate tab
    if (authToken) {
      loadGenerateTab();
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

// Generate Tab
async function loadGenerateTab() {
  const generateContent = document.getElementById('generateContent');

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

    // Check if we're on a supported site
    const supportedSites = ['zillow.com', 'realtor.com', 'sondergrouputah.com'];
    const isSupportedSite = supportedSites.some(site => tab.url?.includes(site));

    // Try to get listing info from content script (only works on supported sites)
    if (isSupportedSite) {
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
            if (chrome.runtime.lastError) {
              // Content script might not be ready, try again
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, { type: 'GET_LISTING_INFO' }, (response) => {
                  handleListingResponse(response, tab.url);
                });
              }, 500);
              return;
            }
            handleListingResponse(response, tab.url);
          });
        }, 100);
      });
    } else {
      // Not a supported site - show manual form
      showManualForm(tab.url);
    }
  } catch (error) {
    console.error('Error loading generate tab:', error);
    generateContent.innerHTML = `
      <div class="status-message status-error">
        <span>Error loading listing information. Please try again.</span>
      </div>
    `;
  }
}

function handleListingResponse(response, url) {
  const generateContent = document.getElementById('generateContent');
  
  if (!response || !response.url) {
    // Content script didn't respond or no data - show manual form
    showManualForm(url);
    return;
  }

  // Check if we got useful data
  if (response.address || response.title) {
    currentListing = response;
    displayListingInfo(response);
  } else {
    // No useful data extracted - show manual form with URL pre-filled
    showManualForm(url, response);
  }
}

function displayListingInfo(listing) {
  const generateContent = document.getElementById('generateContent');
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
      },
    },
    (response) => {
      showLoader(false);

      if (chrome.runtime.lastError) {
        showToast('Failed to generate QR code: ' + chrome.runtime.lastError.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Generate QR Code';
        return;
      }

      if (response.success && response.data) {
        displayQR(response.data);
        btn.innerHTML = '✓ QR Code Generated';
        btn.disabled = true;

        // Show success toast
        const message = response.data.isExisting && !response.data.isNewListing
          ? 'Using existing QR code'
          : 'QR code generated successfully!';
        showToast(message, 'success');
      } else {
        showToast(response.error || 'Failed to generate QR code', 'error');
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

  if (qrData.isExisting && qrData.isNewListing === false) {
    statusClass = 'status-warning';
    statusIcon = '⚠️';
    statusMessage = 'DUPLICATE: This listing already exists. Showing existing QR code.';
  } else if (qrData.isNewListing && qrData.wasAutoGenerated) {
    statusMessage = 'Success! New listing created with auto-generated QR code.';
  } else if (qrData.isNewListing && qrData.isExisting === false) {
    statusMessage = 'Success! New listing created and QR code generated.';
  } else if (qrData.isExisting) {
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
}

function updateSettingsDisplay() {
  // Update site URL
  document.getElementById('siteUrlDisplay').textContent = siteUrl;

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
      <a href="${siteUrl}/auth/login" target="_blank" class="btn btn-primary" style="text-decoration: none;">
        Sign In
      </a>
    </div>
  `;
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
