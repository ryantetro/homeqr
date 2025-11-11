import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'avatar' or 'logo'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Generate unique filename
    // Path structure: {user-id}/{type}-{timestamp}.{ext}
    // This matches the RLS policy which checks (storage.foldername(name))[1] = auth.uid()::text
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${type}-${Date.now()}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Note: We'll attempt the upload directly and handle errors there
    // The upload error will be more specific about what went wrong

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      console.error('Error details:', JSON.stringify(uploadError, null, 2));
      
      // Provide more specific error messages
      if (uploadError.message?.includes('The resource already exists')) {
        return NextResponse.json(
          { error: 'File already exists. Please try again.' },
          { status: 409 }
        );
      }
      
      // Bucket doesn't exist
      if (uploadError.message?.includes('not found') || 
          uploadError.message?.includes('does not exist') ||
          uploadError.message?.includes('Bucket')) {
        return NextResponse.json(
          { 
            error: 'Storage bucket "user-uploads" not found. Please create it in Supabase Dashboard → Storage → New Bucket. Name it exactly "user-uploads" and make it public. See SETUP_STORAGE.md for detailed instructions.',
            setupRequired: true,
            details: uploadError.message
          },
          { status: 503 }
        );
      }
      
      // Permission/RLS errors
      if (uploadError.message?.includes('new row violates row-level security') ||
          uploadError.message?.includes('permission') ||
          uploadError.message?.includes('policy')) {
        return NextResponse.json(
          { 
            error: 'Permission denied. Please check your storage RLS policies. Run the SQL in supabase/storage_policies.sql in the Supabase SQL Editor. See SETUP_STORAGE.md for instructions.',
            setupRequired: true,
            details: uploadError.message
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { 
          error: `Failed to upload file: ${uploadError.message || 'Unknown error'}`,
          details: uploadError.message
        },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('user-uploads').getPublicUrl(filePath);

    // Update user profile
    const updateField = type === 'avatar' ? 'avatar_url' : 'logo_url';
    const { error: updateError } = await supabase
      .from('users')
      .update({ [updateField]: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

