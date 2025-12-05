# Bot Protection Bypass Implementation

## Overview

HomeQR now uses **Puppeteer** (headless Chrome) to bypass bot protection on sites like Zillow, Realtor.com, and Homes.com. This allows the URL extraction feature to work reliably even when sites block standard HTTP requests.

## How It Works

### 1. **Automatic Detection**
The system automatically detects which sites require browser-based extraction:
- **Zillow.com** - Uses Puppeteer
- **Realtor.com** - Uses Puppeteer  
- **Homes.com** - Uses Puppeteer
- **Other sites** - Use lightweight axios requests

### 2. **Stealth Techniques**
Puppeteer is configured with several anti-detection measures:
- Hides `navigator.webdriver` flag
- Sets realistic browser fingerprints
- Uses proper headers and viewport
- Waits for JavaScript to execute
- Mimics real user behavior

### 3. **Fallback Strategy**
If Puppeteer fails, the system automatically falls back to axios with improved headers.

## Performance

- **Puppeteer extraction**: ~5-20 seconds (slower but more reliable)
- **Axios extraction**: ~0.5-2 seconds (faster but may be blocked)

## Configuration

### Disable Puppeteer (if needed)
Set environment variable:
```bash
DISABLE_PUPPETEER=true
```

This will force all sites to use axios (may result in more bot protection blocks).

## Results

### Before (Axios only)
- ❌ Zillow: Blocked (403/404)
- ❌ Realtor.com: Rate limited (429)
- ❌ Homes.com: Blocked (403)
- ✅ UtahRealEstate: Working

### After (Puppeteer + Axios)
- ✅ Zillow: **Working** (extracts all fields)
- ⚠️ Realtor.com: **Accessible** (parser needs improvement)
- ⚠️ Homes.com: **Accessible** (parser needs improvement)
- ✅ UtahRealEstate: Working

## Technical Details

### Files Modified
- `src/lib/extract/browser.ts` - Puppeteer implementation
- `src/lib/extract/index.ts` - Routing logic

### Dependencies Added
- `puppeteer` - Headless Chrome browser

## Limitations

1. **Slower**: Puppeteer is slower than direct HTTP requests (~5-20s vs ~1s)
2. **Resource intensive**: Requires more memory and CPU
3. **Parser quality**: Some sites (Realtor.com, Homes.com) need parser improvements even though access works

## Best Practices

1. **Use Puppeteer only when needed** - Automatically applied to protected sites
2. **Monitor performance** - Track extraction times
3. **Improve parsers** - Better extraction logic = better results
4. **Respect rate limits** - Don't hammer sites with requests

## Future Enhancements

- [ ] Add proxy rotation for better success rates
- [ ] Implement request queuing to avoid rate limits
- [ ] Cache extracted data to reduce redundant requests
- [ ] Improve Realtor.com and Homes.com parsers






