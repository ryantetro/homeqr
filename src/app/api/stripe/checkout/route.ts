import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { getPriceId, type BillingCycle } from '@/lib/stripe/prices';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Stripe is configured
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { 
          error: 'Payment integration is not yet configured. Please contact support to enable your account.',
          configured: false
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { billing = 'monthly', promotionCode }: { billing?: BillingCycle; promotionCode?: string } = body;

    if (!['monthly', 'annual'].includes(billing)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    const priceId = getPriceId(billing);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Create checkout session with 14-day free trial
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId: user.id,
          plan: 'homeqr', // Single plan
          billing: billing,
        },
      },
      success_url: `${siteUrl}/dashboard?trial=activated`,
      cancel_url: `${siteUrl}/dashboard?trial=canceled`,
      metadata: {
        userId: user.id,
        plan: 'homeqr', // Single plan
        billing: billing,
      },
      // Only use allow_promotion_codes if no promotion code is provided
      // If promotionCode is provided, use discounts instead
      ...(promotionCode 
        ? { discounts: [{ promotion_code: promotionCode }] }
        : { allow_promotion_codes: true }
      ),
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}




