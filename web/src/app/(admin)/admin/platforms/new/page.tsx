import { AdminShell } from '@/components/admin/AdminShell'
import { NewPlatformForm } from '@/components/admin/NewPlatformForm'

export const dynamic = 'force-dynamic'

export default function NewPlatformPage() {
  return (
    <AdminShell active="platforms" title="New platform" subtitle="Create the platform, then add its full content.">
      <NewPlatformForm />
    </AdminShell>
  )
}
