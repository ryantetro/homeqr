import { NextRequest, NextResponse } from 'next/server';

/**
 * Image proxy endpoint to bypass CORS restrictions for external images
 * This allows Zillow images to be displayed in our application
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[ImageProxy] Request received:', request.url);
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      console.error('[ImageProxy] Missing image URL');
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }

    console.log('[ImageProxy] Processing URL:', imageUrl.substring(0, 100));

    // Validate that the URL is from an allowed domain and is actually an image URL
    let urlObj;
    try {
      urlObj = new URL(imageUrl);
    } catch (e) {
      console.error('[ImageProxy] Invalid URL format:', imageUrl);
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }
    
    // Must be from Zillow's image CDN, not listing pages
    const isImageCDN = urlObj.hostname.includes('zillowstatic.com') || 
                       urlObj.hostname.includes('photos.zillowstatic.com');
    
    // Must be an actual image file (not a listing page)
    const isImageFile = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(imageUrl) || 
                       imageUrl.includes('/photo/') ||
                       imageUrl.includes('/photos/') ||
                       imageUrl.includes('/image/') ||
                       imageUrl.includes('/media/') ||
                       imageUrl.includes('/fp/');
    
    console.log('[ImageProxy] Validation:', { isImageCDN, isImageFile, hostname: urlObj.hostname });
    
    // Reject listing pages or non-image URLs
    if (imageUrl.includes('/homedetails/') || 
        imageUrl.includes('/homes/') ||
        imageUrl.includes('/alpine-ut/') ||
        !isImageCDN ||
        !isImageFile) {
      console.error('[ImageProxy] Validation failed:', { 
        hasHomedetails: imageUrl.includes('/homedetails/'),
        hasHomes: imageUrl.includes('/homes/'),
        isImageCDN,
        isImageFile
      });
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 403 });
    }

    // Try to get highest resolution version of the image
    // Strategy: Try original URL first, then try enhancements
    const originalUrl = imageUrl;
    const urlVariants: string[] = [];
    
    // Always try original URL first (it's what Zillow actually serves)
    urlVariants.push(originalUrl);
    
    // Strategy 1: Try removing panorama suffix to get base/original resolution (best quality)
    // Only if original has panorama suffix
    if (originalUrl.includes('-p_')) {
      urlVariants.push(originalUrl.replace(/-p_[a-e]\.jpg/i, '.jpg'));
    }
    
    // Strategy 2: Try removing -cc_ft_ to get base URL
    // Only if original has -cc_ft_ suffix
    if (originalUrl.includes('-cc_ft_')) {
      urlVariants.push(originalUrl.replace(/-cc_ft_\d+\.jpg/i, '.jpg'));
    }
    
    // Strategy 3: Try removing -h_g.jpg to get base URL
    if (originalUrl.includes('-h_g.jpg')) {
      urlVariants.push(originalUrl.replace(/-h_g\.jpg/i, '.jpg'));
    }
    
    // Strategy 4: Try higher resolution variants if current is low-res
    const ccFtMatch = originalUrl.match(/-cc_ft_(\d+)/);
    if (ccFtMatch) {
      const currentWidth = parseInt(ccFtMatch[1], 10);
      // Try higher resolutions if we have a low-res version
      if (currentWidth < 3840) {
        urlVariants.push(originalUrl.replace(/-cc_ft_\d+/, '-cc_ft_3840'));
      }
      if (currentWidth < 1920) {
        urlVariants.push(originalUrl.replace(/-cc_ft_\d+/, '-cc_ft_1920'));
      }
    }
    
    // Strategy 5: Try lower resolution variants if current is high-res (as fallback)
    if (ccFtMatch) {
      const currentWidth = parseInt(ccFtMatch[1], 10);
      if (currentWidth >= 3840) {
        urlVariants.push(originalUrl.replace(/-cc_ft_\d+/, '-cc_ft_1920'));
        urlVariants.push(originalUrl.replace(/-cc_ft_\d+/, '-cc_ft_960'));
      } else if (currentWidth >= 1920) {
        urlVariants.push(originalUrl.replace(/-cc_ft_\d+/, '-cc_ft_960'));
      }
    }

    // Try each URL variant until one works
    const tryFetch = async (url: string) => {
      const response = await fetch(url, {
        headers: {
          'Referer': 'https://www.zillow.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      return response;
    };

    // Try each variant in order (highest quality first)
    let imageResponse: Response | null = null;
    let lastError: string = '';
    
    for (const variant of urlVariants) {
      console.log('[ImageProxy] Trying URL variant:', variant.substring(0, 100));
      imageResponse = await tryFetch(variant);
      
      if (imageResponse.ok) {
        console.log('[ImageProxy] Successfully fetched from:', variant.substring(0, 100));
        break;
      } else {
        lastError = `${imageResponse.status} ${imageResponse.statusText}`;
        console.log(`[ImageProxy] Variant failed (${lastError}), trying next...`);
      }
    }

    if (!imageResponse || !imageResponse.ok) {
      console.error(`[ImageProxy] All URL variants failed. Last error: ${lastError}`);
      return NextResponse.json({ 
        error: 'Failed to fetch image from any URL variant', 
        status: imageResponse?.status || 404,
        tried: urlVariants.length,
        originalUrl: originalUrl.substring(0, 100)
      }, { status: imageResponse?.status || 404 });
    }

    console.log('[ImageProxy] Successfully fetched image, size:', imageResponse.headers.get('content-length'));

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers preserving quality
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
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

