import type { Metadata } from 'next'

import { Contact } from '@/components/contact/Contact'
import { loadContactPage, loadSiteSettings } from '@/content/db'

export const revalidate = 30

export async function generateMetadata(): Promise<Metadata> {
  const contact = await loadContactPage()
  const title = contact.seo?.title?.trim() || 'Contact'
  const description =
    contact.seo?.description?.trim() ||
    'Start a conversation with JV Ventures — partnerships, careers, press, and general enquiries. Offices in Hyderabad; presence across India, Dubai, and Singapore.'
  return {
    title,
    description,
    alternates: { canonical: '/contact' },
    openGraph: { title, description, url: '/contact' },
    twitter: { title, description },
  }
}

export default async function ContactPage() {
  const [contact, settings] = await Promise.all([loadContactPage(), loadSiteSettings()])
  return <Contact contact={contact} settings={settings} />
}
