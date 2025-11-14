'use client';

import Image from 'next/image';
import type { QRCustomizationOptions } from '@/lib/qr/constants';

interface QRPreviewProps {
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
  agentLogo?: string | null;
}

export default function QRPreview({
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
  agentLogo,
}: QRPreviewProps) {
  // Calculate QR size based on options.qrSize percentage (base size 200px)
  const qrSizePixels = Math.round((200 * options.qrSize) / 100);
  
  // Calculate spacing multiplier for padding/margins
  const spacingMultiplier = options.spacing;

  const renderPreview = () => {
    switch (options.template) {
      case 'minimal':
        return (
          <div
            className="flex flex-col items-center justify-center rounded-lg border-2"
            style={{
              backgroundColor: options.backgroundColor,
              borderColor: options.borderColor,
              minHeight: '300px',
              padding: `${32 * spacingMultiplier}px`,
            }}
          >
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <img
                src={qrUrl}
                alt="QR Code"
                width={qrSizePixels}
                height={qrSizePixels}
                style={{ width: `${qrSizePixels}px`, height: `${qrSizePixels}px` }}
              />
            </div>
            {options.customMessage && (
              <p
                className="mt-4 text-sm font-medium"
                style={{ 
                  color: options.textColor, 
                  textAlign: options.textAlignment,
                  marginTop: `${16 * spacingMultiplier}px`,
                }}
              >
                {options.customMessage}
              </p>
            )}
          </div>
        );

      case 'sticker':
        return (
          <div
            className="rounded-lg border-2 p-6"
            style={{
              backgroundColor: options.backgroundColor,
              borderColor: options.borderColor,
            }}
          >
            {agentLogo && (
              <div className="mb-4 flex justify-center">
                <img
                  src={agentLogo}
                  alt="Logo"
                  className="h-12 w-auto object-contain"
                />
              </div>
            )}
            <div
              className="mb-4"
              style={{ textAlign: options.textAlignment }}
            >
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: options.primaryColor }}
              >
                HomeQR
              </h3>
              <p className="text-sm font-medium" style={{ color: options.textColor }}>
                {address}
              </p>
              {(city || state) && (
                <p className="text-xs" style={{ color: options.textColor }}>
                  {city && state ? `${city}, ${state}` : city || state}
                </p>
              )}
            </div>
            <div
              className="bg-gray-50 rounded-lg p-4 flex flex-col items-center mb-4"
              style={{ borderColor: options.borderColor }}
            >
              <div className="bg-white p-2 rounded shadow-sm mb-2">
                <img
                  src={qrUrl}
                  alt="QR Code"
                  width={qrSizePixels}
                  height={qrSizePixels}
                  className="w-full h-auto"
                />
              </div>
              <p
                className="text-xs font-medium mt-2"
                style={{ color: options.textColor }}
              >
                {options.customMessage || 'Scan to view property details'}
              </p>
            </div>
            {(options.agentName || options.brokerage) && (
              <div
                className="bg-gray-50 rounded-lg mt-4"
                style={{ 
                  borderColor: options.borderColor,
                  padding: `${12 * spacingMultiplier}px`,
                  marginTop: `${16 * spacingMultiplier}px`,
                }}
              >
                {options.agentName && (
                  <p
                    className="text-sm font-bold mb-1"
                    style={{ color: options.primaryColor }}
                  >
                    {options.agentName}
                  </p>
                )}
                {options.brokerage && (
                  <p className="text-xs" style={{ color: options.textColor }}>
                    {options.brokerage}
                  </p>
                )}
                {options.agentPhone && (
                  <p className="text-xs" style={{ color: options.textColor }}>
                    {options.agentPhone}
                  </p>
                )}
                {options.agentEmail && (
                  <p className="text-xs" style={{ color: options.textColor }}>
                    {options.agentEmail}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 'flyer':
        return (
          <div
            className="rounded-lg border-2 overflow-hidden"
            style={{
              backgroundColor: options.backgroundColor,
              borderColor: options.borderColor,
            }}
          >
            {propertyImage && options.showPropertyImage && (
              <div className="w-full h-48 overflow-hidden bg-gray-200">
                <img
                  src={propertyImage}
                  alt="Property"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              {agentLogo && (
                <div className="mb-4 flex justify-center">
                  <img
                    src={agentLogo}
                    alt="Logo"
                    className="h-10 w-auto object-contain"
                  />
                </div>
              )}
              <div
                className="mb-4"
                style={{ textAlign: options.textAlignment }}
              >
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: options.primaryColor }}
                >
                  {address}
                </h3>
                {(city || state) && (
                  <p className="text-sm" style={{ color: options.textColor }}>
                    {city && state ? `${city}, ${state}` : city || state}
                  </p>
                )}
              </div>
              {options.showPropertyDetails && (price || bedrooms || bathrooms || squareFeet) && (
                <div className="mb-4 grid grid-cols-2 gap-2 text-xs" style={{ color: options.textColor }}>
                  {price && <div>Price: ${price.toLocaleString()}</div>}
                  {bedrooms && <div>Bedrooms: {bedrooms}</div>}
                  {bathrooms && <div>Bathrooms: {bathrooms}</div>}
                  {squareFeet && <div>Sq Ft: {squareFeet.toLocaleString()}</div>}
                </div>
              )}
            <div
              className="bg-gray-50 rounded-lg flex flex-col items-center mb-4"
              style={{ 
                borderColor: options.borderColor,
                padding: `${16 * spacingMultiplier}px`,
                marginBottom: `${16 * spacingMultiplier}px`,
              }}
            >
              <div className="bg-white p-2 rounded shadow-sm mb-2" style={{ marginBottom: `${8 * spacingMultiplier}px` }}>
                <img
                  src={qrUrl}
                  alt="QR Code"
                  width={qrSizePixels}
                  height={qrSizePixels}
                  style={{ width: `${qrSizePixels}px`, height: `${qrSizePixels}px` }}
                />
              </div>
              <p
                className="text-xs font-medium mt-2"
                style={{ color: options.textColor, marginTop: `${8 * spacingMultiplier}px` }}
              >
                {options.customMessage || 'Scan to view full property details'}
              </p>
            </div>
              {(options.agentName || options.brokerage) && (
                <div
                  className="bg-gray-50 rounded-lg"
                  style={{ 
                    borderColor: options.borderColor,
                    padding: `${12 * spacingMultiplier}px`,
                  }}
                >
                  {options.agentName && (
                    <p
                      className="text-sm font-bold mb-1"
                      style={{ color: options.primaryColor }}
                    >
                      {options.agentName}
                    </p>
                  )}
                  {options.brokerage && (
                    <p className="text-xs" style={{ color: options.textColor }}>
                      {options.brokerage}
                    </p>
                  )}
                  {options.agentPhone && (
                    <p className="text-xs" style={{ color: options.textColor }}>
                      {options.agentPhone}
                    </p>
                  )}
                  {options.agentEmail && (
                    <p className="text-xs" style={{ color: options.textColor }}>
                      {options.agentEmail}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'business-card':
        const businessCardQrSize = Math.round((120 * options.qrSize) / 100);
        return (
          <div
            className="rounded-lg border-2 p-6"
            style={{
              backgroundColor: options.backgroundColor,
              borderColor: options.borderColor,
              maxWidth: '400px',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'stretch',
            }}
          >
            <div className="flex-1 flex flex-col justify-between pr-4">
              <div>
                {agentLogo && (
                  <img
                    src={agentLogo}
                    alt="Logo"
                    className="h-10 w-auto object-contain mb-4"
                  />
                )}
                {options.agentName && (
                  <p
                    className="text-base font-bold mb-2"
                    style={{ color: options.primaryColor }}
                  >
                    {options.agentName}
                  </p>
                )}
                {options.brokerage && (
                  <p className="text-xs mb-1.5" style={{ color: options.textColor }}>
                    {options.brokerage}
                  </p>
                )}
                {options.agentPhone && (
                  <p className="text-xs mb-1.5" style={{ color: options.textColor }}>
                    {options.agentPhone}
                  </p>
                )}
                {options.agentEmail && (
                  <p className="text-xs mb-4" style={{ color: options.textColor }}>
                    {options.agentEmail}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: options.textColor }}>
                  {address}
                </p>
                {(city || state) && (
                  <p className="text-xs" style={{ color: options.textColor }}>
                    {city && state ? `${city}, ${state}` : city || state}
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0 flex items-center">
              <div className="bg-white p-2 rounded shadow-sm">
                <img
                  src={qrUrl}
                  alt="QR Code"
                  width={businessCardQrSize}
                  height={businessCardQrSize}
                  style={{ width: `${businessCardQrSize}px`, height: `${businessCardQrSize}px` }}
                />
              </div>
            </div>
          </div>
        );

      case 'yard-sign':
        return (
          <div
            className="rounded-lg border-2 p-6"
            style={{
              backgroundColor: options.backgroundColor,
              borderColor: options.borderColor,
            }}
          >
            {agentLogo && (
              <div className="mb-4 flex justify-center">
                <img
                  src={agentLogo}
                  alt="Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}
            <div
              className="mb-6 text-center"
              style={{ textAlign: options.textAlignment }}
            >
              <h3
                className="text-2xl font-bold mb-2"
                style={{ color: options.primaryColor }}
              >
                {address}
              </h3>
              {(city || state) && (
                <p className="text-lg" style={{ color: options.textColor }}>
                  {city && state ? `${city}, ${state}` : city || state}
                </p>
              )}
            </div>
            <div 
              className="bg-gray-50 rounded-lg flex flex-col items-center mb-6"
              style={{
                padding: `${24 * spacingMultiplier}px`,
                marginBottom: `${24 * spacingMultiplier}px`,
              }}
            >
              <div className="bg-white p-3 rounded shadow-sm mb-3" style={{ marginBottom: `${12 * spacingMultiplier}px` }}>
                <img
                  src={qrUrl}
                  alt="QR Code"
                  width={Math.min(qrSizePixels * 1.5, 300)}
                  height={Math.min(qrSizePixels * 1.5, 300)}
                  style={{ 
                    width: `${Math.min(qrSizePixels * 1.5, 300)}px`, 
                    height: `${Math.min(qrSizePixels * 1.5, 300)}px` 
                  }}
                />
              </div>
              <p
                className="text-base font-medium"
                style={{ color: options.textColor }}
              >
                {options.customMessage || 'Scan for Property Details'}
              </p>
            </div>
            {options.agentName && (
              <div className="text-center">
                <p
                  className="text-lg font-bold mb-1"
                  style={{ color: options.primaryColor }}
                >
                  {options.agentName}
                </p>
                {options.agentPhone && (
                  <p className="text-sm" style={{ color: options.textColor }}>
                    {options.agentPhone}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
        <span className="text-xs text-gray-500">
          {options.pageSize} • {options.orientation}
        </span>
      </div>
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 overflow-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
        <div className="flex justify-center">
          <div style={{ maxWidth: '100%', width: '100%' }}>
            {renderPreview()}
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500 text-center">
        Preview shows approximate layout. Final PDF may vary slightly.
      </p>
    </div>
  );
}

