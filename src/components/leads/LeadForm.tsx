'use client';

import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';

interface LeadFormProps {
  listingId: string;
  agentName?: string;
  onSubmit?: (lead: any) => void;
}

export default function LeadForm({ listingId, agentName, onSubmit }: LeadFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    scheduleTour: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus on first field
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: listingId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit lead');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', scheduleTour: false });

      if (onSubmit) {
        onSubmit(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg text-center">
        <div className="flex items-center justify-center mb-3">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-green-700 font-bold text-xl mb-1">
          Thank you!
        </p>
        <p className="text-green-700 font-semibold text-base">
          {agentName ? `${agentName} will contact you soon.` : "We'll be in touch soon."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Urgency messaging */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
        <p className="text-sm text-blue-800 font-medium">
          ⚡ Get instant property details and schedule a showing
        </p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
          Name *
        </label>
        <input
          ref={nameInputRef}
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          placeholder="Your full name"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
          Phone *
        </label>
        <input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          placeholder="(555) 123-4567"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
          Email *
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          placeholder="your.email@example.com"
        />
      </div>
      <div className="flex items-start">
        <input
          id="scheduleTour"
          type="checkbox"
          checked={formData.scheduleTour}
          onChange={(e) => setFormData({ ...formData, scheduleTour: e.target.checked })}
          className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="scheduleTour" className="ml-3 text-sm text-gray-700">
          I'm interested in scheduling a tour
        </label>
      </div>
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm font-medium">
          {error}
        </div>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full shadow-lg hover:shadow-xl transition-all py-4 text-base font-semibold"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Submitting...
          </span>
        ) : (
          'Request Information'
        )}
      </Button>
    </form>
  );
}



