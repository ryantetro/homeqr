# Gemini AI Integration Testing Guide

## Prerequisites

1. **Environment Variable Setup**
   - Add `GEMINI_API_KEY=AIzaSyDzMnx9HzRbE5WaEvQ-iWdvzeOMpiC8_sw` to your `.env.local` file
   - Restart your development server if it's running

2. **Database Migration**
   - ✅ Migration `add_ai_enhancements.sql` should already be applied
   - Verify the columns exist in Supabase: Go to Table Editor → `listings` table → check for:
     - `ai_description`
     - `ai_key_features`
     - `ai_lifestyle_summary`
     - `ai_social_caption`
     - `ai_enhanced_at`
     - `ai_enhancement_status`

## Testing Steps

### Test 1: Automatic AI Enhancement on Listing Creation

**Goal**: Verify AI enhancement runs automatically when creating a new listing.

1. **Create a new listing via Chrome Extension:**
   - Go to any property listing page (Zillow, Realtor.com, etc.)
   - Click the HomeQR extension icon
   - Click "Generate QR Code"
   - Wait for the listing to be created

2. **Check the logs:**
   - Open your terminal/console where the Next.js server is running
   - Look for: `[AI Enhancement] Successfully enhanced listing {id}`
   - If there's an error, you'll see: `[AI Enhancement] Failed to enhance listing {id}`

3. **Verify in Database:**
   - Go to Supabase Dashboard → Table Editor → `listings`
   - Find your newly created listing
   - Check that:
     - `ai_enhancement_status` = `'completed'` (or `'failed'` if there was an error)
     - `ai_enhanced_at` has a timestamp
     - `ai_description` has text content
     - `ai_key_features` has a JSON array
     - `ai_lifestyle_summary` has text
     - `ai_social_caption` has text

### Test 2: View AI Content on Microsite

**Goal**: Verify AI-enhanced content displays on the public microsite.

1. **Get the listing slug/ID:**
   - From the dashboard, go to Properties → click on your test listing
   - Note the URL: `/dashboard/listings/{id}` or the slug

2. **View the microsite:**
   - Visit: `http://localhost:3000/{slug}` (or your production URL)
   - Or: `http://localhost:3000/listing/{id}`

3. **Verify AI content appears:**
   - ✅ **AI-Enhanced Description** card should be visible (instead of original description)
   - ✅ **Key Features** section with bullet points
   - ✅ **Lifestyle & Neighborhood** section
   - ✅ **Social Media Caption** section with a "Copy" button

4. **Test the copy button:**
   - Click "Copy" on the social media caption
   - Paste it somewhere - should contain the caption text

### Test 3: Dashboard AI Enhancements Display

**Goal**: Verify AI enhancements show in the dashboard with controls.

1. **Go to listing detail page:**
   - Dashboard → Properties → Click on a listing with AI enhancements

2. **Check AI Enhancements section:**
   - Scroll down to find the "AI Enhancements" card
   - Should show:
     - Status badge (green "Enhanced" if completed)
     - Last enhanced timestamp
     - All AI content (description, features, lifestyle, caption)

3. **Test re-enhancement:**
   - Click "Re-enhance with AI" button
   - Should show loading state ("Enhancing...")
   - Page should refresh after completion
   - New content should appear

### Test 4: Manual Re-enhancement API

**Goal**: Test the manual re-enhancement endpoint.

1. **Get a listing ID:**
   - From dashboard, note a listing ID

2. **Call the API:**
   ```bash
   curl -X POST http://localhost:3000/api/listings/enhance \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie" \
     -d '{"listingId": "your-listing-id"}'
   ```

   Or use the browser console:
   ```javascript
   fetch('/api/listings/enhance', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ listingId: 'your-listing-id' })
   }).then(r => r.json()).then(console.log)
   ```

3. **Verify response:**
   - Should return `{ data: {...}, message: "Listing enhanced successfully" }`
   - Check database to see updated AI content

### Test 5: Error Handling & Graceful Degradation

**Goal**: Verify the system handles errors gracefully.

1. **Test with invalid API key:**
   - Temporarily change `GEMINI_API_KEY` to an invalid key in `.env.local`
   - Restart server
   - Create a new listing
   - ✅ Listing should still be created successfully
   - ✅ `ai_enhancement_status` should be `'failed'`
   - ✅ No crash or error in the listing creation flow

2. **Test with missing listing data:**
   - Create a listing with minimal data (just address)
   - ✅ AI enhancement should still attempt to run
   - ✅ Should handle gracefully if prompt is incomplete

3. **Check logs:**
   - Look for error messages in console
   - Should see: `[AI Enhancement] Failed to enhance listing {id}: {error}`

### Test 6: AI Content Quality

**Goal**: Verify AI-generated content is relevant and well-formatted.

1. **Check description:**
   - Should be 2-3 paragraphs
   - Professional and engaging
   - Mentions key property details
   - SEO-friendly

2. **Check key features:**
   - Should be 5-7 bullet points
   - Highlights standout features
   - Relevant to the property

3. **Check lifestyle summary:**
   - Should mention neighborhood/lifestyle
   - Engaging and warm tone
   - Mentions ideal buyer persona

4. **Check social caption:**
   - Should include emojis
   - Under 2200 characters
   - Engaging and shareable

### Test 7: Fallback Behavior

**Goal**: Verify fallback to original description when AI content isn't available.

1. **View a listing without AI enhancements:**
   - Find or create a listing where `ai_enhancement_status` = `'failed'` or `'pending'`
   - Visit the microsite

2. **Verify fallback:**
   - ✅ Original description should display
   - ✅ No AI enhancement sections should appear
   - ✅ Page should load normally

## Quick Test Checklist

- [ ] Environment variable `GEMINI_API_KEY` is set
- [ ] Database migration applied successfully
- [ ] Created a new listing via extension
- [ ] AI enhancement ran automatically (check logs)
- [ ] AI content appears in database
- [ ] AI content displays on microsite (`/{slug}`)
- [ ] AI content displays in dashboard listing detail
- [ ] "Re-enhance with AI" button works
- [ ] Copy button for social caption works
- [ ] Error handling works (invalid API key scenario)
- [ ] Fallback to original description works
- [ ] AI content quality is good (review samples)

## Troubleshooting

### AI Enhancement Not Running

1. **Check environment variable:**
   ```bash
   # In your terminal
   echo $GEMINI_API_KEY
   # Or check .env.local file
   ```

2. **Check server logs:**
   - Look for: `[Gemini] GEMINI_API_KEY not set`
   - Restart server after adding the key

3. **Check database:**
   - Verify `ai_enhancement_status` column exists
   - Check if status is stuck on `'pending'`

### AI Content Not Displaying

1. **Check database:**
   - Verify `ai_description`, `ai_key_features`, etc. have content
   - Check `ai_enhancement_status` = `'completed'`

2. **Check microsite query:**
   - Verify the query includes AI fields (should be automatic with `SELECT *`)

3. **Check browser console:**
   - Look for any JavaScript errors
   - Check network tab for failed requests

### API Errors

1. **Check Gemini API key:**
   - Verify it's valid and has quota remaining
   - Check Google Cloud Console for API status

2. **Check API response:**
   - Look in server logs for Gemini API error messages
   - Verify the request format matches Gemini's requirements

## Expected Results

After successful testing, you should see:

- ✅ New listings automatically get AI-enhanced content
- ✅ AI content displays beautifully on microsites
- ✅ Dashboard shows AI enhancements with re-enhancement option
- ✅ System handles errors gracefully
- ✅ Original content is preserved as fallback

## Next Steps After Testing

1. **Monitor AI quality:**
   - Review AI-generated content for accuracy
   - Adjust prompts if needed in `src/lib/ai/enhance-listing.ts`

2. **Optimize performance:**
   - Monitor API response times
   - Consider caching if needed

3. **Add analytics:**
   - Track AI enhancement success rate
   - Monitor API usage/costs

