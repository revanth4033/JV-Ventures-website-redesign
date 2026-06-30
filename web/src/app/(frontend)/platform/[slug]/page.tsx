import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ClosingBridge } from '@/components/ClosingBridge'
import { JsonLd } from '@/components/JsonLd'
import { Platform } from '@/components/platform/Platform'
import { loadPlatform, loadPlatforms, loadSiteSettings } from '@/content/db'

export const revalidate = 30

export async function generateStaticParams() {
  const platforms = await loadPlatforms()
  return platforms.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const p = await loadPlatform(slug)
  if (!p) return {}
  const title = p.seo?.title?.trim() || p.name
  const description = p.seo?.description?.trim() || p.tagline
  return {
    title,
    description,
    alternates: { canonical: `/platform/${slug}` },
    openGraph: { title, description, url: `/platform/${slug}` },
    twitter: { title, description },
  }
}

export default async function PlatformPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [platform, all, settings] = await Promise.all([
    loadPlatform(slug),
    loadPlatforms(),
    loadSiteSettings(),
  ])
  if (!platform) notFound()
  const others = all.filter((p) => p.slug !== slug)
  const site = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: platform.name,
    ...(platform.tagline ? { description: platform.tagline } : {}),
    url: `${site}/platform/${slug}`,
    parentOrganization: { '@type': 'Organization', name: 'JV Ventures', url: site },
  }
  return (
    <>
      <JsonLd data={ld} />
      <Platform platform={platform} others={others} settings={settings} />
      <ClosingBridge settings={settings} id="closing" />
    </>
  )
}
