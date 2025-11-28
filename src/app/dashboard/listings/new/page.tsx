'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { ExtractedListingData, ExtractionState } from '@/lib/extract/types';

export default function NewListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionUrl, setExtractionUrl] = useState('');
  const [extractionState, setExtractionState] = useState<ExtractionState>('idle');
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractedFields, setExtractedFields] = useState<Set<string>>(new Set());
  const [validationIssues, setValidationIssues] = useState<Array<{
    field: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    originalValue?: string;
    suggestedValue?: string;
  }>>([]);
  const [validationConfidence, setValidationConfidence] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    price: '',
    description: '',
    image_url: '',
    image_urls: '', // JSON string array of all images
    mls_id: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
  });

  const handleExtract = async () => {
    if (!extractionUrl.trim()) {
      setExtractionError('Please enter a listing URL');
      return;
    }

    setExtractionState('extracting');
    setExtractionError(null);
    setExtractedFields(new Set());

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: extractionUrl.trim() }),
      });

      const data = await response.json();

      if (!data.success || !data.data) {
        setExtractionState('error');
        setExtractionError(
          data.error || 'Could not extract listing data. Please try manual entry.'
        );
        return;
      }

      const extracted: ExtractedListingData = data.data;
      const fields = new Set<string>(data.extractedFields || []);

      // Store validation results
      if (data.validation) {
        setValidationIssues(data.validation.issues || []);
        setValidationConfidence(data.validation.confidence || null);
      } else {
        setValidationIssues([]);
        setValidationConfidence(null);
      }

      // Helper to convert formatted price to number string for input
      const formatPriceForInput = (price: string | undefined): string => {
        if (!price) return '';
        // Remove $ and commas, keep only digits
        return price.replace(/[$,]/g, '');
      };

      // Pre-fill form with extracted data
      setFormData({
        address: extracted.address || formData.address,
        city: extracted.city || formData.city,
        state: extracted.state || formData.state,
        zip: extracted.zip || formData.zip,
        price: formatPriceForInput(extracted.price) || formData.price,
        description: extracted.description || formData.description,
        image_url: extracted.imageUrl || formData.image_url,
        image_urls: extracted.imageUrls && extracted.imageUrls.length > 0 
          ? JSON.stringify(extracted.imageUrls) 
          : formData.image_urls,
        mls_id: extracted.mlsId || formData.mls_id,
        bedrooms: extracted.bedrooms || formData.bedrooms,
        bathrooms: extracted.bathrooms || formData.bathrooms,
        square_feet: extracted.squareFeet || formData.square_feet,
      });

      setExtractedFields(fields);

      if (data.missingFields && data.missingFields.length > 0) {
        setExtractionState('partial');
      } else {
        setExtractionState('success');
      }
    } catch (err: unknown) {
      setExtractionState('error');
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to extract listing data. Please try again.';
      setExtractionError(message);
    }
  };

  const handleClearExtraction = () => {
    setExtractionUrl('');
    setExtractionState('idle');
    setExtractionError(null);
    setExtractedFields(new Set());
    setValidationIssues([]);
    setValidationConfidence(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create listing');
      }

      router.push(`/dashboard/listings/${data.data.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create listing';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isFieldExtracted = (fieldName: string): boolean => {
    return extractedFields.has(fieldName);
  };

  // Check for URL in query params and pre-fill, then auto-extract
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam && extractionState === 'idle') {
      const decodedUrl = decodeURIComponent(urlParam);
      setExtractionUrl(decodedUrl);
      
      // Auto-extract after URL is set
      if (decodedUrl.trim()) {
        const extractWithUrl = async () => {
          setExtractionState('extracting');
          setExtractionError(null);
          setExtractedFields(new Set());

          try {
            const response = await fetch('/api/extract', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ url: decodedUrl.trim() }),
            });

            const data = await response.json();

            if (!data.success || !data.data) {
              setExtractionState('error');
              setExtractionError(
                data.error || 'Could not extract listing data. Please try manual entry.'
              );
              return;
            }

            const extracted: ExtractedListingData = data.data;
            const fields = new Set<string>(data.extractedFields || []);

            // Store validation results
            if (data.validation) {
              setValidationIssues(data.validation.issues || []);
              setValidationConfidence(data.validation.confidence || null);
            } else {
              setValidationIssues([]);
              setValidationConfidence(null);
            }

            // Helper to convert formatted price to number string for input
            const formatPriceForInput = (price: string | undefined): string => {
              if (!price) return '';
              // Remove $ and commas, keep only digits
              return price.replace(/[$,]/g, '');
            };

            // Pre-fill form with extracted data
            setFormData({
              address: extracted.address || formData.address,
              city: extracted.city || formData.city,
              state: extracted.state || formData.state,
              zip: extracted.zip || formData.zip,
              price: formatPriceForInput(extracted.price) || formData.price,
              description: extracted.description || formData.description,
              image_url: extracted.imageUrl || formData.image_url,
              image_urls: extracted.imageUrls && extracted.imageUrls.length > 0 
                ? JSON.stringify(extracted.imageUrls) 
                : formData.image_urls,
              mls_id: extracted.mlsId || formData.mls_id,
              bedrooms: extracted.bedrooms || formData.bedrooms,
              bathrooms: extracted.bathrooms || formData.bathrooms,
              square_feet: extracted.squareFeet || formData.square_feet,
            });

            setExtractedFields(fields);

            if (data.missingFields && data.missingFields.length > 0) {
              setExtractionState('partial');
            } else {
              setExtractionState('success');
            }
          } catch (err: unknown) {
            setExtractionState('error');
            const message =
              err instanceof Error
                ? err.message
                : 'Failed to extract listing data. Please try again.';
            setExtractionError(message);
          }
        };

        extractWithUrl();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Listing</h1>
        <p className="mt-2 text-gray-600">
          Paste a listing URL to automatically extract property details
        </p>
      </div>

      {/* URL Extraction Section */}
      <Card className="mb-6 border border-gray-200 hover:border-gray-300 transition-colors">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">Paste Listing URL</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Works with Zillow, Realtor.com, Redfin, Homes.com, Trulia, and more
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input
                type="url"
                value={extractionUrl}
                onChange={(e) => setExtractionUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && extractionUrl.trim() && extractionState !== 'extracting') {
                    handleExtract();
                  }
                }}
                placeholder="https://www.zillow.com/homedetails/..."
                disabled={extractionState === 'extracting'}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
              />
            </div>
            
            <Button
              type="button"
              variant="primary"
              onClick={handleExtract}
              disabled={extractionState === 'extracting' || !extractionUrl.trim()}
              className="w-full justify-center py-2.5 text-sm font-medium"
            >
                {extractionState === 'extracting' ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Extracting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2 inline"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Extract Details
                  </>
                )}
              </Button>

            {/* Platform Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-gray-500">Supported:</span>
              <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-600 rounded border border-gray-200">Zillow</span>
              <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-600 rounded border border-gray-200">Realtor.com</span>
              <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-600 rounded border border-gray-200">Redfin</span>
              <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-600 rounded border border-gray-200">Homes.com</span>
              <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-600 rounded border border-gray-200">Trulia</span>
            </div>
          </div>

          {/* Extraction Status Messages */}
          {extractionState === 'extracting' && (
            <div className="mt-6 p-4 bg-blue-100 border-2 border-blue-300 rounded-xl">
              <div className="flex items-center justify-center gap-3 text-blue-700">
                <svg
                  className="animate-spin h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-base font-semibold">
                  Extracting listing details...
                </span>
              </div>
            </div>
          )}

          {extractionState === 'success' && (
            <div className="mt-6 p-4 bg-green-100 border-2 border-green-300 rounded-xl">
              <div className="flex items-center justify-center gap-3 text-green-700">
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-base font-semibold">
                  Details extracted successfully! Review and edit the form below.
                </span>
              </div>
            </div>
          )}

          {extractionState === 'partial' && (
            <div className="mt-6 p-4 bg-amber-100 border-2 border-amber-300 rounded-xl">
              <div className="flex items-start gap-3 text-amber-700">
                <svg
                  className="h-6 w-6 mt-0.5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-base font-semibold">
                    Partial extraction completed. Some fields may be missing.
                  </p>
                  <p className="text-sm mt-1 text-amber-600">
                    Please review and complete any missing information.
                  </p>
                </div>
              </div>
            </div>
          )}

          {extractionState === 'error' && extractionError && (
            <div className="mt-6 p-4 bg-red-100 border-2 border-red-300 rounded-xl">
              <div className="flex items-start gap-3 text-red-700">
                <svg
                  className="h-6 w-6 mt-0.5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-base font-semibold">{extractionError}</p>
                  <button
                    type="button"
                    onClick={handleExtract}
                    className="text-sm mt-2 text-red-600 hover:text-red-800 underline font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Validation Issues */}
          {validationIssues.length > 0 && (extractionState === 'success' || extractionState === 'partial') && (
            <div className="mt-6 space-y-3">
              {validationConfidence !== null && (
                <div className={`p-3 rounded-xl text-sm font-semibold text-center ${
                  validationConfidence >= 80 
                    ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                    : validationConfidence >= 60 
                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                    : 'bg-red-100 text-red-700 border-2 border-red-300'
                }`}>
                  Data Quality: {validationConfidence}% confidence
                </div>
              )}
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-start gap-2 mb-3">
                  <svg
                    className="h-5 w-5 mt-0.5 shrink-0 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-blue-900">
                    Data Validation ({validationIssues.length} issue{validationIssues.length !== 1 ? 's' : ''})
                  </p>
                </div>
                <div className="space-y-2">
                  {validationIssues.map((issue, index) => (
                    <div
                      key={index}
                      className={`text-sm p-3 rounded-lg ${
                        issue.severity === 'error'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : issue.severity === 'warning'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-semibold capitalize">{issue.field}:</span>
                        <span className="flex-1">{issue.message}</span>
                      </div>
                      {issue.suggestedValue && (
                        <div className="mt-2 text-xs opacity-75">
                          Suggested: {issue.suggestedValue}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Manual Form - Only show after extraction or if user wants to edit */}
      {(extractionState === 'success' || extractionState === 'partial' || extractionState === 'error') && (
        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Review & Edit Details</h3>
              <p className="text-sm text-gray-600 mt-1">Make any necessary changes before creating your listing</p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldExtracted('address')
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
              />
              {isFieldExtracted('address') && (
                <p className="mt-1 text-xs text-green-600">Extracted from URL</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldExtracted('city')
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldExtracted('state')
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldExtracted('zip')
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldExtracted('price')
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MLS ID
              </label>
              <input
                type="text"
                value={formData.mls_id}
                onChange={(e) => setFormData({ ...formData, mls_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldExtracted('mlsId')
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldExtracted('bedrooms')
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldExtracted('bathrooms')
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Square Feet
              </label>
              <input
                type="number"
                value={formData.square_feet}
                onChange={(e) => setFormData({ ...formData, square_feet: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldExtracted('squareFeet')
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldExtracted('images')
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFieldExtracted('description')
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
                }`}
              />
            </div>
          </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" variant="primary" disabled={loading} className="px-8">
                {loading ? 'Creating...' : 'Create Listing'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Show manual form option if no extraction attempted yet */}
      {extractionState === 'idle' && (
        <Card className="mt-6">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Or Enter Details Manually</h3>
              <p className="text-sm text-gray-600 mt-1">Fill in the form below if you prefer manual entry</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MLS ID
                </label>
                <input
                  type="text"
                  value={formData.mls_id}
                  onChange={(e) => setFormData({ ...formData, mls_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrooms
                </label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bathrooms
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Square Feet
                </label>
                <input
                  type="number"
                  value={formData.square_feet}
                  onChange={(e) => setFormData({ ...formData, square_feet: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" variant="primary" disabled={loading} className="px-8">
                {loading ? 'Creating...' : 'Create Listing'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}




