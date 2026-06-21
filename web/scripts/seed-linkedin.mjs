// Deploy-time backfill: copy founder/roster LinkedIn URLs from the bundled seed
// (inventory.json) into the live team record, matched by name. Only fills a
// member whose linkedin is empty/missing, so anything edited in the CMS wins and
// re-runs are no-ops. Runs with the build's own DATABASE_URI — no secrets needed.
import { readFileSync } from 'node:fs'

import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URI) {
  console.log('[seed-linkedin] no DATABASE_URI — skipping.')
  process.exit(0)
}

const inv = JSON.parse(readFileSync(new URL('../src/content/inventory.json', import.meta.url), 'utf8'))

// name -> linkedin, from every person in the seed team page
const byName = new Map()
const collect = (m) => {
  if (m?.name && m?.linkedin) byName.set(m.name.trim().toLowerCase(), m.linkedin)
}
;(inv.teamPage?.founders ?? []).forEach(collect)
;(inv.teamPage?.groups ?? []).forEach((g) => (g.members ?? []).forEach(collect))

const prisma = new PrismaClient()
try {
  const row = await prisma.singleton.findUnique({ where: { key: 'teamPage' } })
  if (!row) {
    console.log('[seed-linkedin] no teamPage row — nothing to backfill.')
    process.exit(0)
  }
  const data = row.data
  let filled = 0
  const fill = (m) => {
    if (m && !m.linkedin) {
      const hit = byName.get((m.name || '').trim().toLowerCase())
      if (hit) {
        m.linkedin = hit
        filled++
      }
    }
  }
  ;(data.founders ?? []).forEach(fill)
  ;(data.groups ?? []).forEach((g) => (g.members ?? []).forEach(fill))

  if (filled > 0) {
    await prisma.singleton.update({ where: { key: 'teamPage' }, data: { data } })
  }
  console.log(`[seed-linkedin] filled ${filled} LinkedIn URL(s).`)
} catch (e) {
  console.warn('[seed-linkedin] skipped (continuing build):', e instanceof Error ? e.message : e)
} finally {
  await prisma.$disconnect()
}
process.exit(0)
