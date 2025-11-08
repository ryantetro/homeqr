'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className="transition-opacity duration-700 ease-out"
      style={{
        opacity: isLoaded ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
}

