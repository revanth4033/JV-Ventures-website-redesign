'use client'

import { Plus, X } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'

import { RichEditor } from './RichTextField'

/** Animated title: one rich line per row, plus a friendly "accent" picker. */
export function LinesField({ name, label, hint }: { name: string; label: string; hint?: string }) {
  const { control } = useFormContext()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const val = field.value || { lines: [], emphasis: '' }
        const lines: string[] = Array.isArray(val.lines) ? val.lines : []
        const setLines = (l: string[]) => field.onChange({ ...val, lines: l })
        return (
          <div className="field">
            <label>{label}</label>
            {hint ? <div className="hint">{hint}</div> : <div className="hint">Each row is one line of the heading. Bold or italicise words with the toolbar.</div>}
            <div className="lines-edit">
              {lines.map((ln, i) => (
                <div className="line-row" key={i}>
                  <span className="line-idx">{i + 1}</span>
                  <div className="line-rte">
                    <RichEditor value={ln} onChange={(v) => setLines(lines.map((x, j) => (j === i ? v : x)))} />
                  </div>
                  <button type="button" className="arr-rm" onClick={() => setLines(lines.filter((_, j) => j !== i))} aria-label="Remove line">
                    <X />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-add btn-sm" onClick={() => setLines([...lines, ''])}>
                <Plus /> Add line
              </button>
            </div>
            <div className="field" style={{ marginTop: '.7rem', marginBottom: 0 }}>
              <label>Accent line</label>
              <div className="hint">Sets one line in the brand’s italic / red display style.</div>
              <select value={val.emphasis || ''} onChange={(e) => field.onChange({ ...val, emphasis: e.target.value })}>
                <option value="">None</option>
                {lines.map((_, i) => (
                  <option key={i} value={`line:${i}`}>
                    Line {i + 1}
                  </option>
                ))}
                <option value="all">All lines</option>
              </select>
            </div>
          </div>
        )
      }}
    />
  )
}

/** A plain list of strings, edited one-per-row. */
export function StringListField({ name, label, hint }: { name: string; label: string; hint?: string }) {
  const { control } = useFormContext()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const arr: string[] = Array.isArray(field.value) ? field.value : []
        return (
          <div className="field">
            <label>{label}</label>
            {hint && <div className="hint">{hint}</div>}
            <textarea
              rows={Math.max(2, arr.length)}
              value={arr.join('\n')}
              // empty textarea → [] (not ['']); blank lines kept so you can add rows
              onChange={(e) => field.onChange(e.target.value === '' ? [] : e.target.value.split('\n'))}
            />
          </div>
        )
      }}
    />
  )
}
