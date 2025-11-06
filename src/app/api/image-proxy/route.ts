import { NextRequest, NextResponse } from 'next/server';

/**
 * Image proxy endpoint to bypass CORS restrictions for external images
 * This allows Zillow images to be displayed in our application
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }

    // Validate that the URL is from an allowed domain and is actually an image URL
    const urlObj = new URL(imageUrl);
    
    // Must be from Zillow's image CDN, not listing pages
    const isImageCDN = urlObj.hostname.includes('zillowstatic.com') || 
                       urlObj.hostname.includes('photos.zillowstatic.com');
    
    // Must be an actual image file (not a listing page)
    const isImageFile = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(imageUrl) || 
                       imageUrl.includes('/photo/') ||
                       imageUrl.includes('/photos/') ||
                       imageUrl.includes('/image/') ||
                       imageUrl.includes('/media/');
    
    // Reject listing pages or non-image URLs
    if (imageUrl.includes('/homedetails/') || 
        imageUrl.includes('/homes/') ||
        imageUrl.includes('/alpine-ut/') ||
        !isImageCDN ||
        !isImageFile) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 403 });
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'Referer': 'https://www.zillow.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: imageResponse.status });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to proxy image' },
      { status: 500 }
    );
  }
}

