'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import QRPreview from './QRPreview';
import type { QRCustomizationOptions, TemplateType, PageSize, Orientation } from '@/lib/qr/constants';
import { DEFAULT_CUSTOMIZATION, COLOR_PRESETS, PAGE_SIZES } from '@/lib/qr/constants';
import { getMergedPreferences, savePreferences } from '@/lib/qr/preferences';

interface QRCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  qrUrl: string;
  address: string;
  city?: string;
  state?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  propertyImage?: string;
}

export default function QRCustomizationModal({
  isOpen,
  onClose,
  listingId,
  qrUrl,
  address,
  city,
  state,
  price,
  bedrooms,
  bathrooms,
  squareFeet,
  propertyImage,
}: QRCustomizationModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    full_name?: string | null;
    phone?: string | null;
    email?: string | null;
    brokerage?: string | null;
    logo_url?: string | null;
  } | null>(null);

  // Initialize customization options with user profile data
  const [options, setOptions] = useState<QRCustomizationOptions>(() => {
    return getMergedPreferences();
  });

  // Load user profile on mount
  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, phone, email, brokerage, logo_url')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          // Update options with profile data
          setOptions(prev => ({
            ...prev,
            agentName: profile.full_name || prev.agentName,
            agentPhone: profile.phone || prev.agentPhone,
            agentEmail: profile.email || prev.agentEmail,
            brokerage: profile.brokerage || prev.brokerage,
            logoUrl: profile.logo_url || prev.logoUrl,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleDownload = async (format: 'pdf' | 'png') => {
    setLoading(true);
    try {
      if (format === 'pdf') {
        // Build query string with customization options (matching the preview exactly)
        const params = new URLSearchParams({
          template: options.template,
          pageSize: options.pageSize,
          orientation: options.orientation,
          primaryColor: options.primaryColor.startsWith('#') ? options.primaryColor.substring(1) : options.primaryColor.replace('#', ''),
          backgroundColor: options.backgroundColor.startsWith('#') ? options.backgroundColor.substring(1) : options.backgroundColor.replace('#', ''),
          textColor: options.textColor.startsWith('#') ? options.textColor.substring(1) : options.textColor.replace('#', ''),
          borderColor: options.borderColor.startsWith('#') ? options.borderColor.substring(1) : options.borderColor.replace('#', ''),
          agentName: options.agentName || '',
          agentPhone: options.agentPhone || '',
          agentEmail: options.agentEmail || '',
          brokerage: options.brokerage || '',
          customMessage: options.customMessage || '',
          qrSize: options.qrSize.toString(),
          qrPosition: options.qrPosition,
          showPropertyImage: options.showPropertyImage.toString(),
          showPropertyDetails: options.showPropertyDetails.toString(),
          textAlignment: options.textAlignment,
          spacing: options.spacing.toString(),
        });

        if (options.logoUrl) {
          params.append('logoUrl', options.logoUrl);
        }

        // Open in new tab to trigger download
        const url = `/api/qr/${listingId}/pdf?${params.toString()}`;
        window.open(url, '_blank');
      } else {
        // PNG download - for now, just download the QR code itself
        // In the future, we could generate a PNG of the entire preview
        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = `homeqr-${address.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      savePreferences(options);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize QR Code"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleSavePreferences}
            disabled={loading || saving}
            className="relative"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <svg className="w-4 h-4 mr-2 inline text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved!
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
          <Button
            variant="primary"
            onClick={() => handleDownload('png')}
            disabled={loading}
          >
            Download PNG
          </Button>
          <Button
            variant="primary"
            onClick={() => handleDownload('pdf')}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Download PDF'}
          </Button>
        </>
      }
    >
      {/* Success Toast Notification */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-[10000] bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3" style={{ animation: 'slideInRight 0.3s ease-out' }}>
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-green-900">Preferences Saved</p>
            <p className="text-xs text-green-700">Your customization settings will be used for future QR codes</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Customization Options */}
        <div className="space-y-6 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 180px)' }}>
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Template
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(['sticker', 'flyer', 'business-card', 'yard-sign', 'minimal'] as TemplateType[]).map((template) => (
              <button
                key={template}
                onClick={() => setOptions(prev => ({ ...prev, template }))}
                className={`p-3 rounded-lg border-2 transition-all ${
                  options.template === template
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 capitalize">
                  {template.replace('-', ' ')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Page Size & Orientation */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Page Size
            </label>
            <select
              value={options.pageSize}
              onChange={(e) => setOptions(prev => ({ ...prev, pageSize: e.target.value as PageSize }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(PAGE_SIZES).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Orientation
            </label>
            <select
              value={options.orientation}
              onChange={(e) => setOptions(prev => ({ ...prev, orientation: e.target.value as Orientation }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        </div>

        {/* Colors */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Primary Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={options.primaryColor}
              onChange={(e) => setOptions(prev => ({ ...prev, primaryColor: e.target.value }))}
              className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
            />
            <div className="flex-1 grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setOptions(prev => ({ ...prev, primaryColor: preset.value }))}
                  className="h-8 rounded border-2 transition-all"
                  style={{
                    backgroundColor: preset.value,
                    borderColor: options.primaryColor === preset.value ? preset.value : '#e5e7eb',
                  }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Agent Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Agent Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={options.agentName}
                onChange={(e) => setOptions(prev => ({ ...prev, agentName: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Phone</label>
              <input
                type="text"
                value={options.agentPhone}
                onChange={(e) => setOptions(prev => ({ ...prev, agentPhone: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={options.agentEmail}
                onChange={(e) => setOptions(prev => ({ ...prev, agentEmail: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Brokerage</label>
              <input
                type="text"
                value={options.brokerage}
                onChange={(e) => setOptions(prev => ({ ...prev, brokerage: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your brokerage"
              />
            </div>
          </div>
        </div>

        {/* Custom Message */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Custom Message
          </label>
          <input
            type="text"
            value={options.customMessage}
            onChange={(e) => setOptions(prev => ({ ...prev, customMessage: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Scan to view property details"
          />
        </div>

        {/* QR Code Options */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              QR Code Size ({options.qrSize}%)
            </label>
            <input
              type="range"
              min="50"
              max="150"
              value={options.qrSize}
              onChange={(e) => setOptions(prev => ({ ...prev, qrSize: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Spacing
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={options.spacing}
              onChange={(e) => setOptions(prev => ({ ...prev, spacing: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>

        {/* Flyer-specific options */}
        {options.template === 'flyer' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Flyer Options</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.showPropertyImage}
                onChange={(e) => setOptions(prev => ({ ...prev, showPropertyImage: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show Property Image</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.showPropertyDetails}
                onChange={(e) => setOptions(prev => ({ ...prev, showPropertyDetails: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show Property Details (Price, Beds, Baths)</span>
            </label>
          </div>
        )}

        {/* Text Alignment */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Text Alignment
          </label>
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => setOptions(prev => ({ ...prev, textAlignment: align }))}
                className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                  options.textAlignment === align
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>
        </div>
        
        {/* Right Column - Live Preview */}
        <div className="lg:sticky lg:top-0" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <QRPreview
            qrUrl={qrUrl}
            address={address}
            city={city}
            state={state}
            price={price}
            bedrooms={bedrooms}
            bathrooms={bathrooms}
            squareFeet={squareFeet}
            propertyImage={propertyImage}
            options={options}
            agentLogo={userProfile?.logo_url || options.logoUrl || null}
          />
        </div>
      </div>
    </Modal>
  );
}

