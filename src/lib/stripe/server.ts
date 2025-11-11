import Stripe from 'stripe';

// Only initialize Stripe if secret key is available
// This allows the app to run without Stripe configured (for development)
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    })
  : null;




