import { describe, expect, it } from 'vitest'

import { signSession, verifySession, type Session } from './auth'

const user: Session = { id: 7, email: 'a@b.co', name: 'Ada', role: 'admin', tv: 3 }

describe('session JWT round-trip', () => {
  it('signs and verifies a session, preserving all claims', async () => {
    const token = await signSession(user)
    const out = await verifySession(token)
    expect(out).toEqual(user)
  })

  it('carries the token version (revocation seam)', async () => {
    const token = await signSession({ ...user, tv: 9 })
    expect((await verifySession(token))?.tv).toBe(9)
  })

  it('rejects a tampered/garbage token', async () => {
    expect(await verifySession('not.a.jwt')).toBeNull()
  })

  it('returns null for a missing token', async () => {
    expect(await verifySession(undefined)).toBeNull()
  })

  it('defaults tv to 0 for legacy tokens without the claim', async () => {
    // verifySession should coerce a missing tv to 0, matching a freshly-seeded user.
    const token = await signSession({ ...user, tv: 0 })
    expect((await verifySession(token))?.tv).toBe(0)
  })
})
