/**
 * migrate-to-sanity.mts — seed a Sanity dataset from the current static content so
 * both the custom CMS and Sanity start byte-identical.
 *
 * USAGE
 *   npx tsx scripts/migrate-to-sanity.mts
 *
 * REQUIRED ENV
 *   SANITY_PROJECT_ID            (or NEXT_PUBLIC_SANITY_PROJECT_ID) — Sanity project id
 *   SANITY_WRITE_TOKEN           — a token with write access (Editor/Deploy Studio)
 * OPTIONAL ENV
 *   SANITY_DATASET               — defaults to "production"
 *   SANITY_API_VERSION           — defaults to "2024-10-01"
 *
 * What it does:
 *   1. Reads src/content/inventory.json.
 *   2. Uploads every referenced image (asset on disk under public/, or remote http(s)
 *      URL) and the platform videos (mp4) to Sanity's asset pipeline; uploads are
 *      deduped by source path.
 *   3. Converts inline-HTML rich fields and AnimatedTitles to Portable Text.
 *   4. Writes the fixed singleton + platform documents with createOrReplace.
 *
 * It is idempotent: re-running replaces the documents and re-uses identical assets.
 */

import { createClient } from '@sanity/client'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'
import { randomUUID } from 'node:crypto'

import { htmlToPortableText, animatedTitleToLines } from './html-to-portable-text.mts'
import type {
  Inventory,
  SiteSettings,
  HomePage,
  AboutPage,
  TeamPage,
  ContactPage,
  Platform,
} from '../src/content/types'

const here = dirname(fileURLToPath(import.meta.url))
const webRoot = join(here, '..')
const inventoryPath = join(webRoot, 'src', 'content', 'inventory.json')
const publicDir = join(webRoot, 'public')

// ---- env / client ---------------------------------------------------------

const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || 'production'
const apiVersion = process.env.SANITY_API_VERSION || '2024-10-01'
const token = process.env.SANITY_WRITE_TOKEN

function fail(msg: string): never {
  console.error(`\n  ✗ ${msg}\n`)
  process.exit(1)
}

if (!projectId) {
  fail('Missing project id. Set SANITY_PROJECT_ID (or NEXT_PUBLIC_SANITY_PROJECT_ID).')
}
if (!token) {
  fail('Missing SANITY_WRITE_TOKEN (needs a token with write access).')
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
})

const key = () => randomUUID().replace(/-/g, '').slice(0, 12)

// ---- asset uploads (deduped) ----------------------------------------------

type AssetKind = 'image' | 'file'

const assetCache = new Map<string, string>() // source string -> asset _id
const uploadedManifest: Array<{ source: string; kind: AssetKind; assetId: string }> = []
const unresolved: Array<{ source: string; reason: string }> = []

async function bytesFor(source: string): Promise<{ data: Buffer; filename: string } | null> {
  if (/^https?:\/\//i.test(source)) {
    const res = await fetch(source)
    if (!res.ok) {
      unresolved.push({ source, reason: `fetch failed: HTTP ${res.status}` })
      return null
    }
    const buf = Buffer.from(await res.arrayBuffer())
    const url = new URL(source)
    return { data: buf, filename: basename(url.pathname) || 'remote-asset' }
  }
  // Local asset like "assets/x.jpg" → resolve under public/.
  const onDisk = join(publicDir, source.replace(/^\/+/, ''))
  if (!existsSync(onDisk)) {
    unresolved.push({ source, reason: `not found on disk at ${onDisk}` })
    return null
  }
  return { data: await readFile(onDisk), filename: basename(onDisk) }
}

// Upload an asset, returning its Sanity _id (or null if it could not be resolved).
async function uploadAsset(source: string, kind: AssetKind): Promise<string | null> {
  const src = (source || '').trim()
  if (!src) return null
  const cacheKey = `${kind}:${src}`
  if (assetCache.has(cacheKey)) return assetCache.get(cacheKey)!

  const payload = await bytesFor(src)
  if (!payload) return null

  process.stdout.write(`    ↑ ${kind}  ${src} … `)
  const asset = await client.assets.upload(kind, payload.data, { filename: payload.filename })
  console.log(asset._id)

  assetCache.set(cacheKey, asset._id)
  uploadedManifest.push({ source: src, kind, assetId: asset._id })
  return asset._id
}

// Build a Sanity image field { _type:'image', asset:{_ref}, alt? }. Returns
// undefined if the source is empty/unresolvable so optional images are omitted.
async function imageRef(source: string | undefined, alt?: string) {
  if (!source) return undefined
  const id = await uploadAsset(source, 'image')
  if (!id) return undefined
  const out: Record<string, unknown> = { _type: 'image', asset: { _type: 'reference', _ref: id } }
  if (alt !== undefined) out.alt = alt
  return out
}

async function fileRef(source: string | undefined) {
  if (!source) return undefined
  const id = await uploadAsset(source, 'file')
  if (!id) return undefined
  return { _type: 'file', asset: { _type: 'reference', _ref: id } }
}

// ---- rich-text helpers -----------------------------------------------------

const rich = (html: string | undefined) => htmlToPortableText(html ?? '')
const title = (t: { lines: string[]; emphasis?: string }) => ({
  _type: 'animatedTitle',
  lines: animatedTitleToLines(t),
})

// ---- document builders -----------------------------------------------------

async function buildSiteSettings(s: SiteSettings) {
  return {
    _id: 'siteSettings',
    _type: 'siteSettings',
    logo: await imageRef(s.logo.src, s.logo.alt),
    nav: s.nav.map((n) => ({
      _key: key(),
      _type: 'navItem',
      label: n.label,
      href: n.href,
      external: n.external ?? false,
      cta: n.cta ?? false,
      dropdown: (n.dropdown ?? []).map((d) => ({
        _key: key(),
        _type: 'navDropItem',
        name: d.name,
        sector: d.sector,
        href: d.href,
      })),
    })),
    closingQuote: {
      _type: 'closingQuote',
      lines: (s.closingQuote.lines ?? []).map((l) => ({ _key: key(), _type: 'quoteLine', text: rich(l) })),
    },
    bridgeImage: await imageRef(s.bridgeImage.src, s.bridgeImage.alt),
    footer: {
      _type: 'footer',
      locations: s.footer.locations,
      links: s.footer.links.map((l) => ({
        _key: key(),
        _type: 'link',
        label: l.label,
        href: l.href,
        external: l.external ?? false,
      })),
    },
  }
}

async function buildHomePage(h: HomePage) {
  const slides = []
  for (const sl of h.deck.slides) {
    const slide: Record<string, unknown> = {
      _key: key(),
      _type: 'deckSlide',
      id: sl.id,
      kicker: sl.kicker,
      title: title(sl.title),
    }
    if (sl.copy !== undefined) slide.copy = rich(sl.copy)
    if (sl.cta) slide.cta = { _type: 'cta', label: sl.cta.label, href: sl.cta.href }
    if (sl.soiTiles) {
      slide.soiTiles = []
      for (const t of sl.soiTiles) {
        ;(slide.soiTiles as unknown[]).push({
          _key: key(),
          _type: 'soiTile',
          label: t.label,
          image: await imageRef(t.image),
        })
      }
    }
    if (sl.coreMark !== undefined) slide.coreMark = await imageRef(sl.coreMark)
    if (sl.backgroundSlices) {
      slide.backgroundSlices = []
      for (const b of sl.backgroundSlices) {
        ;(slide.backgroundSlices as unknown[]).push({
          _key: key(),
          _type: 'bgSlice',
          image: await imageRef(b.image),
          position: b.position,
        })
      }
    }
    if (sl.stats) {
      slide.stats = sl.stats.map((st) => ({
        _key: key(),
        _type: 'homeStat',
        value: st.value,
        suffix: st.suffix,
        label: st.label,
      }))
    }
    if (sl.backgroundImage !== undefined) slide.backgroundImage = await imageRef(sl.backgroundImage)
    if (sl.strips) {
      slide.strips = []
      for (const s of sl.strips) {
        ;(slide.strips as unknown[]).push({
          _key: key(),
          _type: 'strip',
          tab: s.tab,
          logo: await imageRef(s.logo, s.logoAlt),
          logoAlt: s.logoAlt,
          image: await imageRef(s.image),
          statStrong: s.statStrong,
          statSpan: s.statSpan,
          desc: s.desc,
          href: s.href,
        })
      }
    }
    slides.push(slide)
  }

  return {
    _id: 'homePage',
    _type: 'homePage',
    seo: { _type: 'seo', title: h.seo.title },
    deck: {
      _type: 'deck',
      railChapters: h.deck.railChapters,
      deckActName: h.deck.deckActName,
      slides,
    },
  }
}

async function buildAboutPage(a: AboutPage) {
  const ledger = a.hero.ledger.map((l) => ({
    _key: key(),
    _type: 'ledgerItem',
    value: l.value,
    prefix: l.prefix,
    suffix: l.suffix,
    label: l.label,
    plain: l.plain ?? false,
  }))

  const methodCards = []
  for (const c of a.method.cards) {
    methodCards.push({
      _key: key(),
      _type: 'methodCard',
      stage: c.stage,
      icon: await imageRef(c.icon),
      title: rich(c.title), // may contain <br>
      desc: c.desc,
    })
  }

  const modelRows = []
  for (const r of a.models.rows) {
    modelRows.push({
      _key: key(),
      _type: 'modelRow',
      num: r.num,
      icon: await imageRef(r.icon),
      image: await imageRef(r.image),
      title: r.title,
      desc: r.desc,
    })
  }

  const ecoTiles = []
  for (const t of a.ecosystem.tiles) {
    ecoTiles.push({
      _key: key(),
      _type: 'ecoTile',
      image: await imageRef(t.image),
      logo: await imageRef(t.logo, t.logoAlt),
      logoAlt: t.logoAlt,
      text: t.text,
      moreLabel: t.moreLabel,
      href: t.href,
    })
  }

  const gridLayers = []
  for (const g of a.grids.layers) {
    gridLayers.push({
      _key: key(),
      _type: 'gridsLayer',
      num: g.num,
      icon: await imageRef(g.icon),
      title: g.title,
      subtitle: g.subtitle,
    })
  }

  return {
    _id: 'aboutPage',
    _type: 'aboutPage',
    seo: { _type: 'seo', title: a.seo.title },
    hero: {
      _type: 'aboutHero',
      actName: a.hero.actName,
      title: title(a.hero.title),
      subtitle: rich(a.hero.subtitle),
      intro: a.hero.intro,
      sectorChips: a.hero.sectorChips,
      heroImage: await imageRef(a.hero.heroImage),
      ledger,
    },
    belief: {
      _type: 'belief',
      actName: a.belief.actName,
      kicker: a.belief.kicker,
      rows: a.belief.rows.map((r) => ({
        _key: key(),
        _type: 'beliefRow',
        num: r.num,
        line: rich(r.line),
        note: r.note,
      })),
    },
    method: {
      _type: 'method',
      actName: a.method.actName,
      title: title(a.method.title),
      copy: a.method.copy,
      cards: methodCards,
    },
    models: {
      _type: 'models',
      actName: a.models.actName,
      title: title(a.models.title),
      copy: a.models.copy,
      rows: modelRows,
    },
    ecosystem: {
      _type: 'ecosystem',
      actName: a.ecosystem.actName,
      title: title(a.ecosystem.title),
      copy: a.ecosystem.copy,
      tiles: ecoTiles,
    },
    grids: {
      _type: 'grids',
      actName: a.grids.actName,
      title: title(a.grids.title),
      copy: a.grids.copy,
      morphImage: await imageRef(a.grids.morphImage),
      labelA: { _type: 'gridsLabel', title: a.grids.labelA.title, text: a.grids.labelA.text },
      labelB: { _type: 'gridsLabel', title: a.grids.labelB.title, text: a.grids.labelB.text },
      layers: gridLayers,
    },
  }
}

async function buildTeamPage(t: TeamPage) {
  const member = async (m: TeamPage['founders'][number]) => ({
    _key: key(),
    _type: 'teamMember',
    name: m.name,
    role: m.role,
    bio: m.bio,
    photo: await imageRef(m.photo),
    highlights: m.highlights,
  })

  const founders = []
  for (const f of t.founders) founders.push(await member(f))

  const groups = []
  for (const g of t.groups) {
    const members = []
    for (const m of g.members) members.push(await member(m))
    groups.push({ _key: key(), _type: 'teamGroup', venture: g.venture, members })
  }

  return {
    _id: 'teamPage',
    _type: 'teamPage',
    seo: { _type: 'seo', title: t.seo.title },
    hero: {
      _type: 'teamHero',
      actName: t.hero.actName,
      kicker: t.hero.kicker,
      title: title(t.hero.title),
      intro: t.hero.intro,
      stats: t.hero.stats.map((s) => ({
        _key: key(),
        _type: 'homeStat',
        value: s.value,
        suffix: s.suffix,
        label: s.label,
      })),
    },
    foundersTitle: t.foundersTitle,
    founders,
    rosterTitle: t.rosterTitle,
    rosterCopy: t.rosterCopy,
    groups,
  }
}

function buildContactPage(c: ContactPage) {
  return {
    _id: 'contactPage',
    _type: 'contactPage',
    seo: { _type: 'seo', title: c.seo.title },
    hero: {
      _type: 'contactHero',
      actName: c.hero.actName,
      kicker: c.hero.kicker,
      title: title(c.hero.title),
      intro: c.hero.intro,
    },
    email: c.email,
    enquiryTypes: c.enquiryTypes,
    offices: c.offices.map((o) => ({
      _key: key(),
      _type: 'office',
      city: o.city,
      region: o.region,
      address: o.address,
    })),
    presence: c.presence,
    formIntro: c.formIntro,
  }
}

async function buildPlatform(p: Platform) {
  const categories = []
  for (const cat of p.categories) {
    const ventures = []
    for (const v of cat.ventures) {
      ventures.push({
        _key: key(),
        _type: 'venture',
        name: v.name,
        logo: await imageRef(v.logo),
        photo: await imageRef(v.photo),
        desc: v.desc,
        metrics: v.metrics.map((m) => ({ _key: key(), _type: 'metric', value: m.value, label: m.label })),
      })
    }
    categories.push({ _key: key(), _type: 'category', label: cat.label, ventures })
  }

  return {
    _id: `platform-${p.slug}`,
    _type: 'platform',
    slug: { _type: 'slug', current: p.slug },
    order: p.order,
    name: p.name,
    sector: p.sector,
    wordmark: await imageRef(p.wordmark),
    hero: await imageRef(p.hero),
    video: await fileRef(p.video),
    tagline: p.tagline,
    intro: p.intro,
    totals: p.totals.map((t) => ({ _key: key(), _type: 'total', value: t.value, label: t.label })),
    categories,
  }
}

// ---- run -------------------------------------------------------------------

async function main() {
  console.log(`\n  Sanity migration → project ${projectId}, dataset "${dataset}"\n`)

  const inv = JSON.parse(await readFile(inventoryPath, 'utf8')) as Inventory

  const docs: Array<Record<string, unknown>> = []

  console.log('  • siteSettings')
  docs.push(await buildSiteSettings(inv.siteSettings))
  console.log('  • homePage')
  docs.push(await buildHomePage(inv.homePage))
  console.log('  • aboutPage')
  docs.push(await buildAboutPage(inv.aboutPage))
  console.log('  • teamPage')
  docs.push(await buildTeamPage(inv.teamPage))
  console.log('  • contactPage')
  docs.push(buildContactPage(inv.contactPage))

  for (const p of inv.platforms) {
    console.log(`  • platform-${p.slug}`)
    docs.push(await buildPlatform(p))
  }

  console.log('\n  Writing documents …')
  let tx = client.transaction()
  for (const d of docs) tx = tx.createOrReplace(d as { _id: string; _type: string })
  await tx.commit()

  // ---- summary ----
  console.log('\n  ─── Summary ───────────────────────────────')
  console.log(`  Documents written : ${docs.length}`)
  for (const d of docs) console.log(`     ${d._id}`)
  console.log(`  Assets uploaded   : ${uploadedManifest.length}`)
  if (unresolved.length) {
    console.log(`\n  ⚠ Unmapped sources (${unresolved.length}):`)
    for (const u of unresolved) console.log(`     ${u.source} — ${u.reason}`)
  } else {
    console.log('  Unmapped sources  : none')
  }
  console.log('\n  ✓ Migration complete.\n')
}

main().catch((err) => {
  console.error('\n  ✗ Migration failed:\n', err)
  process.exit(1)
})
