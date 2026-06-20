import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import React from 'react'
import './styles.css'

import { loadSiteSettings } from '@/content/db'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { JsonLd } from '@/components/JsonLd'
import { SmoothScroll } from '@/components/SmoothScroll'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'JV Ventures — Reimagining Investing',
    template: '%s — JV Ventures',
  },
  description:
    'JV Ventures is a value-creation partner with a $550M portfolio, building institutional platforms across education, lifesciences, healthcare, and managed living.',
  icons: { icon: '/favicon.png' },
  openGraph: {
    type: 'website',
    siteName: 'JV Ventures',
    locale: 'en',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const settings = await loadSiteSettings()
  const site = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const logoSrc = settings.logo?.src
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'JV Ventures',
    url: site,
    ...(logoSrc ? { logo: logoSrc.startsWith('http') ? logoSrc : `${site}${logoSrc}` } : {}),
    ...(settings.footer?.locations ? { areaServed: settings.footer.locations } : {}),
  }
  const siteLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'JV Ventures', url: site }
  return (
    <html lang="en" className={montserrat.variable}>
      <body>
        <JsonLd data={orgLd} />
        <JsonLd data={siteLd} />
        <SmoothScroll>
          <Header settings={settings} />
          {children}
          <Footer settings={settings} />
        </SmoothScroll>
      </body>
    </html>
  )
}
