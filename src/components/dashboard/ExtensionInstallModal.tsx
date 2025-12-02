'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';

interface ExtensionInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExtensionStatus = 'checking' | 'installed' | 'not-installed' | 'unknown';

export default function ExtensionInstallModal({ isOpen, onClose }: ExtensionInstallModalProps) {
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>('checking');
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  
  const chromeWebStoreUrl = process.env.NEXT_PUBLIC_CHROME_WEB_STORE_URL || 'https://chromewebstore.google.com/detail/miggfgghddpmbnblcoodakemagbjlenf?utm_source=item-share-cb';

  const checkExtensionInstalled = useCallback(async () => {
    try {
      // Try to detect if extension is installed
      // For now, we'll default to 'not-installed' since we don't have the extension ID yet
      // Once the extension is published to Chrome Web Store, we can use the extension ID
      // to properly detect if it's installed
      
      // Check if we're in a Chrome environment
      if (typeof window === 'undefined') {
        queueMicrotask(() => setExtensionStatus('unknown'));
        return;
      }

      // For now, we can't reliably detect if the extension is installed without the extension ID
      // This will be enhanced once the extension is published to Chrome Web Store
      // Users can manually check if they have it installed
      queueMicrotask(() => setExtensionStatus('not-installed'));
    } catch (error) {
      console.error('Error checking extension status:', error);
      queueMicrotask(() => setExtensionStatus('unknown'));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkExtensionInstalled();
    }
  }, [isOpen, checkExtensionInstalled]);

  const handleChromeWebStoreInstall = () => {
    if (chromeWebStoreUrl) {
      window.open(chromeWebStoreUrl, '_blank');
    }
  };

  const handleOpenExtensionsPage = () => {
    // Try to open chrome://extensions/ page
    // Note: This only works in Chrome and may require user interaction
    window.open('chrome://extensions/', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Install HomeQR Extension</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Extension Status */}
          {extensionStatus === 'installed' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-green-900">Extension Installed!</p>
                  <p className="text-sm text-green-700">You can now use the HomeQR extension to generate QR codes from property listings.</p>
                </div>
              </div>
            </div>
          )}

          {/* Chrome Web Store Install */}
          {extensionStatus !== 'installed' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Install from Chrome Web Store</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Install the HomeQR extension with one click from the Chrome Web Store. This is the recommended method.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleChromeWebStoreInstall}
                  className="w-full"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Install from Chrome Web Store
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>
            </div>
          )}

          {/* Manual Installation Instructions */}
          {showManualInstructions && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Manual Installation</h3>
                <button
                  onClick={() => setShowManualInstructions(!showManualInstructions)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Hide manual instructions
                </button>
              </div>
              <p className="text-gray-600 text-sm">
                Follow these steps to manually install the extension for development or testing:
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-4">
                <div className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">Open Chrome Extensions Page</p>
                    <p className="text-sm text-gray-600 mb-2">
                      Navigate to <code className="bg-white px-2 py-1 rounded text-xs font-mono">chrome://extensions/</code>
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenExtensionsPage}
                      className="mt-2"
                    >
                      Open Extensions Page
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">Enable Developer Mode</p>
                    <p className="text-sm text-gray-600">
                      Toggle the <strong>&quot;Developer mode&quot;</strong> switch in the top-right corner of the extensions page.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">Click &quot;Load Unpacked&quot;</p>
                    <p className="text-sm text-gray-600 mb-2">
                      Click the <strong>&quot;Load unpacked&quot;</strong> button that appears after enabling Developer mode.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">Select Extension Folder</p>
                    <p className="text-sm text-gray-600 mb-2">
                      Navigate to the <code className="bg-white px-2 py-1 rounded text-xs font-mono">extension/</code> folder in your HomeQR project directory and select it.
                    </p>
                    <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-xs text-gray-600">
                      <strong>Note:</strong> The extension files are located in the <code className="bg-gray-100 px-1.5 py-0.5 rounded">extension/</code> folder of your HomeQR project.
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    5
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">Pin to Toolbar</p>
                    <p className="text-sm text-gray-600">
                      Once installed, pin the extension to your Chrome toolbar for easy access when browsing property listings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-900 mb-1">Tip</p>
                    <p className="text-xs text-yellow-800">
                      After installation, visit any property listing page (Zillow, Realtor.com, etc.) and click the HomeQR extension icon to generate QR codes instantly!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            {extensionStatus === 'installed' ? (
              <Button variant="primary" onClick={onClose}>
                Got it!
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowManualInstructions(!showManualInstructions)}>
                  {showManualInstructions ? 'Hide' : 'Show'} Manual Instructions
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

