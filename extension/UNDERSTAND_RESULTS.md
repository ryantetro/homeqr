# Understanding Test Results

## Your Results: 27/36 (75%) on Homes.com

### What the Score Means

**Score Breakdown:**
- **Required Fields** (10 points max): Address
- **Important Fields** (20 points max): Price, Bedrooms, Bathrooms, Images (5 points each)
- **Optional Fields** (6 points max): Square Feet, Property Type, MLS ID (2 points each)

**Your Score: 27/36 = 75%**

This means:
- ✅ Address was found (10 points)
- ✅ Some important fields were found (17 points)
- ✅ Some optional fields were found (0-6 points)

### To See Detailed Breakdown

Run this in the console:

```javascript
const result = await testExtraction();
console.log('\n📊 DETAILED BREAKDOWN:\n');
console.log('Required Fields:', result.validation.required);
console.log('Important Fields:', result.validation.important);
console.log('Optional Fields:', result.validation.optional);
console.log('\nWhat Was Found:');
console.log('JSON-LD:', result.extraction.jsonLd);
console.log('Meta Tags:', result.extraction.metaTags);
console.log('DOM Selectors:', result.extraction.domSelectors);
```

### What Each Field Means

**Required (Must Have):**
- ✅ **Address** - Street address, city, state, zip

**Important (Should Have):**
- ✅ **Price** - Listing price
- ✅ **Bedrooms** - Number of bedrooms
- ✅ **Bathrooms** - Number of bathrooms
- ✅ **Images** - Property photos

**Optional (Nice to Have):**
- ✅ **Square Feet** - Property size
- ✅ **Property Type** - House, condo, etc.
- ✅ **MLS ID** - MLS number

### Score Interpretation

- **90-100%** = Excellent - Almost everything extracted
- **75-89%** = Good - Most important fields extracted
- **50-74%** = Fair - Some fields missing
- **Below 50%** = Poor - Many fields missing

### Your Result: 75% = Good! ✅

This means the extension should work on Homes.com, extracting:
- Address ✅
- Most important fields ✅
- Some optional fields may be missing

### Next Steps

1. **Test the Extension** - Click the HomeQR icon and try generating a QR code
2. **Check Console Logs** - Look for `[HomeQR]` logs to see what was extracted
3. **Test Other Sites** - Try Realtor.com, Redfin, etc.
4. **Document Results** - Update `extension/TEST_RESULTS.md`

### Common Issues

**If score is low (< 50%):**
- Site might not use structured data
- DOM structure might be different
- May need site-specific extractor

**If address is missing:**
- Check if address is actually on the page
- Look for different HTML structure
- May need to improve address extraction

**If images are missing:**
- Check if images are loaded (not lazy-loaded)
- Look for different image gallery structure
- May need to improve image extraction

