# Sanity.io CMS — second content source (for the client comparison)

> **Live demo (provisioned 2026-06-19):**
> - Custom CMS → **https://jvventures.vercel.app** (edit at `/admin`)
> - Sanity → **https://jvventures-sanity.vercel.app** (edit at `/studio`)
> - Sanity project id: `m0j7pflx`, dataset `production` (public), seeded with all content.
> - The write token lives only in local `.env` (gitignored); the public dataset needs
>   no token for reads, so the deployment ships none.


This app now has **two** interchangeable content backends behind the same data
seam (`src/content/db.ts`). The frontend is identical for both; only the editing
experience differs.

| Source | Editor | Selected by |
|---|---|---|
| **Custom CMS** (Prisma + Postgres) | `/admin` | default (`CONTENT_SOURCE` unset or `custom`) |
| **Sanity.io** | `/studio` (embedded Studio) | `CONTENT_SOURCE=sanity` |

With `CONTENT_SOURCE` unset, behaviour is **byte-identical to before** — Sanity
code is never even imported. Nothing about the live site changes until you opt in.

## Going live with Sanity (one-time, ~10 minutes)

You need a Sanity account (free tier is fine). Everything else is built.

1. **Create the project + dataset**
   ```bash
   cd web
   npx sanity login          # opens browser; sign in (Google/GitHub/email)
   npx sanity init --env      # create a NEW project, dataset name: production
   ```
   `init --env` writes the project id/dataset into `.env`. Note the **Project ID**.

2. **Add env vars** (`web/.env` locally, and Vercel project settings for deploy):
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=<your project id>
   SANITY_DATASET=production
   SANITY_WRITE_TOKEN=<an Editor token from sanity.io/manage → API → Tokens>
   CONTENT_SOURCE=sanity        # set ONLY on the Sanity demo deployment
   ```

3. **Allow the Studio origin** (CORS): in sanity.io/manage → API → CORS origins,
   add your site URL(s), e.g. `http://localhost:3000` and the deploy URL, with
   credentials allowed.

4. **Seed Sanity with the current content** (so both CMSes start identical):
   ```bash
   npm run sanity:seed
   ```
   This uploads every image/video to Sanity's asset CDN, converts the rich-text
   fields to Portable Text, and creates all documents (5 singletons + 4 platforms).

5. **Run / deploy**
   - Local: `CONTENT_SOURCE=sanity npm run dev` → site reads from Sanity; edit at `/studio`.
   - Demo deployment: set the four env vars above (incl. `CONTENT_SOURCE=sanity`)
     on a **second** Vercel deployment so you can show custom vs Sanity side-by-side.

## How the two compare in the demo
- Same URL structure, same pages, same look — only the editor differs.
- Custom: tailored `/admin`, owned data in your Postgres, no per-seat cost.
- Sanity: `/studio` with real-time collaboration, image hotspot/crop + CDN,
  version history, and live visual preview — hosted, zero infra.

## Removing the loser (after the client decides)
- **Keep custom, drop Sanity:** delete `web/sanity/`, `web/sanity.config.ts`,
  `web/sanity.cli.ts`, `web/src/app/studio/`, `web/src/content/sources/sanity.ts`,
  `web/src/content/sanity/`, `web/scripts/migrate-to-sanity.mts`; remove the Sanity
  deps; revert `src/content/db.ts` to re-export the custom source directly.
- **Keep Sanity, drop custom:** delete `web/src/app/(admin)/`, the Prisma admin
  pieces and form engine, set `CONTENT_SOURCE=sanity` permanently. The data seam
  makes either removal surgical.
