/**
 * Data validation and cleaning for extracted listing data
 * Ensures data quality and correctness before saving
 */

import type { ExtractedListingData } from './types';

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  originalValue?: string;
  suggestedValue?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  cleanedData: ExtractedListingData;
  confidence: number; // 0-100, how confident we are in the data quality
}

/**
 * US State abbreviations (valid states)
 */
const VALID_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', // District of Columbia
]);

/**
 * Validate and clean extracted listing data
 */
/**
 * Check if extracted data looks like it came from a block/CAPTCHA page
 */
function isBlockPageData(data: ExtractedListingData): boolean {
  const addressLower = (data.address || '').toLowerCase();
  const descriptionLower = (data.description || '').toLowerCase();
  
  return (
    addressLower.includes('access to this page has been denied') ||
    addressLower.includes('px-captcha') ||
    descriptionLower.includes('px-captcha') ||
    descriptionLower.includes('captcha') ||
    (addressLower.includes('denied') && addressLower.includes('page'))
  );
}

export function validateAndClean(data: ExtractedListingData): ValidationResult {
  const issues: ValidationIssue[] = [];
  const cleaned: ExtractedListingData = { ...data };
  let confidence = 100;

  // Check if this looks like a block/CAPTCHA page
  if (isBlockPageData(data)) {
    issues.push({
      field: 'address',
      severity: 'error',
      message: 'The listing site blocked access. Please use the Chrome extension or enter details manually.',
      originalValue: data.address,
    });
    confidence = 0;
    // Clear invalid data
    if (cleaned.address && cleaned.address.toLowerCase().includes('denied')) {
      cleaned.address = '';
    }
    if (cleaned.description && cleaned.description.toLowerCase().includes('px-captcha')) {
      cleaned.description = '';
    }
  }

  // Validate and clean address
  if (cleaned.address) {
    cleaned.address = cleanAddress(cleaned.address);
    if (!isValidAddress(cleaned.address)) {
      issues.push({
        field: 'address',
        severity: 'error',
        message: 'Address appears to be invalid or contains suspicious content',
        originalValue: data.address,
      });
      confidence -= 20;
    }
  }

  // Validate and clean city
  if (cleaned.city) {
    cleaned.city = cleanCity(cleaned.city);
    if (!isValidCity(cleaned.city)) {
      issues.push({
        field: 'city',
        severity: 'warning',
        message: 'City name may be invalid',
        originalValue: data.city,
      });
      confidence -= 5;
    }
  }

  // Validate and clean state
  if (cleaned.state) {
    cleaned.state = cleanState(cleaned.state);
    if (!isValidState(cleaned.state)) {
      issues.push({
        field: 'state',
        severity: 'error',
        message: `Invalid state abbreviation: "${cleaned.state}". Must be a valid 2-letter US state code.`,
        originalValue: data.state,
      });
      confidence -= 15;
    }
  }

  // Validate and clean ZIP code
  if (cleaned.zip) {
    cleaned.zip = cleanZip(cleaned.zip);
    if (!isValidZip(cleaned.zip)) {
      issues.push({
        field: 'zip',
        severity: 'error',
        message: 'Invalid ZIP code format. Must be 5 digits or 5+4 format.',
        originalValue: data.zip,
      });
      confidence -= 10;
    }
  }

  // Validate and clean price
  if (cleaned.price) {
    const priceResult = validatePrice(cleaned.price);
    if (!priceResult.isValid) {
      issues.push({
        field: 'price',
        severity: priceResult.severity,
        message: priceResult.message,
        originalValue: data.price,
        suggestedValue: priceResult.suggestedValue,
      });
      confidence -= priceResult.severity === 'error' ? 15 : 5;
    } else if (priceResult.cleanedValue) {
      cleaned.price = priceResult.cleanedValue;
    }
  }

  // Validate and clean bedrooms
  if (cleaned.bedrooms) {
    const bedResult = validateBedrooms(cleaned.bedrooms);
    if (!bedResult.isValid) {
      issues.push({
        field: 'bedrooms',
        severity: bedResult.severity,
        message: bedResult.message,
        originalValue: data.bedrooms,
        suggestedValue: bedResult.suggestedValue,
      });
      confidence -= bedResult.severity === 'error' ? 10 : 3;
    } else if (bedResult.cleanedValue) {
      cleaned.bedrooms = bedResult.cleanedValue;
    }
  }

  // Validate and clean bathrooms
  if (cleaned.bathrooms) {
    const bathResult = validateBathrooms(cleaned.bathrooms);
    if (!bathResult.isValid) {
      issues.push({
        field: 'bathrooms',
        severity: bathResult.severity,
        message: bathResult.message,
        originalValue: data.bathrooms,
        suggestedValue: bathResult.suggestedValue,
      });
      confidence -= bathResult.severity === 'error' ? 10 : 3;
    } else if (bathResult.cleanedValue) {
      cleaned.bathrooms = bathResult.cleanedValue;
    }
  }

  // Validate and clean square feet
  if (cleaned.squareFeet) {
    const sqftResult = validateSquareFeet(cleaned.squareFeet);
    if (!sqftResult.isValid) {
      issues.push({
        field: 'squareFeet',
        severity: sqftResult.severity,
        message: sqftResult.message,
        originalValue: data.squareFeet,
        suggestedValue: sqftResult.suggestedValue,
      });
      confidence -= sqftResult.severity === 'error' ? 10 : 3;
    } else if (sqftResult.cleanedValue) {
      cleaned.squareFeet = sqftResult.cleanedValue;
    }
  }

  // Validate year built
  if (cleaned.yearBuilt) {
    const yearResult = validateYearBuilt(cleaned.yearBuilt);
    if (!yearResult.isValid) {
      issues.push({
        field: 'yearBuilt',
        severity: yearResult.severity,
        message: yearResult.message,
        originalValue: data.yearBuilt,
      });
      confidence -= 5;
    } else if (yearResult.cleanedValue) {
      cleaned.yearBuilt = yearResult.cleanedValue;
    }
  }

  // Validate MLS ID
  if (cleaned.mlsId) {
    cleaned.mlsId = cleanMlsId(cleaned.mlsId);
    if (!isValidMlsId(cleaned.mlsId)) {
      issues.push({
        field: 'mlsId',
        severity: 'warning',
        message: 'MLS ID format may be invalid',
        originalValue: data.mlsId,
      });
      confidence -= 3;
    }
  }

  // Validate images
  if (cleaned.imageUrls && cleaned.imageUrls.length > 0) {
    const imageIssues = validateImages(cleaned.imageUrls);
    issues.push(...imageIssues);
    if (imageIssues.length > 0) {
      confidence -= imageIssues.length * 2;
    }
    // Clean image URLs
    cleaned.imageUrls = cleaned.imageUrls.filter((url) => isValidImageUrl(url));
    if (cleaned.imageUrls.length > 0 && !cleaned.imageUrl) {
      cleaned.imageUrl = cleaned.imageUrls[0];
    }
  }

  // Cross-field validation
  const crossFieldIssues = validateCrossFields(cleaned);
  issues.push(...crossFieldIssues);
  confidence -= crossFieldIssues.length * 3;

  // Ensure confidence doesn't go below 0
  confidence = Math.max(0, confidence);

  const hasErrors = issues.some((issue) => issue.severity === 'error');
  const isValid = !hasErrors && cleaned.address.length > 0;

  return {
    isValid,
    issues,
    cleanedData: cleaned,
    confidence,
  };
}

/**
 * Clean address string
 */
function cleanAddress(address: string): string {
  return address
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/[^\w\s\-#.,]/g, '') // Remove special chars except common address chars
    .trim();
}

/**
 * Validate address
 */
function isValidAddress(address: string): boolean {
  if (!address || address.length < 5) return false;
  
  // Check for suspicious patterns (like prices, generic text)
  const suspiciousPatterns = [
    /^\$\d+/, // Starts with price
    /^price/i,
    /^listing/i,
    /^property/i,
    /access denied/i,
    /captcha/i,
    /error/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(address)) {
      return false;
    }
  }
  
  // Should contain at least one number (street number)
  if (!/\d/.test(address)) {
    return false;
  }
  
  return true;
}

/**
 * Clean city name
 */
function cleanCity(city: string): string {
  return city
    .trim()
    .replace(/[^\w\s-']/g, '') // Remove special chars except hyphens and apostrophes
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

/**
 * Validate city name
 */
function isValidCity(city: string): boolean {
  if (!city || city.length < 2) return false;
  if (city.length > 50) return false;
  // Should not contain numbers (except for special cases like "2nd Street")
  if (/^\d+$/.test(city)) return false;
  return true;
}

/**
 * Clean state abbreviation
 */
function cleanState(state: string): string {
  const cleaned = state.trim().toUpperCase().replace(/[^A-Z]/g, '');
  // Handle full state names (basic conversion)
  const stateMap: Record<string, string> = {
    'ALABAMA': 'AL',
    'ALASKA': 'AK',
    'ARIZONA': 'AZ',
    'ARKANSAS': 'AR',
    'CALIFORNIA': 'CA',
    'COLORADO': 'CO',
    'CONNECTICUT': 'CT',
    'DELAWARE': 'DE',
    'FLORIDA': 'FL',
    'GEORGIA': 'GA',
    'HAWAII': 'HI',
    'IDAHO': 'ID',
    'ILLINOIS': 'IL',
    'INDIANA': 'IN',
    'IOWA': 'IA',
    'KANSAS': 'KS',
    'KENTUCKY': 'KY',
    'LOUISIANA': 'LA',
    'MAINE': 'ME',
    'MARYLAND': 'MD',
    'MASSACHUSETTS': 'MA',
    'MICHIGAN': 'MI',
    'MINNESOTA': 'MN',
    'MISSISSIPPI': 'MS',
    'MISSOURI': 'MO',
    'MONTANA': 'MT',
    'NEBRASKA': 'NE',
    'NEVADA': 'NV',
    'NEW HAMPSHIRE': 'NH',
    'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM',
    'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC',
    'NORTH DAKOTA': 'ND',
    'OHIO': 'OH',
    'OKLAHOMA': 'OK',
    'OREGON': 'OR',
    'PENNSYLVANIA': 'PA',
    'RHODE ISLAND': 'RI',
    'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD',
    'TENNESSEE': 'TN',
    'TEXAS': 'TX',
    'UTAH': 'UT',
    'VERMONT': 'VT',
    'VIRGINIA': 'VA',
    'WASHINGTON': 'WA',
    'WEST VIRGINIA': 'WV',
    'WISCONSIN': 'WI',
    'WYOMING': 'WY',
    'DISTRICT OF COLUMBIA': 'DC',
  };
  
  if (stateMap[cleaned]) {
    return stateMap[cleaned];
  }
  
  return cleaned;
}

/**
 * Validate state abbreviation
 */
function isValidState(state: string): boolean {
  return VALID_STATES.has(state.toUpperCase());
}

/**
 * Clean ZIP code
 */
function cleanZip(zip: string): string {
  // Remove all non-digits
  const digits = zip.replace(/\D/g, '');
  
  // Format as 5 digits or 5+4
  if (digits.length === 5) {
    return digits;
  } else if (digits.length === 9) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  } else if (digits.length > 5) {
    // Take first 5 digits if longer
    return digits.slice(0, 5);
  }
  
  return digits;
}

/**
 * Validate ZIP code
 */
function isValidZip(zip: string): boolean {
  if (!zip) return false;
  const digits = zip.replace(/\D/g, '');
  return digits.length === 5 || digits.length === 9;
}

/**
 * Validate price
 */
function validatePrice(price: string): {
  isValid: boolean;
  severity: 'error' | 'warning';
  message: string;
  cleanedValue?: string;
  suggestedValue?: string;
} {
  // Extract numeric value
  const numeric = price.replace(/[^0-9.]/g, '');
  const numValue = parseFloat(numeric);
  
  if (isNaN(numValue) || numValue <= 0) {
    return {
      isValid: false,
      severity: 'error',
      message: 'Price must be a positive number',
    };
  }
  
  // Sanity checks
  if (numValue < 1000) {
    return {
      isValid: false,
      severity: 'warning',
      message: 'Price seems unusually low. Please verify.',
      cleanedValue: `$${Math.round(numValue).toLocaleString()}`,
    };
  }
  
  if (numValue > 500_000_000) {
    return {
      isValid: false,
      severity: 'warning',
      message: 'Price seems unusually high. Please verify.',
      cleanedValue: `$${Math.round(numValue).toLocaleString()}`,
    };
  }
  
  return {
    isValid: true,
    severity: 'warning',
    message: '',
    cleanedValue: `$${Math.round(numValue).toLocaleString()}`,
  };
}

/**
 * Validate bedrooms
 */
function validateBedrooms(bedrooms: string): {
  isValid: boolean;
  severity: 'error' | 'warning';
  message: string;
  cleanedValue?: string;
  suggestedValue?: string;
} {
  const num = parseInt(bedrooms.replace(/\D/g, ''), 10);
  
  if (isNaN(num) || num < 0) {
    return {
      isValid: false,
      severity: 'error',
      message: 'Bedrooms must be a non-negative number',
    };
  }
  
  if (num > 20) {
    return {
      isValid: false,
      severity: 'warning',
      message: 'Number of bedrooms seems unusually high. Please verify.',
      cleanedValue: String(num),
    };
  }
  
  return {
    isValid: true,
    severity: 'warning',
    message: '',
    cleanedValue: String(num),
  };
}

/**
 * Validate bathrooms
 */
function validateBathrooms(bathrooms: string): {
  isValid: boolean;
  severity: 'error' | 'warning';
  message: string;
  cleanedValue?: string;
  suggestedValue?: string;
} {
  // Handle half baths (e.g., "2.5")
  const num = parseFloat(bathrooms.replace(/[^0-9.]/g, ''));
  
  if (isNaN(num) || num < 0) {
    return {
      isValid: false,
      severity: 'error',
      message: 'Bathrooms must be a non-negative number',
    };
  }
  
  if (num > 30) {
    return {
      isValid: false,
      severity: 'warning',
      message: 'Number of bathrooms seems unusually high. Please verify.',
      cleanedValue: String(num),
    };
  }
  
  return {
    isValid: true,
    severity: 'warning',
    message: '',
    cleanedValue: String(num.toFixed(1)),
  };
}

/**
 * Validate square feet
 */
function validateSquareFeet(squareFeet: string): {
  isValid: boolean;
  severity: 'error' | 'warning';
  message: string;
  cleanedValue?: string;
  suggestedValue?: string;
} {
  const num = parseInt(squareFeet.replace(/\D/g, ''), 10);
  
  if (isNaN(num) || num < 0) {
    return {
      isValid: false,
      severity: 'error',
      message: 'Square feet must be a non-negative number',
    };
  }
  
  if (num < 100) {
    return {
      isValid: false,
      severity: 'warning',
      message: 'Square footage seems unusually low. Please verify.',
      cleanedValue: String(num),
    };
  }
  
  if (num > 100_000) {
    return {
      isValid: false,
      severity: 'warning',
      message: 'Square footage seems unusually high. Please verify.',
      cleanedValue: String(num),
    };
  }
  
  return {
    isValid: true,
    severity: 'warning',
    message: '',
    cleanedValue: String(num),
  };
}

/**
 * Validate year built
 */
function validateYearBuilt(yearBuilt: string): {
  isValid: boolean;
  severity: 'error' | 'warning';
  message: string;
  cleanedValue?: string;
} {
  const year = parseInt(yearBuilt.replace(/\D/g, ''), 10);
  const currentYear = new Date().getFullYear();
  
  if (isNaN(year)) {
    return {
      isValid: false,
      severity: 'error',
      message: 'Year built must be a valid year',
    };
  }
  
  if (year < 1600) {
    return {
      isValid: false,
      severity: 'warning',
      message: 'Year built seems unusually old. Please verify.',
      cleanedValue: String(year),
    };
  }
  
  if (year > currentYear + 1) {
    return {
      isValid: false,
      severity: 'warning',
      message: 'Year built cannot be in the future. Please verify.',
      cleanedValue: String(year),
    };
  }
  
  return {
    isValid: true,
    severity: 'warning',
    message: '',
    cleanedValue: String(year),
  };
}

/**
 * Clean MLS ID
 */
function cleanMlsId(mlsId: string): string {
  return mlsId.trim().replace(/\s+/g, '');
}

/**
 * Validate MLS ID
 */
function isValidMlsId(mlsId: string): boolean {
  if (!mlsId || mlsId.length < 3) return false;
  if (mlsId.length > 20) return false;
  return true;
}

/**
 * Validate image URLs
 */
function validateImages(imageUrls: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  if (imageUrls.length === 0) {
    return issues;
  }
  
  const invalidUrls = imageUrls.filter((url) => !isValidImageUrl(url));
  if (invalidUrls.length > 0) {
    issues.push({
      field: 'images',
      severity: 'warning',
      message: `${invalidUrls.length} invalid image URL(s) found and removed`,
    });
  }
  
  return issues;
}

/**
 * Check if URL is a valid image URL
 */
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  
  // Check for common image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
  const urlLower = url.toLowerCase();
  return imageExtensions.some((ext) => urlLower.includes(ext));
}

/**
 * Cross-field validation
 */
function validateCrossFields(data: ExtractedListingData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // If we have city and state, validate they're not empty
  if (data.city && !data.state) {
    issues.push({
      field: 'state',
      severity: 'warning',
      message: 'City provided but state is missing',
    });
  }
  
  if (data.state && !data.city) {
    issues.push({
      field: 'city',
      severity: 'info',
      message: 'State provided but city is missing',
    });
  }
  
  // Validate price per square foot if we have both
  if (data.price && data.squareFeet) {
    const price = parseFloat(data.price.replace(/[^0-9.]/g, ''));
    const sqft = parseInt(data.squareFeet.replace(/\D/g, ''), 10);
    
    if (!isNaN(price) && !isNaN(sqft) && sqft > 0) {
      const pricePerSqft = price / sqft;
      
      if (pricePerSqft < 10) {
        issues.push({
          field: 'price',
          severity: 'warning',
          message: `Price per square foot ($${pricePerSqft.toFixed(2)}) seems unusually low. Please verify.`,
        });
      }
      
      if (pricePerSqft > 2000) {
        issues.push({
          field: 'price',
          severity: 'warning',
          message: `Price per square foot ($${pricePerSqft.toFixed(2)}) seems unusually high. Please verify.`,
        });
      }
    }
  }
  
  return issues;
}


