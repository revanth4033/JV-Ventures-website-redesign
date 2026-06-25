import { cookies } from 'next/headers'

import { SESSION_COOKIE, verifySession, type Session } from './auth'
import { prisma } from './prisma'

/**
 * Server-side: current logged-in user (or null). Do not import from middleware.
 *
 * Beyond verifying the JWT signature, this confirms the user still exists and the
 * token's version matches the DB — so deleting a user, or bumping their
 * `tokenVersion` (e.g. on password change), immediately invalidates outstanding
 * sessions. The stateless JWT alone can't be revoked; this is the revocation seam.
 * Edge middleware keeps using the signature-only `verifySession` as a coarse gate.
 */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = await verifySession(token)
  if (!session) return null
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { tokenVersion: true },
    })
    if (!user || user.tokenVersion !== session.tv) return null
  } catch {
    // DB unreachable: fall back to the signature-verified session rather than
    // locking every editor out during a transient outage.
    return session
  }
  return session
}
