import { AdminShell } from '@/components/admin/AdminShell'
import { HistoryView } from '@/components/admin/HistoryView'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const [audit, plats] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { at: 'desc' }, take: 100 }).catch(() => []),
    prisma.platform.findMany({ orderBy: { order: 'asc' }, select: { slug: true, name: true } }).catch(() => []),
  ])
  const entities = [
    { entity: 'homePage', label: 'Home Page' },
    { entity: 'aboutPage', label: 'About Page' },
    { entity: 'teamPage', label: 'Team Page' },
    { entity: 'contactPage', label: 'Contact Page' },
    { entity: 'siteSettings', label: 'Site Settings' },
    ...plats.map((p) => ({ entity: `platform:${p.slug}`, label: p.name })),
  ]
  const rows = audit.map((a) => ({ id: a.id, entity: a.entity, label: a.label, action: a.action, userEmail: a.userEmail, at: a.at.toISOString() }))
  return (
    <AdminShell active="history" title="History" subtitle="Audit trail and one-click version rollback.">
      <HistoryView audit={rows} entities={entities} />
    </AdminShell>
  )
}
