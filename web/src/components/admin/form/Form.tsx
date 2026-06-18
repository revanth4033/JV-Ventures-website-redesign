'use client'

import { ChevronDown, CloudUpload, Eye, EyeOff, Plus, RefreshCw, SquareArrowOutUpRight, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { ImageField } from './ImageField'
import { PreviewFrame, type PreviewHandle } from './PreviewFrame'
import { RichListField, RichTextField } from './RichTextField'
import { LinesField, StringListField } from './TextListFields'
import { join, type FieldDef } from './types'

type SaveResult = { ok: boolean; error?: string }
const isTech = (f: FieldDef) =>
  /href|slug|url|link|mailto/i.test(('name' in f && f.name) || '') ||
  /\b(link|url)\b/i.test((f as { label?: string }).label ?? '')
const keyOf = (f: FieldDef, i: number) => ('name' in f ? f.name : `row-${i}`)

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
  const [showPreview, setShowPreview] = useState(false) // collapsed by default — opens on click
  const frameRef = useRef<PreviewHandle>(null)
  const dirty = methods.formState.isDirty

  useEffect(() => {
    if (!preview || !showPreview) return
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
      {preview && (
        <div className="editor-toolbar">
          <span className="spacer" />
          <button type="button" className="btn btn-sm" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? <EyeOff /> : <Eye />} {showPreview ? 'Hide preview' : 'Live preview'}
          </button>
        </div>
      )}
      <Fields fields={defs} prefix="" />
      <div className="savebar">
        <button className="btn btn-primary" type="submit" disabled={saving}>
          <CloudUpload /> {saving ? 'Publishing…' : saveLabel}
        </button>
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
      {fields.map((f, i) => (
        <FieldView key={keyOf(f, i)} field={f} prefix={prefix} index={i} />
      ))}
    </>
  )
}

function FieldView({ field, prefix, index }: { field: FieldDef; prefix: string; index: number }) {
  const { register } = useFormContext()

  switch (field.type) {
    case 'section':
      return <PanelSection label={field.label} fields={field.fields} bodyPrefix={prefix} defaultOpen={index === 0} />
    case 'group':
      return prefix === '' ? (
        <PanelSection label={field.label ?? ''} fields={field.fields} bodyPrefix={join(prefix, field.name)} defaultOpen={index === 0} />
      ) : (
        <div className="subgroup">
          {field.label && <div className="subgroup-label">{field.label}</div>}
          <Fields fields={field.fields} prefix={join(prefix, field.name)} />
        </div>
      )
    case 'row':
      return (
        <div className="field-row" style={{ gridTemplateColumns: `repeat(${field.fields.length}, minmax(0, 1fr))` }}>
          <Fields fields={field.fields} prefix={prefix} />
        </div>
      )
    case 'array':
      return <ArrayField field={field} prefix={prefix} />
    case 'image':
      return <ImageField name={join(prefix, field.name)} label={field.label} hint={field.hint} />
    case 'rich':
      return <RichTextField name={join(prefix, field.name)} label={field.label} hint={field.hint} multiline={field.multiline} />
    case 'richList':
      return <RichListField name={join(prefix, field.name)} label={field.label} hint={field.hint} />
    case 'lines':
      return <LinesField name={join(prefix, field.name)} label={field.label} hint={field.hint} />
    case 'stringList':
      return <StringListField name={join(prefix, field.name)} label={field.label} hint={field.hint} />
    case 'textarea':
      return (
        <div className={`field${isTech(field) ? ' tech' : ''}`}>
          <label>{field.label}</label>
          {field.hint && <div className="hint" dangerouslySetInnerHTML={{ __html: hintHtml(field.hint) }} />}
          <textarea {...register(join(prefix, field.name))} />
        </div>
      )
    case 'checkbox':
      return (
        <div className="field">
          <label className="check" htmlFor={join(prefix, field.name)}>
            <input type="checkbox" id={join(prefix, field.name)} {...register(join(prefix, field.name))} />
            <span>{field.label}</span>
          </label>
        </div>
      )
    case 'number':
      return (
        <div className="field">
          <label>{field.label}</label>
          {field.hint && <div className="hint">{field.hint}</div>}
          <input type="number" {...register(join(prefix, field.name), { valueAsNumber: true })} />
        </div>
      )
    default:
      return (
        <div className={`field${isTech(field) ? ' tech' : ''}`}>
          <label>{field.label}</label>
          {field.hint && <div className="hint" dangerouslySetInnerHTML={{ __html: hintHtml(field.hint) }} />}
          <input type="text" {...register(join(prefix, field.name))} />
        </div>
      )
  }
}

function PanelSection({
  label,
  fields,
  bodyPrefix,
  defaultOpen,
}: {
  label: string
  fields: FieldDef[]
  bodyPrefix: string
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={`panel${open ? ' open' : ''}`}>
      <button type="button" className="panel-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <h2>{label}</h2>
        <ChevronDown className="panel-chev" />
      </button>
      <div className="panel-body" hidden={!open}>
        <Fields fields={fields} prefix={bodyPrefix} />
      </div>
    </section>
  )
}

function hintHtml(s: string) {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc.replace(/&lt;code&gt;(.*?)&lt;\/code&gt;/g, '<code>$1</code>')
}

function ArrayField({ field, prefix }: { field: Extract<FieldDef, { type: 'array' }>; prefix: string }) {
  const { control, watch } = useFormContext()
  const path = join(prefix, field.name)
  const { fields, append, remove } = useFieldArray({ control, name: path })
  const singular = field.label.replace(/s$/, '')
  const flat = !!field.flat

  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(fields[0] ? [fields[0].id] : []))
  const lenRef = useRef(fields.length)
  useEffect(() => {
    if (fields.length > lenRef.current) {
      const last = fields[fields.length - 1]
      // open the freshly-added item (one-time on length growth)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (last) setOpenIds((s) => new Set(s).add(last.id))
    }
    lenRef.current = fields.length
  }, [fields])
  const toggle = (id: string) =>
    setOpenIds((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  return (
    <div className="arr">
      <div className="arr-head">
        <span className="arr-t">
          {field.label}
          <span className="count">{fields.length}</span>
        </span>
      </div>

      {fields.map((item, i) => {
        if (flat) {
          return (
            <div className="arr-item flat" key={item.id}>
              <div className="flat-body">
                <Fields fields={field.fields} prefix={`${path}.${i}`} />
              </div>
              <button type="button" className="arr-rm" onClick={() => remove(i)} aria-label="Remove">
                <X />
              </button>
            </div>
          )
        }
        const head = field.itemTitleKey ? String(watch(`${path}.${i}.${field.itemTitleKey}`) || '') : ''
        const isOpen = openIds.has(item.id)
        return (
          <div className={`arr-item${isOpen ? ' open' : ''}`} key={item.id}>
            <div className="arr-item-head" onClick={() => toggle(item.id)} role="button" aria-expanded={isOpen}>
              <span className="idx">{i + 1}</span>
              <span className="arr-item-t">{head || `${singular} ${i + 1}`}</span>
              <ChevronDown className="arr-chev" />
              <button
                type="button"
                className="arr-rm"
                onClick={(e) => { e.stopPropagation(); remove(i) }}
                aria-label="Remove"
              >
                <Trash2 />
              </button>
            </div>
            <div className="arr-item-body" hidden={!isOpen}>
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
