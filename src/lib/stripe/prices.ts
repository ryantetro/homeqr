// Stripe Price IDs configuration
// Set these in your environment variables

export const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || '',
  annual: process.env.STRIPE_ANNUAL_PRICE_ID || '',
} as const;

export type BillingCycle = 'monthly' | 'annual';

export function getPriceId(billing: BillingCycle): string {
  const priceId = PRICE_IDS[billing];
  if (!priceId) {
    throw new Error(`Price ID not configured for ${billing}`);
  }
  return priceId;
}

export const PLAN_PRICES = {
  monthly: 29,
  annual: 290, // $24.17/mo when billed annually
} as const;

