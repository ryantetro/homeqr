'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';

export default function Header() {
  const { user, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-500 ease-in-out ${
      isScrolled 
        ? 'pt-3 pb-3' 
        : 'pt-8 pb-2'
    }`}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className={`transition-all duration-500 ease-in-out ${
          isScrolled
            ? 'bg-white rounded-full shadow-lg px-8 py-2 max-w-5xl mx-auto'
            : 'bg-transparent'
        }`}>
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 transition-transform hover:scale-105">
              <Image
                src="/logo.png"
                alt="HomeQR"
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
                priority
              />
              <span className="text-2xl font-semibold text-gray-900 tracking-tight">HomeQR</span>
            </Link>

            {/* Navigation Links - Centered */}
            <nav className="hidden md:flex items-center gap-7 flex-1 justify-center">
              <Link
                href="/"
                className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
              >
                Home
              </Link>
              <Link
                href="#features"
                className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
              >
                Pricing
              </Link>
            </nav>

            {/* CTA Button / Auth - Right side */}
            <div className="flex items-center gap-3 shrink-0">
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
                      >
                        Dashboard
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const { createClient } = await import('@/lib/supabase/client');
                          const supabase = createClient();
                          await supabase.auth.signOut();
                          window.location.href = '/';
                        }}
                        className="rounded-full"
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
                      >
                        Sign in
                      </Link>
                      <Link href="/auth/signup">
                        <Button variant="primary" size="sm" className="px-5 rounded-full">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
