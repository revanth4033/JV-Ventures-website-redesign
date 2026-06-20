import type { Metadata } from 'next'

import { ClosingBridge } from '@/components/ClosingBridge'
import { Home } from '@/components/home/Home'
import { loadHomePage, loadSiteSettings } from '@/content/db'

export async function generateMetadata(): Promise<Metadata> {
  const home = await loadHomePage()
  const title = home.seo?.title?.trim()
  return {
    title: title ? { absolute: title } : { absolute: 'JV Ventures — Reimagining Investing' },
    alternates: { canonical: '/' },
  }
}

// ISR: serve cached HTML, regenerate within 30s of a CMS edit
export const revalidate = 30

export default async function HomePage() {
  const [home, settings] = await Promise.all([loadHomePage(), loadSiteSettings()])
  return (
    <main id="top">
      <Home home={home} />
      <ClosingBridge settings={settings} dataAct="02" dataActName="Invitation" />
    </main>
  )
}
