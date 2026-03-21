import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';
import '../../globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://directbnb.nl'),
  title: {
    default: 'DirectBnB — Directe boekingen zonder commissie',
    template: '%s | DirectBnB',
  },
  description:
    'DirectBnB helpt Bed & Breakfast eigenaren om directe boekingen te ontvangen zonder hoge commissies. Eigen boekingspagina, eenvoudig dashboard, 0% commissie.',
  keywords: ['B&B boekingen', 'Bed en Breakfast', 'directe boekingen', 'no commission', 'booking systeem'],
  openGraph: {
    title: 'DirectBnB — Directe boekingen zonder commissie',
    description:
      'Ontvang directe boekingen voor jouw B&B. Geen commissie, eigen boekingspagina, eenvoudig dashboard.',
    url: 'https://directbnb.nl',
    siteName: 'DirectBnB',
    locale: 'nl_NL',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DirectBnB — Directe boekingen voor B&B eigenaren',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DirectBnB — Directe boekingen zonder commissie',
    description: 'Ontvang directe boekingen voor jouw B&B. Geen commissie.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
