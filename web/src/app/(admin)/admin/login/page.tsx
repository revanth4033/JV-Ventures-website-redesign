'use client'

import { CircleAlert } from 'lucide-react'
import { useActionState } from 'react'

import { login } from '../auth-actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null)
  return (
    <div className="login-wrap">
      <aside className="login-aside">
        <div className="la-brand">
          <span className="mark">JV</span>
          <b>JV Ventures</b>
        </div>
        <div className="la-quote">
          <span className="eyebrow">Content Studio</span>
          <p>Shape how capital becomes impact — one page at a time.</p>
        </div>
        <div className="la-foot">India · Dubai · Singapore</div>
      </aside>

      <div className="login-main">
        <form className="login-card" action={action}>
          <h1>Sign in</h1>
          <p className="muted">Edit the JV Ventures website with a live preview.</p>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="username" autoFocus placeholder="you@jv.ventures" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
          </div>
          {state?.error && (
            <p className="err-msg" style={{ marginBottom: '1rem' }}>
              <CircleAlert /> {state.error}
            </p>
          )}
          <button className="btn btn-primary" type="submit" disabled={pending} style={{ width: '100%' }}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
