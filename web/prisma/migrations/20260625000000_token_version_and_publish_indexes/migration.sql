-- Brings the committed migration history in line with schema.prisma. The 0_init
-- baseline predates these and the project had been using `prisma db push`, so
-- production databases may be missing them. All statements are idempotent.

-- User.tokenVersion: the JWT-revocation seam (bumped on password change to
-- invalidate outstanding sessions). Missing here meant migrate-based deploys
-- shipped a schema where session revocation silently failed.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- Indexes the scheduled-publish cron scans by (publishAt <= now()).
CREATE INDEX IF NOT EXISTS "Singleton_publishAt_idx" ON "Singleton"("publishAt");
CREATE INDEX IF NOT EXISTS "Platform_publishAt_idx" ON "Platform"("publishAt");
