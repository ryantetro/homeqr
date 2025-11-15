'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import AIEnhancements from './AIEnhancements';

interface AIEnhancementControlsProps {
  listingId: string;
  aiDescription?: string | null;
  aiKeyFeatures?: string | null;
  aiLifestyleSummary?: string | null;
  aiSocialCaption?: string | null;
  originalDescription?: string | null;
  aiEnhancementStatus?: string | null;
  aiEnhancedAt?: string | null;
}

export default function AIEnhancementControls({
  listingId,
  aiDescription,
  aiKeyFeatures,
  aiLifestyleSummary,
  aiSocialCaption,
  originalDescription,
  aiEnhancementStatus,
  aiEnhancedAt,
}: AIEnhancementControlsProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementError, setEnhancementError] = useState<string | null>(null);

  const handleReEnhance = async () => {
    setIsEnhancing(true);
    setEnhancementError(null);

    try {
      const response = await fetch('/api/listings/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to enhance listing');
      }

      // Refresh the page to show new enhancements
      window.location.reload();
    } catch (error) {
      console.error('AI enhancement error:', error);
      setEnhancementError(error instanceof Error ? error.message : 'Failed to enhance listing');
      setIsEnhancing(false);
    }
  };

  const hasAIContent = aiDescription || aiKeyFeatures || aiLifestyleSummary || aiSocialCaption;

  return (
    <Card className="border border-gray-200">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">AI Enhancements</h2>
          </div>
          {aiEnhancementStatus && (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                aiEnhancementStatus === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : aiEnhancementStatus === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {aiEnhancementStatus === 'completed'
                ? 'Enhanced'
                : aiEnhancementStatus === 'failed'
                ? 'Failed'
                : 'Pending'}
            </span>
          )}
        </div>
        {aiEnhancedAt && (
          <p className="mt-2 text-xs text-gray-500">
            Last enhanced: {new Date(aiEnhancedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="p-6 space-y-4">
        {hasAIContent ? (
          <>
            <AIEnhancements
              aiDescription={aiDescription}
              aiKeyFeatures={aiKeyFeatures}
              aiLifestyleSummary={aiLifestyleSummary}
              aiSocialCaption={aiSocialCaption}
              originalDescription={originalDescription}
              hideSocialCaption={false}
              showAILabels={true}
            />
            <div className="pt-4 border-t border-gray-200">
              <Button
                onClick={handleReEnhance}
                disabled={isEnhancing}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isEnhancing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enhancing...
                  </>
                ) : (
                  'Re-enhance with AI'
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900">No AI Enhancements Yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Enhance this listing with AI-generated descriptions, features, and social media captions.
            </p>
            <div className="mt-6">
              <Button
                onClick={handleReEnhance}
                disabled={isEnhancing}
                variant="primary"
                size="sm"
              >
                {isEnhancing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enhancing...
                  </>
                ) : (
                  'Enhance with AI'
                )}
              </Button>
            </div>
          </div>
        )}

        {enhancementError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{enhancementError}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

