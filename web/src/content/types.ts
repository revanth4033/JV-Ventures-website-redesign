// Shared content shapes. In Phase 2 these are filled from the static inventory;
// in Phase 6 the same shapes are returned from Payload, so components don't change.

export type Href = string

export interface Link {
  label: string
  href: Href
  external?: boolean
  cta?: boolean
}

export interface NavDropItem {
  name: string
  sector: string
  href: Href
}
export interface NavItem extends Link {
  dropdown?: NavDropItem[]
}

export interface Cta {
  label: string
  href: Href
}

/** Title that animates line-by-line. `emphasis` marks which line(s) are italic/red:
 *  "all" | "line:N" (0-based) | undefined. */
export interface AnimatedTitle {
  lines: string[]
  emphasis?: string
}

export interface Stat {
  value: number
  prefix?: string
  suffix?: string
  label: string
  plain?: boolean
}

export interface SiteSettings {
  logo: { src: string; alt: string }
  nav: NavItem[]
  closingQuote: { lines: string[]; actName?: string; actIndex?: string }
  bridgeImage: { src: string; alt: string }
  footer: { locations: string; links: Link[]; copyright?: string }
  /** Small, site-wide UI labels/glyphs. */
  ui?: {
    ctaArrow?: string // the "→" glyph used on CTAs/links
    skipLink?: string // skip-to-content link text
    menuLabel?: string // mobile menu button label
    logoHref?: string // where the header logo links
  }
  /** Brand name used in metadata, JSON-LD, and the OG image. */
  brandName?: string
  /** Site-wide SEO defaults (per-page SEO overrides these). */
  seo?: {
    title?: string // default browser/social title
    titleTemplate?: string // e.g. "%s — JV Ventures"
    description?: string // default meta description
    ogTitle?: string // big title on the generated share image
    ogSubtitle?: string // subtitle on the share image
    ogDescription?: string // description line on the share image
  }
  /** Shared UI copy used across the platform pages. */
  platformLabels?: {
    scrollCue?: string
    insideKicker?: string
    switcherTitle?: string // may contain inline <em> emphasis
    switcherCta?: string
    prevVenture?: string
    nextVenture?: string
  }
}

// ---- Home ----
export interface SoiTile { label: string; image: string }
export interface HomeStat { value: number; suffix?: string; label: string }
export interface BgSlice { image: string; position?: string; alt?: string }
export interface Strip {
  tab: string; logo: string; logoAlt: string; image: string; imageAlt?: string
  statStrong: string; statSpan: string; desc: string; href: Href
}
export interface DeckSlide {
  id: string
  kicker?: string
  title: AnimatedTitle
  copy?: string
  cta?: Cta
  soiTiles?: SoiTile[]
  coreMark?: string
  backgroundSlices?: BgSlice[]
  stats?: HomeStat[]
  backgroundImage?: string
  backgroundImageAlt?: string
  strips?: Strip[]
}
export interface HomePage {
  seo: { title: string; description?: string }
  deck: { railChapters: string[]; deckActName: string; deckActIndex?: string; slides: DeckSlide[] }
}

// ---- About ----
export interface LedgerItem extends Stat {}
export interface BeliefRow { num: string; line: string; note: string }
export interface MethodCard { stage: string; icon: string; title: string; desc: string }
export interface ModelRow { num: string; icon: string; image: string; title: string; desc: string }
export interface EcoTile { image: string; imageAlt?: string; logo: string; logoAlt: string; text: string; moreLabel: string; href: Href }
export interface GridsLayer { num: string; icon: string; title: string; subtitle: string }
export interface AboutPage {
  seo: { title: string; description?: string }
  hero: {
    actName: string; actIndex?: string; title: AnimatedTitle; subtitle: string; intro: string
    sectorChips: string[]; heroImage: string; heroImageAlt?: string; ledger: LedgerItem[]
  }
  belief: { actName: string; actIndex?: string; kicker: string; rows: BeliefRow[] }
  method: { actName: string; actIndex?: string; title: AnimatedTitle; copy: string; cards: MethodCard[] }
  models: { actName: string; actIndex?: string; title: AnimatedTitle; copy: string; rows: ModelRow[] }
  ecosystem: { actName: string; actIndex?: string; title: AnimatedTitle; copy: string; tiles: EcoTile[] }
  grids: {
    actName: string; actIndex?: string; title: AnimatedTitle; copy: string; morphImage: string; morphAlt?: string
    labelA: { title: string; text: string }; labelB: { title: string; text: string }
    layers: GridsLayer[]
  }
}

// ---- Platform ----
export interface Metric { value: string; label: string }
export interface Venture { name: string; logo: string; photo: string; photoAlt?: string; desc: string; metrics: Metric[] }
export interface Category { label: string; ventures: Venture[] }
export interface Total { value: string; label: string }
export interface Platform {
  slug: string; order: number; name: string; sector: string
  wordmark: string; hero: string; heroAlt?: string; video: string
  tagline: string; intro: string
  totals: Total[]; categories: Category[]
  seo?: { title?: string; description?: string }
}

// ---- Team ----
export interface TeamMember { name: string; role: string; bio?: string; photo?: string; photoAlt?: string; highlights?: string[]; linkedin?: string }
export interface TeamGroup { venture: string; members: TeamMember[] }
export interface TeamPage {
  seo: { title: string; description?: string }
  hero: { actName: string; actIndex?: string; kicker: string; title: AnimatedTitle; intro: string; stats: HomeStat[] }
  foundersTitle: string
  foundersActName?: string
  foundersActIndex?: string
  founders: TeamMember[]
  rosterTitle: string
  rosterActName?: string
  rosterActIndex?: string
  rosterCopy: string
  groups: TeamGroup[]
}

// ---- Contact ----
export interface Office { city: string; region: string; address: string; lat?: number; lng?: number }
export interface ContactPage {
  seo: { title: string; description?: string }
  hero: { actName: string; actIndex?: string; kicker: string; title: AnimatedTitle; intro: string }
  email: string
  enquiryTypes: string[]
  offices: Office[]
  presence: string
  formIntro: string
  bodyActName?: string
  bodyActIndex?: string
  mapActName?: string
  mapActIndex?: string
  mapTitle?: string
  mapCopy?: string
  emailLabel?: string // "Email" rail heading
  officesLabel?: string // "Offices" rail heading
  presenceLabel?: string // "Presence" rail heading
  form?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    company?: string
    enquiryLabel?: string
    message?: string
    submit?: string
    submitting?: string
    successTitle?: string
    successBody?: string
    resetLabel?: string
    errorName?: string
    errorEmail?: string
    errorMessage?: string
    errorGeneric?: string
    errorNetwork?: string
  }
}

export interface Inventory {
  siteSettings: SiteSettings
  homePage: HomePage
  aboutPage: AboutPage
  teamPage: TeamPage
  contactPage: ContactPage
  platforms: Platform[]
}
