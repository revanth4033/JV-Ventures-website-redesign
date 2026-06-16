import { ArrowRight, Boxes, ExternalLink, FileText, House, Image as ImageIcon, Settings } from 'lucide-react'
import Link from 'next/link'

import { AdminShell } from '@/components/admin/AdminShell'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const [session, platforms, media] = await Promise.all([
    getSession(),
    prisma.platform.count().catch(() => 0),
    prisma.media.count().catch(() => 0),
  ])
  const firstName = (session?.name || session?.email || '').split(/[@.\s]/)[0]
  const greeting = firstName ? `Welcome back, ${firstName[0].toUpperCase()}${firstName.slice(1)}` : 'Welcome back'

  const sections = [
    { href: '/admin/site-settings', icon: Settings, t: 'Site Settings', d: 'Logo, navigation, footer, and the closing quote shown on every page.', meta: 'Global' },
    { href: '/admin/home', icon: House, t: 'Home Page', d: 'The four-slide deck — Investing, Impact, Ecosystems, Platforms.', meta: '4 slides' },
    { href: '/admin/about', icon: FileText, t: 'About Page', d: 'Hero, beliefs, method, models, ecosystem, and the GRIDS section.', meta: '6 sections' },
    { href: '/admin/platforms', icon: Boxes, t: 'Platforms', d: 'PowerEd, PoweRx, PowerCare, PowerPod — ventures, totals, metrics.', meta: `${platforms} platforms` },
    { href: '/admin/media', icon: ImageIcon, t: 'Media', d: 'Upload and manage all images and videos used across the site.', meta: `${media} items` },
  ]

  return (
    <AdminShell
      active="dashboard"
      title={greeting}
      subtitle="Pick a section to edit. Changes go live within ~30 seconds of publishing."
      actions={
        <a className="btn" href="/" target="_blank" rel="noopener noreferrer">
          <ExternalLink /> Open live site
        </a>
      }
    >
      <div className="dash-hero">
        <div className="dash-stats">
          <div className="dash-stat">
            <b>{platforms}</b>
            <span>Platforms</span>
          </div>
          <div className="dash-stat">
            <b>{media}</b>
            <span>Media items</span>
          </div>
          <div className="dash-stat">
            <b style={{ color: 'var(--ok)' }}>Live</b>
            <span>Status</span>
          </div>
        </div>
      </div>

      <div className="cards">
        {sections.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.href} href={s.href} className="nav-card">
              <span className="ic">
                <Icon strokeWidth={1.9} />
              </span>
              <span className="body">
                <span className="t">
                  {s.t} <ArrowRight className="arr" size={15} />
                </span>
                <span className="d">{s.d}</span>
                <span className="meta">{s.meta}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </AdminShell>
  )
}
