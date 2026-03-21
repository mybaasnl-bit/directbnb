import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://directbnb.app'),
  title: {
    template: '%s | DirectBnB',
    default: 'DirectBnB',
  },
  description: 'Beheer uw B&B reserveringen direct, zonder commissie.',
};

// Root layout owns <html> and <body> as required by Next.js.
// suppressHydrationWarning prevents React from warning when next-intl
// swaps the lang attribute on the client after locale detection.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
