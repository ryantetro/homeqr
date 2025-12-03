# Development Testing Guide

## Quick Setup for Local Development

### Step 1: Start Your Local Server

```bash
npm run dev
```

Your app should be running at `http://localhost:3000`

### Step 2: Switch Extension to Development Mode

1. **Open the extension popup**
   - Click the HomeQR extension icon in Chrome toolbar

2. **Go to Settings tab**
   - Click the "Settings" tab in the extension popup

3. **Click "Use Development (localhost:3000)" button**
   - This switches the extension to use your local development server
   - You'll see a success toast message
   - The Site URL will show `http://localhost:3000 (Development)` in green

### Step 3: Test Authentication Detection

1. **Open extension popup** (should show "Sign In" if not authenticated)
2. **Click "Sign In" button**
   - This will open `http://localhost:3000/auth/login` in a new tab
3. **Sign in on your local server**
4. **Return to the extension popup**
   - The popup should automatically detect you're signed in
   - No need to close/reopen the popup!

### Step 4: Test QR Code Generation

1. Navigate to a property listing (Zillow, Realtor.com, etc.)
2. Open the extension popup
3. Click "Generate QR Code"
4. The extension will create a listing on your local server at `localhost:3000`

## Switching Back to Production

1. Open extension popup → Settings tab
2. Click "Use Production" button
3. Extension will now use `https://www.home-qrcode.com`

## Visual Indicators

- **Development Mode**: Site URL shows in green with "(Development)" label
- **Production Mode**: Site URL shows in gray with "(Production)" label
- Active mode button is highlighted (primary color)

## Troubleshooting

### Extension Still Points to Production

- Make sure you clicked the "Use Development" button
- Check the Settings tab - Site URL should show `http://localhost:3000`
- Try reloading the extension: `chrome://extensions/` → Click reload icon

### Authentication Not Detected

- Make sure you're signed in on `localhost:3000`
- Check browser console for errors
- Try clicking "Check Sign-In Status" button in the popup
- Verify `dashboard-content.js` is running (check console on dashboard page)

### Can't Connect to Localhost

- Verify your dev server is running on port 3000
- Check that `http://localhost:3000` is accessible in your browser
- Make sure the extension has permission for `http://localhost:3000/*` (it should, it's in manifest.json)

## Testing Authentication Detection

After switching to development mode, you can test the auth detection:

1. **Storage Listener Test:**
   ```javascript
   // In extension popup console
   chrome.storage.sync.set({authToken: 'test_token'})
   // Popup should automatically refresh
   ```

2. **Manual Refresh Test:**
   - Open popup (not signed in)
   - Click "Sign In" → Sign in on localhost
   - Click "Check Sign-In Status" button
   - Should detect authentication

3. **Focus Refresh Test:**
   - Open popup (not signed in)
   - Click "Sign In" → Sign in on localhost
   - Switch back to extension popup window
   - Should automatically detect authentication

## Notes

- The extension remembers your environment choice (stored in `chrome.storage.sync`)
- Switching environments will reload the extension data
- Make sure your local server is running before switching to development mode
- The extension will use the selected environment for all API calls

