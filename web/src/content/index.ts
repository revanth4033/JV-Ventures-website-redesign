import inventoryJson from './inventory.json'
import type { Inventory, Platform } from './types'

// Phase 2: content comes from the static inventory. Phase 6 swaps these accessors
// for Payload queries returning the same shapes.
const inventory = inventoryJson as unknown as Inventory

/** Normalise a prototype asset path ("assets/x.jpg") to a public URL ("/assets/x.jpg"). */
export const asset = (src?: string): string => {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('/')) return src
  return '/' + src.replace(/^\.?\//, '')
}

/** Convert a prototype href ("about.html", "platform.html?p=powerx", "#contact")
 *  to a Next route. */
export const route = (href?: string): string => {
  if (!href) return '#'
  if (href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return href
  if (href === 'index.html') return '/'
  if (href.startsWith('about.html')) return '/about' + href.slice('about.html'.length)
  if (href.startsWith('platform.html')) {
    const q = href.split('?')[1] || ''
    const p = new URLSearchParams(q).get('p')
    return p ? `/platform/${p}` : '/platform'
  }
  return href
}

export const getSiteSettings = () => inventory.siteSettings
export const getHomePage = () => inventory.homePage
export const getAboutPage = () => inventory.aboutPage
export const getTeamPage = () => inventory.teamPage
export const getContactPage = () => inventory.contactPage
export const getPlatforms = (): Platform[] =>
  [...inventory.platforms].sort((a, b) => a.order - b.order)
export const getPlatform = (slug: string): Platform | undefined =>
  inventory.platforms.find((p) => p.slug === slug)

export { inventory }
