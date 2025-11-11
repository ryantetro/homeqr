'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Properties', href: '/dashboard/listings', icon: '🏠' },
  { name: 'Leads', href: '/dashboard/leads', icon: '👥' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: '📈' },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-56 flex flex-col bg-gray-50 transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            {/* Logo Section */}
            <div className="flex items-center shrink-0 px-4 mb-8">
              <Link href="/dashboard" className="flex items-center gap-2.5" onClick={closeMobileMenu}>
                <Image
                  src="/logo.png"
                  alt="HomeQR"
                  width={36}
                  height={36}
                  className="h-9 w-9"
                />
                <span className="text-lg font-semibold text-gray-900">HomeQR</span>
              </Link>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
              {navigation.map((item) => {
                // Precise active state detection
                let isActive = false;
                if (item.href === '/dashboard') {
                  // Dashboard is only active on exact match
                  isActive = pathname === '/dashboard';
                } else {
                  // Other routes are active if pathname starts with the href
                  isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                }
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-700 hover:bg-white/60 hover:text-gray-900'
                    )}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Sign Out Button at Bottom */}
            <div className="px-3 pb-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all duration-200 hover:shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

