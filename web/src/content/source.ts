import 'server-only'

// Content source. The public site reads through this single seam; the active
// implementation is the custom (Prisma-backed) source, which falls back to the
// bundled static inventory when the DB is empty or unreachable.
export {
  loadSiteSettings,
  loadHomePage,
  loadAboutPage,
  loadTeamPage,
  loadContactPage,
  loadPlatforms,
  loadPlatform,
} from './sources/custom'
