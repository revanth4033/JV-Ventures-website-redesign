'use client'

/**
 * Sanity Studio, mounted under /studio via Next's optional catch-all route.
 * This is a CLIENT component on purpose: Sanity Studio calls React.createContext
 * at module load, which is unavailable under Next's server (RSC) condition. Keeping
 * it client-only means `sanity` is never imported on the server. Route metadata
 * lives in the sibling layout (a server component).
 */
import { NextStudio } from 'next-sanity/studio'

import config from '../../../../sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
