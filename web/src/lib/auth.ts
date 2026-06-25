import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'jv_session'
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
