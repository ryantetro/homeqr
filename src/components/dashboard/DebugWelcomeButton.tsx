'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

export default function DebugWelcomeButton() {
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // Only show in development
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  const handleDebugWelcome = () => {
    // Trigger welcome screen via window function or URL parameter
    if (typeof window !== 'undefined') {
      // Try calling the window function first
      if ((window as any).debugShowWelcome) {
        (window as any).debugShowWelcome();
      } else {
        // Fallback: use URL parameter
        window.location.href = '/dashboard?trial=activated';
      }
    }
  };

  if (!isDev) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDebugWelcome}
      className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
      title="Debug: Show Welcome Screen"
    >
      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Debug: Welcome Screen
    </Button>
  );
}

