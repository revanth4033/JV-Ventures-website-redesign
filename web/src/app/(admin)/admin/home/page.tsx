import { AdminShell } from '@/components/admin/AdminShell'
import { PreviewLink } from '@/components/admin/PreviewLink'
import { SectionForm } from '@/components/admin/SectionForm'
import { getHomePage } from '@/content'
import { prisma } from '@/lib/prisma'
import { saveHome } from '../content-actions'

export const dynamic = 'force-dynamic'

export default async function HomeEditPage() {
  const row = await prisma.singleton.findUnique({ where: { key: 'homePage' } })
  const data = (row?.data as Record<string, unknown>) ?? (getHomePage() as unknown as Record<string, unknown>)
  return (
    <AdminShell
      active="home"
      title="Home Page"
      subtitle="The four-slide presentation deck."
      actions={<PreviewLink href="/" label="Open page" />}
      wide
    >
      <SectionForm
        schema="home"
        defaultValues={data}
        action={saveHome}
        preview={{ url: '/preview/home', section: 'home' }}
      />
    </AdminShell>
  )
}
