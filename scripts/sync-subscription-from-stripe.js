#!/usr/bin/env node

/**
 * Sync subscription from Stripe to database
 * Use this if the webhook failed to create the subscription record
 */

const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Missing Stripe secret key');
  console.error('   Make sure STRIPE_SECRET_KEY is set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY);

async function syncSubscription() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Usage:');
    console.log('   node scripts/sync-subscription-from-stripe.js <stripe_subscription_id>');
    console.log('   OR');
    console.log('   node scripts/sync-subscription-from-stripe.js <user_email>');
    console.log('');
    console.log('Examples:');
    console.log('   node scripts/sync-subscription-from-stripe.js sub_1234567890');
    console.log('   node scripts/sync-subscription-from-stripe.js user@example.com');
    process.exit(1);
  }

  const identifier = args[0];
  let subscriptionId;
  let userId;

  // Check if it's an email or subscription ID
  if (identifier.includes('@')) {
    // It's an email - find user and their subscription
    console.log(`🔍 Looking up user by email: ${identifier}`);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', identifier)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError?.message);
      process.exit(1);
    }

    userId = user.id;
    console.log(`✅ Found user: ${user.id}`);

    // Get subscription from Stripe by customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (subscription?.stripe_subscription_id) {
      subscriptionId = subscription.stripe_subscription_id;
      console.log(`📦 Found existing subscription ID: ${subscriptionId}`);
    } else if (subscription?.stripe_customer_id) {
      // Find subscription in Stripe by customer
      console.log(`🔍 Looking up Stripe subscriptions for customer: ${subscription.stripe_customer_id}`);
      const subscriptions = await stripe.subscriptions.list({
        customer: subscription.stripe_customer_id,
        limit: 1,
      });
      
      if (subscriptions.data.length > 0) {
        subscriptionId = subscriptions.data[0].id;
        console.log(`✅ Found Stripe subscription: ${subscriptionId}`);
      } else {
        console.error('❌ No Stripe subscription found for this customer');
        process.exit(1);
      }
    } else {
      console.error('❌ No subscription found. Please provide Stripe subscription ID directly.');
      process.exit(1);
    }
  } else {
    // It's a subscription ID
    subscriptionId = identifier;
  }

  console.log(`\n🔄 Syncing subscription: ${subscriptionId}`);

  try {
    // Get subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    console.log('📊 Stripe subscription details:');
    console.log(`   Status: ${stripeSubscription.status}`);
    console.log(`   Plan: ${stripeSubscription.items.data[0]?.price?.nickname || 'N/A'}`);
    console.log(`   Customer: ${stripeSubscription.customer}`);
    console.log(`   Trial start: ${stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000).toISOString() : 'N/A'}`);
    console.log(`   Period start: ${stripeSubscription.current_period_start ? new Date(stripeSubscription.current_period_start * 1000).toISOString() : 'N/A'}`);
    console.log(`   Period end: ${stripeSubscription.current_period_end ? new Date(stripeSubscription.current_period_end * 1000).toISOString() : 'N/A'}`);

    // Get user_id from customer metadata or find by customer ID
    if (!userId) {
      const customer = await stripe.customers.retrieve(stripeSubscription.customer);
      const customerEmail = customer.email;
      
      if (customerEmail) {
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('email', customerEmail)
          .single();
        
        if (user) {
          userId = user.id;
        }
      }

      // Try metadata
      if (!userId && customer.metadata?.userId) {
        userId = customer.metadata.userId;
      }
    }

    if (!userId) {
      console.error('❌ Could not determine user_id. Please provide email or ensure customer has userId in metadata.');
      process.exit(1);
    }

    // Determine plan from price
    const priceId = stripeSubscription.items.data[0]?.price?.id;
    let plan = 'starter';
    if (priceId) {
      if (priceId.includes('pro') || priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID) {
        plan = 'pro';
      } else if (priceId.includes('starter') || priceId === process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_STARTER_ANNUAL_PRICE_ID) {
        plan = 'starter';
      }
    }

    // Upsert subscription
    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: stripeSubscription.customer,
      stripe_subscription_id: stripeSubscription.id,
      status: stripeSubscription.status === 'trialing' ? 'trialing' : stripeSubscription.status,
      plan: plan,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
    };

    // Add dates only if they exist
    // For trialing subscriptions, use trial_end as current_period_end
    if (stripeSubscription.current_period_start) {
      subscriptionData.current_period_start = new Date(stripeSubscription.current_period_start * 1000).toISOString();
    } else if (stripeSubscription.trial_start) {
      // Use trial_start as period_start if current_period_start is not available
      subscriptionData.current_period_start = new Date(stripeSubscription.trial_start * 1000).toISOString();
    }
    
    if (stripeSubscription.current_period_end) {
      subscriptionData.current_period_end = new Date(stripeSubscription.current_period_end * 1000).toISOString();
    } else if (stripeSubscription.trial_end) {
      // Use trial_end as current_period_end for trialing subscriptions
      subscriptionData.current_period_end = new Date(stripeSubscription.trial_end * 1000).toISOString();
    }
    // Only add trial_started_at if the column exists (check by trying to query it first)
    // For now, we'll skip it if it causes errors - the migration might not be run
    // if (stripeSubscription.trial_start) {
    //   subscriptionData.trial_started_at = new Date(stripeSubscription.trial_start * 1000).toISOString();
    // }

    // First check if subscription exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', stripeSubscription.id)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('stripe_subscription_id', stripeSubscription.id)
        .select()
        .single();
      result = { data, error };
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();
      result = { data, error };
    }

    const { data, error } = result;

    if (error) {
      console.error('❌ Database error:', error);
      process.exit(1);
    }

    console.log('\n✅ Subscription synced successfully!');
    console.log(`   Status: ${data.status}`);
    console.log(`   Plan: ${data.plan}`);
    console.log(`   User ID: ${data.user_id}`);
    console.log(`   Period End: ${data.current_period_end}`);
    
    if (data.status === 'trialing') {
      console.log('\n🎉 Your trial is now active!');
    }
  } catch (error) {
    console.error('❌ Error syncing subscription:', error.message);
    process.exit(1);
  }
}

syncSubscription().catch(console.error);

