import { toHTML, type PortableTextOptions } from '@portabletext/to-html'
import type { PortableTextBlock } from '@portabletext/types'

/**
 * Serialize INLINE Portable Text to the exact trusted HTML the frontend expects:
 *   - strong decorator       → <strong>…</strong>
 *   - em decorator           → <em>…</em>
 *   - custom "soi" decorator → <em class="soi">…</em>
 *   - block / line breaks    → joined with <br>
 *
 * These rich fields are single-paragraph snippets carried over from the
 * prototype (AnimatedTitle lines, slide copy, belief lines, method-card titles,
 * the closing-quote lines). MethodCard.title may contain a hard line break,
 * represented either as multiple blocks or a literal "\n" inside a span — both
 * collapse to <br>.
 */
const options: PortableTextOptions = {
  // Render each block's children inline (no wrapping <p>); blocks are joined
  // with <br> below.
  components: {
    block: {
      // Render inline: emit the block's inner HTML without a wrapping <p>.
      normal: ({ children }) => `${children}`,
    },
    marks: {
      strong: ({ children }) => `<strong>${children}</strong>`,
      em: ({ children }) => `<em>${children}</em>`,
      soi: ({ children }) => `<em class="soi">${children}</em>`,
    },
  },
}

/**
 * Convert an inline Portable Text value (a single block, or an array of blocks
 * for multi-line titles) to its HTML string. Newlines inside a block and breaks
 * between blocks both become <br>.
 */
export function toInlineHtml(
  value: PortableTextBlock | PortableTextBlock[] | undefined | null,
): string {
  if (!value) return ''
  const blocks = Array.isArray(value) ? value : [value]
  if (!blocks.length) return ''
  const html = blocks
    .map((block) => toHTML(block, options))
    .join('<br>')
  // A hard newline inside a single block (e.g. method-card title) → <br>.
  return html.replace(/\n/g, '<br>')
}
