'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import { useQRCode } from '@/hooks/useQRCode';

interface QRCodeDisplayProps {
  listingId: string;
  existingQR?: {
    id: string;
    qr_url: string;
    scan_count: number;
  } | null;
  analyticsScanCount?: number; // Pass analytics scan count as prop
  onQRGenerated?: (qr: any) => void;
}

export default function QRCodeDisplay({ listingId, existingQR, analyticsScanCount, onQRGenerated }: QRCodeDisplayProps) {
  const { generateQR, loading, error } = useQRCode();
  const [qrData, setQrData] = useState(existingQR);
  const [scanCount, setScanCount] = useState(existingQR?.scan_count || 0);

  // Use analytics scan count if provided (more accurate), otherwise use QR code scan_count
  useEffect(() => {
    if (analyticsScanCount !== undefined) {
      setScanCount(analyticsScanCount);
    } else if (existingQR?.scan_count !== undefined) {
      setScanCount(existingQR.scan_count);
    }
  }, [analyticsScanCount, existingQR?.scan_count]);

  // Periodically refresh scan count from database
  useEffect(() => {
    const refreshScanCount = async () => {
      const supabase = createClient();
      // Try to get from analytics first (more accurate)
      if (analyticsScanCount === undefined) {
        const { data: qrCode } = await supabase
          .from('qrcodes')
          .select('scan_count')
          .eq('listing_id', listingId)
          .single();
        
        if (qrCode) {
          setScanCount(qrCode.scan_count || 0);
        }
      }
    };

    // Refresh immediately and then every 10 seconds
    refreshScanCount();
    const interval = setInterval(refreshScanCount, 10000);

    return () => clearInterval(interval);
  }, [listingId, analyticsScanCount]);

  const handleGenerate = async () => {
    try {
      const qr = await generateQR(listingId);
      setQrData(qr);
      if (onQRGenerated) {
        onQRGenerated(qr);
      }
    } catch (err) {
      console.error('Failed to generate QR:', err);
    }
  };

  const handleDownload = () => {
    if (!qrData?.qr_url) return;
    const link = document.createElement('a');
    link.href = qrData.qr_url;
    link.download = `homeqr-${listingId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (!qrData?.id) return;
    window.open(`/api/qr/${listingId}/pdf`, '_blank');
  };

  if (qrData?.qr_url) {
    return (
      <div className="space-y-5">
        <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg shadow-sm mb-5">
              <img
                src={qrData.qr_url}
                alt="QR Code"
                className="w-56 h-56"
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Scan Count
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {scanCount}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <Button 
            onClick={handleDownload} 
            variant="primary" 
            className="w-full"
            size="md"
          >
            Download QR Code (PNG)
          </Button>
          <Button 
            onClick={handleDownloadPDF} 
            variant="primary" 
            className="w-full"
            size="md"
          >
            Download QR Sticker (PDF)
          </Button>
          <Button 
            onClick={handleGenerate} 
            variant="outline" 
            disabled={loading}
            className="w-full"
            size="md"
          >
            {loading ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </div>
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-10 rounded-lg border border-gray-200 text-center">
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          No QR code generated yet. Click the button below to create one.
        </p>
        <Button 
          onClick={handleGenerate} 
          variant="primary" 
          disabled={loading}
          size="md"
          className="w-full"
        >
          {loading ? 'Generating...' : 'Generate QR Code'}
        </Button>
      </div>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
          {error}
        </div>
      )}
    </div>
  );
}


