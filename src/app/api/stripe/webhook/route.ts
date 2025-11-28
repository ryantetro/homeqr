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

        console.log('[Webhook] checkout.session.completed:', {
          userId,
          plan,
          subscription: session.subscription,
          customer: session.customer,
          sessionId: session.id,
        });

        if (!userId) {
          console.error('[Webhook] Missing userId in checkout session metadata:', {
            sessionId: session.id,
            customer: session.customer,
            metadata: session.metadata,
          });
          // Try to find user by customer email as fallback
          if (session.customer) {
            try {
              const customer = await stripe.customers.retrieve(session.customer as string);
              if (!customer.deleted && customer.email) {
                const { data: user } = await supabaseAdmin
                  .from('users')
                  .select('id')
                  .eq('email', customer.email)
                  .single();
                
                if (user) {
                  console.log('[Webhook] Found user by customer email:', user.id);
                  // Note: userId would need to be set here to continue processing
                } else {
                  console.error('[Webhook] User not found by customer email:', customer.email);
                }
              }
            } catch (err) {
              console.error('[Webhook] Error retrieving customer:', err);
            }
          }
        }

        if (userId && plan && session.subscription) {
          try {
            // Verify user exists in database
            const { data: user, error: userError } = await supabaseAdmin
              .from('users')
              .select('id, email')
              .eq('id', userId)
              .single();

            if (userError || !user) {
              console.error('[Webhook] User not found in database:', {
                userId,
                error: userError?.message,
                sessionId: session.id,
                customer: session.customer,
              });
              throw new Error(`User ${userId} not found in database`);
            }

            console.log('[Webhook] User verified:', { userId, email: user.email });

            // Get subscription details to check trial status
            const subscriptionResponse = await stripe.subscriptions.retrieve(session.subscription as string);
            const subscription = subscriptionResponse as unknown as {
              status: string;
              current_period_start?: number;
              current_period_end?: number;
              trial_start: number | null;
              trial_end?: number | null;
            };
            
            console.log('[Webhook] Subscription details:', {
              status: subscription.status,
              trial_start: subscription.trial_start,
              trial_end: subscription.trial_end,
              period_start: subscription.current_period_start,
              period_end: subscription.current_period_end,
            });

            // For trialing subscriptions, use trial_end as current_period_end if current_period_end is not available
            const periodEnd = subscription.current_period_end 
              ? subscription.current_period_end 
              : subscription.trial_end;
            const periodStart = subscription.current_period_start 
              ? subscription.current_period_start 
              : subscription.trial_start;

            // Check if subscription exists first (since we don't have unique constraint on stripe_subscription_id)
            const { data: existing, error: existingError } = await supabaseAdmin
              .from('subscriptions')
              .select('id, user_id, status')
              .eq('stripe_subscription_id', session.subscription as string)
              .maybeSingle();

            if (existingError && existingError.code !== 'PGRST116') {
              // PGRST116 is "not found" which is expected for new subscriptions
              console.error('[Webhook] Error checking existing subscription:', existingError);
            }

            // All subscriptions now use single plan - set to 'starter' for consistency
            // (existing subscriptions keep their plan value but it doesn't affect features)
            const subscriptionData = {
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              status: subscription.status === 'trialing' ? 'trialing' : 'active',
              plan: plan || 'starter', // Default to 'starter' for single plan
              current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
              current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              // Note: trial_started_at column doesn't exist yet - migration not run
            };

            let data, error;
            if (existing) {
              // Update existing
              console.log('[Webhook] Updating existing subscription:', existing.id);
              const result = await supabaseAdmin
                .from('subscriptions')
                .update(subscriptionData)
                .eq('stripe_subscription_id', session.subscription as string)
                .select()
                .single();
              data = result.data;
              error = result.error;
            } else {
              // Insert new
              console.log('[Webhook] Inserting new subscription');
              const result = await supabaseAdmin
                .from('subscriptions')
                .insert(subscriptionData)
                .select()
                .single();
              data = result.data;
              error = result.error;
            }

            if (error) {
              console.error('[Webhook] Database upsert error:', {
                error: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                userId,
                subscriptionId: session.subscription,
              });
              throw new Error(`Failed to save subscription: ${error.message}`);
            }

            console.log('[Webhook] Subscription saved successfully:', {
              id: data?.id,
              userId: data?.user_id,
              status: data?.status,
              plan: data?.plan,
            });
          } catch (error) {
            console.error('[Webhook] Error processing checkout.session.completed:', {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              userId,
              subscription: session.subscription,
              customer: session.customer,
            });
            throw error; // Re-throw to trigger 500 response
          }
        } else {
          console.warn('[Webhook] Missing required data:', { 
            userId: !!userId, 
            plan: !!plan, 
            subscription: !!session.subscription,
            sessionId: session.id,
          });
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
            // Note: trial_started_at column doesn't exist yet - migration not run
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

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as unknown as {
          subscription: string;
          customer: string;
        };
        
        if (invoice.subscription) {
          // Get subscription details to update status
          const subscriptionResponse = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const subscription = subscriptionResponse as unknown as {
            id: string;
            status: string;
            current_period_start: number;
            current_period_end: number;
          };
          
          // Update subscription status (payment succeeded = active)
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);
          
          console.log(`[Payment Succeeded] Subscription ${subscription.id} updated to ${subscription.status}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as {
          subscription: string;
          customer: string;
        };
        
        if (invoice.subscription) {
          // Get subscription details to update status
          const subscriptionResponse = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const subscription = subscriptionResponse as unknown as {
            id: string;
            status: string;
            current_period_start: number;
            current_period_end: number;
          };
          
          // Update subscription status (payment failed = past_due)
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);
          
          console.log(`[Payment Failed] Subscription ${subscription.id} updated to ${subscription.status}`);
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




