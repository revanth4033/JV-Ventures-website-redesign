import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'jv_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// Shared options for the admin session cookie. SameSite=Strict (not Lax) so the
// cookie is never sent on cross-site requests — a CSRF on a logged-in admin can't
// drive the state-changing server actions. httpOnly keeps it out of JS; Secure in
// production keeps it off plaintext HTTP.
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}
const rawSecret = process.env.AUTH_SECRET || process.env.PAYLOAD_SECRET
// Fail closed everywhere except an explicit `next dev` run. Keying off
// NODE_ENV==='production' alone let non-Vercel deploys (Docker, self-host,
// preview) silently sign sessions with the public dev constant — a forge-an-admin
// vector. NODE_ENV is 'development' only under `next dev`.
if (!rawSecret && process.env.NODE_ENV !== 'development') {
  throw new Error('AUTH_SECRET (or PAYLOAD_SECRET) must be set outside local development.')
}
const secret = new TextEncoder().encode(rawSecret || 'dev-only-insecure-secret')

export type Session = { id: number; email: string; name: string; role: string; tv: number }

export async function signSession(user: Session): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, role: user.role, tv: user.tv })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return {
      id: Number(payload.sub),
      email: String(payload.email || ''),
      name: String(payload.name || ''),
      role: String(payload.role || 'editor'),
      tv: Number(payload.tv ?? 0),
    }
  } catch {
    return null
  }
}
