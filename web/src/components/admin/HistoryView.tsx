'use client'

import { RotateCcw } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { listRevisions, restoreRevision, type AuditRow, type RevisionRow } from '@/app/(admin)/admin/content-actions'

type Entity = { entity: string; label: string }

const ACTION_TONE: Record<string, string> = { create: 'ok', update: 'info', delete: 'danger', restore: 'warn' }

export function HistoryView({ audit, entities }: { audit: AuditRow[]; entities: Entity[] }) {
  const [entity, setEntity] = useState('')
  const [revs, setRevs] = useState<RevisionRow[] | null>(null)
  const [busy, start] = useTransition()

  const pick = (e: string) => {
    setEntity(e)
    setRevs(null)
    if (e) listRevisions(e).then(setRevs)
  }
  const restore = (id: number) => {
    if (!confirm('Restore this version? The live content will be replaced (your current version is snapshotted first).')) return
    start(async () => {
      const res = await restoreRevision(id)
      if (res.ok) {
        toast.success('Version restored', { description: 'The live site updates within ~30 seconds.' })
        if (entity) listRevisions(entity).then(setRevs)
      } else {
        toast.error('Could not restore', { description: res.error || 'Please try again.' })
      }
    })
  }

  return (
    <div className="history">
      <section className="hist-panel">
        <h2 className="hist-h">Restore a previous version</h2>
        <p className="hint">Every publish snapshots the page. Pick a page, then restore any earlier version.</p>
        <select value={entity} onChange={(e) => pick(e.target.value)} style={{ maxWidth: 360 }}>
          <option value="">Choose a page…</option>
          {entities.map((e) => (
            <option key={e.entity} value={e.entity}>{e.label}</option>
          ))}
        </select>
        {entity && (
          <div className="rev-list">
            {revs === null ? (
              <p className="hint">Loading…</p>
            ) : revs.length === 0 ? (
              <p className="hint">No saved versions yet for this page.</p>
            ) : (
              <ul>
                {revs.map((r, i) => (
                  <li key={r.id}>
                    <span className="rev-when">{new Date(r.at).toLocaleString()}</span>
                    <span className="rev-who">{r.userEmail || '—'}</span>
                    {i === 0 ? (
                      <span className="badge badge-info">current</span>
                    ) : (
                      <button type="button" className="btn btn-sm" disabled={busy} onClick={() => restore(r.id)}>
                        <RotateCcw /> Restore
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section className="hist-panel">
        <h2 className="hist-h">Activity log</h2>
        {audit.length === 0 ? (
          <p className="hint">No activity recorded yet.</p>
        ) : (
          <table className="audit-table">
            <thead>
              <tr><th>When</th><th>Action</th><th>Page</th><th>By</th></tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id}>
                  <td className="rev-when">{new Date(a.at).toLocaleString()}</td>
                  <td><span className={`badge badge-${ACTION_TONE[a.action] || 'info'}`}>{a.action}</span></td>
                  <td>{a.label || a.entity}</td>
                  <td className="rev-who">{a.userEmail || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
