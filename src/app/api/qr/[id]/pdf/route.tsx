import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { getTemplateComponent } from '@/lib/qr/templates';
import type { QRCustomizationOptions } from '@/lib/qr/constants';
import { DEFAULT_CUSTOMIZATION } from '@/lib/qr/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: listingId } = await params;
    const { searchParams } = new URL(request.url);

    // Get listing and QR code with full details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select(`
        id, 
        address, 
        city, 
        state, 
        price,
        bedrooms,
        bathrooms,
        square_feet,
        image_url,
        user_id, 
        qrcodes(qr_url)
      `)
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const qrCode = listing.qrcodes?.[0] as { qr_url: string } | undefined;

    if (!qrCode || !qrCode.qr_url) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }

    // Get user profile for personalization
    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name, phone, email, brokerage, logo_url')
      .eq('id', user.id)
      .single();

    // Parse customization options from query params (ensure colors have # prefix)
    const getColor = (param: string | null, defaultColor: string) => {
      if (!param) return defaultColor;
      return param.startsWith('#') ? param : `#${param}`;
    };

    const customization: QRCustomizationOptions = {
      ...DEFAULT_CUSTOMIZATION,
      template: (searchParams.get('template') as any) || DEFAULT_CUSTOMIZATION.template,
      pageSize: (searchParams.get('pageSize') as any) || DEFAULT_CUSTOMIZATION.pageSize,
      orientation: (searchParams.get('orientation') as any) || DEFAULT_CUSTOMIZATION.orientation,
      primaryColor: getColor(searchParams.get('primaryColor'), DEFAULT_CUSTOMIZATION.primaryColor),
      backgroundColor: getColor(searchParams.get('backgroundColor'), DEFAULT_CUSTOMIZATION.backgroundColor),
      textColor: getColor(searchParams.get('textColor'), DEFAULT_CUSTOMIZATION.textColor),
      borderColor: getColor(searchParams.get('borderColor'), DEFAULT_CUSTOMIZATION.borderColor),
      agentName: searchParams.get('agentName') || userProfile?.full_name || '',
      agentPhone: searchParams.get('agentPhone') || userProfile?.phone || '',
      agentEmail: searchParams.get('agentEmail') || userProfile?.email || '',
      brokerage: searchParams.get('brokerage') || userProfile?.brokerage || '',
      customMessage: searchParams.get('customMessage') || DEFAULT_CUSTOMIZATION.customMessage,
      logoUrl: searchParams.get('logoUrl') || userProfile?.logo_url || null,
      qrSize: parseInt(searchParams.get('qrSize') || '100'),
      qrPosition: (searchParams.get('qrPosition') as any) || DEFAULT_CUSTOMIZATION.qrPosition,
      showPropertyImage: searchParams.get('showPropertyImage') === 'true',
      showPropertyDetails: searchParams.get('showPropertyDetails') !== 'false',
      textAlignment: (searchParams.get('textAlignment') as any) || DEFAULT_CUSTOMIZATION.textAlignment,
      spacing: parseFloat(searchParams.get('spacing') || '1'),
    };

    // Parse property image from image_url (could be JSON array or single URL)
    let propertyImage: string | undefined;
    if (listing.image_url) {
      try {
        const parsed = JSON.parse(listing.image_url);
        if (Array.isArray(parsed) && parsed.length > 0) {
          propertyImage = parsed[0];
        } else if (typeof parsed === 'string') {
          propertyImage = parsed;
        }
      } catch {
        if (typeof listing.image_url === 'string') {
          propertyImage = listing.image_url;
        }
      }
    }

    // Get the appropriate template component
    const TemplateComponent = getTemplateComponent(customization.template);

    // Generate PDF - create the template component
    const templateProps = {
      qrUrl: qrCode.qr_url,
      address: listing.address,
      city: listing.city || undefined,
      state: listing.state || undefined,
      price: listing.price || undefined,
      bedrooms: listing.bedrooms || undefined,
      bathrooms: listing.bathrooms || undefined,
      squareFeet: listing.square_feet || undefined,
      propertyImage: propertyImage,
      options: customization,
    };

    const pdfDoc = TemplateComponent(templateProps);

    // Use toBlob for browser/Node.js compatibility
    const pdfBlob = await pdf(pdfDoc as React.ReactElement<any>).toBlob();
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate filename based on template
    const templateName = customization.template.replace('-', '_');
    const filename = `homeqr-${templateName}-${listing.address.replace(/\s+/g, '-')}.pdf`;

    // Return PDF as response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

