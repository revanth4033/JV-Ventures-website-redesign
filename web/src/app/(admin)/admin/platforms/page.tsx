import { AdminShell } from '@/components/admin/AdminShell'
import { PlatformsManager } from '@/components/admin/PlatformsManager'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function PlatformsListPage() {
  const plats = await prisma.platform.findMany({
    orderBy: { order: 'asc' },
    select: { slug: true, name: true, sector: true },
  })
  return (
    <AdminShell active="platforms" title="Platforms" subtitle="Choose a platform to edit, or add a new one.">
      <PlatformsManager initial={plats} />
    </AdminShell>
  )
}
