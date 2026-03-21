import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://directbnb.app';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${APP_URL}/nl`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${APP_URL}/en`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];

  try {
    const res = await fetch(`${API_URL}/public/properties`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return staticPages;

    const json = await res.json();
    const properties: Array<{ slug: string; updatedAt: string }> =
      Array.isArray(json) ? json : json.data ?? [];

    const propertyPages: MetadataRoute.Sitemap = properties.flatMap((p) => [
      {
        url: `${APP_URL}/nl/bnb/${p.slug}`,
        lastModified: new Date(p.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      },
      {
        url: `${APP_URL}/en/bnb/${p.slug}`,
        lastModified: new Date(p.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      },
    ]);

    return [...staticPages, ...propertyPages];
  } catch {
    return staticPages;
  }
}
