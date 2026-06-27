// Applies committed Prisma migrations at deploy time.
//
// - No DATABASE_URI (e.g. a preview build without a DB): skip cleanly so the build
//   still succeeds.
// - DATABASE_URI present: run `prisma migrate deploy`, which applies ONLY the
//   reviewed migration files in prisma/migrations. Unlike `prisma db push` it never
//   diffs-and-drops, so it is safe against production data. A failure aborts the
//   build on purpose — shipping app code against an un-migrated schema is worse
//   than a failed deploy.
//
// Self-healing baseline: this project's database was originally created with
// `prisma db push` (tables but no migration history), so the first `migrate deploy`
// returns P3005 ("schema is not empty"). When that happens we baseline the initial
// migration (mark 0_init applied WITHOUT re-running it) and retry — which then
// applies only the genuinely new migrations. This branch only triggers on an
// already-populated database; a fresh/empty DB takes the success path on the first
// try, so we never skip creating tables on a new database.
//
// Data backfills/self-heals are intentionally NOT run here — they live in
// `npm run db:maintenance` and are run deliberately by an operator. Content seeding
// is likewise NOT run on every deploy (it would overwrite CMS edits); seed manually
// with `SEED_FORCE=1 npm run seed` when you deliberately want inventory.json to win.
import { execSync } from 'node:child_process'

if (!process.env.DATABASE_URI) {
  console.log('[db-deploy] No DATABASE_URI in this environment — skipping migrations.')
  process.exit(0)
}

// Disable Prisma's migration advisory lock. Neon's pooled connection (PgBouncer)
// doesn't support Postgres advisory locks, so `migrate deploy` otherwise hangs and
// fails with P1002. Safe here: migrations are idempotent and no concurrent migration
// runs against this database during a deploy.
const ENV = { ...process.env, PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: '1' }

try {
  // Stream stdout for live logs; capture stderr so we can detect P3005.
  execSync('npx prisma migrate deploy', { stdio: ['inherit', 'inherit', 'pipe'], env: ENV })
} catch (e) {
  const stderr = e?.stderr ? e.stderr.toString() : ''
  if (stderr) process.stderr.write(stderr)
  if (stderr.includes('P3005')) {
    console.log('[db-deploy] Existing schema without migration history — baselining 0_init, then re-applying.')
    execSync('npx prisma migrate resolve --applied 0_init', { stdio: 'inherit', env: ENV })
    execSync('npx prisma migrate deploy', { stdio: 'inherit', env: ENV })
  } else {
    throw e
  }
}
