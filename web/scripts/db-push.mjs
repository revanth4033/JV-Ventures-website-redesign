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
process.exit(0)
