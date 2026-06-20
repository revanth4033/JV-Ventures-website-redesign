'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

type Data = Record<string, unknown>
const json = (d: Data) => d as Prisma.InputJsonValue
type Result = { ok: boolean; error?: string }

async function guard() {
  const s = await getSession()
  if (!s) throw new Error('Not authenticated')
}

const toSlug = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

async function revalidateSite() {
  revalidatePath('/')
  revalidatePath('/about')
  revalidatePath('/team')
  revalidatePath('/contact')
  revalidatePath('/platform')
  const plats = await prisma.platform.findMany({ select: { slug: true } })
  for (const p of plats) revalidatePath(`/platform/${p.slug}`)
}

async function saveSingleton(key: string, data: Data): Promise<Result> {
  await guard()
  await prisma.singleton.upsert({ where: { key }, create: { key, data: json(data) }, update: { data: json(data) } })
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
  await guard()
  await prisma.platform.update({
    where: { slug },
    data: {
      name: String(data.name ?? ''),
      sector: String(data.sector ?? ''),
      order: Number(data.order ?? 0),
      data: json(data),
    },
  })
  await revalidateSite()
  return { ok: true }
}

/** Create a new platform with a unique slug and sensible empty content, then the
 *  caller redirects into the full editor. */
export async function createPlatform(input: {
  name?: string
  sector?: string
  slug?: string
}): Promise<Result & { slug?: string }> {
  await guard()
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
    slug,
    order,
    name,
    sector: String(input.sector ?? '').trim(),
    wordmark: '',
    hero: '',
    video: '',
    tagline: '',
    intro: '',
    totals: [] as unknown[],
    categories: [] as unknown[],
  }
  await prisma.platform.create({
    data: { slug, name: content.name, sector: content.sector, order, data: json(content) },
  })
  revalidatePath('/platform')
  return { ok: true, slug }
}

export async function deletePlatform(slug: string): Promise<Result> {
  await guard()
  await prisma.platform.delete({ where: { slug } }).catch(() => {})
  await revalidateSite()
  return { ok: true }
}
