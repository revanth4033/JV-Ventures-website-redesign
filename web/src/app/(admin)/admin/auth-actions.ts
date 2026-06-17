'use server'

import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { SESSION_COOKIE, signSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Best-effort brute-force throttle. In-memory, so per-instance on serverless —
// not a hard guarantee, but it meaningfully slows credential-stuffing. For a
// stronger guarantee, back this with the DB or a KV store.
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS = 8
const fails = new Map<string, { n: number; ts: number }>()
const tooMany = (key: string) => {
  const a = fails.get(key)
  if (!a) return false
  if (Date.now() - a.ts > WINDOW_MS) { fails.delete(key); return false }
  return a.n >= MAX_FAILS
}
const recordFail = (key: string) => {
  const a = fails.get(key)
  if (!a || Date.now() - a.ts > WINDOW_MS) fails.set(key, { n: 1, ts: Date.now() })
  else a.n++
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function login(_prev: { error?: string } | null, formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')

  if (tooMany(email)) {
    return { error: 'Too many attempts. Please wait a few minutes and try again.' }
  }
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    recordFail(email)
    await sleep(400) // slow automated guessing
    return { error: 'Invalid email or password.' }
  }
  fails.delete(email)
  const token = await signSession({ id: user.id, email: user.email, name: user.name, role: user.role })
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  redirect('/admin')
}

export async function logout() {
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect('/admin/login')
}
