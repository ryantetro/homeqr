'use client';

import { useState } from 'react';
import type { GenerateQRResponse } from '@/types/api';

function useQRCode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQR = async (listing_id: string, redirect_url?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listing_id, redirect_url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate QR code');
      }

      return data as GenerateQRResponse;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate QR code';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateQR,
    loading,
    error,
  };
}

export { useQRCode };




