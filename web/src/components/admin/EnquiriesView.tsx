'use client'

import { Building2, Mail, Phone, Trash2 } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteEnquiry, type EnquiryRow } from '@/app/(admin)/admin/enquiry-actions'

export function EnquiriesView({ rows: initial, canDelete }: { rows: EnquiryRow[]; canDelete: boolean }) {
  const [rows, setRows] = useState(initial)
  const [filter, setFilter] = useState('')
  const [busy, start] = useTransition()

  const types = useMemo(() => Array.from(new Set(initial.map((r) => r.enquiry).filter(Boolean))), [initial])
  const shown = filter ? rows.filter((r) => r.enquiry === filter) : rows

  const remove = (id: number) => {
    if (!confirm('Delete this enquiry permanently?')) return
    start(async () => {
      const res = await deleteEnquiry(id)
      if (res.ok) {
        setRows((rs) => rs.filter((r) => r.id !== id))
        toast.success('Enquiry deleted')
      } else {
        toast.error('Could not delete')
      }
    })
  }

  if (!initial.length) {
    return <p className="hint">No enquiries yet. Submissions from the Contact form will appear here.</p>
  }

  return (
    <div className="enquiries">
      <div className="enq-filter">
        <button type="button" className={`enq-chip${!filter ? ' active' : ''}`} onClick={() => setFilter('')}>
          All <span>{rows.length}</span>
        </button>
        {types.map((t) => {
          const n = rows.filter((r) => r.enquiry === t).length
          return (
            <button type="button" key={t} className={`enq-chip${filter === t ? ' active' : ''}`} onClick={() => setFilter(t)}>
              {t} <span>{n}</span>
            </button>
          )
        })}
      </div>

      <ul className="enq-list">
        {shown.map((r) => {
          const name = `${r.firstName} ${r.lastName}`.trim() || '(no name)'
          return (
            <li className="enq-card" key={r.id}>
              <div className="enq-top">
                <div className="enq-id">
                  <span className="enq-name">{name}</span>
                  {r.enquiry ? <span className="badge badge-info">{r.enquiry}</span> : null}
                </div>
                <time className="enq-when">{new Date(r.createdAt).toLocaleString()}</time>
              </div>

              <div className="enq-meta">
                <a href={`mailto:${r.email}`}>
                  <Mail size={14} /> {r.email}
                </a>
                {r.phone ? (
                  <a href={`tel:${r.phone}`}>
                    <Phone size={14} /> {r.phone}
                  </a>
                ) : null}
                {r.company ? (
                  <span>
                    <Building2 size={14} /> {r.company}
                  </span>
                ) : null}
              </div>

              <p className="enq-msg">{r.message}</p>

              <div className="enq-actions">
                <a className="btn btn-sm" href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: ${r.enquiry || 'Your enquiry'} — JV Ventures`)}`}>
                  Reply
                </a>
                {canDelete ? (
                  <button type="button" className="btn btn-sm enq-del" disabled={busy} onClick={() => remove(r.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
