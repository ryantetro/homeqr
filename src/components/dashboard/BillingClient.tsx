'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function BillingClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageBilling = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to open billing portal');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to open billing portal';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Billing Management</h4>
        <p className="text-sm text-gray-600 mb-4">
          Update your payment method, change plans, download invoices, or cancel your subscription.
        </p>
        <Button
          variant="primary"
          onClick={handleManageBilling}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? 'Opening...' : 'Manage Billing'}
        </Button>
      </div>
    </div>
  );
}

