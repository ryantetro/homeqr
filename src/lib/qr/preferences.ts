/**
 * QR customization preferences management
 * Stores user preferences in localStorage and optionally syncs with backend
 */

import type { QRCustomizationOptions } from './constants';
import { DEFAULT_CUSTOMIZATION } from './constants';

const STORAGE_KEY = 'homeqr_qr_customization_preferences';

/**
 * Load saved customization preferences from localStorage
 */
export function loadPreferences(): Partial<QRCustomizationOptions> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
  
  return {};
}

/**
 * Save customization preferences to localStorage
 */
export function savePreferences(preferences: Partial<QRCustomizationOptions>): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

/**
 * Merge saved preferences with defaults
 */
export function getMergedPreferences(
  userProfile?: {
    full_name?: string | null;
    phone?: string | null;
    email?: string | null;
    brokerage?: string | null;
    logo_url?: string | null;
  }
): QRCustomizationOptions {
  const saved = loadPreferences();
  const defaults = { ...DEFAULT_CUSTOMIZATION };
  
  // Merge with user profile data if available
  if (userProfile) {
    defaults.agentName = userProfile.full_name || '';
    defaults.agentPhone = userProfile.phone || '';
    defaults.agentEmail = userProfile.email || '';
    defaults.brokerage = userProfile.brokerage || '';
    defaults.logoUrl = userProfile.logo_url || null;
  }
  
  // Merge saved preferences (overrides defaults and profile)
  return {
    ...defaults,
    ...saved,
    // Ensure nested objects are merged properly
    ...(saved.primaryColor && { primaryColor: saved.primaryColor }),
    ...(saved.backgroundColor && { backgroundColor: saved.backgroundColor }),
  };
}

/**
 * Clear saved preferences
 */
export function clearPreferences(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

