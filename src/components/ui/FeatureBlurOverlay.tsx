'use client';

import { useRouter } from 'next/navigation';
import Button from './Button';

interface FeatureBlurOverlayProps {
  featureName: string;
  description?: string;
}

export default function FeatureBlurOverlay({ featureName, description }: FeatureBlurOverlayProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push('/dashboard/billing');
  };

  return (
    <div className="absolute inset-0 backdrop-blur-md bg-white/70 flex items-center justify-center z-10 rounded-lg">
      <div className="text-center p-6 max-w-sm">
        <div className="mb-4">
          <svg className="w-12 h-12 text-blue-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upgrade to Pro</h3>
        <p className="text-sm text-gray-600 mb-4">
          {description || `Unlock ${featureName} with a Pro subscription`}
        </p>
        <Button
          variant="primary"
          onClick={handleUpgrade}
          className="w-full"
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
}

