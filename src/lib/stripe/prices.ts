// Stripe Price IDs configuration
// Set these in your environment variables

export const PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || '',
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '',
  },
} as const;

export type PlanType = 'starter' | 'pro';
export type BillingCycle = 'monthly' | 'annual';

export function getPriceId(plan: PlanType, billing: BillingCycle): string {
  const priceId = PRICE_IDS[plan][billing];
  if (!priceId) {
    throw new Error(`Price ID not configured for ${plan} ${billing}`);
  }
  return priceId;
}

export const PLAN_PRICES = {
  starter: {
    monthly: 29,
    annual: 290, // ~$24.17/mo when billed annually
  },
  pro: {
    monthly: 49,
    annual: 490, // ~$40.83/mo when billed annually
  },
} as const;

