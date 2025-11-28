# URL Extraction Testing

Test scripts for validating the URL-based listing extraction functionality.

## Quick Test

Test a single URL quickly:

```bash
# Using the shell script
./tests/test-extraction-quick.sh https://www.zillow.com/homedetails/...

# Or using curl directly
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.zillow.com/homedetails/..."}'
```

## Comprehensive Test Suite

Test multiple URLs with detailed output:

```bash
# Test individual URLs
node tests/test-extraction.js https://www.zillow.com/homedetails/... https://www.realtor.com/...

# Test from file
node tests/test-extraction.js --file tests/test-urls-example.txt

# Test with custom API URL
API_URL=https://your-production-url.com node tests/test-extraction.js <url>
```

## Test File Format

Create a text file with one URL per line:

```
https://www.zillow.com/homedetails/123-Main-St-City-ST-12345/12345678_zpid/
https://www.realtor.com/realestateandhomes-detail/...
# Comments start with #
```

## What Gets Tested

The test script validates:

- ✅ URL validation
- ✅ Platform detection (Zillow, Realtor.com, etc.)
- ✅ Data extraction (address, price, bedrooms, etc.)
- ✅ Image extraction
- ✅ Error handling
- ✅ Extraction quality score
- ✅ Performance (extraction time)

## Output

The test script provides:

- **Color-coded output** for easy reading
- **Field-by-field breakdown** showing what was extracted
- **Quality score** based on extracted fields
- **Summary statistics** across all tests
- **Platform breakdown** showing success rates per platform

## Prerequisites

1. Make sure your Next.js dev server is running:
   ```bash
   npm run dev
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. For the quick test script, ensure it's executable:
   ```bash
   chmod +x tests/test-extraction-quick.sh
   ```

## Example Output

```
════════════════════════════════════════════════════════════
Testing Extraction: https://www.zillow.com/homedetails/...
════════════════════════════════════════════════════════════

✅ Extraction Successful (2345ms)

────────────────────────────────────────────────────────────
Extracted Data
────────────────────────────────────────────────────────────

  ✓ Address: 123 Main St
  ✓ City: City
  ✓ State: ST
  ✓ ZIP: 12345
  ✓ Price: $523,900
  ✓ Bedrooms: 3
  ✓ Bathrooms: 2.5
  ✓ Square Feet: 2,063
  ✓ Images: 25 image(s)
  ✗ MLS ID: (empty)

────────────────────────────────────────────────────────────
Extraction Summary
────────────────────────────────────────────────────────────

  Extracted Fields: 9
    address, city, state, zip, price, bedrooms, bathrooms, squareFeet, images
  Missing Fields: 1
    mlsId
  Quality Score: 80%
```

## Troubleshooting

**"No response received"**
- Make sure the dev server is running: `npm run dev`
- Check that the API URL is correct (default: http://localhost:3000)

**"Request timed out"**
- The listing page may be slow to load
- Try increasing the timeout in the script (default: 60 seconds)

**"Extraction failed"**
- The URL may not be a valid listing page
- The platform may not be supported
- The page structure may have changed

**"ECONNREFUSED"**
- The server is not running
- Check the API_URL environment variable
