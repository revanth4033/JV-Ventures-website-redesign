'use server'

import bcrypt from 'bcryptjs'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Durable brute-force throttle, backed by the database (works across serverless
// instances): after MAX_FAILS failures within WINDOW_MS, the *source IP* is
// locked out. Keying on IP (not email) stops single-source guessing without
// letting an attacker lock a known admin out of their own account by burning
// failures against their email (an account-lockout DoS).
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS = 8
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Best-effort client IP from the proxy headers; falls back to a constant bucket. */
async function clientIp(): Promise<string> {
  const h = await headers()
  const fwd = h.get('x-forwarded-for')
  return (fwd?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown').slice(0, 64)
}

export async function login(_prev: { error?: string } | null, formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const throttleKey = `ip:${await clientIp()}`

  const rec = await prisma.loginAttempt.findUnique({ where: { key: throttleKey } }).catch(() => null)
  const within = rec ? Date.now() - rec.windowAt.getTime() < WINDOW_MS : false
  if (within && rec!.fails >= MAX_FAILS) {
    return { error: 'Too many attempts. Please wait a few minutes and try again.' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    // record the failure (reset the window if it has expired)
    if (within) {
      await prisma.loginAttempt.update({ where: { key: throttleKey }, data: { fails: { increment: 1 } } }).catch(() => {})
    } else {
      await prisma.loginAttempt
        .upsert({ where: { key: throttleKey }, create: { key: throttleKey, fails: 1, windowAt: new Date() }, update: { fails: 1, windowAt: new Date() } })
        .catch(() => {})
    }
    await sleep(400) // slow automated guessing
    return { error: 'Invalid email or password.' }
  }
  await prisma.loginAttempt.deleteMany({ where: { key: throttleKey } }).catch(() => {})
  const token = await signSession({ id: user.id, email: user.email, name: user.name, role: user.role, tv: user.tokenVersion })
  ;(await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions())
  redirect('/admin')
}

export async function logout() {
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect('/admin/login')
}
