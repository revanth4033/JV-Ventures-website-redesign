// One-time content seed during the Vercel build.
//
// Runs the CMS seed (force-overwriting singletons/platforms from inventory.json)
// ONLY when SEED_FORCE=1 is set in the build environment. This is the controlled
// way to push inventory.json content into the production Neon DB, since the Neon
// connection string is a Vercel "sensitive" env var that can't be pulled locally.
//
// Normal deploys leave SEED_FORCE unset, so this is a clean no-op and never
// clobbers content edited through the admin CMS. Set SEED_FORCE=1 in Vercel for
// the single deploy where you want inventory.json to win, then remove it again.
import { execSync } from 'node:child_process'

// Trim because env values set via the CLI can carry a trailing newline/CR
// ("1\r\n" !== "1"), which would silently skip the seed.
const seedForce = String(process.env.SEED_FORCE ?? '').trim()
console.log(`[seed-on-build] SEED_FORCE=${JSON.stringify(process.env.SEED_FORCE)} (normalized: "${seedForce}")`)

if (seedForce !== '1') {
  console.log('[seed-on-build] SEED_FORCE not "1" — skipping content seed.')
  process.exit(0)
}
if (!process.env.DATABASE_URI) {
  console.log('[seed-on-build] No DATABASE_URI in this environment — skipping content seed.')
  process.exit(0)
}

console.log('[seed-on-build] SEED_FORCE=1 — seeding content from inventory.json into the build-time database…')
execSync('npm run seed', { stdio: 'inherit', env: process.env })
console.log('[seed-on-build] content seed complete.')
