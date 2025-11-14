# How to Run Tests

## Method 1: Using the Test Suite (Recommended)

### Step 1: Open a Listing Page
Navigate to any property listing page on:
- Zillow
- Realtor.com
- Redfin
- Trulia
- Homes.com
- Or any MLS portal

### Step 2: Open Browser Console
1. Press `F12` (or `Cmd+Option+I` on Mac)
2. Click the **Console** tab

### Step 3: Load Test Suite
Copy the entire contents of `extension/test-suite.js` and paste it into the console, then press Enter.

### Step 4: Run Test
Type this in the console:
```javascript
testExtraction()
```

### Step 5: Review Results
The test will display:
- ✅/❌ for each field (address, price, bedrooms, etc.)
- A score out of 100
- Detailed extraction information
- Results copied to clipboard (if available)

## Method 2: Test Extension Directly

### Step 1: Open Listing Page
Navigate to any property listing page

### Step 2: Open Extension
1. Click the HomeQR extension icon in your Chrome toolbar
2. The popup should show the "Generate" tab

### Step 3: Check Console Logs
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for logs starting with `[HomeQR]`

### Step 4: Generate QR Code
1. Click "Generate QR Code" in the extension popup
2. Watch the console for extraction logs
3. Verify the QR code appears

### Step 5: Verify Data
Check that the extracted data matches what's on the page:
- Address
- Price
- Bedrooms/Bathrooms
- Square Feet
- Images

## Method 3: Automated Testing (Advanced)

For automated testing across multiple sites, you can create a script that:
1. Opens each test URL
2. Runs the test suite
3. Collects results
4. Generates a report

Example:
```javascript
const testSites = [
  'https://www.zillow.com/homedetails/...',
  'https://www.realtor.com/realestateandhomes-detail/...',
  // ... more URLs
];

async function runAllTests() {
  const results = [];
  for (const url of testSites) {
    // Open URL in new tab
    // Wait for page load
    // Run testExtraction()
    // Collect results
  }
  return results;
}
```

## What to Look For

### Success Indicators
- ✅ Address extracted correctly
- ✅ Price extracted (if on page)
- ✅ Property details extracted
- ✅ Images extracted
- ✅ QR code generated successfully

### Failure Indicators
- ❌ No address found
- ❌ Price not extracted (even if on page)
- ❌ Missing property details
- ❌ No images extracted
- ❌ QR generation fails

### Console Logs to Check

**Good logs:**
```
[HomeQR] GET_LISTING_INFO received
[HomeQR] ✅ Using JSON cache data
[HomeQR] Extraction SUCCESS
```

**Warning logs:**
```
[HomeQR] ⚠️ JSON extraction failed, falling back to DOM
[HomeQR] Using generic DOM fallback
```

**Error logs:**
```
[HomeQR] ❌ DOM extraction failed
[HomeQR] Extraction FAILED
```

## Troubleshooting

### Test Suite Not Loading
- Make sure you're on a listing page (not search results)
- Check that the console doesn't show errors
- Try refreshing the page

### Extension Not Working
- Verify you're signed in to HomeQR
- Check subscription status
- Look for errors in console
- Try a different listing page

### Missing Data
- Check if the data is actually on the page
- Review console logs for extraction attempts
- Some sites may not have all fields
- Try the generic extraction fallback

## Recording Results

After testing, update `extension/TEST_RESULTS.md` with:
1. Site name
2. Test URL
3. Date tested
4. What worked ✅
5. What didn't work ❌
6. Console logs (if issues)
7. Screenshots (if issues)

## Next Steps

1. Test on 5-10 different sites
2. Document all results
3. Identify patterns in failures
4. Improve extraction based on findings
5. Re-test after improvements

