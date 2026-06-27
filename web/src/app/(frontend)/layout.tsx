import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import React from 'react'
import './styles.css'

import { loadSiteSettings } from '@/content/db'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { JsonLd } from '@/components/JsonLd'
import { ScrollTop } from '@/components/ScrollTop'
import { SmoothScroll } from '@/components/SmoothScroll'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-montserrat',
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await loadSiteSettings()
  const brand = settings.brandName || 'JV Ventures'
  const seo = settings.seo ?? {}
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
    title: {
      default: seo.title || `${brand} — Reimagining Investing`,
      template: seo.titleTemplate || `%s — ${brand}`,
    },
    description:
      seo.description ||
      'JV Ventures is a value-creation partner with a $550M portfolio, building institutional platforms across education, lifesciences, healthcare, and managed living.',
    icons: { icon: '/favicon.png' },
    openGraph: {
      type: 'website',
      siteName: brand,
      locale: 'en',
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const settings = await loadSiteSettings()
  const site = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const brand = settings.brandName || 'JV Ventures'
  const logoSrc = settings.logo?.src
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand,
    url: site,
    ...(logoSrc ? { logo: logoSrc.startsWith('http') ? logoSrc : `${site}${logoSrc}` } : {}),
    ...(settings.footer?.locations ? { areaServed: settings.footer.locations } : {}),
  }
  const siteLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: brand, url: site }
  return (
    <html lang="en" className={montserrat.variable}>
      <body>
        <a href="#top" className="skip-link">
          {settings.ui?.skipLink || 'Skip to content'}
        </a>
        <JsonLd data={orgLd} />
        <JsonLd data={siteLd} />
        <SmoothScroll>
          <Header settings={settings} />
          {children}
          <Footer settings={settings} />
          <ScrollTop />
        </SmoothScroll>
      </body>
    </html>
  )
}
