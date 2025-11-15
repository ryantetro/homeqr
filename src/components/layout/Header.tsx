'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function Header() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [shrunk, setShrunk] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const rafRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Check if we're on a microsite page (listing pages)
  const isMicrosite = pathname?.match(/^\/([^\/]+)$/) || pathname?.startsWith('/listing/');

  useEffect(() => {
    // On microsite pages, hide header when scrolling down, show when scrolling up
    if (isMicrosite) {
      setShrunk(true);
      
      const handleScroll = () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        
        rafRef.current = requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Hide header when scrolling down past 100px, show when scrolling up or at top
          if (currentScrollY > 100 && currentScrollY > lastScrollY) {
            // Scrolling down - hide header
            setIsScrolledDown(true);
          } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
            // Scrolling up or near top - show header
            setIsScrolledDown(false);
          }
          
          setLastScrollY(currentScrollY);
        });
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        window.removeEventListener('scroll', handleScroll);
      };
    }

    // On other pages, use scroll-based shrinking
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        setShrunk(window.scrollY > 80);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMicrosite, lastScrollY]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        mobileMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-transform duration-300 ease-in-out ${
        isMicrosite 
          ? `bg-white shadow-sm ${isScrolledDown ? '-translate-y-full' : 'translate-y-0'}` 
          : ''
      }`}
    >
      <div className="container mx-auto px-3 sm:px-6 md:px-8 lg:px-12 relative">
        {/* Fixed frame - no layout changes, only GPU-friendly properties */}
        <div
          className={`relative w-full transition-[background-color,box-shadow,backdrop-filter] duration-700 ease-in-out ${
            isMicrosite 
              ? 'rounded-none backdrop-blur-none mt-0 mb-0' // Seamless on microsites
              : 'rounded-full sm:rounded-full backdrop-blur-md mt-2 sm:mt-4 mb-2'
          }`}
          style={{
            backgroundColor: isMicrosite 
              ? 'rgba(255, 255, 255, 1)' // Always solid white on microsites
              : shrunk 
                ? 'rgba(255, 255, 255, 0.95)' 
                : 'rgba(255, 255, 255, 0)',
            backdropFilter: isMicrosite ? 'none' : (shrunk ? 'blur(12px)' : 'blur(0px)'),
            WebkitBackdropFilter: isMicrosite ? 'none' : (shrunk ? 'blur(12px)' : 'blur(0px)'),
            boxShadow: isMicrosite 
              ? 'none' // No shadow on microsites for seamless look
              : (shrunk 
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' 
                : 'none'),
          }}
        >
          <div className={`flex items-center justify-between gap-2 sm:gap-4 ${
            isMicrosite 
              ? 'px-4 sm:px-6 md:px-8 py-3 sm:py-4' // Seamless padding on microsites
              : 'px-3 sm:px-6 py-2.5 sm:py-3 md:px-8'
          }`}>
            {/* Logo - smaller on mobile, fixed container, scale via transform */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 transition-transform hover:scale-105 min-w-0">
              <div
                className="relative h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 transition-transform duration-700 ease-in-out will-change-transform shrink-0"
                style={{
                  transform: shrunk ? 'scale(0.625)' : 'scale(1)',
                }}
              >
                <Image
                  src="/logo.png"
                  alt="HomeQR"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span
                className="font-semibold text-gray-900 tracking-tight origin-left transition-[opacity,transform] duration-700 ease-in-out will-change-transform hidden sm:inline-block"
                style={{
                  fontSize: '1.5rem',
                  lineHeight: '2rem',
                  transform: shrunk ? 'scale(0.75) translateY(-2px)' : 'scale(1)',
                  opacity: shrunk ? 0.9 : 1,
                }}
              >
                HomeQR
              </span>
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

            {/* Desktop CTA Buttons / Auth - Right side */}
            <div className="hidden md:flex items-center gap-3 shrink-0 min-w-0">
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 whitespace-nowrap"
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
                      <Link href="/auth/login">
                        <Button variant="primary" size="sm" className="px-4 rounded-full whitespace-nowrap">
                          Sign in
                        </Button>
                      </Link>
                      <Link href="/auth/signup">
                        <Button variant="primary" size="sm" className="px-5 rounded-full whitespace-nowrap">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Mobile Hamburger Menu Button */}
            <div className="md:hidden shrink-0">
              <button
                ref={hamburgerRef}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        ref={menuRef}
        className={`md:hidden absolute top-full left-0 right-0 mt-2 mx-3 sm:mx-6 bg-white rounded-xl border border-gray-200 shadow-xl z-40 overflow-hidden transition-all duration-300 ease-out ${
          mobileMenuOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto visible'
            : 'opacity-0 -translate-y-2 pointer-events-none invisible'
        }`}
      >
        <div className="py-2">
          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={async () => {
                      const { createClient } = await import('@/lib/supabase/client');
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      window.location.href = '/';
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
