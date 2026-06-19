import type { Metadata, Viewport } from 'next'

// The Studio is its own full-bleed app: it must NOT inherit the marketing or admin
// chrome, so this segment provides its own minimal root html/body. Route config
// lives here (a server component) since the page itself is client-only.
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'JV Ventures Studio',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  // Studio manages its own scrolling/overflow.
  interactiveWidget: 'resizes-content',
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
