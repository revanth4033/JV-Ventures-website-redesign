'use client'

import { Boxes, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deletePlatform } from '@/app/(admin)/admin/content-actions'

type P = { slug: string; name: string; sector: string }

export function PlatformsManager({ initial }: { initial: P[] }) {
  const [items, setItems] = useState(initial)
  const [busy, start] = useTransition()
  const [pending, setPending] = useState<string | null>(null)

  const onDelete = (p: P) => {
    if (!confirm(`Delete the “${p.name}” platform and its page? This can’t be undone.`)) return
    setPending(p.slug)
    start(async () => {
      const res = await deletePlatform(p.slug)
      if (res.ok) {
        setItems((x) => x.filter((i) => i.slug !== p.slug))
        toast.success('Platform deleted', { description: 'The page is removed within ~30 seconds.' })
      } else {
        toast.error('Could not delete', { description: res.error || 'Please try again.' })
      }
      setPending(null)
    })
  }

  return (
    <div className="cards">
      {items.map((p) => (
        <div className={`card card-row${pending === p.slug ? ' is-busy' : ''}`} key={p.slug}>
          <Link href={`/admin/platforms/${p.slug}`} prefetch={false} className="card-main">
            <span className="card-ic">
              <Boxes strokeWidth={1.9} />
            </span>
            <span className="card-body">
              <span className="card-t">{p.name}</span>
              <span className="card-d">{p.sector}</span>
            </span>
          </Link>
          <button
            type="button"
            className="arr-rm card-del"
            onClick={() => onDelete(p)}
            disabled={busy}
            aria-label={`Delete ${p.name}`}
            title="Delete platform"
          >
            <Trash2 />
          </button>
        </div>
      ))}

      <Link href="/admin/platforms/new" className="card card-new">
        <Plus />
        <span>New platform</span>
      </Link>
    </div>
  )
}
