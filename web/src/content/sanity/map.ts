import type { PortableTextBlock } from '@portabletext/types'
import type { SanityImageSource } from '@sanity/image-url'

import type {
  AboutPage,
  AnimatedTitle,
  Category,
  ContactPage,
  DeckSlide,
  EcoTile,
  HomePage,
  MethodCard,
  ModelRow,
  Platform,
  SiteSettings,
  TeamGroup,
  TeamMember,
  TeamPage,
  Venture,
} from '../types'
import { fileUrl, urlFor, type ResolvedFileAsset } from './image'
import { toInlineHtml } from './portableText'

/* ---------------- Raw (GROQ-projected) shapes ---------------- */
// Loose shapes describing what the GROQ queries in sources/sanity.ts return.
// Images come back as raw Sanity image objects; we resolve to URLs here.

type Img = SanityImageSource | null | undefined
type Rich = PortableTextBlock | PortableTextBlock[] | null | undefined

interface RawTitleLine {
  text?: Rich
  accent?: boolean
}
interface RawTitle {
  lines?: RawTitleLine[]
}

/* ---------------- Primitive helpers ---------------- */
const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const num = (v: unknown): number => (typeof v === 'number' ? v : 0)

/**
 * Map a Sanity `animatedTitle` to the frontend shape:
 *   lines[i] = inline HTML of line.text
 *   emphasis = 'all' (every line accented) | `line:${i}` (first accented line)
 *            | undefined (no accent)
 */
export function mapAnimatedTitle(raw: RawTitle | null | undefined): AnimatedTitle {
  const rawLines = raw?.lines ?? []
  const lines = rawLines.map((l) => toInlineHtml(l?.text))
  const accents = rawLines.map((l) => Boolean(l?.accent))
  const anyAccent = accents.some(Boolean)
  const allAccent = accents.length > 0 && accents.every(Boolean)
  const firstAccent = accents.findIndex(Boolean)
  const emphasis = allAccent ? 'all' : anyAccent ? `line:${firstAccent}` : undefined
  return emphasis === undefined ? { lines } : { lines, emphasis }
}

/* ---------------- Site Settings ---------------- */
/** A Sanity image object that also carries a custom `alt` field (imageWithAlt). */
type ImgWithAlt = Img & { alt?: string }
const altOf = (v: ImgWithAlt | null | undefined): string => str((v as { alt?: string } | null | undefined)?.alt)

interface RawSiteSettings {
  logo?: ImgWithAlt
  nav?: Array<{
    label?: string
    href?: string
    external?: boolean
    cta?: boolean
    dropdown?: Array<{ name?: string; sector?: string; href?: string }>
  }>
  closingQuote?: { lines?: Array<{ text?: Rich }> }
  bridgeImage?: ImgWithAlt
  footer?: {
    locations?: string
    links?: Array<{ label?: string; href?: string; external?: boolean; cta?: boolean }>
  }
}

export function mapSiteSettings(raw: RawSiteSettings): SiteSettings {
  return {
    logo: { src: urlFor(raw.logo), alt: altOf(raw.logo) },
    nav: (raw.nav ?? []).map((n) => {
      const item: SiteSettings['nav'][number] = { label: str(n.label), href: str(n.href) }
      if (n.external) item.external = true
      if (n.cta) item.cta = true
      if (n.dropdown?.length)
        item.dropdown = n.dropdown.map((d) => ({
          name: str(d.name),
          sector: str(d.sector),
          href: str(d.href),
        }))
      return item
    }),
    closingQuote: { lines: (raw.closingQuote?.lines ?? []).map((l) => toInlineHtml(l?.text)) },
    bridgeImage: { src: urlFor(raw.bridgeImage), alt: altOf(raw.bridgeImage) },
    footer: {
      locations: str(raw.footer?.locations),
      links: (raw.footer?.links ?? []).map((l) => {
        const link: SiteSettings['footer']['links'][number] = {
          label: str(l.label),
          href: str(l.href),
        }
        if (l.external) link.external = true
        if (l.cta) link.cta = true
        return link
      }),
    },
  }
}

/* ---------------- Home ---------------- */
interface RawSlide {
  id?: string
  kicker?: string
  title?: RawTitle
  copy?: Rich
  cta?: { label?: string; href?: string }
  soiTiles?: Array<{ label?: string; image?: Img }>
  coreMark?: Img
  backgroundSlices?: Array<{ image?: Img; position?: string }>
  stats?: Array<{ value?: number; suffix?: string; label?: string }>
  backgroundImage?: Img
  strips?: Array<{
    tab?: string
    logo?: Img
    logoAlt?: string
    image?: Img
    statStrong?: string
    statSpan?: string
    desc?: string
    href?: string
  }>
}
interface RawHomePage {
  seo?: { title?: string }
  deck?: { railChapters?: string[]; deckActName?: string; slides?: RawSlide[] }
}

function mapSlide(s: RawSlide): DeckSlide {
  const slide: DeckSlide = { id: str(s.id), title: mapAnimatedTitle(s.title) }
  if (s.kicker) slide.kicker = s.kicker
  if (s.copy) slide.copy = toInlineHtml(s.copy)
  if (s.cta) slide.cta = { label: str(s.cta.label), href: str(s.cta.href) }
  if (s.soiTiles?.length)
    slide.soiTiles = s.soiTiles.map((t) => ({ label: str(t.label), image: urlFor(t.image) }))
  if (s.coreMark) slide.coreMark = urlFor(s.coreMark)
  if (s.backgroundSlices?.length)
    slide.backgroundSlices = s.backgroundSlices.map((b) => {
      const slice: NonNullable<DeckSlide['backgroundSlices']>[number] = { image: urlFor(b.image) }
      if (b.position) slice.position = b.position
      return slice
    })
  if (s.stats?.length)
    slide.stats = s.stats.map((st) => {
      const stat: NonNullable<DeckSlide['stats']>[number] = { value: num(st.value), label: str(st.label) }
      if (st.suffix) stat.suffix = st.suffix
      return stat
    })
  if (s.backgroundImage) slide.backgroundImage = urlFor(s.backgroundImage)
  if (s.strips?.length)
    slide.strips = s.strips.map((st) => ({
      tab: str(st.tab),
      logo: urlFor(st.logo),
      logoAlt: str(st.logoAlt),
      image: urlFor(st.image),
      statStrong: str(st.statStrong),
      statSpan: str(st.statSpan),
      desc: str(st.desc),
      href: str(st.href),
    }))
  return slide
}

export function mapHomePage(raw: RawHomePage): HomePage {
  return {
    seo: { title: str(raw.seo?.title) },
    deck: {
      railChapters: raw.deck?.railChapters ?? [],
      deckActName: str(raw.deck?.deckActName),
      slides: (raw.deck?.slides ?? []).map(mapSlide),
    },
  }
}

/* ---------------- About ---------------- */
interface RawAboutPage {
  seo?: { title?: string }
  hero?: {
    actName?: string
    title?: RawTitle
    subtitle?: Rich
    intro?: string
    sectorChips?: string[]
    heroImage?: Img
    ledger?: Array<{ value?: number; prefix?: string; suffix?: string; label?: string; plain?: boolean }>
  }
  belief?: {
    actName?: string
    kicker?: string
    rows?: Array<{ num?: string; line?: Rich; note?: string }>
  }
  method?: {
    actName?: string
    title?: RawTitle
    copy?: string
    cards?: Array<{ stage?: string; icon?: Img; title?: Rich; desc?: string }>
  }
  models?: {
    actName?: string
    title?: RawTitle
    copy?: string
    rows?: Array<{ num?: string; icon?: Img; image?: Img; title?: string; desc?: string }>
  }
  ecosystem?: {
    actName?: string
    title?: RawTitle
    copy?: string
    tiles?: Array<{
      image?: Img
      logo?: Img
      logoAlt?: string
      text?: string
      moreLabel?: string
      href?: string
    }>
  }
  grids?: {
    actName?: string
    title?: RawTitle
    copy?: string
    morphImage?: Img
    labelA?: { title?: string; text?: string }
    labelB?: { title?: string; text?: string }
    layers?: Array<{ num?: string; icon?: Img; title?: string; subtitle?: string }>
  }
}

export function mapAboutPage(raw: RawAboutPage): AboutPage {
  const h = raw.hero ?? {}
  return {
    seo: { title: str(raw.seo?.title) },
    hero: {
      actName: str(h.actName),
      title: mapAnimatedTitle(h.title),
      subtitle: toInlineHtml(h.subtitle),
      intro: str(h.intro),
      sectorChips: h.sectorChips ?? [],
      heroImage: urlFor(h.heroImage),
      ledger: (h.ledger ?? []).map((l) => {
        const item: AboutPage['hero']['ledger'][number] = { value: num(l.value), label: str(l.label) }
        if (l.prefix) item.prefix = l.prefix
        if (l.suffix) item.suffix = l.suffix
        if (l.plain) item.plain = true
        return item
      }),
    },
    belief: {
      actName: str(raw.belief?.actName),
      kicker: str(raw.belief?.kicker),
      rows: (raw.belief?.rows ?? []).map((r) => ({
        num: str(r.num),
        line: toInlineHtml(r.line),
        note: str(r.note),
      })),
    },
    method: {
      actName: str(raw.method?.actName),
      title: mapAnimatedTitle(raw.method?.title),
      copy: str(raw.method?.copy),
      cards: (raw.method?.cards ?? []).map(
        (c): MethodCard => ({
          stage: str(c.stage),
          icon: urlFor(c.icon),
          title: toInlineHtml(c.title),
          desc: str(c.desc),
        }),
      ),
    },
    models: {
      actName: str(raw.models?.actName),
      title: mapAnimatedTitle(raw.models?.title),
      copy: str(raw.models?.copy),
      rows: (raw.models?.rows ?? []).map(
        (r): ModelRow => ({
          num: str(r.num),
          icon: urlFor(r.icon),
          image: urlFor(r.image),
          title: str(r.title),
          desc: str(r.desc),
        }),
      ),
    },
    ecosystem: {
      actName: str(raw.ecosystem?.actName),
      title: mapAnimatedTitle(raw.ecosystem?.title),
      copy: str(raw.ecosystem?.copy),
      tiles: (raw.ecosystem?.tiles ?? []).map(
        (t): EcoTile => ({
          image: urlFor(t.image),
          logo: urlFor(t.logo),
          logoAlt: str(t.logoAlt),
          text: str(t.text),
          moreLabel: str(t.moreLabel),
          href: str(t.href),
        }),
      ),
    },
    grids: {
      actName: str(raw.grids?.actName),
      title: mapAnimatedTitle(raw.grids?.title),
      copy: str(raw.grids?.copy),
      morphImage: urlFor(raw.grids?.morphImage),
      labelA: { title: str(raw.grids?.labelA?.title), text: str(raw.grids?.labelA?.text) },
      labelB: { title: str(raw.grids?.labelB?.title), text: str(raw.grids?.labelB?.text) },
      layers: (raw.grids?.layers ?? []).map((l) => ({
        num: str(l.num),
        icon: urlFor(l.icon),
        title: str(l.title),
        subtitle: str(l.subtitle),
      })),
    },
  }
}

/* ---------------- Platform ---------------- */
interface RawVenture {
  name?: string
  logo?: Img
  photo?: Img
  desc?: string
  metrics?: Array<{ value?: string; label?: string }>
}
interface RawPlatform {
  slug?: { current?: string } | string
  order?: number
  name?: string
  sector?: string
  wordmark?: Img
  hero?: Img
  video?: { asset?: ResolvedFileAsset | null } | null
  tagline?: string
  intro?: string
  totals?: Array<{ value?: string; label?: string }>
  categories?: Array<{ label?: string; ventures?: RawVenture[] }>
}

function slugOf(slug: RawPlatform['slug']): string {
  if (typeof slug === 'string') return slug
  return str(slug?.current)
}

function mapVenture(v: RawVenture): Venture {
  return {
    name: str(v.name),
    logo: urlFor(v.logo),
    photo: urlFor(v.photo),
    desc: str(v.desc),
    metrics: (v.metrics ?? []).map((m) => ({ value: str(m.value), label: str(m.label) })),
  }
}

export function mapPlatform(raw: RawPlatform): Platform {
  return {
    slug: slugOf(raw.slug),
    order: num(raw.order),
    name: str(raw.name),
    sector: str(raw.sector),
    wordmark: urlFor(raw.wordmark),
    hero: urlFor(raw.hero),
    video: fileUrl(raw.video),
    tagline: str(raw.tagline),
    intro: str(raw.intro),
    totals: (raw.totals ?? []).map((t) => ({ value: str(t.value), label: str(t.label) })),
    categories: (raw.categories ?? []).map(
      (c): Category => ({
        label: str(c.label),
        ventures: (c.ventures ?? []).map(mapVenture),
      }),
    ),
  }
}

/* ---------------- Team ---------------- */
interface RawMember {
  name?: string
  role?: string
  bio?: string
  photo?: Img
  highlights?: string[]
}
interface RawTeamPage {
  seo?: { title?: string }
  hero?: {
    actName?: string
    kicker?: string
    title?: RawTitle
    intro?: string
    stats?: Array<{ value?: number; suffix?: string; label?: string }>
  }
  foundersTitle?: string
  founders?: RawMember[]
  rosterTitle?: string
  rosterCopy?: string
  groups?: Array<{ venture?: string; members?: RawMember[] }>
}

function mapMember(m: RawMember): TeamMember {
  const member: TeamMember = { name: str(m.name), role: str(m.role) }
  if (m.bio) member.bio = m.bio
  const photo = urlFor(m.photo)
  if (photo) member.photo = photo
  if (m.highlights?.length) member.highlights = m.highlights
  return member
}

export function mapTeamPage(raw: RawTeamPage): TeamPage {
  const h = raw.hero ?? {}
  return {
    seo: { title: str(raw.seo?.title) },
    hero: {
      actName: str(h.actName),
      kicker: str(h.kicker),
      title: mapAnimatedTitle(h.title),
      intro: str(h.intro),
      stats: (h.stats ?? []).map((s) => {
        const stat: TeamPage['hero']['stats'][number] = { value: num(s.value), label: str(s.label) }
        if (s.suffix) stat.suffix = s.suffix
        return stat
      }),
    },
    foundersTitle: str(raw.foundersTitle),
    founders: (raw.founders ?? []).map(mapMember),
    rosterTitle: str(raw.rosterTitle),
    rosterCopy: str(raw.rosterCopy),
    groups: (raw.groups ?? []).map(
      (g): TeamGroup => ({
        venture: str(g.venture),
        members: (g.members ?? []).map(mapMember),
      }),
    ),
  }
}

/* ---------------- Contact ---------------- */
interface RawContactPage {
  seo?: { title?: string }
  hero?: { actName?: string; kicker?: string; title?: RawTitle; intro?: string }
  email?: string
  enquiryTypes?: string[]
  offices?: Array<{ city?: string; region?: string; address?: string }>
  presence?: string
  formIntro?: string
}

export function mapContactPage(raw: RawContactPage): ContactPage {
  const h = raw.hero ?? {}
  return {
    seo: { title: str(raw.seo?.title) },
    hero: {
      actName: str(h.actName),
      kicker: str(h.kicker),
      title: mapAnimatedTitle(h.title),
      intro: str(h.intro),
    },
    email: str(raw.email),
    enquiryTypes: raw.enquiryTypes ?? [],
    offices: (raw.offices ?? []).map((o) => ({
      city: str(o.city),
      region: str(o.region),
      address: str(o.address),
    })),
    presence: str(raw.presence),
    formIntro: str(raw.formIntro),
  }
}
