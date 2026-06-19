import 'server-only'

import type { AboutPage, ContactPage, HomePage, Platform, SiteSettings, TeamPage } from './types'
import * as custom from './sources/custom'

// Content source selector. Defaults to the existing custom (Prisma-backed) source;
// only switches to Sanity when CONTENT_SOURCE === 'sanity'. With the env unset the
// behaviour is byte-identical to the custom source — the Sanity module (and its
// deps) is never imported.
type ContentSource = {
  loadSiteSettings: () => Promise<SiteSettings>
  loadHomePage: () => Promise<HomePage>
  loadAboutPage: () => Promise<AboutPage>
  loadTeamPage: () => Promise<TeamPage>
  loadContactPage: () => Promise<ContactPage>
  loadPlatforms: () => Promise<Platform[]>
  loadPlatform: (slug: string) => Promise<Platform | undefined>
}

const useSanity = process.env.CONTENT_SOURCE === 'sanity'

// Lazily resolve the Sanity source so the custom path never pays for it.
let sanitySource: Promise<ContentSource> | null = null
function getSanity(): Promise<ContentSource> {
  if (!sanitySource) sanitySource = import('@/content/sources/sanity')
  return sanitySource
}

export const loadSiteSettings = (): Promise<SiteSettings> =>
  useSanity ? getSanity().then((s) => s.loadSiteSettings()) : custom.loadSiteSettings()

export const loadHomePage = (): Promise<HomePage> =>
  useSanity ? getSanity().then((s) => s.loadHomePage()) : custom.loadHomePage()

export const loadAboutPage = (): Promise<AboutPage> =>
  useSanity ? getSanity().then((s) => s.loadAboutPage()) : custom.loadAboutPage()

export const loadTeamPage = (): Promise<TeamPage> =>
  useSanity ? getSanity().then((s) => s.loadTeamPage()) : custom.loadTeamPage()

export const loadContactPage = (): Promise<ContactPage> =>
  useSanity ? getSanity().then((s) => s.loadContactPage()) : custom.loadContactPage()

export const loadPlatforms = (): Promise<Platform[]> =>
  useSanity ? getSanity().then((s) => s.loadPlatforms()) : custom.loadPlatforms()

export const loadPlatform = (slug: string): Promise<Platform | undefined> =>
  useSanity ? getSanity().then((s) => s.loadPlatform(slug)) : custom.loadPlatform(slug)
