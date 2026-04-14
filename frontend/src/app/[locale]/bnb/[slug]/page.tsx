import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Property } from '@/types';
import { PropertyPageClient } from './PropertyPageClient';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://directbnb.app';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

/** Fallback OG image shown when the property has no cover photo yet. */
const DEFAULT_OG_IMAGE = `${APP_URL}/og-default.png`;

// ─── Server-side data fetching ────────────────────────────────────────────────

async function fetchProperty(slug: string): Promise<Property | null> {
  try {
    const res = await fetch(`${API_URL}/public/properties/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as Property;
  } catch {
    return null;
  }
}

// ─── Dynamic metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const property = await fetchProperty(params.slug);
  if (!property) return { title: 'Not Found' };

  const isNl = params.locale === 'nl';
  const city = property.addressCity ?? '';
  const name = property.name;

  const rawDescription =
    isNl
      ? property.descriptionNl || property.descriptionEn
      : property.descriptionEn || property.descriptionNl;

  // OG title — exact format requested: "[B&B Name] - Boek direct via DirectBnB"
  const ogTitle = isNl
    ? `${name} — Boek direct via DirectBnB`
    : `${name} — Book directly via DirectBnB`;

  // <title> tag — keeps location context for SEO
  const pageTitle = isNl
    ? `${name} — Bed & Breakfast in ${city} | DirectBnB`
    : `${name} — Bed and Breakfast in ${city} | DirectBnB`;

  // Short snippet used for og:description and meta description
  const descriptionSnippet = rawDescription
    ? rawDescription.replace(/\s+/g, ' ').trim().slice(0, 155)
    : null;

  const ogDescription = isNl
    ? `${descriptionSnippet ? descriptionSnippet + ' — ' : ''}Boek direct bij de eigenaar via DirectBnB.`
    : `${descriptionSnippet ? descriptionSnippet + ' — ' : ''}Book directly with the owner via DirectBnB.`;

  const metaDescription = isNl
    ? `Verblijf bij ${name} in ${city}. Boek direct bij de eigenaar — geen commissiekosten. ${descriptionSnippet ? descriptionSnippet.slice(0, 80) + '…' : ''}`
    : `Stay at ${name} in ${city}. Book directly with the owner — no commission fees. ${descriptionSnippet ? descriptionSnippet.slice(0, 80) + '…' : ''}`;

  const coverPhoto =
    property.photos?.find((p) => p.isCover) ?? property.photos?.[0];

  // Use cover photo when available, fall back to the platform default OG image.
  const ogImage = coverPhoto
    ? { url: coverPhoto.url, alt: `${name} — DirectBnB`, width: 1200, height: 630 }
    : { url: DEFAULT_OG_IMAGE, alt: 'DirectBnB', width: 1200, height: 630 };

  const canonicalUrl = `${APP_URL}/${params.locale}/bnb/${params.slug}`;

  return {
    title: pageTitle,
    description: metaDescription.trim(),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        nl: `${APP_URL}/nl/bnb/${params.slug}`,
        en: `${APP_URL}/en/bnb/${params.slug}`,
        'x-default': `${APP_URL}/nl/bnb/${params.slug}`,
      },
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription.trim(),
      url: canonicalUrl,
      siteName: 'DirectBnB',
      images: [ogImage],
      locale: isNl ? 'nl_NL' : 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription.trim(),
      images: [ogImage.url],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// ─── JSON-LD structured data ──────────────────────────────────────────────────

function buildJsonLd(property: Property, locale: string) {
  const description =
    locale === 'nl'
      ? property.descriptionNl || property.descriptionEn
      : property.descriptionEn || property.descriptionNl;

  const minPrice = property.rooms?.length
    ? Math.min(...property.rooms.map((r) => Number(r.pricePerNight)))
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: property.name,
    description: description ?? '',
    url: `${APP_URL}/${locale}/bnb/${property.slug}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.addressStreet ?? '',
      addressLocality: property.addressCity ?? '',
      postalCode: property.addressZip ?? '',
      addressCountry: property.addressCountry ?? 'NL',
    },
    image: property.photos?.map((p) => p.url) ?? [],
    priceRange: minPrice ? `Vanaf €${minPrice} per nacht` : '€€',
    availableLanguage: ['Dutch', 'English'],
    makesOffer: property.rooms?.map((r) => ({
      '@type': 'Offer',
      name: r.name,
      price: Number(r.pricePerNight).toFixed(2),
      priceCurrency: 'EUR',
    })) ?? [],
  };
}

// ─── SEO text block (server-rendered, crawlable) ──────────────────────────────

function SeoTextBlock({
  property,
  locale,
}: {
  property: Property;
  locale: string;
}) {
  const city = property.addressCity ?? '';
  const name = property.name;
  const roomCount = property.rooms?.length ?? 0;
  const maxGuests = property.rooms?.reduce((m, r) => Math.max(m, r.maxGuests), 0) ?? 0;
  const minPrice = property.rooms?.length
    ? Math.min(...property.rooms.map((r) => Number(r.pricePerNight)))
    : 0;

  if (locale === 'nl') {
    return (
      <p className="text-slate-400 text-sm leading-relaxed max-w-5xl mx-auto px-4 pb-8">
        Op zoek naar een bed and breakfast in {city}? {name} biedt{' '}
        {roomCount} {roomCount === 1 ? 'kamer' : 'kamers'} voor maximaal {maxGuests}{' '}
        {maxGuests === 1 ? 'gast' : 'gasten'}
        {minPrice > 0 ? `, vanaf €${minPrice} per nacht` : ''}.{' '}
        Boek direct bij de eigenaar via DirectBnB — geen commissie, geen tussenpersoon.
      </p>
    );
  }

  return (
    <p className="text-slate-400 text-sm leading-relaxed max-w-5xl mx-auto px-4 pb-8">
      Looking for a bed and breakfast in {city}? {name} offers{' '}
      {roomCount} {roomCount === 1 ? 'room' : 'rooms'} for up to {maxGuests}{' '}
      {maxGuests === 1 ? 'guest' : 'guests'}
      {minPrice > 0 ? ` from €${minPrice} per night` : ''}.{' '}
      Book directly with the owner on DirectBnB — no commission fees, no middleman.
    </p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PropertyPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const property = await fetchProperty(params.slug);

  if (!property) {
    notFound();
  }

  const jsonLd = buildJsonLd(property, params.locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyPageClient property={property} />
      <SeoTextBlock property={property} locale={params.locale} />
    </>
  );
}
