'use client'

import { CalendarClock, ChevronDown, CloudUpload, Eye, EyeOff, Maximize2, Minimize2, Plus, RefreshCw, SquareArrowOutUpRight, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form'
import { toast } from 'sonner'

import { ImageField } from './ImageField'
import { PreviewFrame, type PreviewDevice, type PreviewHandle } from './PreviewFrame'
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
  draftAction,
  scheduleAction,
  discardAction,
  hasDraft = false,
  publishAt = null,
}: {
  defs: FieldDef[]
  defaultValues: Record<string, unknown>
  action: (data: Record<string, unknown>) => Promise<SaveResult>
  saveLabel?: string
  preview?: { url: string; section: string }
  draftAction?: (data: Record<string, unknown>) => Promise<SaveResult>
  scheduleAction?: (data: Record<string, unknown>, at: string) => Promise<SaveResult>
  discardAction?: () => Promise<SaveResult>
  hasDraft?: boolean
  publishAt?: string | null
}) {
  const router = useRouter()
  const methods = useForm({ defaultValues })
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false) // collapsed by default — opens on click
  const [device, setDevice] = useState<PreviewDevice>('desktop')
  const [fullscreen, setFullscreen] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleAt, setScheduleAt] = useState('')
  const [hasDraftLocal, setHasDraftLocal] = useState(hasDraft)
  const [publishAtLocal, setPublishAtLocal] = useState<string | null>(publishAt)
  const frameRef = useRef<PreviewHandle>(null)
  const sectionIdRef = useRef<string>('')
  const draftMode = Boolean(draftAction)

  // Tell the live preview which section the editor is on, so it scrolls there.
  const onSectionChange = (id: string) => {
    sectionIdRef.current = id
    if (showPreview) frameRef.current?.scrollTo(id)
  }
  // When the preview is (re)opened, jump it to the section currently being edited.
  useEffect(() => {
    if (!showPreview || !sectionIdRef.current) return
    const t = setTimeout(() => frameRef.current?.scrollTo(sectionIdRef.current), 700)
    return () => clearTimeout(t)
  }, [showPreview])
  // isDirty gives false positives with nested object/array Controllers (title/lines),
  // so judge "unsaved" by actual changed fields instead.
  const dirty = Object.keys(methods.formState.dirtyFields).length > 0

  // Keep the sticky section-tab bar parked right below the (sticky) topbar.
  useEffect(() => {
    const tb = document.querySelector<HTMLElement>('.admin-topbar')
    if (!tb) return
    const set = () => document.documentElement.style.setProperty('--cms-topbar-h', `${tb.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(tb)
    return () => ro.disconnect()
  }, [])

  // Esc exits the fullscreen preview.
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFullscreen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  // Warn before the tab is closed/reloaded with unpublished edits.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

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

  const runSave = async (fn: () => Promise<SaveResult>, ok: string, okDesc: string, refresh = false): Promise<boolean> => {
    setSaving(true)
    try {
      const res = await fn()
      if (res.ok) {
        methods.reset(methods.getValues())
        toast.success(ok, { description: okDesc })
        if (refresh) router.refresh()
        return true
      }
      toast.error('Could not save', { description: res.error || 'Please try again.' })
      return false
    } catch (e) {
      toast.error('Could not save', { description: e instanceof Error ? e.message : 'Please try again.' })
      return false
    } finally {
      setSaving(false)
    }
  }

  const onPublish = methods.handleSubmit(async (d) => {
    const ok = await runSave(() => action(d), 'Published', 'Live on the site within ~30 seconds.', true)
    if (ok) {
      setHasDraftLocal(false)
      setPublishAtLocal(null)
      setShowSchedule(false)
    }
  })
  const onDraft = methods.handleSubmit(async (d) => {
    const ok = await runSave(() => draftAction!(d), 'Draft saved', 'Not published yet — visitors still see the live version.')
    if (ok) setHasDraftLocal(true)
  })
  const onSchedule = methods.handleSubmit(async (d) => {
    if (!scheduleAt) return
    const iso = new Date(scheduleAt).toISOString()
    const ok = await runSave(() => scheduleAction!(d, iso), 'Scheduled', `Goes live ${new Date(scheduleAt).toLocaleString()}.`)
    if (ok) {
      setHasDraftLocal(true)
      setPublishAtLocal(iso)
      setShowSchedule(false)
    }
  })
  const onDiscard = () => {
    if (!discardAction || !confirm('Discard the unpublished draft and revert to the live version?')) return
    runSave(() => discardAction(), 'Draft discarded', 'Reverted to the published version.', true).then((ok) => {
      if (ok) {
        setHasDraftLocal(false)
        setPublishAtLocal(null)
      }
    })
  }

  const status = publishAtLocal
    ? `Scheduled for ${new Date(publishAtLocal).toLocaleString()}`
    : hasDraftLocal
      ? 'Draft saved — not yet published'
      : dirty
        ? 'Unsaved changes'
        : 'All changes published'

  const split = preview && showPreview

  const formInner = (
    <form onSubmit={draftMode ? onDraft : onPublish}>
      {preview && (
        <div className="editor-toolbar">
          <span className="spacer" />
          <button type="button" className="btn btn-sm" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? <EyeOff /> : <Eye />} {showPreview ? 'Hide preview' : 'Live preview'}
          </button>
        </div>
      )}
      <FormBody defs={defs} onActiveChange={onSectionChange} />
      <div className="savebar">
        {draftMode ? (
          <>
            <button className="btn btn-primary" type="button" onClick={onPublish} disabled={saving}>
              <CloudUpload /> {saving ? 'Working…' : 'Publish now'}
            </button>
            <button className="btn" type="submit" disabled={saving}>
              Save draft
            </button>
            {scheduleAction && (
              <button className="btn" type="button" onClick={() => setShowSchedule((s) => !s)} disabled={saving}>
                <CalendarClock /> Schedule
              </button>
            )}
          </>
        ) : (
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <CloudUpload /> {saving ? 'Publishing…' : saveLabel}
          </button>
        )}
        <span className="spacer" />
        <span className="hint-inline">{status}</span>
      </div>
      {draftMode && showSchedule && scheduleAction && (
        <div className="schedule-row">
          <label className="schedule-field">
            Go live at
            <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
          </label>
          <button className="btn btn-sm btn-primary" type="button" onClick={onSchedule} disabled={saving || !scheduleAt}>
            Schedule publish
          </button>
          {(hasDraft || publishAt) && discardAction && (
            <button className="btn btn-sm" type="button" onClick={onDiscard} disabled={saving}>
              Discard draft
            </button>
          )}
        </div>
      )}
    </form>
  )

  return (
    <FormProvider {...methods}>
      {split ? (
        <div className="editor-split">
          <div className="editor-form">{formInner}</div>
          <div className={`editor-preview-col${fullscreen ? ' fullscreen' : ''}`}>
            <div className="editor-preview-bar">
              <span className="lp-live">
                <span className="blip" /> Live preview
              </span>
              <span className="lp-device" role="group" aria-label="Preview size">
                {(['desktop', 'tablet', 'mobile'] as const).map((d) => (
                  <button key={d} type="button" className={device === d ? 'on' : ''} onClick={() => setDevice(d)} title={`${d[0].toUpperCase()}${d.slice(1)} preview`}>
                    {d === 'desktop' ? 'Desktop' : d === 'tablet' ? 'Tablet' : 'Mobile'}
                  </button>
                ))}
              </span>
              <span className="lp-actions">
                <button type="button" onClick={() => setFullscreen((f) => !f)} title={fullscreen ? 'Exit fullscreen (Esc)' : 'Expand to fullscreen'}>
                  {fullscreen ? <Minimize2 /> : <Maximize2 />} {fullscreen ? 'Exit' : 'Expand'}
                </button>
                <button type="button" onClick={() => frameRef.current?.reload()} title="Rebuild — use after adding or removing items">
                  <RefreshCw /> Refresh
                </button>
                <a href={preview!.url} target="_blank" rel="noopener noreferrer">
                  <SquareArrowOutUpRight /> Open
                </a>
              </span>
            </div>
            <PreviewFrame ref={frameRef} url={preview!.url} device={device} />
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

type Tab = { id: string; label: string; fields: FieldDef[]; prefix: string }

/** If every top-level field is a section/group, present them as tabs instead of
 *  a tall stack of accordions — one section on screen at a time. */
function asTabs(defs: FieldDef[]): Tab[] | null {
  const tabs = defs.map((d): Tab | null => {
    if (d.type === 'section') return { id: d.name, label: d.label, fields: d.fields, prefix: '' }
    if (d.type === 'group') return { id: d.name, label: d.label ?? '', fields: d.fields, prefix: d.name }
    return null
  })
  return tabs.every((t): t is Tab => t !== null && t.label !== '') ? (tabs as Tab[]) : null
}

function FormBody({ defs, onActiveChange }: { defs: FieldDef[]; onActiveChange?: (id: string) => void }) {
  const tabs = asTabs(defs)
  if (!tabs) return <Fields fields={defs} prefix="" />
  return <TabbedSections tabs={tabs} onActiveChange={onActiveChange} />
}

function TabbedSections({ tabs, onActiveChange }: { tabs: Tab[]; onActiveChange?: (id: string) => void }) {
  const [active, setActive] = useState(0)
  const cur = tabs[Math.min(active, tabs.length - 1)]
  const wrapRef = useRef<HTMLDivElement>(null)
  const firstRun = useRef(true)
  // notify the editor (→ live preview) which section is being edited, and bring the
  // section's top into view so you start at the top (the tab bar stays sticky).
  useEffect(() => {
    onActiveChange?.(cur.id)
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
  return (
    <div className="sec-wrap" ref={wrapRef}>
      <div className="sec-tabs" role="tablist" aria-label="Page sections">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`sec-tab${i === active ? ' on' : ''}`}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="sec-body" key={cur.label}>
        <Fields fields={cur.fields} prefix={cur.prefix} />
      </div>
    </div>
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
          <input
            type="number"
            {...register(join(prefix, field.name), {
              // empty / non-numeric → 0 (avoids NaN serialising to null on save)
              setValueAs: (v) => (v === '' || v === null || Number.isNaN(Number(v)) ? 0 : Number(v)),
            })}
          />
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
            <div className="arr-item-head">
              <button
                type="button"
                className="arr-item-toggle"
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
              >
                <span className="idx">{i + 1}</span>
                <span className="arr-item-t">{head || `${singular} ${i + 1}`}</span>
                <ChevronDown className="arr-chev" />
              </button>
              <button
                type="button"
                className="arr-rm"
                onClick={() => remove(i)}
                aria-label={`Remove ${head || `${singular} ${i + 1}`}`}
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
