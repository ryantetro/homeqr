# Quick Start Testing Guide

## Step 1: Load the Test Suite

1. Open any property listing page (Zillow, Realtor.com, etc.)
2. Open Chrome Developer Tools (F12)
3. Go to the **Console** tab
4. Copy and paste the contents of `extension/test-suite.js` into the console
5. Press Enter

## Step 2: Run the Test

In the console, type:
```javascript
testExtraction()
```

This will:
- Test JSON-LD structured data extraction
- Test meta tags
- Test DOM selectors
- Validate all extracted fields
- Display a score and detailed results

## Step 3: Test the Extension

1. Click the HomeQR extension icon in your toolbar
2. Click "Generate QR Code"
3. Check the console for `[HomeQR]` logs
4. Verify the extracted data matches what's on the page

## Step 4: Document Results

Update `extension/TEST_RESULTS.md` with:
- Site name
- Test URL
- What worked
- What didn't work
- Screenshots (if issues found)

## Testing Checklist

For each site, verify:
- [ ] Address extracted correctly
- [ ] Price extracted (if available)
- [ ] Bedrooms extracted (if available)
- [ ] Bathrooms extracted (if available)
- [ ] Square feet extracted (if available)
- [ ] Images extracted (if available)
- [ ] QR code generated successfully

## Common Sites to Test

1. **Zillow** - Should work perfectly (baseline)
2. **Realtor.com** - Test generic extraction
3. **Redfin** - Test generic extraction
4. **Trulia** - Test generic extraction
5. **Homes.com** - Test generic extraction
6. **Local MLS portals** - Test on your local MLS

## Troubleshooting

### Test Suite Not Working
- Make sure you're on a listing page (not search results)
- Check browser console for errors
- Try refreshing the page

### Extension Not Extracting Data
- Check console for `[HomeQR]` logs
- Verify you're signed in to HomeQR
- Check subscription status
- Try a different listing page

### Missing Fields
- Some sites may not have all fields (e.g., "Contact for Price")
- Check if the data is actually on the page
- Review console logs for extraction attempts

