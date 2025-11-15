'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';

interface AIEnhancementsProps {
  aiDescription?: string | null;
  aiKeyFeatures?: string | null; // JSON array string
  aiLifestyleSummary?: string | null;
  aiSocialCaption?: string | null;
  originalDescription?: string | null;
  hideSocialCaption?: boolean; // Hide social caption (for public microsite)
  showAILabels?: boolean; // Show "AI-Enhanced" labels (default: false for public)
}

export default function AIEnhancements({
  aiDescription,
  aiKeyFeatures,
  aiLifestyleSummary,
  aiSocialCaption,
  originalDescription,
  hideSocialCaption = false,
  showAILabels = false,
}: AIEnhancementsProps) {
  const [copied, setCopied] = useState(false);

  // Parse key features from JSON string
  let keyFeatures: string[] = [];
  try {
    if (aiKeyFeatures) {
      const parsed = JSON.parse(aiKeyFeatures);
      if (Array.isArray(parsed)) {
        keyFeatures = parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }

  // Don't include social caption in hasAIContent check if it's hidden
  const hasAIContent = aiDescription || keyFeatures.length > 0 || aiLifestyleSummary || (!hideSocialCaption && aiSocialCaption);

  if (!hasAIContent) {
    return null;
  }

  const handleCopyCaption = async () => {
    if (aiSocialCaption) {
      try {
        await navigator.clipboard.writeText(aiSocialCaption);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Description */}
      {aiDescription && (
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {showAILabels ? 'AI-Enhanced Description' : 'About This Property'}
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{aiDescription}</p>
          </div>
        </Card>
      )}

      {/* Key Features */}
      {keyFeatures.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Property Highlights</h3>
            <ul className="space-y-2">
              {keyFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-700 flex-1">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Lifestyle Summary */}
      {aiLifestyleSummary && (
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Neighborhood & Lifestyle</h3>
            <p className="text-gray-700 leading-relaxed">{aiLifestyleSummary}</p>
          </div>
        </Card>
      )}

      {/* Social Media Caption - Only show if not hidden (for dashboard) */}
      {aiSocialCaption && !hideSocialCaption && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Social Media Caption</h3>
              </div>
              <button
                onClick={handleCopyCaption}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">{aiSocialCaption}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

