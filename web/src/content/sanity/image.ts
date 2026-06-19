import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url'

import { getSanityClient } from './client'

let builder: ReturnType<typeof imageUrlBuilder> | undefined

function getBuilder() {
  if (!builder) builder = imageUrlBuilder(getSanityClient())
  return builder
}

/**
 * Resolve a Sanity image source to a plain CDN URL string. Returns '' for
 * empty/missing sources so the shape stays a string (matching types.ts, where
 * image fields are `string`). The frontend's `asset()` passes full URLs through
 * untouched, so a `https://cdn.sanity.io/...` URL renders as-is.
 */
export function urlFor(source: SanityImageSource | undefined | null): string {
  if (!source) return ''
  // An unresolved image object with no asset reference yields no URL.
  const hasAsset =
    typeof source === 'string' ||
    (typeof source === 'object' && 'asset' in source && (source as { asset?: unknown }).asset) ||
    (typeof source === 'object' && '_ref' in source)
  if (!hasAsset) return ''
  try {
    return getBuilder().image(source).auto('format').url()
  } catch {
    return ''
  }
}

/** Shape of a dereferenced Sanity file asset (as projected via `asset->`). */
export interface ResolvedFileAsset {
  url?: string
}

/**
 * Resolve a Sanity file (e.g. the platform hero mp4) to its asset URL string.
 * GROQ must project the file's `asset->{url}` (see sources/sanity.ts). Returns
 * '' when absent, keeping the shape a string (Platform.video is `string`).
 */
export function fileUrl(
  file: { asset?: ResolvedFileAsset | null } | null | undefined,
): string {
  return file?.asset?.url || ''
}
