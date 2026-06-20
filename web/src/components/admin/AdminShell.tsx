import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { RailToggle } from './RailToggle'

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  home: 'Home Page',
  about: 'About Page',
  platforms: 'Platforms',
  team: 'Team Page',
  contact: 'Contact Page',
  media: 'Media',
  history: 'History',
  'site-settings': 'Site Settings',
}

/**
 * Page header + body for a studio screen. The rail and main column come from the
 * admin layout (so they persist across navigation); this only renders the parts
 * that change per page.
 */
export function AdminShell({
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
  return (
    <>
      <header className="admin-topbar">
        <div className="topbar-head">
          <div className="crumbs">
            <RailToggle />
            <Link href="/admin" prefetch={false}>Studio</Link>
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
    </>
  )
}
