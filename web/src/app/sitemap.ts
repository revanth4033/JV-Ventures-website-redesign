import type { MetadataRoute } from 'next'

import { loadPlatforms } from '@/content/db'

const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Regenerate so newly created/deleted platforms appear (also revalidated on save).
export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const platforms = await loadPlatforms()
  // Regenerated every `revalidate` window, so this reflects the last (re)build of
  // the sitemap — a reasonable freshness signal for crawlers.
  const lastModified = new Date()
  return [
    { url: `${base}/`, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/about`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/team`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    ...platforms.map((p) => ({
      url: `${base}/platform/${p.slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
