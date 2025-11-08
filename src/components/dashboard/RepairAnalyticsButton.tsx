'use client';

import { useState } from 'react';

export default function RepairAnalyticsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; stats?: any } | null>(null);

  const handleRepair = async () => {
    if (!confirm('This will recalculate all analytics data from scan sessions. Continue?')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/repair-analytics', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Reload the page after 2 seconds to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to repair analytics',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-right">
      <button
        onClick={handleRepair}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '🔄 Repairing...' : '🔧 Repair Analytics'}
      </button>
      
      {result && (
        <div className={`mt-2 text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.message}
          {result.stats && (
            <div className="text-xs mt-1 text-gray-600">
              Created: {result.stats.recordsCreated}, Updated: {result.stats.recordsUpdated}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

