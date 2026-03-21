import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://directbnb.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/*/dashboard/',
        '/*/admin/',
        '/*/settings/',
        '/*/bookings/',
        '/*/guests/',
        '/*/calendar/',
        '/*/properties/',
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
