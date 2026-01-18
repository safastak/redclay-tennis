import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth';
import './globals.css';

/**
 * Application metadata
 */
export const metadata: Metadata = {
  title: {
    default: 'Red Clay Tennis - Book Your Court',
    template: '%s | Red Clay Tennis',
  },
  description:
    'Experience the joy of tennis on authentic red clay courts. Book courts, schedule training sessions, and manage your tennis activities with Red Clay Tennis.',
  keywords: [
    'tennis',
    'court booking',
    'red clay',
    'tennis lessons',
    'sports facility',
    'tennis training',
  ],
  authors: [{ name: 'Red Clay Tennis' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Red Clay Tennis',
    title: 'Red Clay Tennis - Book Your Court',
    description:
      'Experience the joy of tennis on authentic red clay courts. Book courts, schedule training sessions, and manage your tennis activities.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Red Clay Tennis - Book Your Court',
    description:
      'Experience the joy of tennis on authentic red clay courts. Book courts, schedule training sessions, and manage your tennis activities.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Root Layout Component
 * Wraps the entire application with providers and global styles
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Inter font from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-gray-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
