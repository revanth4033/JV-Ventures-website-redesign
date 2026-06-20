import type { Metadata } from 'next'

import { Team } from '@/components/team/Team'
import { loadSiteSettings, loadTeamPage } from '@/content/db'

export const revalidate = 30

export async function generateMetadata(): Promise<Metadata> {
  const team = await loadTeamPage()
  const title = team.seo?.title?.trim() || 'Team'
  const description =
    team.seo?.description?.trim() ||
    'The operators, founders, and investors behind JV Ventures — leadership across education, lifesciences, healthcare, and managed living.'
  return {
    title,
    description,
    alternates: { canonical: '/team' },
    openGraph: { title, description, url: '/team' },
    twitter: { title, description },
  }
}

export default async function TeamPage() {
  const [team, settings] = await Promise.all([loadTeamPage(), loadSiteSettings()])
  return <Team team={team} settings={settings} />
}
