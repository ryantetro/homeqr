# HomeQR Chrome Extension - Testing Guide

## How to Load and Test the Extension

### Step 1: Start Your Next.js Development Server

Make sure your Next.js app is running:

```bash
npm run dev
```

The app should be running at `http://localhost:3000`

### Step 2: Sign In to HomeQR

1. Open your browser and go to `http://localhost:3000`
2. Sign in to your HomeQR account (or create an account if you don't have one)
3. Make sure you're logged in and can access the dashboard

### Step 3: Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Navigate to the `extension/` folder in your project directory
5. Select the folder and click **Select Folder**

The extension should now appear in your extensions list.

### Step 4: Pin the Extension

1. Click the puzzle piece icon (🧩) in Chrome's toolbar
2. Find "HomeQR — Smart QR Codes for Realtors"
3. Click the pin icon to pin it to your toolbar

### Step 5: Test the Extension

1. **Navigate to a listing page:**
   - Go to a property listing on:
     - Zillow (e.g., `https://www.zillow.com/homedetails/...`)
     - Realtor.com (e.g., `https://www.realtor.com/realestateandhomes/...`)
     - Sonder Group (e.g., `https://sondergrouputah.com/...`)

2. **Open the extension:**
   - Click the HomeQR extension icon in your toolbar
   - The popup should show:
     - Property address (if detected)
     - Property URL
     - A "Generate QR Code" button

3. **Generate a QR code:**
   - Click "Generate QR Code"
   - The extension will:
     1. Create a listing in your HomeQR dashboard
     2. Generate a QR code for that listing
   - You should see the QR code image appear
   - Click "Download QR Code" to save it

### Step 6: Verify in Dashboard

1. Go to `http://localhost:3000/dashboard/listings`
2. You should see the new listing that was created by the extension
3. Click on the listing to view its details and QR code

## Troubleshooting

### Extension shows "Not a valid listing page"
- Make sure you're on a supported site (Zillow, Realtor.com, or Sonder Group)
- The content script may not have loaded. Try refreshing the page

### "Please sign in to HomeQR first" error
- Make sure you're signed in at `http://localhost:3000`
- Try refreshing the extension (reload it in `chrome://extensions/`)
- The extension needs to access your session cookies

### QR code generation fails
- Check the browser console (F12) for errors
- Check the extension's background script console:
  1. Go to `chrome://extensions/`
  2. Find HomeQR extension
  3. Click "Inspect views: background page"
  4. Check for errors in the console

### Extension not detecting listing info
- The page selectors may have changed
- Check `extension/content.js` and update selectors if needed
- You can test selectors in the browser console on the listing page

## Development Tips

### View Extension Logs

1. **Popup logs:** Right-click the extension popup → Inspect
2. **Background script logs:** `chrome://extensions/` → HomeQR → "Inspect views: background page"
3. **Content script logs:** Open DevTools on the listing page → Console tab

### Update Extension After Changes

1. Make your changes to extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon (🔄) on the HomeQR extension card

### Test on Different Sites

The extension currently supports:
- Zillow (`zillow.com`)
- Realtor.com (`realtor.com`)
- Sonder Group (`sondergrouputah.com`)

To add more sites, update:
1. `manifest.json` → `host_permissions` and `content_scripts.matches`
2. `extension/content.js` → `detectListing()` function

## Production Deployment

When deploying to production:

1. Update `NEXT_PUBLIC_SITE_URL` in your `.env.local` to your production URL
2. Update `manifest.json` → `host_permissions` to include your production domain
3. Test the extension with your production site
4. Package the extension for Chrome Web Store submission


