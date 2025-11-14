import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@supabase/supabase-js';

if (!stripe) {
  console.warn('Stripe not configured - webhook handler will not work');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId && plan && session.subscription) {
          // Get subscription details to check trial status
          const subscriptionResponse = await stripe.subscriptions.retrieve(session.subscription as string);
          const subscription = subscriptionResponse as unknown as {
            status: string;
            current_period_start: number;
            current_period_end: number;
            trial_start: number | null;
          };
          
          await supabaseAdmin.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: subscription.status === 'trialing' ? 'trialing' : 'active',
            plan: plan,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_started_at: subscription.trial_start 
              ? new Date(subscription.trial_start * 1000).toISOString() 
              : null,
          });

          // Note: has_paid is now derived from subscription.status === 'active'
          // No need to update users table
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as unknown as {
          id: string;
          status: string;
          current_period_start: number;
          current_period_end: number;
          cancel_at_period_end: boolean;
          trial_start: number | null;
        };
        
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            trial_started_at: subscription.trial_start 
              ? new Date(subscription.trial_start * 1000).toISOString() 
              : null,
          })
          .eq('stripe_subscription_id', subscription.id);

        // Note: has_paid is now derived from subscription.status === 'active'
        // No need to update users table
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as unknown as {
          id: string;
          customer: string;
          trial_end: number;
        };
        
        // Get user from subscription
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();
        
        if (sub) {
          // Get user email from auth.users (Supabase Auth)
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(sub.user_id);
          const userEmail = authUser?.user?.email;
          
          // Calculate days remaining
          const trialEndDate = new Date(subscription.trial_end * 1000);
          const now = new Date();
          const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          console.log(`[Trial Ending] Subscription ${subscription.id}, User ${sub.user_id}, Days remaining: ${daysRemaining}`);
          
          // Send email notification
          if (userEmail) {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            const { sendTrialEndingEmail } = await import('@/lib/email/trial-ending');
            
            await sendTrialEndingEmail({
              email: userEmail,
              userName: userEmail.split('@')[0], // Fallback to email prefix
              daysRemaining,
              upgradeUrl: `${siteUrl}/dashboard/billing`,
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Webhook handler error:', error);
    const message = error instanceof Error ? error.message : 'Webhook handler error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}




