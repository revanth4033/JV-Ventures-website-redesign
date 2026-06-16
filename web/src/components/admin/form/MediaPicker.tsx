'use client'

import { Upload, X } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'

import { listMedia, uploadMedia, type MediaItem } from '@/app/(admin)/admin/media-actions'

export function MediaPicker({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [busy, startBusy] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listMedia().then(setItems)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onUpload = (files: FileList | null) => {
    if (!files?.length) return
    startBusy(async () => {
      const fd = new FormData()
      fd.set('file', files[0])
      const m = await uploadMedia(fd)
      setItems((p) => [m, ...p])
      onPick(m.url)
      onClose()
    })
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Choose media</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
              <Upload /> {busy ? 'Uploading…' : 'Upload new'}
              <input ref={fileRef} type="file" accept="image/*,video/mp4" hidden onChange={(e) => onUpload(e.target.files)} />
            </label>
            <button className="btn btn-sm" onClick={onClose}>
              <X /> Close
            </button>
          </div>
        </div>
        <div className="modal-body">
          <div className="media-grid">
            {items.map((m) => (
              <div className="media-cell pick" key={m.id} onClick={() => { onPick(m.url); onClose() }}>
                {m.mime.startsWith('video') ? (
                  <video className="mc-img" src={m.url} muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="mc-img" src={m.url} alt={m.alt} />
                )}
                <div className="mc-meta">
                  <div className="mc-name">{m.filename}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
