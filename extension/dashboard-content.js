// Content script that runs on HomeQR dashboard pages
// Extracts auth token and stores it for the extension

(function() {
  // Only run on HomeQR pages
  if (!window.location.hostname.includes('localhost') && 
      !window.location.hostname.includes('homeqr') &&
      !window.location.hostname.includes('vercel.app')) {
    return;
  }

  // Function to extract token from Supabase session
  async function extractAndStoreToken() {
    try {
      // Access Supabase client if available
      const response = await fetch('/api/extension/token', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.access_token) {
          // Store token in extension storage
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            chrome.runtime.sendMessage({
              type: 'STORE_AUTH_TOKEN',
              token: data.access_token
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.log('Extension not loaded, token will be fetched on demand');
              } else {
                console.log('Auth token stored for extension');
              }
            });
          }
        }
      }
    } catch (error) {
      console.log('Could not extract token:', error);
    }
  }

  // Extract token when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', extractAndStoreToken);
  } else {
    extractAndStoreToken();
  }

  // Also extract token when navigating (for SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(extractAndStoreToken, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
})();

