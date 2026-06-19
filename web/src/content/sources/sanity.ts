import 'server-only'

import type { AboutPage, ContactPage, HomePage, Platform, SiteSettings, TeamPage } from '../types'
import { getSanityClient } from '../sanity/client'
import {
  mapAboutPage,
  mapContactPage,
  mapHomePage,
  mapPlatform,
  mapSiteSettings,
  mapTeamPage,
} from '../sanity/map'

// Tagged fetch caching so the whole Sanity source can be revalidated together
// (e.g. from a webhook calling revalidateTag('sanity')).
const fetchOptions = { next: { tags: ['sanity'] } }

/* ---------------- Reusable GROQ projection fragments ---------------- */

// animatedTitle → { lines: [{ text (Portable Text), accent }] }
const TITLE = `{ "lines": lines[]{ text, accent } }`

// A Sanity image: keep the raw object so urlFor() can build the CDN URL.
// (Selecting the whole field is enough; the builder reads asset._ref.)

const SLIDE = `{
  id, kicker,
  title${TITLE},
  copy,
  cta{ label, href },
  soiTiles[]{ label, image },
  coreMark,
  backgroundSlices[]{ image, position },
  stats[]{ value, suffix, label },
  backgroundImage,
  strips[]{ tab, logo, logoAlt, image, statStrong, statSpan, desc, href }
}`

const SITE_SETTINGS = `*[_id == "siteSettings"][0]{
  logo,
  nav[]{ label, href, external, cta, dropdown[]{ name, sector, href } },
  closingQuote{ lines[]{ text } },
  bridgeImage,
  footer{ locations, links[]{ label, href, external, cta } }
}`

const HOME_PAGE = `*[_id == "homePage"][0]{
  seo{ title },
  deck{ railChapters, deckActName, slides[]${SLIDE} }
}`

const ABOUT_PAGE = `*[_id == "aboutPage"][0]{
  seo{ title },
  hero{
    actName, title${TITLE}, subtitle, intro, sectorChips, heroImage,
    ledger[]{ value, prefix, suffix, label, plain }
  },
  belief{ actName, kicker, rows[]{ num, line, note } },
  method{ actName, title${TITLE}, copy, cards[]{ stage, icon, title, desc } },
  models{ actName, title${TITLE}, copy, rows[]{ num, icon, image, title, desc } },
  ecosystem{ actName, title${TITLE}, copy, tiles[]{ image, logo, logoAlt, text, moreLabel, href } },
  grids{
    actName, title${TITLE}, copy, morphImage,
    labelA{ title, text }, labelB{ title, text },
    layers[]{ num, icon, title, subtitle }
  }
}`

const TEAM_MEMBER = `{ name, role, bio, photo, highlights }`

const TEAM_PAGE = `*[_id == "teamPage"][0]{
  seo{ title },
  hero{ actName, kicker, title${TITLE}, intro, stats[]{ value, suffix, label } },
  foundersTitle,
  founders[]${TEAM_MEMBER},
  rosterTitle,
  rosterCopy,
  groups[]{ venture, members[]${TEAM_MEMBER} }
}`

const CONTACT_PAGE = `*[_id == "contactPage"][0]{
  seo{ title },
  hero{ actName, kicker, title${TITLE}, intro },
  email, enquiryTypes,
  offices[]{ city, region, address },
  presence, formIntro
}`

// Platform: video is a file → dereference its asset to get the CDN url.
const PLATFORM_FIELDS = `{
  "slug": slug.current,
  order, name, sector,
  wordmark, hero,
  video{ asset->{ url } },
  tagline, intro,
  totals[]{ value, label },
  categories[]{ label, ventures[]{ name, logo, photo, desc, metrics[]{ value, label } } }
}`

const PLATFORMS = `*[_type == "platform"] | order(order asc)${PLATFORM_FIELDS}`
const PLATFORM_BY_SLUG = `*[_type == "platform" && slug.current == $slug][0]${PLATFORM_FIELDS}`

/* ---------------- Loaders (same signatures as db.ts) ---------------- */

export async function loadSiteSettings(): Promise<SiteSettings> {
  const data = await getSanityClient().fetch(SITE_SETTINGS, {}, fetchOptions)
  return mapSiteSettings(data ?? {})
}

export async function loadHomePage(): Promise<HomePage> {
  const data = await getSanityClient().fetch(HOME_PAGE, {}, fetchOptions)
  return mapHomePage(data ?? {})
}

export async function loadAboutPage(): Promise<AboutPage> {
  const data = await getSanityClient().fetch(ABOUT_PAGE, {}, fetchOptions)
  return mapAboutPage(data ?? {})
}

export async function loadTeamPage(): Promise<TeamPage> {
  const data = await getSanityClient().fetch(TEAM_PAGE, {}, fetchOptions)
  return mapTeamPage(data ?? {})
}

export async function loadContactPage(): Promise<ContactPage> {
  const data = await getSanityClient().fetch(CONTACT_PAGE, {}, fetchOptions)
  return mapContactPage(data ?? {})
}

export async function loadPlatforms(): Promise<Platform[]> {
  const data = await getSanityClient().fetch(PLATFORMS, {}, fetchOptions)
  return ((data as unknown[]) ?? []).map((p) => mapPlatform(p as Parameters<typeof mapPlatform>[0]))
}

export async function loadPlatform(slug: string): Promise<Platform | undefined> {
  const data = await getSanityClient().fetch(PLATFORM_BY_SLUG, { slug }, fetchOptions)
  return data ? mapPlatform(data) : undefined
}
