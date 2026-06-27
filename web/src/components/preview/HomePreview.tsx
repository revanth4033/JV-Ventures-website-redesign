'use client'

import { ClosingBridge } from '@/components/ClosingBridge'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Home } from '@/components/home/Home'
import type { HomePage, SiteSettings } from '@/content/types'
import { usePreviewMessages } from './usePreviewMessages'

export function HomePreview({ settings: s0, home: h0 }: { settings: SiteSettings; home: HomePage }) {
  const { settings, data: home } = usePreviewMessages(s0, 'home', h0)
  return (
    <>
      <Header settings={settings} />
      <main id="top">
        <Home home={home} settings={settings} />
        <ClosingBridge settings={settings} dataAct="02" dataActName="Invitation" />
      </main>
      <Footer settings={settings} />
    </>
  )
}
