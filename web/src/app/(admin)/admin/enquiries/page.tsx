import { AdminShell } from '@/components/admin/AdminShell'
import { EnquiriesView } from '@/components/admin/EnquiriesView'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function EnquiriesPage() {
  const [session, rows] = await Promise.all([
    getSession(),
    prisma.enquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }).catch(() => []),
  ])
  const data = rows.map((r) => ({
    id: r.id,
    enquiry: r.enquiry,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    phone: r.phone,
    company: r.company,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
  }))
  const subtitle = data.length
    ? `${data.length} message${data.length === 1 ? '' : 's'} from the Contact form.`
    : 'Messages submitted through the Contact form will appear here.'
  return (
    <AdminShell active="enquiries" title="Enquiries" subtitle={subtitle}>
      <EnquiriesView rows={data} canDelete={session?.role === 'admin'} />
    </AdminShell>
  )
}
