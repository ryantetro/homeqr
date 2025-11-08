/**
 * Analytics utility functions for consistent calculations across the application
 */

export interface ConversionRateOptions {
  includePageViews?: boolean;
  pageViews?: number;
}

/**
 * Calculate conversion rate consistently across the application
 * @param scans - Total QR code scans
 * @param leads - Total leads generated
 * @param options - Optional configuration
 * @returns Conversion rate as a percentage (0-100)
 */
export function calculateConversionRate(
  scans: number,
  leads: number,
  options: ConversionRateOptions = {}
): number {
  const { includePageViews = false, pageViews = 0 } = options;
  const denominator = includePageViews ? scans + pageViews : scans;
  return denominator > 0 ? (leads / denominator) * 100 : 0;
}

/**
 * Format conversion rate for display
 */
export function formatConversionRate(rate: number, decimals = 1): string {
  return `${rate.toFixed(decimals)}%`;
}

/**
 * Calculate week-over-week growth percentage
 */
export function calculateWoWGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate month-over-month growth percentage
 */
export function calculateMoMGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate bounce rate (single page view with no lead)
 */
export function calculateBounceRate(
  singlePageViews: number,
  totalPageViews: number
): number {
  return totalPageViews > 0 ? (singlePageViews / totalPageViews) * 100 : 0;
}

/**
 * Calculate average time to lead (in minutes)
 */
export function calculateAvgTimeToLead(
  timeToLeadData: number[]
): number {
  if (timeToLeadData.length === 0) return 0;
  const sum = timeToLeadData.reduce((acc, time) => acc + time, 0);
  return sum / timeToLeadData.length;
}

/**
 * Get day of week name from date string
 */
export function getDayOfWeek(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Get hour label (12-hour format)
 */
export function getHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

/**
 * Calculate engagement score based on time, scroll, and actions
 */
export function calculateEngagementScore(
  timeOnPage: number, // seconds
  scrollDepth: number, // percentage 0-100
  hasLead: boolean
): number {
  // Time component (max 50 points): 2+ minutes = 50, 1-2 min = 30, <1 min = 10
  let timeScore = 0;
  if (timeOnPage >= 120) timeScore = 50;
  else if (timeOnPage >= 60) timeScore = 30;
  else if (timeOnPage > 0) timeScore = 10;

  // Scroll component (max 30 points): based on scroll depth
  const scrollScore = (scrollDepth / 100) * 30;

  // Action component (max 20 points): lead submission
  const actionScore = hasLead ? 20 : 0;

  return timeScore + scrollScore + actionScore;
}

/**
 * Determine if a lead is "hot" (submitted within 1 hour of scan)
 */
export function isHotLead(scanTime: Date, leadTime: Date): boolean {
  const diffMs = leadTime.getTime() - scanTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 1;
}

