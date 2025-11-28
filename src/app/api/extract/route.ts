import { NextRequest, NextResponse } from 'next/server';
import { extractListingData } from '@/lib/extract';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const result = await extractListingData(url);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Failed to extract listing data',
          extractedFields: result.extractedFields,
          missingFields: result.missingFields,
        },
        { status: 200 } // Return 200 so frontend can handle partial success
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      extractedFields: result.extractedFields,
      missingFields: result.missingFields,
      validation: result.validation, // Include validation results
    });
  } catch (error: unknown) {
    console.error('Extraction error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to extract listing data';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

