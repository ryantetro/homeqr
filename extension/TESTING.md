# HomeQR Extension - Manual Testing Guide

This guide helps you manually test the HomeQR Chrome extension on different MLS listing sites to ensure it works correctly across various platforms.

**Note**: The extension automatically attempts to extract listing data from any MLS listing site. If automatic extraction fails, you can manually enter the listing details using the manual form.

## Prerequisites

1. Install the extension in Chrome (Developer mode)
2. Sign in to your HomeQR account
3. Have an active subscription or trial

## Testing Process

### Step 1: Navigate to a Listing Page

1. Open a property listing page on the site you're testing
2. Ensure the page is fully loaded
3. Look for the property address, price, and images on the page

### Step 2: Open Extension Popup

1. Click the HomeQR extension icon in your Chrome toolbar
2. The popup should open showing the "Generate" tab

### Step 3: Check Data Extraction

The extension should automatically extract:
- **Address** (required)
- **Price** (if available)
- **Bedrooms** (if available)
- **Bathrooms** (if available)
- **Square Feet** (if available)
- **Images** (if available)
- **Property Details** (if available)

### Step 4: Generate QR Code

1. Click "Generate QR Code" button
2. Wait for the QR code to appear
3. Verify the listing was created correctly in your dashboard

## What to Check

### Required Fields (Must Work)

- [ ] **Address**: Should be extracted correctly (street address, city, state, zip)
- [ ] **URL**: Should capture the listing page URL

### Important Fields (Should Work)

- [ ] **Price**: Should extract listing price correctly
- [ ] **Images**: Should extract at least one property image
- [ ] **Bedrooms**: Should extract number of bedrooms
- [ ] **Bathrooms**: Should extract number of bathrooms

### Optional Fields (Nice to Have)

- [ ] **Square Feet**: Should extract property size
- [ ] **Property Type**: Should extract property type (house, condo, etc.)
- [ ] **MLS ID**: Should extract MLS number if available
- [ ] **Description**: Should extract property description

## Testing Checklist by Site

### Zillow

- [ ] Address extraction works
- [ ] Price extraction works
- [ ] Bedrooms/bathrooms extraction works
- [ ] Square feet extraction works
- [ ] Multiple images extracted
- [ ] QR code generation works

**Expected**: Should work perfectly (uses JSON cache extraction)

### Realtor.com

- [ ] Address extraction works
- [ ] Price extraction works
- [ ] Bedrooms/bathrooms extraction works
- [ ] Images extracted
- [ ] QR code generation works

**Expected**: Should work with generic DOM extraction

### Redfin

- [ ] Address extraction works
- [ ] Price extraction works
- [ ] Bedrooms/bathrooms extraction works
- [ ] Images extracted
- [ ] QR code generation works

**Expected**: Should work with generic DOM extraction

### Other Sites

Test on any other MLS listing sites you encounter:
- [ ] Address extraction works
- [ ] Price extraction works (if available)
- [ ] Images extracted (if available)
- [ ] QR code generation works

## How to Report Issues

### If Extraction Fails

1. **Take a screenshot** of the listing page
2. **Open browser console** (F12) and check for errors
3. **Copy console logs** that start with `[HomeQR]`
4. **Note what data is missing** (address, price, images, etc.)
5. **Report the issue** with:
   - Site name
   - Listing URL
   - What failed
   - Console logs
   - Screenshot

### If QR Generation Fails

1. **Check subscription status** - ensure you have active access
2. **Check console logs** for API errors
3. **Verify you're signed in** to HomeQR
4. **Report the issue** with:
   - Error message
   - Console logs
   - Subscription status

## Console Logging

The extension logs detailed information to the browser console. To view:

1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for logs starting with `[HomeQR]`

### Key Log Messages

- `[HomeQR] GET_LISTING_INFO received` - Extension started extraction
- `[HomeQR] ✅ Using JSON cache data` - Using Zillow-specific extraction
- `[HomeQR] Using generic DOM fallback` - Using generic extraction
- `[HomeQR] Extraction SUCCESS` - Extraction completed successfully
- `[HomeQR] Extraction FAILED` - Extraction failed

## Testing Tips

1. **Test on multiple listings** from the same site to ensure consistency
2. **Test on different property types** (houses, condos, land, etc.)
3. **Test on listings with missing data** (no price, no images, etc.)
4. **Test on mobile-responsive sites** to ensure extraction works
5. **Clear extension cache** if you encounter issues (chrome://extensions → HomeQR → Details → Clear storage)

## Success Criteria

A site is considered "working" if:
- ✅ Address is extracted correctly (90%+ accuracy)
- ✅ Price is extracted (if available on page)
- ✅ At least one image is extracted (if available on page)
- ✅ QR code can be generated successfully
- ✅ Listing appears correctly in dashboard

## Notes

- Some sites may not have all fields (e.g., no price for "Contact for Price" listings)
- Image extraction may vary significantly between sites
- Generic extraction relies on common patterns and may not work perfectly on all sites
- Site-specific extractors can be added if generic extraction fails

