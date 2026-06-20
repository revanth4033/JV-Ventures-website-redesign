import type { Metadata } from 'next'

import { About } from '@/components/about/About'
import { loadAboutPage, loadSiteSettings } from '@/content/db'

export const revalidate = 30

export async function generateMetadata(): Promise<Metadata> {
  const about = await loadAboutPage()
  const title = about.seo?.title?.trim() || 'About'
  const description =
    about.seo?.description?.trim() ||
    'Founded in 2015, JV Ventures is a value-creation partner with a $550M portfolio, pioneering institutional models across lifesciences, education, healthcare, and managed living.'
  return {
    title,
    description,
    alternates: { canonical: '/about' },
    openGraph: { title, description, url: '/about' },
    twitter: { title, description },
  }
}

export default async function AboutPage() {
  const [about, settings] = await Promise.all([loadAboutPage(), loadSiteSettings()])
  return <About about={about} settings={settings} />
}
