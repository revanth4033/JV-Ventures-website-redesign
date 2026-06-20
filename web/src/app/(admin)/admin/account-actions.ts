'use server'

import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

import { SESSION_COOKIE, signSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

type Result = { ok: boolean; error?: string }
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

async function me() {
  const s = await getSession()
  if (!s) throw new Error('Not authenticated')
  return s
}
async function audit(userEmail: string, action: string, label: string) {
  await prisma.auditLog.create({ data: { userEmail, entity: 'account', label, action } }).catch(() => {})
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<Result> {
  const s = await me()
  const user = await prisma.user.findUnique({ where: { id: s.id } })
  if (!user) return { ok: false, error: 'Account not found.' }
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) return { ok: false, error: 'Current password is incorrect.' }
  if (newPassword.length < 8) return { ok: false, error: 'New password must be at least 8 characters.' }
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } })
  await audit(s.email, 'password-change', user.email)
  return { ok: true }
}

export async function updateProfile(name: string, email: string): Promise<Result> {
  const s = await me()
  const e = email.trim().toLowerCase()
  if (!EMAIL_RE.test(e)) return { ok: false, error: 'Enter a valid email address.' }
  if (await prisma.user.findFirst({ where: { email: e, NOT: { id: s.id } } })) {
    return { ok: false, error: 'That email is already in use.' }
  }
  const user = await prisma.user.update({ where: { id: s.id }, data: { name: name.trim(), email: e } })
  // re-issue the session cookie so the new email/name take effect immediately
  const token = await signSession({ id: user.id, email: user.email, name: user.name, role: user.role })
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  await audit(s.email, 'profile-update', user.email)
  return { ok: true }
}

/* ---------------- Team / admin-user management (admin role only) ---------------- */

export type AdminUser = { id: number; email: string; name: string; role: string }

async function requireAdmin() {
  const s = await me()
  if (s.role !== 'admin') throw new Error('Only admins can manage users.')
  return s
}

export async function listUsers(): Promise<AdminUser[]> {
  await me()
  return prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, email: true, name: true, role: true } })
}

export async function createUser(input: { email: string; name: string; password: string; role: string }): Promise<Result> {
  const s = await requireAdmin()
  const email = input.email.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Enter a valid email address.' }
  if (input.password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }
  if (await prisma.user.findUnique({ where: { email } })) return { ok: false, error: 'A user with that email already exists.' }
  const role = input.role === 'admin' ? 'admin' : 'editor'
  await prisma.user.create({ data: { email, name: input.name.trim(), passwordHash: await bcrypt.hash(input.password, 12), role } })
  await audit(s.email, 'user-create', `${email} (${role})`)
  return { ok: true }
}

export async function deleteUser(id: number): Promise<Result> {
  const s = await requireAdmin()
  if (id === s.id) return { ok: false, error: 'You can’t delete your own account.' }
  if ((await prisma.user.count()) <= 1) return { ok: false, error: 'At least one user must remain.' }
  const u = await prisma.user.findUnique({ where: { id } })
  await prisma.user.delete({ where: { id } }).catch(() => {})
  await audit(s.email, 'user-delete', u?.email ?? String(id))
  return { ok: true }
}
