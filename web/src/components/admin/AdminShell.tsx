import Link from 'next/link'
import {
  Boxes,
  ChevronRight,
  ExternalLink,
  FileText,
  House,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Settings,
} from 'lucide-react'

import { logout } from '@/app/(admin)/admin/auth-actions'
import { getSession } from '@/lib/session'
import { RailToggle } from './RailToggle'

const NAV = [
  {
    label: 'Overview',
    items: [{ href: '/admin', key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Pages',
    items: [
      { href: '/admin/home', key: 'home', label: 'Home Page', icon: House },
      { href: '/admin/about', key: 'about', label: 'About Page', icon: FileText },
      { href: '/admin/platforms', key: 'platforms', label: 'Platforms', icon: Boxes },
    ],
  },
  {
    label: 'Library',
    items: [{ href: '/admin/media', key: 'media', label: 'Media', icon: ImageIcon }],
  },
  {
    label: 'Configuration',
    items: [{ href: '/admin/site-settings', key: 'site-settings', label: 'Site Settings', icon: Settings }],
  },
]

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  home: 'Home Page',
  about: 'About Page',
  platforms: 'Platforms',
  media: 'Media',
  'site-settings': 'Site Settings',
}

export async function AdminShell({
  active,
  title,
  subtitle,
  actions,
  children,
  wide,
}: {
  active: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  wide?: boolean
}) {
  const session = await getSession()
  const email = session?.email ?? ''
  const initials = email.slice(0, 2).toUpperCase() || 'JV'

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="rail-brand">
          <span className="mark">
            <span>JV</span>
          </span>
          <span className="name">
            JV Ventures
            <small>Content Studio</small>
          </span>
        </div>

        <nav className="rail-nav">
          {NAV.map((group) => (
            <div className="rail-group" key={group.label}>
              <div className="rail-group-label">{group.label}</div>
              {group.items.map((n) => {
                const Icon = n.icon
                return (
                  <Link key={n.key} href={n.href} className={`rail-link${active === n.key ? ' active' : ''}`}>
                    <Icon strokeWidth={1.9} />
                    {n.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="rail-foot">
          <div className="rail-user">
            <span className="avatar">{initials}</span>
            <span className="who">
              <b>{email}</b>
              <span>{session?.role ?? 'editor'}</span>
            </span>
          </div>
          <div className="rail-foot-links">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ExternalLink strokeWidth={2} /> View site
            </a>
            <form action={logout} style={{ flex: 1, display: 'flex' }}>
              <button type="submit" style={{ flex: 1 }}>
                <LogOut strokeWidth={2} /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-head">
            <div className="crumbs">
              <RailToggle />
              <Link href="/admin">Studio</Link>
              {active !== 'dashboard' && (
                <>
                  <ChevronRight />
                  <span style={{ color: 'var(--ink-2)' }}>{LABELS[active] ?? title}</span>
                </>
              )}
            </div>
            <h1>{title}</h1>
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          {actions && <div className="topbar-actions">{actions}</div>}
        </header>
        <div className={`admin-content${wide ? ' flush' : ''}`}>{children}</div>
      </main>
    </div>
  )
}
