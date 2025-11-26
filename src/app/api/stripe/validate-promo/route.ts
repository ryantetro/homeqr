import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment integration is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Promotion code is required' },
        { status: 400 }
      );
    }

    const codeToSearch = code.toUpperCase().trim();
    
    // List all active promotion codes and find the one matching our code
    // We list all because the 'code' filter might not work as expected
    const allPromotionCodes = await stripe.promotionCodes.list({
      active: true,
      limit: 100,
    });
    
    // Filter by case-insensitive match
    const matched = allPromotionCodes.data.find(
      (pc) => pc.code?.toUpperCase() === codeToSearch
    );
    
    if (!matched) {
      console.log(`[Promo Validation] Code "${codeToSearch}" not found. Available codes:`, 
        allPromotionCodes.data.map(pc => pc.code).filter(Boolean)
      );
      return NextResponse.json(
        { valid: false, error: 'Invalid promotion code. Please check the code and try again.' },
        { status: 200 }
      );
    }
    
    // Retrieve the full promotion code with promotion expanded
    let promotionCode;
    try {
      promotionCode = await stripe.promotionCodes.retrieve(matched.id, {
        expand: ['promotion'],
      });
    } catch (err) {
      console.error(`[Promo Validation] Failed to retrieve promotion code "${matched.id}":`, err);
      return NextResponse.json(
        { valid: false, error: 'Failed to validate promotion code' },
        { status: 200 }
      );
    }
    
    // Check if promotion code itself is active
    if (!promotionCode.active) {
      console.log(`[Promo Validation] Promotion code "${promotionCode.code}" is not active`);
      return NextResponse.json(
        { valid: false, error: 'This promotion code is not currently active' },
        { status: 200 }
      );
    }
    
    // Get coupon from promotion object (newer Stripe API uses 'promotion' property)
    let coupon;
    
    if (promotionCode.promotion) {
      // New API structure: promotion.promotion contains the coupon
      const promotion = typeof promotionCode.promotion === 'string' 
        ? await stripe.promotions.retrieve(promotionCode.promotion, { expand: ['coupon'] })
        : promotionCode.promotion;
      
      if (promotion.coupon) {
        coupon = typeof promotion.coupon === 'string'
          ? await stripe.coupons.retrieve(promotion.coupon)
          : promotion.coupon;
        console.log(`[Promo Validation] Retrieved coupon "${coupon.id}" from promotion for code "${promotionCode.code}"`);
      } else {
        console.error(`[Promo Validation] Promotion "${promotion.id}" has no coupon`);
      }
    } else if (promotionCode.coupon) {
      // Legacy API structure: coupon directly on promotion code
      coupon = typeof promotionCode.coupon === 'string'
        ? await stripe.coupons.retrieve(promotionCode.coupon)
        : promotionCode.coupon;
      console.log(`[Promo Validation] Retrieved coupon "${coupon.id}" directly for code "${promotionCode.code}"`);
    }
    
    if (!coupon) {
      console.error(`[Promo Validation] No coupon found for promotion code "${promotionCode.code}". Available properties:`, {
        id: promotionCode.id,
        code: promotionCode.code,
        hasPromotion: !!promotionCode.promotion,
        hasCoupon: !!promotionCode.coupon,
        promotionType: promotionCode.promotion ? typeof promotionCode.promotion : 'none',
      });
      return NextResponse.json(
        { valid: false, error: 'This promotion code is not valid - no coupon attached' },
        { status: 200 }
      );
    }

    // Check if coupon exists and is valid
    if (!coupon || !coupon.id) {
      console.error(`[Promo Validation] Invalid coupon object for promotion code "${promotionCode.code}"`);
      return NextResponse.json(
        { valid: false, error: 'This promotion code is not valid' },
        { status: 200 }
      );
    }

    // Check coupon validity (valid can be true, false, or undefined)
    if (coupon.valid === false) {
      console.log(`[Promo Validation] Coupon "${coupon.id}" is marked as invalid`);
      return NextResponse.json(
        { valid: false, error: 'This promotion code is no longer valid' },
        { status: 200 }
      );
    }

    // Calculate discount details
    let discountAmount: string | null = null;
    let discountPercent: number | null = null;

    if (coupon.percent_off) {
      discountPercent = coupon.percent_off;
    } else if (coupon.amount_off) {
      discountAmount = `$${(coupon.amount_off / 100).toFixed(2)}`;
    }

    return NextResponse.json({
      valid: true,
      promotionCodeId: promotionCode.id,
      coupon: {
        id: coupon.id,
        name: coupon.name,
        percentOff: discountPercent,
        amountOff: discountAmount,
        duration: coupon.duration,
      },
    });
  } catch (error: unknown) {
    console.error('Promo code validation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to validate promotion code';
    return NextResponse.json(
      { valid: false, error: message },
      { status: 500 }
    );
  }
}

