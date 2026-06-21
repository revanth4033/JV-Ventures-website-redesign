// Deploy-time self-heal: collapse accidental repeated currency symbols
// ("$$500M" -> "$500M") in stored CMS content. Idempotent — only rows that
// actually change are written. Runs with the build's own DATABASE_URI, so it
// needs no secrets passed in. Logs counts so the effect is visible in build logs.
import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URI) {
  console.log('[currency] no DATABASE_URI — skipping.')
  process.exit(0)
}

const RE = /([$₹€£])\1+/g
const fix = (v) => {
  if (typeof v === 'string') return v.replace(RE, '$1')
  if (Array.isArray(v)) return v.map(fix)
  if (v && typeof v === 'object') {
    const o = {}
    for (const [k, val] of Object.entries(v)) o[k] = fix(val)
    return o
  }
  return v
}
const changed = (v) => JSON.stringify(fix(v)) !== JSON.stringify(v)

const prisma = new PrismaClient()
const sample = new Set()
const collect = (v) => {
  if (typeof v === 'string') { if (v.includes('$') || v.includes('500M') || v.includes('2.4M')) sample.add(v) }
  else if (Array.isArray(v)) v.forEach(collect)
  else if (v && typeof v === 'object') Object.values(v).forEach(collect)
}
try {
  let n = 0
  for (const row of await prisma.singleton.findMany()) {
    const data = { data: fix(row.data), draft: row.draft == null ? row.draft : fix(row.draft) }
    if (changed(row.data) || (row.draft != null && changed(row.draft))) {
      await prisma.singleton.update({ where: { key: row.key }, data })
      n++
    }
  }
  const platforms = await prisma.platform.findMany()
  console.log(`[currency] DB has ${platforms.length} platform row(s).`)
  for (const row of platforms) {
    collect(row.data)
    const data = { data: fix(row.data), draft: row.draft == null ? row.draft : fix(row.draft) }
    if (changed(row.data) || (row.draft != null && changed(row.draft))) {
      await prisma.platform.update({ where: { id: row.id }, data })
      n++
    }
  }
  console.log(`[currency] normalized ${n} row(s). $-values seen:`, JSON.stringify([...sample]))
} catch (e) {
  console.warn('[currency] skipped (continuing build):', e instanceof Error ? e.message : e)
} finally {
  await prisma.$disconnect()
}
process.exit(0)
