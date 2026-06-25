import { NextResponse } from 'next/server'

import { runScheduledPublishes } from '@/lib/scheduled-publish'

export const dynamic = 'force-dynamic'

// Invoked by Vercel Cron (see vercel.json), which sends CRON_SECRET as a Bearer
// token. Fail closed: if CRON_SECRET is unset the endpoint is disabled entirely,
// so a missing config can never leave the publish trigger open to the world.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const result = await runScheduledPublishes()
  return NextResponse.json({ ok: true, ...result })
}
