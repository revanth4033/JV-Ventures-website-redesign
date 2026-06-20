'use client'

import { KeyRound, Trash2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { changePassword, createUser, deleteUser, updateProfile, type AdminUser } from '@/app/(admin)/admin/account-actions'

export function AccountView({
  me,
  users,
  isAdmin,
}: {
  me: { name: string; email: string; role: string }
  users: AdminUser[]
  isAdmin: boolean
}) {
  const router = useRouter()
  const [busy, start] = useTransition()
  const [name, setName] = useState(me.name)
  const [email, setEmail] = useState(me.email)
  const [cur, setCur] = useState('')
  const [np, setNp] = useState('')
  const [cp, setCp] = useState('')
  const [list, setList] = useState(users)
  const [nu, setNu] = useState({ email: '', name: '', password: '', role: 'editor' })

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      const r = await updateProfile(name, email)
      if (r.ok) {
        toast.success('Profile updated')
        router.refresh()
      } else toast.error('Could not update', { description: r.error })
    })
  }
  const savePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (np !== cp) return toast.error('The new passwords don’t match.')
    start(async () => {
      const r = await changePassword(cur, np)
      if (r.ok) {
        toast.success('Password changed')
        setCur('')
        setNp('')
        setCp('')
      } else toast.error('Could not change password', { description: r.error })
    })
  }
  const addUser = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      const r = await createUser(nu)
      if (r.ok) {
        toast.success('User added')
        setNu({ email: '', name: '', password: '', role: 'editor' })
        router.refresh()
      } else toast.error('Could not add user', { description: r.error })
    })
  }
  const removeUser = (u: AdminUser) => {
    if (!confirm(`Remove ${u.email}? They will lose access.`)) return
    start(async () => {
      const r = await deleteUser(u.id)
      if (r.ok) {
        toast.success('User removed')
        setList((p) => p.filter((x) => x.id !== u.id))
      } else toast.error('Could not remove user', { description: r.error })
    })
  }

  return (
    <div className="account">
      <section className="acc-card">
        <h2>Profile</h2>
        <form onSubmit={saveProfile}>
          <div className="field">
            <label>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Email (your sign-in)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Save profile
          </button>
        </form>
      </section>

      <section className="acc-card">
        <h2>Change password</h2>
        <form onSubmit={savePassword}>
          <div className="field">
            <label>Current password</label>
            <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required />
          </div>
          <div className="field">
            <label>New password</label>
            <input type="password" value={np} onChange={(e) => setNp(e.target.value)} autoComplete="new-password" required />
            <div className="hint">At least 8 characters.</div>
          </div>
          <div className="field">
            <label>Confirm new password</label>
            <input type="password" value={cp} onChange={(e) => setCp(e.target.value)} autoComplete="new-password" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            <KeyRound /> Update password
          </button>
        </form>
      </section>

      {isAdmin && (
        <section className="acc-card">
          <h2>Team members</h2>
          <p className="hint">Admins can edit everything incl. users; editors can edit content only.</p>
          <div className="acc-users">
            {list.map((u) => (
              <div className="acc-user" key={u.id}>
                <span className="acc-user-info">
                  <b>{u.name || u.email}</b>
                  <span>{u.email} · {u.role}</span>
                </span>
                <button type="button" className="arr-rm" onClick={() => removeUser(u)} disabled={busy} aria-label={`Remove ${u.email}`}>
                  <Trash2 />
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={addUser} className="acc-add">
            <div className="row2">
              <div className="field">
                <label>Name</label>
                <input type="text" value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} required />
              </div>
            </div>
            <div className="row2">
              <div className="field">
                <label>Temporary password</label>
                <input type="text" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} required />
              </div>
              <div className="field">
                <label>Role</label>
                <select value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              <UserPlus /> Add user
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
