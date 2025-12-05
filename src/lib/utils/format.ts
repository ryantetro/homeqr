// Formatting utility functions

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
};

export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return 'N/A';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle 10-digit US phone numbers: (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Handle 11-digit numbers starting with 1 (US country code): +1 (XXX) XXX-XXXX
  if (cleaned.length === 11 && cleaned[0] === '1') {
    const areaCode = cleaned.slice(1, 4);
    const exchange = cleaned.slice(4, 7);
    const number = cleaned.slice(7);
    return `+1 (${areaCode}) ${exchange}-${number}`;
  }
  
  // Handle other international formats (if starts with +, preserve it)
  if (phone.trim().startsWith('+')) {
    return phone.trim();
  }
  
  // For any other format, try to format as best we can
  // If it's mostly digits, format it nicely
  if (cleaned.length > 0 && cleaned.length <= 15) {
    // For numbers that don't fit standard formats, return cleaned version
    // but ensure it's readable
    return cleaned;
  }
  
  // Fallback: return original if we can't format it
  return phone;
};




