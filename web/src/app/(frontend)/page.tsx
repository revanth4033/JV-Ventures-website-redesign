import type { Metadata } from 'next'

import { ClosingBridge } from '@/components/ClosingBridge'
import { Home } from '@/components/home/Home'
import { loadHomePage, loadSiteSettings } from '@/content/db'

export async function generateMetadata(): Promise<Metadata> {
  const home = await loadHomePage()
  const title = home.seo?.title?.trim() || 'JV Ventures — Reimagining Investing'
  const description = home.seo?.description?.trim()
  return {
    title: { absolute: title },
    ...(description ? { description } : {}),
    alternates: { canonical: '/' },
    openGraph: { title, ...(description ? { description } : {}), url: '/' },
    twitter: { title, ...(description ? { description } : {}) },
  }
}

// ISR: serve cached HTML, regenerate within 30s of a CMS edit
export const revalidate = 30

export default async function HomePage() {
  const [home, settings] = await Promise.all([loadHomePage(), loadSiteSettings()])
  return (
    <main id="top">
      <Home home={home} settings={settings} />
      <ClosingBridge settings={settings} dataAct="02" dataActName="Invitation" />
    </main>
  )
}
