import crypto from 'crypto'
import { NextResponse } from 'next/server'

import { runScheduledPublishes } from '@/lib/scheduled-publish'

export const dynamic = 'force-dynamic'

/** Constant-time string compare (avoids leaking the secret via response timing). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

// Invoked by Vercel Cron (see vercel.json), which sends CRON_SECRET as a Bearer
// token. Fail closed: if CRON_SECRET is unset the endpoint is disabled entirely,
// so a missing config can never leave the publish trigger open to the world.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 })
  }
  if (!safeEqual(req.headers.get('authorization') ?? '', `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const result = await runScheduledPublishes()
  return NextResponse.json({ ok: true, ...result })
}
