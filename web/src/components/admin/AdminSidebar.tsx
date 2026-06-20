'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Boxes,
  ExternalLink,
  FileText,
  History,
  House,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  Users,
} from 'lucide-react'

import { logout } from '@/app/(admin)/admin/auth-actions'

export const NAV = [
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
      { href: '/admin/team', key: 'team', label: 'Team Page', icon: Users },
      { href: '/admin/contact', key: 'contact', label: 'Contact Page', icon: Mail },
    ],
  },
  {
    label: 'Library',
    items: [
      { href: '/admin/media', key: 'media', label: 'Media', icon: ImageIcon },
      { href: '/admin/history', key: 'history', label: 'History', icon: History },
    ],
  },
  {
    label: 'Configuration',
    items: [{ href: '/admin/site-settings', key: 'site-settings', label: 'Site Settings', icon: Settings }],
  },
]

/** which nav item the current path belongs to (longest href match wins) */
function activeKey(path: string): string {
  let best = ''
  let bestLen = -1
  for (const g of NAV)
    for (const n of g.items) {
      const match = n.href === '/admin' ? path === '/admin' : path.startsWith(n.href)
      if (match && n.href.length > bestLen) {
        best = n.key
        bestLen = n.href.length
      }
    }
  return best
}

/**
 * Persistent command rail. Lives in the admin layout so it never re-renders on
 * navigation — only the page body swaps, which keeps clicks feeling instant.
 */
export function AdminSidebar({ email = '', role = 'editor' }: { email?: string; role?: string }) {
  const path = usePathname()
  const active = activeKey(path)
  const initials = email.slice(0, 2).toUpperCase() || 'JV'

  return (
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
                <Link key={n.key} href={n.href} prefetch={false} className={`rail-link${active === n.key ? ' active' : ''}`}>
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
            <b>{email || 'Signed in'}</b>
            <span>{role}</span>
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
  )
}
