'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export type EnquiryRow = {
  id: number
  enquiry: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  message: string
  createdAt: string
}

async function requireUser() {
  const s = await getSession()
  if (!s) throw new Error('Not authenticated')
  return s
}

async function requireAdmin() {
  const s = await requireUser()
  if (s.role !== 'admin') throw new Error('Only admins can perform this action.')
  return s
}

/** Contact-form submissions, newest first. */
export async function listEnquiries(): Promise<EnquiryRow[]> {
  await requireUser()
  const rows = await prisma.enquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }).catch(() => [])
  return rows.map((r) => ({
    id: r.id,
    enquiry: r.enquiry,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    phone: r.phone,
    company: r.company,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
  }))
}

/** Permanently delete an enquiry (admins only). */
export async function deleteEnquiry(id: number): Promise<{ ok: boolean }> {
  await requireAdmin()
  await prisma.enquiry.delete({ where: { id } }).catch(() => {})
  return { ok: true }
}
