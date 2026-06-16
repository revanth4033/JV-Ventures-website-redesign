import type { Metadata } from 'next'

import { Team } from '@/components/team/Team'
import { loadSiteSettings, loadTeamPage } from '@/content/db'

export const revalidate = 30

export const metadata: Metadata = {
  title: 'Team',
  description:
    'The operators, founders, and investors behind JV Ventures — leadership across education, lifesciences, healthcare, and managed living.',
  alternates: { canonical: '/team' },
}

export default async function TeamPage() {
  const [team, settings] = await Promise.all([loadTeamPage(), loadSiteSettings()])
  return <Team team={team} settings={settings} />
}
