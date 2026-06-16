'use client'

import { CloudUpload, Eye, EyeOff, Plus, RefreshCw, SquareArrowOutUpRight, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { ImageField } from './ImageField'
import { PreviewFrame, type PreviewHandle } from './PreviewFrame'
import { LinesField, StringListField } from './TextListFields'
import { join, type FieldDef } from './types'

type SaveResult = { ok: boolean; error?: string }
const isTech = (f: FieldDef) =>
  /href|slug|url|link|mailto/i.test(f.name) || /\b(link|url)\b/i.test((f as { label?: string }).label ?? '')

export function EntityForm({
  defs,
  defaultValues,
  action,
  saveLabel = 'Save & publish',
  preview,
}: {
  defs: FieldDef[]
  defaultValues: Record<string, unknown>
  action: (data: Record<string, unknown>) => Promise<SaveResult>
  saveLabel?: string
  preview?: { url: string; section: string }
}) {
  const methods = useForm({ defaultValues })
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const frameRef = useRef<PreviewHandle>(null)
  const dirty = methods.formState.isDirty

  useEffect(() => {
    if (!preview) return
    let t: ReturnType<typeof setTimeout>
    frameRef.current?.post(preview.section, methods.getValues())
    const sub = methods.watch((values) => {
      clearTimeout(t)
      t = setTimeout(() => frameRef.current?.post(preview.section, values), 120)
    })
    return () => {
      clearTimeout(t)
      sub.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, showPreview])

  const onSubmit = methods.handleSubmit(async (data) => {
    setSaving(true)
    try {
      const res = await action(data)
      if (res.ok) {
        methods.reset(data)
        toast.success('Published', { description: 'Your changes are live within ~30 seconds.' })
      } else {
        toast.error('Could not publish', { description: res.error || 'Please try again.' })
      }
    } catch (e) {
      toast.error('Could not publish', { description: e instanceof Error ? e.message : 'Please try again.' })
    } finally {
      setSaving(false)
    }
  })

  const split = preview && showPreview

  const formInner = (
    <form onSubmit={onSubmit}>
      <Fields fields={defs} prefix="" />
      <div className="savebar">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          <CloudUpload /> {saving ? 'Publishing…' : saveLabel}
        </button>
        {preview && (
          <button type="button" className="btn btn-ghost" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? <EyeOff /> : <Eye />} {showPreview ? 'Hide preview' : 'Show preview'}
          </button>
        )}
        <span className="spacer" />
        <span className="hint-inline">{dirty ? 'Unsaved changes' : 'All changes published'}</span>
      </div>
    </form>
  )

  return (
    <FormProvider {...methods}>
      {split ? (
        <div className="editor-split">
          <div className="editor-form">{formInner}</div>
          <div className="editor-preview-col">
            <div className="editor-preview-bar">
              <span className="lp-live">
                <span className="blip" /> Live preview
              </span>
              <span className="lp-actions">
                <button type="button" onClick={() => frameRef.current?.reload()} title="Rebuild — use after adding or removing items">
                  <RefreshCw /> Refresh
                </button>
                <a href={preview!.url} target="_blank" rel="noopener noreferrer">
                  <SquareArrowOutUpRight /> Open
                </a>
              </span>
            </div>
            <PreviewFrame ref={frameRef} url={preview!.url} />
          </div>
        </div>
      ) : (
        formInner
      )}
    </FormProvider>
  )
}

function Fields({ fields, prefix }: { fields: FieldDef[]; prefix: string }) {
  return (
    <>
      {fields.map((f) => (
        <FieldView key={f.name} field={f} prefix={prefix} />
      ))}
    </>
  )
}

function FieldView({ field, prefix }: { field: FieldDef; prefix: string }) {
  const { register } = useFormContext()
  const path = join(prefix, field.name)

  switch (field.type) {
    case 'group':
      // top-level groups are full sections; nested groups are lighter
      return prefix === '' ? (
        <section className="panel">
          {field.label && (
            <div className="panel-head">
              <h2>{field.label}</h2>
            </div>
          )}
          <div className="panel-body">
            <Fields fields={field.fields} prefix={path} />
          </div>
        </section>
      ) : (
        <div className="subgroup">
          {field.label && <div className="subgroup-label">{field.label}</div>}
          <Fields fields={field.fields} prefix={path} />
        </div>
      )
    case 'array':
      return <ArrayField field={field} prefix={prefix} />
    case 'image':
      return <ImageField name={path} label={field.label} hint={field.hint} />
    case 'lines':
      return <LinesField name={path} label={field.label} hint={field.hint} />
    case 'stringList':
      return <StringListField name={path} label={field.label} hint={field.hint} />
    case 'textarea':
      return (
        <div className={`field${isTech(field) ? ' tech' : ''}`}>
          <label>{field.label}</label>
          {field.hint && <div className="hint" dangerouslySetInnerHTML={{ __html: hintHtml(field.hint) }} />}
          <textarea {...register(path)} />
        </div>
      )
    case 'checkbox':
      return (
        <div className="field">
          <label className="check" htmlFor={path}>
            <input type="checkbox" id={path} {...register(path)} />
            <span>{field.label}</span>
          </label>
        </div>
      )
    case 'number':
      return (
        <div className="field">
          <label>{field.label}</label>
          {field.hint && <div className="hint">{field.hint}</div>}
          <input type="number" {...register(path, { valueAsNumber: true })} />
        </div>
      )
    default:
      return (
        <div className={`field${isTech(field) ? ' tech' : ''}`}>
          <label>{field.label}</label>
          {field.hint && <div className="hint" dangerouslySetInnerHTML={{ __html: hintHtml(field.hint) }} />}
          <input type="text" {...register(path)} />
        </div>
      )
  }
}

// turn `<code>x</code>`-style hints (and bare inline code) into styled code chips safely
function hintHtml(s: string) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc.replace(/&lt;code&gt;(.*?)&lt;\/code&gt;/g, '<code>$1</code>')
}

function ArrayField({ field, prefix }: { field: Extract<FieldDef, { type: 'array' }>; prefix: string }) {
  const { control, watch } = useFormContext()
  const path = join(prefix, field.name)
  const { fields, append, remove } = useFieldArray({ control, name: path })
  const singular = field.label.replace(/s$/, '')

  return (
    <div className="arr">
      <div className="arr-head">
        <span className="arr-t">
          {field.label}
          <span className="count">{fields.length}</span>
        </span>
      </div>
      {fields.map((item, i) => {
        const head = field.itemTitleKey ? String(watch(`${path}.${i}.${field.itemTitleKey}`) || '') : ''
        return (
          <div className="arr-item" key={item.id}>
            <div className="arr-item-head">
              <span className="idx">{i + 1}</span>
              <span className="arr-item-t">{head || `${singular} ${i + 1}`}</span>
              <button type="button" className="arr-rm" onClick={() => remove(i)} aria-label="Remove">
                <Trash2 />
              </button>
            </div>
            <div className="arr-item-body">
              <Fields fields={field.fields} prefix={`${path}.${i}`} />
            </div>
          </div>
        )
      })}
      <button type="button" className="btn btn-add" onClick={() => append((field.newItem?.() ?? {}) as never)}>
        <Plus /> Add {singular.toLowerCase()}
      </button>
    </div>
  )
}
