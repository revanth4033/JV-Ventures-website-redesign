'use client'

import { CloudUpload, Copy, Crop, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  cropMedia,
  deleteMedia,
  findMediaUsage,
  listFolders,
  listMedia,
  replaceMedia,
  updateMedia,
  uploadMedia,
  type MediaItem,
} from '@/app/(admin)/admin/media-actions'
import { ImageCropper } from './ImageCropper'

export function MediaManager({ initial }: { initial: MediaItem[] }) {
  const [items, setItems] = useState(initial)
  const [busy, startBusy] = useTransition()
  const [drag, setDrag] = useState(false)
  const [q, setQ] = useState('')
  const [folder, setFolder] = useState('')
  const [folders, setFolders] = useState<string[]>([])
  const [bust, setBust] = useState<Record<number, number>>({})
  const [cropping, setCropping] = useState<MediaItem | null>(null)
  const [replacingId, setReplacingId] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const replaceRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listFolders().then(setFolders).catch(() => {})
  }, [items.length])

  // debounced search + folder filter
  useEffect(() => {
    const t = setTimeout(() => {
      listMedia({ q, folder: folder || undefined }).then(setItems).catch(() => {})
    }, 250)
    return () => clearTimeout(t)
  }, [q, folder])

  const srcOf = (m: MediaItem) => (bust[m.id] ? `${m.url}?v=${bust[m.id]}` : m.url)
  const patch = (id: number, p: Partial<MediaItem>) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)))

  const saveMeta = (m: MediaItem, p: { alt?: string; folder?: string; tags?: string[] }) => {
    updateMedia(m.id, p).catch(() => toast.error('Could not save'))
  }

  const upload = (files: FileList | null) => {
    if (!files?.length) return
    startBusy(async () => {
      const added: MediaItem[] = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.set('file', file)
        if (folder) fd.set('folder', folder)
        added.push(await uploadMedia(fd))
      }
      setItems((prev) => [...added, ...prev])
      toast.success(`Uploaded ${added.length} ${added.length === 1 ? 'file' : 'files'}`)
      if (fileRef.current) fileRef.current.value = ''
    })
  }

  const onReplaceFile = (files: FileList | null) => {
    if (!files?.length || replacingId == null) return
    const fd = new FormData()
    fd.set('file', files[0])
    const id = replacingId
    startBusy(async () => {
      try {
        const updated = await replaceMedia(id, fd)
        patch(id, updated)
        setBust((b) => ({ ...b, [id]: Date.now() }))
        toast.success('File replaced', { description: 'All references keep working (same URL).' })
      } catch (e) {
        toast.error('Replace failed', { description: e instanceof Error ? e.message : 'Try again.' })
      }
      if (replaceRef.current) replaceRef.current.value = ''
      setReplacingId(null)
    })
  }

  const doCrop = async (area: { x: number; y: number; width: number; height: number }) => {
    if (!cropping) return
    const id = cropping.id
    try {
      const updated = await cropMedia(id, area)
      patch(id, updated)
      setBust((b) => ({ ...b, [id]: Date.now() }))
      toast.success('Image cropped')
    } catch (e) {
      toast.error('Crop failed', { description: e instanceof Error ? e.message : 'Try again.' })
    }
    setCropping(null)
  }

  const onDelete = async (m: MediaItem) => {
    const uses = await findMediaUsage(m.url).catch(() => [] as string[])
    const msg = uses.length
      ? `“${m.filename}” is in use on: ${uses.join(', ')}.\nDeleting it will break those images. Delete anyway?`
      : `Delete “${m.filename}”? This can't be undone.`
    if (!confirm(msg)) return
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
          <b>{busy ? 'Working…' : 'Drop files here, or click to browse'}</b>
          <p>Images and MP4 video{folder ? ` · uploading to “${folder}”` : ''} · {items.length} shown</p>
        </div>
        <span className="btn btn-primary" style={{ pointerEvents: 'none' }}>
          <CloudUpload /> Upload
        </span>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>

      <div className="media-toolbar">
        <div className="media-search">
          <Search />
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search filename or alt text…" />
        </div>
        <select value={folder} onChange={(e) => setFolder(e.target.value)} aria-label="Filter by folder">
          <option value="">All folders</option>
          {folders.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <input ref={replaceRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4" hidden onChange={(e) => onReplaceFile(e.target.files)} />

      {items.length === 0 ? (
        <p className="hint" style={{ padding: '1.5rem 0' }}>{q || folder ? 'No media matches your filters.' : 'No media yet — upload your first file above.'}</p>
      ) : (
        <div className="media-grid">
          {items.map((m) => {
            const isImage = m.mime.startsWith('image')
            return (
              <div className="media-cell" key={m.id}>
                {m.mime.startsWith('video') ? (
                  <video className="mc-img" src={srcOf(m)} muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="mc-img" src={srcOf(m)} alt={m.alt} />
                )}
                <div className="mc-ovl">
                  <button className="mc-btn" onClick={() => copy(m.url)} title="Copy link"><Copy /></button>
                  {isImage && <button className="mc-btn" onClick={() => setCropping(m)} title="Crop"><Crop /></button>}
                  <button className="mc-btn" onClick={() => { setReplacingId(m.id); replaceRef.current?.click() }} title="Replace file"><RefreshCw /></button>
                  <button className="mc-btn danger" onClick={() => onDelete(m)} title="Delete"><Trash2 /></button>
                </div>
                <div className="mc-meta">
                  <div className="mc-name" title={m.filename}>{m.filename}</div>
                  <input className="mc-alt" type="text" defaultValue={m.alt} placeholder="Alt text…" onBlur={(e) => saveMeta(m, { alt: e.target.value })} />
                  <div className="mc-fields">
                    <input className="mc-alt" type="text" defaultValue={m.folder} placeholder="Folder" onBlur={(e) => saveMeta(m, { folder: e.target.value })} />
                    <input className="mc-alt" type="text" defaultValue={m.tags.join(', ')} placeholder="Tags (comma)" onBlur={(e) => saveMeta(m, { tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {cropping && <ImageCropper src={srcOf(cropping)} onCancel={() => setCropping(null)} onApply={doCrop} />}
    </div>
  )
}
