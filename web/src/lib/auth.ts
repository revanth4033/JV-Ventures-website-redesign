import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'jv_session'
const rawSecret = process.env.AUTH_SECRET || process.env.PAYLOAD_SECRET
if (!rawSecret && process.env.NODE_ENV === 'production') {
  // never sign sessions with a public constant in production
  throw new Error('AUTH_SECRET (or PAYLOAD_SECRET) must be set in production.')
}
const secret = new TextEncoder().encode(rawSecret || 'dev-only-insecure-secret')

export type Session = { id: number; email: string; name: string; role: string }

export async function signSession(user: Session): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, role: user.role })
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
    }
  } catch {
    return null
  }
}
