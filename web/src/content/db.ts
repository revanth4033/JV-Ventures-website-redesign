// The content seam. Existing imports (`@/content/db`) keep working unchanged; the
// actual implementation is selected in `@/content/source` (custom by default, or
// Sanity when CONTENT_SOURCE=sanity).
export {
  loadSiteSettings,
  loadHomePage,
  loadAboutPage,
  loadTeamPage,
  loadContactPage,
  loadPlatforms,
  loadPlatform,
} from '@/content/source'
