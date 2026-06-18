'use client'

import { Bold, Italic, Plus, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

// brand classes that carry design meaning and must survive a round-trip
// (there's no button for them, but existing content uses them — e.g. "Sphere of Influence")
const KEPT_CLASSES = new Set(['soi'])

/** Keep only <strong>/<em>/<br> (+ known brand classes); map b→strong, i→em; escape text. Blocks become line breaks. */
export function cleanInlineHtml(html: string): string {
  if (typeof document === 'undefined') return html
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const cls = (el: HTMLElement) => {
    const keep = (el.getAttribute('class') || '').split(/\s+/).filter((c) => KEPT_CLASSES.has(c))
    return keep.length ? ` class="${keep.join(' ')}"` : ''
  }
  const ser = (node: Node): string => {
    let out = ''
    node.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        out += esc(n.textContent || '')
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        const el = n as HTMLElement
        const tag = el.tagName.toLowerCase()
        if (tag === 'br') out += '<br>'
        else if (tag === 'strong' || tag === 'b') out += `<strong${cls(el)}>${ser(el)}</strong>`
        else if (tag === 'em' || tag === 'i') out += `<em${cls(el)}>${ser(el)}</em>`
        else if (tag === 'div' || tag === 'p') out += (out && !out.endsWith('<br>') ? '<br>' : '') + ser(el)
        else out += ser(el)
      }
    })
    return out
  }
  return ser(tmp).replace(/(<br>\s*)+$/, '').trim()
}

/** The contentEditable WYSIWYG core (uncontrolled — innerHTML set once on mount). */
export function RichEditor({
  value,
  onChange,
  multiline = false,
}: {
  value: string
  onChange: (v: string) => void
  multiline?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  // initialise once so the caret never jumps on re-render
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) ref.current.innerHTML = value || ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const emit = () => onChange(cleanInlineHtml(ref.current?.innerHTML || ''))
  const cmd = (c: string) => {
    try {
      document.execCommand('styleWithCSS', false, 'false')
      document.execCommand(c, false)
    } catch {
      /* noop */
    }
    ref.current?.focus()
    emit()
  }
  return (
    <div className={`rte${multiline ? ' rte-multi' : ''}`}>
      <div className="rte-bar">
        <button type="button" title="Bold (Ctrl+B)" onMouseDown={(e) => { e.preventDefault(); cmd('bold') }}>
          <Bold strokeWidth={2.5} />
        </button>
        <button type="button" title="Italic (Ctrl+I)" onMouseDown={(e) => { e.preventDefault(); cmd('italic') }}>
          <Italic strokeWidth={2.5} />
        </button>
      </div>
      <div
        ref={ref}
        className="rte-body"
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onKeyDown={(e) => { if (!multiline && e.key === 'Enter') e.preventDefault() }}
        onPaste={(e) => {
          e.preventDefault()
          const t = e.clipboardData.getData('text/plain')
          document.execCommand('insertText', false, t)
        }}
      />
    </div>
  )
}

/** A single rich-text field (bound to one HTML string). */
export function RichTextField({
  name,
  label,
  hint,
  multiline,
}: {
  name: string
  label: string
  hint?: string
  multiline?: boolean
}) {
  const { control } = useFormContext()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="field">
          <label>{label}</label>
          {hint && <div className="hint">{hint}</div>}
          <RichEditor value={field.value || ''} onChange={field.onChange} multiline={multiline} />
        </div>
      )}
    />
  )
}

/** A list of rich-text lines (bound to a string[]). */
export function RichListField({ name, label, hint }: { name: string; label: string; hint?: string }) {
  const { control } = useFormContext()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const arr: string[] = Array.isArray(field.value) ? field.value : []
        const set = (l: string[]) => field.onChange(l)
        return (
          <div className="field">
            <label>{label}</label>
            {hint && <div className="hint">{hint}</div>}
            <div className="lines-edit">
              {arr.map((ln, i) => (
                <div className="line-row" key={i}>
                  <span className="line-idx">{i + 1}</span>
                  <div className="line-rte">
                    <RichEditor value={ln} onChange={(v) => set(arr.map((x, j) => (j === i ? v : x)))} />
                  </div>
                  <button type="button" className="arr-rm" onClick={() => set(arr.filter((_, j) => j !== i))} aria-label="Remove line">
                    <X />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-add btn-sm" onClick={() => set([...arr, ''])}>
                <Plus /> Add line
              </button>
            </div>
          </div>
        )
      }}
    />
  )
}
