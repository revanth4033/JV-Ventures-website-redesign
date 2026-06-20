'use client'

import { Copy, Search, Trash2, CloudUpload } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteMedia, listMedia, updateMedia, uploadMedia, type MediaItem } from '@/app/(admin)/admin/media-actions'

export function MediaManager({ initial }: { initial: MediaItem[] }) {
  const [items, setItems] = useState(initial)
  const [busy, startBusy] = useTransition()
  const [drag, setDrag] = useState(false)
  const [q, setQ] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      listMedia({ q }).then(setItems).catch(() => {})
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  const saveAlt = (m: MediaItem, alt: string) => {
    if (alt === m.alt) return
    setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, alt } : x)))
    updateMedia(m.id, { alt }).catch(() => toast.error('Could not save alt text'))
  }

  const upload = (files: FileList | null) => {
    if (!files?.length) return
    startBusy(async () => {
      const added: MediaItem[] = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.set('file', file)
        added.push(await uploadMedia(fd))
      }
      setItems((prev) => [...added, ...prev])
      toast.success(`Uploaded ${added.length} ${added.length === 1 ? 'file' : 'files'}`)
      if (fileRef.current) fileRef.current.value = ''
    })
  }

  const onDelete = (m: MediaItem) => {
    if (!confirm(`Delete “${m.filename}”? This can't be undone.`)) return
    startBusy(async () => {
      await deleteMedia(m.id)
      setItems((prev) => prev.filter((x) => x.id !== m.id))
      toast.success('Deleted')
    })
  }

  const copy = (url: string) => {
    const full = url.startsWith('http') ? url : window.location.origin + url
    navigator.clipboard.writeText(full).then(() => toast.success('Link copied'))
  }

  return (
    <div>
      <div
        className={`dropzone${drag ? ' drag' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files) }}
        style={{ cursor: 'pointer' }}
      >
        <span className="dz-ic">
          <CloudUpload strokeWidth={1.8} />
        </span>
        <div className="dz-body">
          <b>{busy ? 'Uploading…' : 'Drop files here, or click to browse'}</b>
          <p>Images and MP4 video · {items.length} items in the library</p>
        </div>
        <span className="btn btn-primary" style={{ pointerEvents: 'none' }}>
          <CloudUpload /> Upload
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      <div className="media-search">
        <Search />
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by filename or alt text…" />
      </div>

      {items.length === 0 ? (
        <p className="hint" style={{ padding: '1.5rem 0' }}>{q ? 'No media matches your search.' : 'No media yet — upload your first file above.'}</p>
      ) : (
        <div className="media-grid">
          {items.map((m) => (
            <div className="media-cell" key={m.id}>
              {m.mime.startsWith('video') ? (
                <video className="mc-img" src={m.url} muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="mc-img" src={m.url} alt={m.alt} />
              )}
              <div className="mc-ovl">
                <button className="mc-btn" onClick={() => copy(m.url)} title="Copy link">
                  <Copy />
                </button>
                <button className="mc-btn danger" onClick={() => onDelete(m)} title="Delete">
                  <Trash2 />
                </button>
              </div>
              <div className="mc-meta">
                <div className="mc-name" title={m.filename}>{m.filename}</div>
                <input
                  className="mc-alt"
                  type="text"
                  defaultValue={m.alt}
                  placeholder="Alt text (for accessibility)…"
                  onBlur={(e) => saveAlt(m, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
