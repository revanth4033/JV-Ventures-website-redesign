import type { Metadata } from 'next'

import { Contact } from '@/components/contact/Contact'
import { loadContactPage, loadSiteSettings } from '@/content/db'

export const revalidate = 30

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Start a conversation with JV Ventures — partnerships, careers, press, and general enquiries. Offices in Hyderabad; presence across India, Dubai, and Singapore.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const [contact, settings] = await Promise.all([loadContactPage(), loadSiteSettings()])
  return <Contact contact={contact} settings={settings} />
}
