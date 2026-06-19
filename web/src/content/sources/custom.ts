import 'server-only'

import { prisma } from '@/lib/prisma'
import type { AboutPage, ContactPage, HomePage, Platform, SiteSettings, TeamPage } from '../types'
import {
  getAboutPage,
  getContactPage,
  getHomePage,
  getPlatform as staticPlatform,
  getPlatforms as staticPlatforms,
  getSiteSettings,
  getTeamPage,
} from '../index'

// Read a singleton's JSON; fall back to the bundled inventory if the DB is empty
// or unreachable, so the public site always renders.
async function singleton<T>(key: string, fallback: () => T): Promise<T> {
  try {
    const row = await prisma.singleton.findUnique({ where: { key } })
    return row ? (row.data as unknown as T) : fallback()
  } catch {
    return fallback()
  }
}

export const loadSiteSettings = () => singleton<SiteSettings>('siteSettings', getSiteSettings)
export const loadHomePage = () => singleton<HomePage>('homePage', getHomePage)
export const loadAboutPage = () => singleton<AboutPage>('aboutPage', getAboutPage)
export const loadTeamPage = () => singleton<TeamPage>('teamPage', getTeamPage)
export const loadContactPage = () => singleton<ContactPage>('contactPage', getContactPage)

export async function loadPlatforms(): Promise<Platform[]> {
  try {
    const rows = await prisma.platform.findMany({ orderBy: { order: 'asc' } })
    if (rows.length) return rows.map((r) => r.data as unknown as Platform)
  } catch {
    /* fall through */
  }
  return staticPlatforms()
}

export async function loadPlatform(slug: string): Promise<Platform | undefined> {
  try {
    const row = await prisma.platform.findUnique({ where: { slug } })
    if (row) return row.data as unknown as Platform
  } catch {
    /* fall through */
  }
  return staticPlatform(slug)
}
