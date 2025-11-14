/**
 * Default values and constants for QR code customization
 */

export type TemplateType = 'sticker' | 'flyer' | 'business-card' | 'yard-sign' | 'minimal';
export type PageSize = 'A4' | 'Letter' | '4x6' | '8.5x11';
export type Orientation = 'portrait' | 'landscape';
export type QRPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface QRCustomizationOptions {
  // Template
  template: TemplateType;
  pageSize: PageSize;
  orientation: Orientation;
  
  // Colors
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  
  // Content
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  brokerage: string;
  customMessage: string;
  
  // Visual
  logoUrl: string | null;
  qrSize: number; // Percentage or pixels
  qrPosition: QRPosition;
  showPropertyImage: boolean;
  showPropertyDetails: boolean;
  
  // Layout
  textAlignment: 'left' | 'center' | 'right';
  spacing: number; // Padding/spacing multiplier
}

export const DEFAULT_CUSTOMIZATION: QRCustomizationOptions = {
  template: 'sticker',
  pageSize: 'A4',
  orientation: 'portrait',
  primaryColor: '#2563eb', // Blue
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  borderColor: '#e5e7eb',
  agentName: '',
  agentPhone: '',
  agentEmail: '',
  brokerage: '',
  customMessage: 'Scan to view property details',
  logoUrl: null,
  qrSize: 100, // Percentage
  qrPosition: 'center',
  showPropertyImage: false,
  showPropertyDetails: true,
  textAlignment: 'center',
  spacing: 1,
};

export const COLOR_PRESETS = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Indigo', value: '#6366f1' },
];

export const PAGE_SIZES: Record<PageSize, { width: number; height: number; label: string }> = {
  A4: { width: 595, height: 842, label: 'A4 (8.27" × 11.69")' },
  Letter: { width: 612, height: 792, label: 'Letter (8.5" × 11")' },
  '4x6': { width: 288, height: 432, label: '4" × 6" (Photo)' },
  '8.5x11': { width: 612, height: 792, label: '8.5" × 11" (Standard)' },
};

