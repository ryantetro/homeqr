/**
 * QR Code PDF Template Definitions
 * Each template defines a layout structure for different use cases
 */

import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { QRCustomizationOptions, PageSize } from './constants';
import { PAGE_SIZES } from './constants';

export interface TemplateProps {
  qrUrl: string;
  address: string;
  city?: string;
  state?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  propertyImage?: string;
  options: QRCustomizationOptions;
}

/**
 * Get page size for react-pdf Page component
 * Standard sizes use string, custom sizes use [width, height] array
 */
function getPageSize(pageSize: PageSize): 'A4' | 'Letter' | [number, number] {
  // react-pdf supports: A4, A3, A5, Letter, Legal, Tabloid as strings
  if (pageSize === 'A4' || pageSize === 'Letter') {
    return pageSize;
  }
  // Custom sizes need to be arrays [width, height] in points
  const dimensions = PAGE_SIZES[pageSize];
  return [dimensions.width, dimensions.height];
}

/**
 * Generate dynamic styles based on customization options
 */
function generateStyles(options: QRCustomizationOptions) {
  const pageSize = PAGE_SIZES[options.pageSize];
  const isLandscape = options.orientation === 'landscape';
  
  return StyleSheet.create({
    page: {
      flexDirection: options.orientation === 'landscape' ? 'row' : 'column',
      backgroundColor: options.backgroundColor,
      padding: 40 * options.spacing,
      fontFamily: 'Helvetica',
      width: isLandscape ? pageSize.height : pageSize.width,
      height: isLandscape ? pageSize.width : pageSize.height,
    },
    header: {
      marginBottom: 20 * options.spacing,
      alignItems: options.textAlignment === 'center' ? 'center' : 
                  options.textAlignment === 'right' ? 'flex-end' : 'flex-start',
    },
    logo: {
      width: 60,
      height: 60,
      marginBottom: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
      color: options.primaryColor,
    },
    address: {
      fontSize: 16,
      color: options.textColor,
      marginBottom: 5,
    },
    details: {
      fontSize: 12,
      color: options.textColor,
      marginTop: 10,
    },
    qrContainer: {
      alignItems: 'center',
      marginVertical: 20 * options.spacing,
      padding: 20 * options.spacing,
      backgroundColor: options.backgroundColor === '#ffffff' ? '#F9FAFB' : options.backgroundColor,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: options.borderColor,
    },
    qrImage: {
      width: (300 * options.qrSize) / 100,
      height: (300 * options.qrSize) / 100,
      marginBottom: 15,
    },
    scanText: {
      fontSize: 14,
      color: options.textColor,
      marginTop: 10,
    },
    agentInfo: {
      marginTop: 20 * options.spacing,
      padding: 15 * options.spacing,
      backgroundColor: options.backgroundColor === '#ffffff' ? '#F9FAFB' : options.backgroundColor,
      borderRadius: 8,
    },
    agentName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: options.primaryColor,
      marginBottom: 5,
    },
    agentDetail: {
      fontSize: 11,
      color: options.textColor,
      marginBottom: 3,
    },
    footer: {
      marginTop: 'auto',
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: options.borderColor,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 10,
      color: options.textColor,
      textAlign: 'center',
    },
    propertyImage: {
      width: '100%',
      height: 200,
      marginBottom: 20,
      objectFit: 'cover',
    },
  });
}

/**
 * Sticker Template - Compact QR with address
 */
export function StickerTemplate({ qrUrl, address, city, state, options }: TemplateProps): React.ReactElement {
  const styles = generateStyles(options);
  const pageSize = getPageSize(options.pageSize);
  
  return (
    <Document>
      {/* @ts-expect-error - react-pdf accepts string or [number, number] but types are too strict */}
      <Page size={pageSize} style={styles.page}>
        {options.logoUrl && (
          <View style={styles.header}>
            <Image src={options.logoUrl} style={styles.logo} />
          </View>
        )}
        <View style={styles.header}>
          <Text style={styles.title}>HomeQR</Text>
          <Text style={styles.address}>{address}</Text>
          {(city || state) && (
            <Text style={styles.address}>
              {city && state ? `${city}, ${state}` : city || state}
            </Text>
          )}
        </View>
        <View style={styles.qrContainer}>
          <Image src={qrUrl} style={styles.qrImage} />
          <Text style={styles.scanText}>
            {options.customMessage || 'Scan to view property details'}
          </Text>
        </View>
        {(options.agentName || options.brokerage) && (
          <View style={styles.agentInfo}>
            {options.agentName && (
              <Text style={styles.agentName}>{options.agentName}</Text>
            )}
            {options.brokerage && (
              <Text style={styles.agentDetail}>{options.brokerage}</Text>
            )}
            {options.agentPhone && (
              <Text style={styles.agentDetail}>{options.agentPhone}</Text>
            )}
            {options.agentEmail && (
              <Text style={styles.agentDetail}>{options.agentEmail}</Text>
            )}
          </View>
        )}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by HomeQR</Text>
        </View>
      </Page>
    </Document>
  ) as React.ReactElement;
}

/**
 * Flyer Template - Full property flyer with images and details
 */
export function FlyerTemplate({
  qrUrl,
  address,
  city,
  state,
  price,
  bedrooms,
  bathrooms,
  squareFeet,
  propertyImage,
  options,
}: TemplateProps): React.ReactElement {
  const styles = generateStyles(options);
  const pageSize = getPageSize(options.pageSize);
  
  return (
    <Document>
      {/* @ts-expect-error - react-pdf accepts string or [number, number] but types are too strict */}
      <Page size={pageSize} style={styles.page}>
        {propertyImage && options.showPropertyImage && (
          <Image src={propertyImage} style={styles.propertyImage} />
        )}
        
        <View style={styles.header}>
          {options.logoUrl && (
            <Image src={options.logoUrl} style={styles.logo} />
          )}
          <Text style={styles.title}>{address}</Text>
          {(city || state) && (
            <Text style={styles.address}>
              {city && state ? `${city}, ${state}` : city || state}
            </Text>
          )}
        </View>
        
        {options.showPropertyDetails && (price || bedrooms || bathrooms || squareFeet) && (
          <View style={styles.details}>
            {price && <Text style={styles.details}>Price: ${price.toLocaleString()}</Text>}
            {bedrooms && <Text style={styles.details}>Bedrooms: {bedrooms}</Text>}
            {bathrooms && <Text style={styles.details}>Bathrooms: {bathrooms}</Text>}
            {squareFeet && <Text style={styles.details}>Square Feet: {squareFeet.toLocaleString()}</Text>}
          </View>
        )}
        
        <View style={styles.qrContainer}>
          <Image src={qrUrl} style={styles.qrImage} />
          <Text style={styles.scanText}>
            {options.customMessage || 'Scan to view full property details'}
          </Text>
        </View>
        
        {(options.agentName || options.brokerage) && (
          <View style={styles.agentInfo}>
            {options.agentName && (
              <Text style={styles.agentName}>{options.agentName}</Text>
            )}
            {options.brokerage && (
              <Text style={styles.agentDetail}>{options.brokerage}</Text>
            )}
            {options.agentPhone && (
              <Text style={styles.agentDetail}>Phone: {options.agentPhone}</Text>
            )}
            {options.agentEmail && (
              <Text style={styles.agentDetail}>Email: {options.agentEmail}</Text>
            )}
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by HomeQR</Text>
        </View>
      </Page>
    </Document>
  ) as React.ReactElement;
}

/**
 * Business Card Template - Agent contact info with QR
 */
export function BusinessCardTemplate({
  qrUrl,
  address,
  city,
  state,
  options,
}: TemplateProps): React.ReactElement {
  const styles = generateStyles(options);
  const qrSize = Math.round((120 * options.qrSize) / 100);
  const pageSize = getPageSize('4x6');
  
  return (
    <Document>
      {/* @ts-expect-error - react-pdf accepts string or [number, number] but types are too strict */}
      <Page size={pageSize} style={[styles.page, { padding: 30 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', height: '100%' }}>
          <View style={{ flex: 1, paddingRight: 15, justifyContent: 'space-between', height: '100%' }}>
            <View>
              {options.logoUrl && (
                <View style={{ marginBottom: 15 }}>
                  <Image src={options.logoUrl} style={{ width: 50, height: 50 }} />
                </View>
              )}
              {options.agentName && (
                <Text style={[styles.agentName, { marginBottom: 8, fontSize: 16 }]}>{options.agentName}</Text>
              )}
              {options.brokerage && (
                <Text style={[styles.agentDetail, { marginBottom: 4, fontSize: 10 }]}>{options.brokerage}</Text>
              )}
              {options.agentPhone && (
                <Text style={[styles.agentDetail, { marginBottom: 4, fontSize: 10 }]}>{options.agentPhone}</Text>
              )}
              {options.agentEmail && (
                <Text style={[styles.agentDetail, { marginBottom: 8, fontSize: 10 }]}>{options.agentEmail}</Text>
              )}
            </View>
            <View>
              <Text style={[styles.address, { fontSize: 10, marginBottom: 3 }]}>{address}</Text>
              {(city || state) && (
                <Text style={[styles.address, { fontSize: 10 }]}>
                  {city && state ? `${city}, ${state}` : city || state}
                </Text>
              )}
            </View>
          </View>
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 4 }}>
              <Image src={qrUrl} style={{ width: qrSize, height: qrSize }} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  ) as React.ReactElement;
}

/**
 * Yard Sign Template - Large format for outdoor signs
 */
export function YardSignTemplate({
  qrUrl,
  address,
  city,
  state,
  options,
}: TemplateProps): React.ReactElement {
  const styles = generateStyles(options);
  const pageSize = getPageSize('8.5x11');
  
  return (
    <Document>
      {/* @ts-expect-error - react-pdf accepts string or [number, number] but types are too strict */}
      <Page size={pageSize} style={styles.page}>
        <View style={styles.header}>
          {options.logoUrl && (
            <Image src={options.logoUrl} style={{ width: 80, height: 80, marginBottom: 20 }} />
          )}
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: options.primaryColor, marginBottom: 10 }}>
            {address}
          </Text>
          {(city || state) && (
            <Text style={{ fontSize: 20, color: options.textColor }}>
              {city && state ? `${city}, ${state}` : city || state}
            </Text>
          )}
        </View>
        <View style={styles.qrContainer}>
          <Image src={qrUrl} style={{ width: 400, height: 400 }} />
          <Text style={{ fontSize: 24, color: options.textColor, marginTop: 20 }}>
            {options.customMessage || 'Scan for Property Details'}
          </Text>
        </View>
        {options.agentName && (
          <View style={styles.agentInfo}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: options.primaryColor }}>
              {options.agentName}
            </Text>
            {options.agentPhone && (
              <Text style={{ fontSize: 16, color: options.textColor }}>
                {options.agentPhone}
              </Text>
            )}
          </View>
        )}
      </Page>
    </Document>
  ) as React.ReactElement;
}

/**
 * Minimal Template - Just QR code with optional text
 */
export function MinimalTemplate({
  qrUrl,
  options,
}: TemplateProps): React.ReactElement {
  const styles = generateStyles(options);
  const pageSize = getPageSize(options.pageSize);
  
  return (
    <Document>
      {/* @ts-expect-error - react-pdf accepts string or [number, number] but types are too strict */}
      <Page size={pageSize} style={styles.page}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Image src={qrUrl} style={styles.qrImage} />
          {options.customMessage && (
            <Text style={styles.scanText}>{options.customMessage}</Text>
          )}
        </View>
      </Page>
    </Document>
  ) as React.ReactElement;
}

/**
 * Get the appropriate template component based on template type
 */
export function getTemplateComponent(templateType: string) {
  switch (templateType) {
    case 'flyer':
      return FlyerTemplate;
    case 'business-card':
      return BusinessCardTemplate;
    case 'yard-sign':
      return YardSignTemplate;
    case 'minimal':
      return MinimalTemplate;
    case 'sticker':
    default:
      return StickerTemplate;
  }
}

