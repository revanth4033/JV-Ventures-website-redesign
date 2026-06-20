import type { Metadata } from 'next'

import { Team } from '@/components/team/Team'
import { loadSiteSettings, loadTeamPage } from '@/content/db'

export const revalidate = 30

export async function generateMetadata(): Promise<Metadata> {
  const team = await loadTeamPage()
  return {
    title: team.seo?.title?.trim() || 'Team',
    description:
      'The operators, founders, and investors behind JV Ventures — leadership across education, lifesciences, healthcare, and managed living.',
    alternates: { canonical: '/team' },
  }
}

export default async function TeamPage() {
  const [team, settings] = await Promise.all([loadTeamPage(), loadSiteSettings()])
  return <Team team={team} settings={settings} />
}
