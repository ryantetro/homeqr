import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

const PRICES = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || '',
  pro: process.env.STRIPE_PRO_PRICE_ID || '',
  team: process.env.STRIPE_TEAM_PRICE_ID || '',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan || !['starter', 'pro', 'team'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const priceId = PRICES[plan as keyof typeof PRICES];
    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Create checkout session
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
      success_url: `${siteUrl}/dashboard/settings?success=true`,
      cancel_url: `${siteUrl}/dashboard/settings?canceled=true`,
      metadata: {
        userId: user.id,
        plan: plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}


