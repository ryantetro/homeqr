'use client';

import { useState } from 'react';
import type { GenerateQRResponse } from '@/types/api';

export function useQRCode() {
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
    } catch (err: any) {
      setError(err.message);
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



