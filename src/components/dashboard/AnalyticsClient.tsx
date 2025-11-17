'use client';

import { useState, useEffect } from 'react';
import FeatureBlurOverlay from '@/components/ui/FeatureBlurOverlay';

interface AnalyticsClientProps {
  children: React.ReactNode;
  feature: 'advanced_analytics' | 'csv_export';
  featureName: string;
  description?: string;
}

export default function AnalyticsClient({ 
  children, 
  feature, 
  featureName, 
  description 
}: AnalyticsClientProps) {
  const [hasFeature, setHasFeature] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        const response = await fetch(`/api/subscription/features?feature=${feature}`);
        if (response.ok) {
          const data = await response.json();
          setHasFeature(data.hasFeature || false);
        }
      } catch (error) {
        console.error('Error checking feature:', error);
      } finally {
        setLoading(false);
      }
    };
    checkFeature();
  }, [feature]);

  if (loading) {
    return <div className="relative">{children}</div>;
  }

  return (
    <div className="relative">
      {children}
      {!hasFeature && (
        <FeatureBlurOverlay 
          featureName={featureName}
          description={description}
        />
      )}
    </div>
  );
}

