'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'
const WIDTHS: Record<PreviewDevice, number> = { desktop: 1366, tablet: 834, mobile: 390 }

export type PreviewHandle = {
  post: (section: string, data: unknown) => void
  scrollTo: (sectionId: string) => void
  reload: () => void
}

export const PreviewFrame = forwardRef<PreviewHandle, { url: string; device?: PreviewDevice }>(function PreviewFrame({ url, device = 'desktop' }, ref) {
  const BASE = WIDTHS[device] // narrower devices upscale to fill the pane → bigger, readable text
  const wrapRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const lastRef = useRef<{ section: string; data: unknown } | null>(null)
  const [dim, setDim] = useState({ w: BASE, h: 800 })

  const send = () => {
    const win = iframeRef.current?.contentWindow
    if (win && lastRef.current) win.postMessage({ source: 'jv-admin', ...lastRef.current }, window.location.origin)
  }

  useImperativeHandle(ref, () => ({
    post: (section, data) => {
      lastRef.current = { section, data }
      send()
    },
    scrollTo: (sectionId) => {
      const win = iframeRef.current?.contentWindow
      if (win) win.postMessage({ source: 'jv-admin', scrollTo: sectionId }, window.location.origin)
    },
    // reload re-mounts the page (rebuilds animations/structure); the iframe's
    // ready handshake then re-applies the latest unsaved values automatically.
    reload: () => {
      const win = iframeRef.current?.contentWindow
      if (win) win.location.reload()
      else if (iframeRef.current) iframeRef.current.src = url
    },
  }), [url])

  // changing device only resizes the iframe; the page's responsive JS (GSAP deck,
  // header menu, matchMedia) only runs on load — so reload it to re-initialise at
  // the new width. The ready handshake then re-applies the current unsaved values.
  const firstDeviceRef = useRef(true)
  useEffect(() => {
    if (firstDeviceRef.current) {
      firstDeviceRef.current = false
      return
    }
    const win = iframeRef.current?.contentWindow
    try {
      win?.location.reload()
    } catch {
      if (iframeRef.current) iframeRef.current.src = url
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device])

  // when the preview iframe says it's ready, push the latest values
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.source === 'jv-preview' && e.data?.ready) send()
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  // keep the scaled iframe fitting its column
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setDim({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // fit to the pane width, but cap upscaling so narrow devices don't blow up blurry
  const MAX_SCALE: Record<PreviewDevice, number> = { desktop: 1, tablet: 1.4, mobile: 1.7 }
  const scale = Math.min(dim.w / BASE, MAX_SCALE[device]) || 1
  return (
    <div className={`editor-preview-frame is-${device}`} ref={wrapRef}>
      <div className="epf-stage" style={{ width: BASE * scale, height: dim.h }}>
        <iframe
          ref={iframeRef}
          src={url}
          title="Live preview"
          style={{ width: BASE, height: dim.h / scale, transform: `scale(${scale})`, transformOrigin: '0 0' }}
        />
      </div>
    </div>
  )
})
