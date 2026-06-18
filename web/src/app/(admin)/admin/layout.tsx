import { AdminChrome } from '@/components/admin/AdminChrome'
import { getSession } from '@/lib/session'

// The persistent studio chrome (rail + main column) lives here so it survives
// navigation; pages only render their own header + body.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  return (
    <AdminChrome email={session?.email ?? ''} role={session?.role ?? 'editor'}>
      {children}
    </AdminChrome>
  )
}
