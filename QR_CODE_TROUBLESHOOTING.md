# QR Code Scan Tracking Troubleshooting

## Issue: QR Code Scans Not Being Tracked

If QR code scans aren't being tracked, here are the most common causes and solutions:

### 1. Old QR Codes Pointing to Wrong URL

**Problem:** QR codes generated before the route update might point to `/api/scan/[id]` instead of `/api/scan/qr/[id]`.

**Solution:** Regenerate all QR codes:
- Go to each listing in the dashboard
- Click "Regenerate QR Code" button
- This will update the QR code to use the correct scan endpoint

### 2. Check Server Logs

When you scan a QR code, you should see logs like:
```
[QR Scan] ===== SCAN DETECTED =====
[QR Scan] Listing ID: <listing-id>
[QR Scan] URL: <scan-url>
[QR Scan] Listing found: <listing-id> slug: <slug>
[QR Scan] Created new scan session for listing: <listing-id>
[QR Scan] Updated analytics: X scans, Y unique visitors
[QR Scan] ===== SCAN TRACKING COMPLETE =====
```

If you don't see these logs, the scan endpoint isn't being hit.

### 3. Verify QR Code URL

To check what URL your QR code is encoding:
1. Scan the QR code with a QR reader app
2. Check the URL it points to
3. It should be: `https://yourdomain.com/api/scan/qr/<listing-id>`

If it's pointing to:
- `/api/scan/[id]` - This is the old route (still works but should be updated)
- `/listing/[id]` - This bypasses tracking entirely (needs regeneration)
- Direct to microsite - This bypasses tracking (needs regeneration)

### 4. Environment Variable Check

Make sure `NEXT_PUBLIC_SITE_URL` is set correctly in your `.env.local`:
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # for development
# or
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # for production
```

### 5. Database Check

Verify that:
- The `scan_sessions` table exists
- The `analytics` table exists
- RLS policies allow public inserts for scan tracking

### 6. Test Scan Flow

1. Generate a new QR code for a test listing
2. Scan it with your phone
3. Check server logs for tracking messages
4. Check the dashboard analytics page for the scan count
5. Verify the `scan_sessions` table in Supabase has a new record

### 7. Common Issues

**Issue:** QR code points directly to listing page
- **Fix:** Regenerate QR code - it should point to `/api/scan/qr/[id]` first

**Issue:** No logs appear when scanning
- **Fix:** Check that the route file exists at `src/app/api/scan/qr/[id]/route.ts`
- **Fix:** Restart the Next.js dev server

**Issue:** Scans tracked but not showing in dashboard
- **Fix:** Check that analytics aggregation is working
- **Fix:** Verify the date range in analytics queries

### 8. Regenerate All QR Codes

If you have many old QR codes, you can regenerate them all:

1. Go to `/dashboard/listings`
2. For each listing, click "Regenerate QR Code"
3. Or use the API to regenerate programmatically

### 9. Debug Mode

The scan route now includes extensive logging. Check your server console when scanning to see:
- If the route is being hit
- What listing ID is being scanned
- If the scan session is created/updated
- If analytics are updated
- Any errors that occur

If you see errors in the logs, they will help identify the specific issue.

