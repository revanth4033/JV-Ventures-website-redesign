import 'server-only'

import sanitizeHtml from 'sanitize-html'

// Server-side allowlist for the inline rich text the CMS produces. Defence in
// depth: the editor sanitizes client-side, but a tampered request could POST raw
// HTML straight to a server action — so we re-sanitize before persisting and the
// public site renders only these tags. <script>/<style>/event handlers/<a>/<img>
// etc. are stripped; <em class="soi"> (the brand mark) survives.
const RICH_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: ['strong', 'em', 'b', 'i', 'br'],
  allowedAttributes: { em: ['class'] },
  allowedClasses: { em: ['soi'] },
  disallowedTagsMode: 'discard',
}

/**
 * True when a string could contain markup. We key off the presence of any '<'
 * rather than a tag-shaped regex: a regex like /<[a-z!/]/ misses obfuscated forms
 * (e.g. "<\tscript") and is the kind of short-circuit that turns into a bypass.
 * If there is no '<' at all, the string cannot form a tag, so it's safe to leave
 * untouched (which also avoids HTML-entity-encoding plain text like "R&D" or "a > b").
 */
const looksLikeHtml = (s: string) => s.includes('<')

/**
 * Collapse accidental repeated currency symbols ("$$500M" → "$500M"). These slip
 * in when an editor types a "$" in front of a value that already carries one; a
 * run of the same currency mark is never intentional in this content.
 */
const normalizeCurrency = (s: string) => s.replace(/([$₹€£])\1+/g, '$1')

export function sanitizeRich(s: string): string {
  const cleaned = normalizeCurrency(s)
  return looksLikeHtml(cleaned) ? sanitizeHtml(cleaned, RICH_CONFIG) : cleaned
}

/**
 * Deep-clone `data`, sanitising every string that contains markup. Used on every
 * content save so no stored field can carry executable HTML to the public site.
 */
export function sanitizeContent<T>(data: T): T {
  if (typeof data === 'string') return sanitizeRich(data) as unknown as T
  if (Array.isArray(data)) return data.map((v) => sanitizeContent(v)) as unknown as T
  if (data && typeof data === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) out[k] = sanitizeContent(v)
    return out as T
  }
  return data
}
