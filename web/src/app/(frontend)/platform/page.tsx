import { redirect } from 'next/navigation'

import { loadPlatforms } from '@/content/db'

// Cache the redirect (ISR) so /platform doesn't query the DB on every request;
// the first platform's slug changes rarely, and content edits revalidate it.
export const revalidate = 300

export default async function PlatformIndex() {
  const platforms = await loadPlatforms()
  redirect(`/platform/${platforms[0]?.slug ?? 'powered'}`)
}
