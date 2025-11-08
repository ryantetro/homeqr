# Supabase Storage Setup Guide

## Overview
HomeQR uses Supabase Storage to store user-uploaded images (agent headshots and brokerage logos). This guide will walk you through setting up the storage bucket and configuring access policies.

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name:** `user-uploads`
   - **Public bucket:** ✅ **Enable** (check this box)
   - **File size limit:** 5 MB (recommended)
   - **Allowed MIME types:** `image/*` (optional, for security)

5. Click **"Create bucket"**

## Step 2: Configure Row Level Security (RLS) Policies

You have two options for creating policies:

### Option A: Using the Supabase Dashboard (Recommended)

1. In the Supabase Dashboard, go to **Storage** → **Policies**
2. Select the `user-uploads` bucket
3. Click **"New Policy"** for each policy below
4. Use the **"Policy Template"** dropdown and select **"Custom policy"**
5. Enter the policy name and SQL as shown below

### Option B: Using SQL Editor (Recommended - Avoids Syntax Errors)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New query"**
3. **Option A:** Copy and paste all the SQL statements below
4. **Option B:** Open the file `supabase/storage_policies.sql` from this project and copy its contents
5. Click **"Run"**

**Important:** If you get a syntax error, make sure you're running this in the **SQL Editor**, not in the Storage Policies UI. The Storage Policies UI sometimes has issues with complex policies.

### SQL Policies (Copy all at once)

```sql
-- Policy 1: Allow Authenticated Users to Upload
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow Public Read Access
CREATE POLICY "Public can read uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-uploads');

-- Policy 3: Allow Users to Update Their Own Files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow Users to Delete Their Own Files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### What Each Policy Does

- **Policy 1 (Upload):** Allows authenticated users to upload files, but only to folders named with their user ID
- **Policy 2 (Read):** Allows anyone to view uploaded images (needed for public property pages)
- **Policy 3 (Update):** Allows users to replace their own uploaded images
- **Policy 4 (Delete):** Allows users to delete their own uploaded images

## Step 3: Verify Setup

### Test Image Upload

1. Sign up or log in to your HomeQR account
2. Go to **Settings** or complete the **Onboarding** flow
3. Try uploading a headshot or logo
4. Verify the image appears correctly

### Check Storage

1. Go to **Storage** → **user-uploads** in Supabase Dashboard
2. You should see folders named with user IDs (UUIDs)
3. Each folder should contain uploaded images

## Troubleshooting

### Error: "Bucket not found"
- **Solution:** Make sure the bucket is named exactly `user-uploads` (case-sensitive)
- Verify the bucket exists in Storage → Buckets

### Error: "Permission denied"
- **Solution:** Check that RLS policies are correctly applied
- Verify the bucket is set to **Public**
- Check that policies allow the operation you're trying to perform

### Images not displaying
- **Solution:** 
  - Verify the bucket is public
  - Check that the "Public can read uploads" policy is active
  - Verify image URLs are accessible (try opening in a new tab)

### Upload fails silently
- **Solution:**
  - Check browser console for errors
  - Verify file size is under 5MB
  - Check that file type is an image (jpg, png, webp, etc.)
  - Verify RLS policies allow INSERT operations

## File Structure

Uploaded files are organized as follows:
```
user-uploads/
  └── {user-id}/
      ├── avatar-{timestamp}.{ext}
      └── logo-{timestamp}.{ext}
```

This structure ensures:
- Users can only access their own files
- Files are organized by user
- Easy cleanup if a user deletes their account

## Security Notes

- **Public bucket:** The bucket is public for read access, but uploads are restricted to authenticated users
- **User isolation:** Files are stored in user-specific folders, preventing unauthorized access
- **File validation:** The upload API validates file size and type before storing
- **RLS policies:** Row Level Security ensures users can only manage their own files

## Next Steps

After setting up storage:
1. Test image uploads in the onboarding flow
2. Test image uploads in the settings page
3. Verify images display correctly on property pages
4. Test image replacement functionality

