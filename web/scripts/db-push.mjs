// Applies additive Prisma schema changes at build time when a database is
// reachable (e.g. the production deploy). On builds without DATABASE_URI (preview
// deploys), or if the DB is unreachable, it skips without failing the build.
import { execSync } from 'node:child_process'

if (!process.env.DATABASE_URI) {
  console.log('[db-push] No DATABASE_URI in this environment — skipping schema sync.')
  process.exit(0)
}
try {
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' })
} catch (e) {
  console.warn('[db-push] schema sync skipped (continuing build):', e instanceof Error ? e.message : e)
}
// Force-sync ALL page + platform content from content/inventory.json into the DB
// on every build. inventory.json is the single source of truth for this project,
// so the live (DB-backed) site always matches what's committed in the repo.
// NOTE: this overwrites content edited directly via the admin CMS.
try {
  execSync('npm run seed', { stdio: 'inherit', env: { ...process.env, SEED_FORCE: '1' } })
} catch (e) {
  console.warn('[seed] content sync skipped (continuing build):', e instanceof Error ? e.message : e)
}
// Idempotent data self-heal (e.g. collapse "$$500M" -> "$500M"). No-op on clean rows.
try {
  execSync('node scripts/normalize-currency.mjs', { stdio: 'inherit' })
} catch (e) {
  console.warn('[db-normalize] skipped (continuing build):', e instanceof Error ? e.message : e)
}
// Idempotent backfill of founder/roster LinkedIn URLs from the seed. Fills empties only.
try {
  execSync('node scripts/seed-linkedin.mjs', { stdio: 'inherit' })
} catch (e) {
  console.warn('[seed-linkedin] skipped (continuing build):', e instanceof Error ? e.message : e)
}
process.exit(0)
