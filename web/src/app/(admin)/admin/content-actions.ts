'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import { sanitizeContent } from '@/lib/sanitize'
import { getSession } from '@/lib/session'

type Data = Record<string, unknown>
const json = (d: unknown) => d as Prisma.InputJsonValue
type Result = { ok: boolean; error?: string }

const SINGLETON_LABELS: Record<string, string> = {
  siteSettings: 'Site Settings',
  homePage: 'Home Page',
  aboutPage: 'About Page',
  teamPage: 'Team Page',
  contactPage: 'Contact Page',
}

const toSlug = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

async function guard() {
  const s = await getSession()
  if (!s) throw new Error('Not authenticated')
  return s
}

async function revalidateSite() {
  revalidatePath('/')
  revalidatePath('/about')
  revalidatePath('/team')
  revalidatePath('/contact')
  revalidatePath('/platform')
  revalidatePath('/sitemap.xml')
  const plats = await prisma.platform.findMany({ select: { slug: true } })
  for (const p of plats) revalidatePath(`/platform/${p.slug}`)
}

/** Audit trail + a version snapshot (for rollback). Keeps the latest 30 snapshots per entity. */
async function record(entity: string, label: string, action: string, userEmail: string, snapshot?: unknown) {
  await prisma.auditLog.create({ data: { userEmail, entity, label, action } }).catch(() => {})
  if (snapshot !== undefined) {
    await prisma.revision.create({ data: { entity, label, userEmail, data: json(snapshot) } }).catch(() => {})
    const old = await prisma.revision
      .findMany({ where: { entity }, orderBy: { at: 'desc' }, skip: 30, select: { id: true } })
      .catch(() => [])
    if (old.length) await prisma.revision.deleteMany({ where: { id: { in: old.map((r) => r.id) } } }).catch(() => {})
  }
}

async function saveSingleton(key: string, data: Data): Promise<Result> {
  const s = await guard()
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, error: 'Invalid content payload.' }
  const clean = sanitizeContent(data)
  await prisma.singleton.upsert({
    where: { key },
    create: { key, data: json(clean) },
    update: { data: json(clean) },
  })
  await record(key, SINGLETON_LABELS[key] ?? key, 'update', s.email, clean)
  await revalidateSite()
  return { ok: true }
}

export async function saveSiteSettings(data: Data): Promise<Result> {
  return saveSingleton('siteSettings', data)
}
export async function saveHome(data: Data): Promise<Result> {
  return saveSingleton('homePage', data)
}
export async function saveAbout(data: Data): Promise<Result> {
  return saveSingleton('aboutPage', data)
}
export async function saveTeam(data: Data): Promise<Result> {
  return saveSingleton('teamPage', data)
}
export async function saveContact(data: Data): Promise<Result> {
  return saveSingleton('contactPage', data)
}

export async function savePlatform(slug: string, data: Data): Promise<Result> {
  const s = await guard()
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, error: 'Invalid content payload.' }
  const clean = sanitizeContent(data)
  await prisma.platform.update({
    where: { slug },
    data: {
      name: String(clean.name ?? ''),
      sector: String(clean.sector ?? ''),
      order: Number(clean.order ?? 0),
      data: json(clean),
    },
  })
  await record(`platform:${slug}`, String(clean.name ?? slug), 'update', s.email, clean)
  await revalidateSite()
  return { ok: true }
}

/** Create a new platform with a unique slug and sensible empty content. */
export async function createPlatform(input: { name?: string; sector?: string; slug?: string }): Promise<Result & { slug?: string }> {
  const s = await guard()
  const name = String(input.name ?? '').trim()
  const slug = toSlug(String(input.slug ?? input.name ?? ''))
  if (!name) return { ok: false, error: 'A platform name is required.' }
  if (!slug) return { ok: false, error: 'A URL slug is required.' }
  if (await prisma.platform.findUnique({ where: { slug } })) {
    return { ok: false, error: `The slug "${slug}" is already taken.` }
  }
  const max = await prisma.platform.aggregate({ _max: { order: true } })
  const order = (max._max.order ?? 0) + 1
  const content = {
    slug, order, name,
    sector: String(input.sector ?? '').trim(),
    wordmark: '', hero: '', video: '', tagline: '', intro: '',
    totals: [] as unknown[], categories: [] as unknown[],
  }
  await prisma.platform.create({ data: { slug, name: content.name, sector: content.sector, order, data: json(content) } })
  await record(`platform:${slug}`, name, 'create', s.email, content)
  revalidatePath('/platform')
  revalidatePath('/sitemap.xml')
  return { ok: true, slug }
}

export async function deletePlatform(slug: string): Promise<Result> {
  const s = await guard()
  const row = await prisma.platform.findUnique({ where: { slug }, select: { name: true } })
  if (!row) return { ok: false, error: 'That platform no longer exists.' }
  await prisma.platform.delete({ where: { slug } })
  await record(`platform:${slug}`, row.name, 'delete', s.email)
  revalidatePath(`/platform/${slug}`)
  await revalidateSite()
  return { ok: true }
}

/* ---------------- Version history / audit ---------------- */

export type RevisionRow = { id: number; entity: string; label: string; userEmail: string; at: string }
export type AuditRow = { id: number; entity: string; label: string; action: string; userEmail: string; at: string }

export async function listRevisions(entity: string): Promise<RevisionRow[]> {
  await guard()
  const rows = await prisma.revision.findMany({ where: { entity }, orderBy: { at: 'desc' }, take: 30 })
  return rows.map((r) => ({ id: r.id, entity: r.entity, label: r.label, userEmail: r.userEmail, at: r.at.toISOString() }))
}

export async function listAuditLog(limit = 100): Promise<AuditRow[]> {
  await guard()
  const rows = await prisma.auditLog.findMany({ orderBy: { at: 'desc' }, take: limit })
  return rows.map((r) => ({ id: r.id, entity: r.entity, label: r.label, action: r.action, userEmail: r.userEmail, at: r.at.toISOString() }))
}

/** Roll an entity back to a stored revision. */
export async function restoreRevision(id: number): Promise<Result> {
  const s = await guard()
  const rev = await prisma.revision.findUnique({ where: { id } })
  if (!rev) return { ok: false, error: 'Revision not found.' }
  const data = rev.data as Data
  if (rev.entity.startsWith('platform:')) {
    const slug = rev.entity.slice('platform:'.length)
    await prisma.platform.update({
      where: { slug },
      data: { name: String(data.name ?? ''), sector: String(data.sector ?? ''), order: Number(data.order ?? 0), data: json(data) },
    }).catch(() => {})
  } else {
    await prisma.singleton.upsert({ where: { key: rev.entity }, create: { key: rev.entity, data: json(data) }, update: { data: json(data) } })
  }
  await record(rev.entity, rev.label, 'restore', s.email, data)
  await revalidateSite()
  revalidatePath('/admin/history')
  return { ok: true }
}
