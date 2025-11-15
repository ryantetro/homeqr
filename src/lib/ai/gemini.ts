/**
 * Gemini API Client
 * Handles communication with Google Gemini 2.0 Flash API
 */

import type { GeminiResponse, GeminiRequest } from '@/types/ai';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('[Gemini] GEMINI_API_KEY not set. AI enhancements will be disabled.');
}

/**
 * Generate content using Gemini API
 */
export async function generateContent(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const requestBody: GeminiRequest = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Gemini] API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as GeminiResponse;

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No candidates returned from Gemini API');
    }

    const text = data.candidates[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No text content in Gemini API response');
    }

    return text;
  } catch (error) {
    console.error('[Gemini] Error generating content:', error);
    throw error;
  }
}

/**
 * Check if Gemini API is available
 */
export function isGeminiAvailable(): boolean {
  return !!GEMINI_API_KEY;
}

