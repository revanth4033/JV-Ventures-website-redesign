'use client'

import { usePathname } from 'next/navigation'

import { AdminSidebar } from './AdminSidebar'

/**
 * Wraps every /admin route. Renders the persistent rail + main column for the
 * studio, but lets the login screen render full-bleed (no chrome). Because the
 * rail lives here in the layout, it stays mounted across navigation — only the
 * page body swaps, so moving between sections feels instant.
 */
export function AdminChrome({
  email,
  role,
  children,
}: {
  email?: string
  role?: string
  children: React.ReactNode
}) {
  const path = usePathname()
  if (path?.startsWith('/admin/login')) return <>{children}</>
  return (
    <div className="admin-shell">
      <AdminSidebar email={email} role={role} />
      <main className="admin-main">{children}</main>
    </div>
  )
}
