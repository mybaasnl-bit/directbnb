import type { Metadata } from 'next';
import { Archivo, Playfair_Display } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

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
      <body className={`${archivo.variable} ${playfair.variable} font-sans`}>{children}</body>
    </html>
  );
}
