import 'server-only'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { prisma } from './prisma'
import { sanitizeContent } from './sanitize'

type Data = Record<string, unknown>
const logFail = (what: string) => (e: unknown) => console.error(`[scheduled-publish] ${what} failed`, e)

// Cap how many drafts we promote per run so the cron can't exceed the function
// timeout if a large backlog ever accumulates; the oldest scheduled items go
// first, and the next run picks up the remainder.
const BATCH = 50

/** Promote any drafts whose scheduled publishAt has arrived. Called by the cron route. */
export async function runScheduledPublishes(): Promise<{ published: string[] }> {
  const now = new Date()
  const published: string[] = []

  for (const r of await prisma.singleton.findMany({
    where: { publishAt: { lte: now } },
    orderBy: { publishAt: 'asc' },
    take: BATCH,
  })) {
    if (r.draft == null) {
      await prisma.singleton.update({ where: { key: r.key }, data: { publishAt: null } })
      continue
    }
    const clean = sanitizeContent(r.draft) as Prisma.InputJsonValue
    await prisma.singleton.update({
      where: { key: r.key },
      data: { data: clean, draft: Prisma.DbNull, publishAt: null },
    })
    await prisma.revision.create({ data: { entity: r.key, label: r.key, userEmail: 'scheduler', data: clean } }).catch(logFail('revision'))
    await prisma.auditLog.create({ data: { userEmail: 'scheduler', entity: r.key, label: r.key, action: 'publish' } }).catch(logFail('audit'))
    published.push(r.key)
  }

  for (const r of await prisma.platform.findMany({
    where: { publishAt: { lte: now } },
    orderBy: { publishAt: 'asc' },
    take: BATCH,
  })) {
    if (r.draft == null) {
      await prisma.platform.update({ where: { id: r.id }, data: { publishAt: null } })
      continue
    }
    const d = sanitizeContent(r.draft as Data)
    const cleanPlatform = d as Prisma.InputJsonValue
    await prisma.platform.update({
      where: { id: r.id },
      data: {
        name: String(d.name ?? r.name),
        sector: String(d.sector ?? r.sector),
        order: Number(d.order ?? r.order),
        data: cleanPlatform,
        draft: Prisma.DbNull,
        publishAt: null,
      },
    })
    await prisma.revision.create({ data: { entity: `platform:${r.slug}`, label: r.name, userEmail: 'scheduler', data: cleanPlatform } }).catch(logFail('revision'))
    await prisma.auditLog.create({ data: { userEmail: 'scheduler', entity: `platform:${r.slug}`, label: r.name, action: 'publish' } }).catch(logFail('audit'))
    published.push(`platform:${r.slug}`)
  }

  if (published.length) {
    // Refresh the whole frontend in one pass via the shared (frontend) layout
    // (all pages + dynamic platform routes + OG image), plus the sitemap.
    revalidatePath('/', 'layout')
    revalidatePath('/sitemap.xml')
  }
  return { published }
}
