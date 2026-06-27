// The content seam. Existing imports (`@/content/db`) keep working unchanged; the
// actual implementation lives in `@/content/source` (the custom Prisma source).
export {
  loadSiteSettings,
  loadHomePage,
  loadAboutPage,
  loadTeamPage,
  loadContactPage,
  loadPlatforms,
  loadPlatform,
} from '@/content/source'
