'use client'

import { CircleAlert, CloudUpload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { createPlatform } from '@/app/(admin)/admin/content-actions'

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export function NewPlatformForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [sector, setSector] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [busy, start] = useTransition()
  const [err, setErr] = useState('')

  const effSlug = slugTouched ? slugify(slug) : slugify(name)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    start(async () => {
      const res = await createPlatform({ name, sector, slug: effSlug })
      if (res.ok && res.slug) {
        toast.success('Platform created', { description: 'Now add its content below.' })
        router.push(`/admin/platforms/${res.slug}`)
      } else {
        setErr(res.error || 'Could not create the platform.')
      }
    })
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 560 }}>
      <div className="field">
        <label>Platform name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PowerX" autoFocus required />
      </div>
      <div className="field">
        <label>Sector</label>
        <input type="text" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. Pharma & Life Sciences" />
      </div>
      <div className="field">
        <label>URL slug</label>
        <div className="hint">
          The page address will be <code>/platform/{effSlug || '…'}</code>
        </div>
        <input
          type="text"
          value={slugTouched ? slug : effSlug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
          placeholder="powerx"
        />
      </div>
      {err && (
        <p className="err-msg" style={{ marginBottom: '1rem' }}>
          <CircleAlert /> {err}
        </p>
      )}
      <div className="savebar">
        <button className="btn btn-primary" type="submit" disabled={busy || !name.trim()}>
          <CloudUpload /> {busy ? 'Creating…' : 'Create platform'}
        </button>
      </div>
    </form>
  )
}
