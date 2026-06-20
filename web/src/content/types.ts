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
  closingQuote: { lines: string[] }
  bridgeImage: { src: string; alt: string }
  footer: { locations: string; links: Link[] }
}

// ---- Home ----
export interface SoiTile { label: string; image: string }
export interface HomeStat { value: number; suffix?: string; label: string }
export interface BgSlice { image: string; position?: string }
export interface Strip {
  tab: string; logo: string; logoAlt: string; image: string
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
  strips?: Strip[]
}
export interface HomePage {
  seo: { title: string }
  deck: { railChapters: string[]; deckActName: string; slides: DeckSlide[] }
}

// ---- About ----
export interface LedgerItem extends Stat {}
export interface BeliefRow { num: string; line: string; note: string }
export interface MethodCard { stage: string; icon: string; title: string; desc: string }
export interface ModelRow { num: string; icon: string; image: string; title: string; desc: string }
export interface EcoTile { image: string; logo: string; logoAlt: string; text: string; moreLabel: string; href: Href }
export interface GridsLayer { num: string; icon: string; title: string; subtitle: string }
export interface AboutPage {
  seo: { title: string }
  hero: {
    actName: string; title: AnimatedTitle; subtitle: string; intro: string
    sectorChips: string[]; heroImage: string; ledger: LedgerItem[]
  }
  belief: { actName: string; kicker: string; rows: BeliefRow[] }
  method: { actName: string; title: AnimatedTitle; copy: string; cards: MethodCard[] }
  models: { actName: string; title: AnimatedTitle; copy: string; rows: ModelRow[] }
  ecosystem: { actName: string; title: AnimatedTitle; copy: string; tiles: EcoTile[] }
  grids: {
    actName: string; title: AnimatedTitle; copy: string; morphImage: string
    labelA: { title: string; text: string }; labelB: { title: string; text: string }
    layers: GridsLayer[]
  }
}

// ---- Platform ----
export interface Metric { value: string; label: string }
export interface Venture { name: string; logo: string; photo: string; desc: string; metrics: Metric[] }
export interface Category { label: string; ventures: Venture[] }
export interface Total { value: string; label: string }
export interface Platform {
  slug: string; order: number; name: string; sector: string
  wordmark: string; hero: string; video: string
  tagline: string; intro: string
  totals: Total[]; categories: Category[]
}

// ---- Team ----
export interface TeamMember { name: string; role: string; bio?: string; photo?: string; highlights?: string[] }
export interface TeamGroup { venture: string; members: TeamMember[] }
export interface TeamPage {
  seo: { title: string }
  hero: { actName: string; kicker: string; title: AnimatedTitle; intro: string; stats: HomeStat[] }
  foundersTitle: string
  founders: TeamMember[]
  rosterTitle: string
  rosterCopy: string
  groups: TeamGroup[]
}

// ---- Contact ----
export interface Office { city: string; region: string; address: string }
export interface ContactPage {
  seo: { title: string }
  hero: { actName: string; kicker: string; title: AnimatedTitle; intro: string }
  email: string
  enquiryTypes: string[]
  offices: Office[]
  presence: string
  formIntro: string
  mapTitle?: string
  mapCopy?: string
}

export interface Inventory {
  siteSettings: SiteSettings
  homePage: HomePage
  aboutPage: AboutPage
  teamPage: TeamPage
  contactPage: ContactPage
  platforms: Platform[]
}
