import { AdminShell } from '@/components/admin/AdminShell'
import { AccountView } from '@/components/admin/AccountView'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const s = await getSession()
  const meRow = s ? await prisma.user.findUnique({ where: { id: s.id }, select: { name: true, email: true, role: true } }) : null
  const isAdmin = s?.role === 'admin'
  const users = isAdmin
    ? await prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, email: true, name: true, role: true } })
    : []
  return (
    <AdminShell active="account" title="Account" subtitle="Your sign-in, password, and team.">
      <AccountView me={meRow ?? { name: '', email: s?.email ?? '', role: s?.role ?? 'editor' }} users={users} isAdmin={isAdmin} />
    </AdminShell>
  )
}
