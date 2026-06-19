import 'server-only'

import { createClient, type SanityClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'

let client: SanityClient | undefined

/**
 * Lazily build the Sanity read client. The guard throws only when the Sanity
 * source is actually used (i.e. CONTENT_SOURCE=sanity), so the default custom
 * source never trips over a missing project id.
 */
export function getSanityClient(): SanityClient {
  if (!projectId) {
    throw new Error(
      'NEXT_PUBLIC_SANITY_PROJECT_ID is not set. Set it (and CONTENT_SOURCE=sanity) to use the Sanity content source.',
    )
  }
  if (!client) {
    client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: true,
    })
  }
  return client
}

/** Convenience proxy so callers can `import { sanityClient }` and use it directly. */
export const sanityClient: SanityClient = new Proxy({} as SanityClient, {
  get(_target, prop) {
    const real = getSanityClient() as unknown as Record<string | symbol, unknown>
    const value = real[prop]
    return typeof value === 'function' ? value.bind(real) : value
  },
})
