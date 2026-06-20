'use client'

import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

/** Crop modal. Collects the crop rectangle (in image pixels) and hands it back —
 *  the actual crop is done server-side (sharp), so there's no canvas/CORS issue. */
export function ImageCropper({
  src,
  onCancel,
  onApply,
}: {
  src: string
  onCancel: () => void
  onApply: (area: { x: number; y: number; width: number; height: number }) => Promise<void> | void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  const onComplete = useCallback((_a: Area, pixels: Area) => setArea(pixels), [])
  const apply = async () => {
    if (!area) return
    setBusy(true)
    try {
      await onApply({ x: area.x, y: area.y, width: area.width, height: area.height })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="modal crop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Crop image</h2>
        </div>
        <div className="crop-area">
          <Cropper image={src} crop={crop} zoom={zoom} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onComplete} />
        </div>
        <div className="crop-controls">
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom" />
          <span className="spacer" />
          <button className="btn btn-sm" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-sm btn-primary" type="button" onClick={apply} disabled={busy || !area}>
            {busy ? 'Saving…' : 'Crop & save'}
          </button>
        </div>
      </div>
    </div>
  )
}
