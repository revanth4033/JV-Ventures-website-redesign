'use client'

import { ImageUp, ImagePlus, X } from 'lucide-react'
import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { MediaPicker } from './MediaPicker'

export function ImageField({ name, label, hint }: { name: string; label: string; hint?: string }) {
  const { control } = useFormContext()
  const [open, setOpen] = useState(false)
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="field">
          <label>{label}</label>
          {hint && <div className="hint">{hint}</div>}
          <div className="img-field">
            {field.value ? (
              /\.mp4($|\?)/i.test(field.value) ? (
                <video className="img-thumb" src={field.value} muted playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="img-thumb" src={field.value} alt="" />
              )
            ) : (
              <span className="img-thumb empty">
                <ImagePlus strokeWidth={1.7} />
              </span>
            )}
            <div className="img-actions">
              <div className="row">
                <button type="button" className="btn btn-sm" onClick={() => setOpen(true)}>
                  <ImageUp /> {field.value ? 'Replace' : 'Choose image'}
                </button>
                {field.value && (
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => field.onChange('')}>
                    <X /> Remove
                  </button>
                )}
              </div>
              <div className="img-meta">{field.value || 'No image selected'}</div>
            </div>
          </div>
          {open && <MediaPicker onPick={(url) => field.onChange(url)} onClose={() => setOpen(false)} />}
        </div>
      )}
    />
  )
}
