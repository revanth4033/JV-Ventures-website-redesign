/**
 * Seed the custom CMS (Prisma + Postgres) from content/inventory.json.
 * Stores page content as JSON matching the frontend shapes, registers every
 * referenced asset in the Media library, and creates the first admin user.
 * Idempotent (upserts).  Run:  npm run seed
 */
import 'dotenv/config'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const dirname = path.dirname(fileURLToPath(import.meta.url))
const inventory = JSON.parse(fs.readFileSync(path.resolve(dirname, '../content/inventory.json'), 'utf8'))

import crypto from 'crypto'

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@jv.ventures'
// Never ship a known default password. If SEED_ADMIN_PASSWORD isn't provided we
// mint a random one and print it once below — so a forgotten env var can't leave
// a publicly-guessable admin account.
const ADMIN_PASSWORD_FROM_ENV = process.env.SEED_ADMIN_PASSWORD
const ADMIN_PASSWORD = ADMIN_PASSWORD_FROM_ENV || crypto.randomBytes(12).toString('base64url')

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.svg': 'image/svg+xml',
}
const humanize = (file: string) =>
  path.basename(file, path.extname(file)).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

/** Recursively prefix "assets/x" -> "/assets/x" so stored URLs are absolute. */
const normalize = <T>(v: T): T => {
  if (typeof v === 'string') return (/^assets\//.test(v) ? '/' + v : v) as unknown as T
  if (Array.isArray(v)) return v.map(normalize) as unknown as T
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(v)) out[k] = normalize(val)
    return out as T
  }
  return v
}

async function run() {
  const inv = normalize(inventory)

  // ---- singletons ----
  const ss = inv.siteSettings
  const siteSettings = {
    logo: ss.logo, nav: ss.nav, closingQuote: ss.closingQuote,
    bridgeImage: ss.bridgeImage, footer: ss.footer,
  }
  for (const [key, data] of Object.entries({
    siteSettings,
    homePage: inv.homePage,
    aboutPage: inv.aboutPage,
    teamPage: inv.teamPage,
    contactPage: inv.contactPage,
  })) {
    // CREATE-ONLY: never overwrite content already published through the CMS.
    // Re-running the seed only fills in what's missing. To force-reset a record,
    // delete it first (or run with SEED_FORCE=1).
    if (process.env.SEED_FORCE === '1') {
      await prisma.singleton.upsert({ where: { key }, create: { key, data }, update: { data } })
    } else {
      const exists = await prisma.singleton.findUnique({ where: { key }, select: { key: true } })
      if (!exists) await prisma.singleton.create({ data: { key, data } })
    }
  }

  // ---- platforms (create-only, same policy) ----
  for (const p of inv.platforms) {
    const data = { slug: p.slug, order: p.order, name: p.name, sector: p.sector, data: p }
    if (process.env.SEED_FORCE === '1') {
      await prisma.platform.upsert({ where: { slug: p.slug }, create: data, update: { order: p.order, name: p.name, sector: p.sector, data: p } })
    } else {
      const exists = await prisma.platform.findUnique({ where: { slug: p.slug }, select: { slug: true } })
      if (!exists) await prisma.platform.create({ data })
    }
  }

  // ---- media library (assets already live in /public/assets) ----
  const assetPaths = new Set<string>()
  const walk = (v: unknown) => {
    if (typeof v === 'string') { if (/^\/assets\//.test(v)) assetPaths.add(v) }
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(inv)
  for (const url of assetPaths) {
    const filename = path.basename(url)
    const ext = path.extname(filename).toLowerCase()
    await prisma.media.upsert({
      where: { url },
      create: { url, filename, alt: humanize(filename), mime: MIME[ext] || '' },
      update: {},
    })
  }

  // ---- first admin user ----
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: { email: ADMIN_EMAIL, passwordHash, name: 'JV Admin', role: 'admin' },
    update: {},
  })

  console.log(`✓ Seed complete — ${inv.platforms.length} platforms, ${assetPaths.size} media`)
  console.log(`  admin email: ${ADMIN_EMAIL}`)
  if (ADMIN_PASSWORD_FROM_ENV) {
    console.log('  admin password: (from SEED_ADMIN_PASSWORD env)')
  } else {
    console.log(`  admin password (generated — save this now, it won't be shown again): ${ADMIN_PASSWORD}`)
  }
  await prisma.$disconnect()
}

run().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
