'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
  showPattern?: boolean;
}

export function AuthLayout({ children, showPattern = true }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative overflow-hidden">
      {/* Background pattern */}
      {showPattern && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Tennis court pattern - subtle lines */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="tennis-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="100" height="100" fill="none" stroke="#C75B39" strokeWidth="1" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#C75B39" strokeWidth="1" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#C75B39" strokeWidth="1" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#tennis-pattern)" />
            </svg>
          </div>

          {/* Decorative circles (tennis balls) */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#C75B39]/5" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#2D5A27]/5" />
          <div className="absolute top-1/4 -left-16 w-32 h-32 rounded-full bg-[#C75B39]/3" />
          <div className="absolute bottom-1/4 -right-12 w-24 h-24 rounded-full bg-[#2D5A27]/3" />
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#C75B39] flex items-center justify-center shadow-md">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeWidth="2" d="M12 2C6.5 2 2 6.5 2 12M22 12c0 5.5-4.5 10-10 10" />
                <path strokeWidth="2" d="M2 12h20M12 2v20" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-[#C75B39]">Red Clay Tennis</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Auth card */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-8">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>{new Date().getFullYear()} Red Clay Tennis. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-[#C75B39] transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-[#C75B39] transition-colors">
                Privacy
              </Link>
              <Link href="/contact" className="hover:text-[#C75B39] transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Components for building auth forms
export function AuthTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
      {children}
    </h1>
  );
}

export function AuthSubtitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-gray-600 text-center mb-6">
      {children}
    </p>
  );
}

export function AuthDivider({ text = 'or' }: { text?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white text-gray-500">{text}</span>
      </div>
    </div>
  );
}

export function AuthFooterLink({
  text,
  linkText,
  href,
}: {
  text: string;
  linkText: string;
  href: string;
}) {
  return (
    <p className="mt-6 text-center text-sm text-gray-600">
      {text}{' '}
      <Link href={href} className="font-medium text-[#C75B39] hover:text-[#A84A2E] transition-colors">
        {linkText}
      </Link>
    </p>
  );
}
