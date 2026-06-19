// Minimal inline-HTML → Portable Text converter for the JV Ventures content set.
//
// The prototype copy only uses a tiny, trusted subset of HTML:
//   <strong>…</strong>   → "strong" decorator
//   <em>…</em>           → "em" decorator
//   <em class="soi">…</em> → custom "soi" decorator
//   <br>                 → a hard line break (split into separate blocks)
//   &nbsp; / &amp; / …   → decoded to their characters
//   plain text
//
// Output is Portable Text: an array of `block` objects. Each block has `children`
// (an array of spans) and an empty `markDefs`. A <br> starts a NEW block so the
// frontend can render line breaks structurally (used by MethodCard.title).
//
// This is deliberately small and dependency-free — it is NOT a general HTML parser.

import { randomUUID } from 'node:crypto'

export type PtSpan = {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

export type PtBlock = {
  _type: 'block'
  _key: string
  style: 'normal'
  markDefs: never[]
  children: PtSpan[]
}

const key = () => randomUUID().replace(/-/g, '').slice(0, 12)

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&mdash;': '—',
  '&ndash;': '–',
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;|&apos;|&mdash;|&ndash;/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
}

type Token =
  | { kind: 'text'; text: string }
  | { kind: 'open'; tag: string; soi: boolean }
  | { kind: 'close'; tag: string }
  | { kind: 'br' }

// Tokenize the inline HTML. Anything that isn't a recognised tag is treated as text.
function tokenize(html: string): Token[] {
  const tokens: Token[] = []
  const re = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    if (m.index > last) tokens.push({ kind: 'text', text: html.slice(last, m.index) })
    last = re.lastIndex
    const closing = m[1] === '/'
    const tag = m[2].toLowerCase()
    const attrs = m[3] ?? ''
    if (tag === 'br') {
      tokens.push({ kind: 'br' })
    } else if (tag === 'strong' || tag === 'b' || tag === 'em' || tag === 'i') {
      const norm = tag === 'b' ? 'strong' : tag === 'i' ? 'em' : tag
      if (closing) tokens.push({ kind: 'close', tag: norm })
      else tokens.push({ kind: 'open', tag: norm, soi: /class\s*=\s*["'][^"']*\bsoi\b/.test(attrs) })
    } else {
      // Unknown tag — keep its literal text so nothing is silently dropped.
      tokens.push({ kind: 'text', text: m[0] })
    }
  }
  if (last < html.length) tokens.push({ kind: 'text', text: html.slice(last) })
  return tokens
}

/**
 * Convert a trusted inline-HTML string to inline Portable Text blocks.
 * Returns at least one block (possibly with an empty span) so the value is never null.
 */
export function htmlToPortableText(html: string): PtBlock[] {
  const tokens = tokenize(html ?? '')
  const blocks: PtBlock[] = []
  let children: PtSpan[] = []
  const marks: string[] = [] // active decorator stack, e.g. ['strong'] or ['em', 'soi']

  const pushBlock = () => {
    blocks.push({ _type: 'block', _key: key(), style: 'normal', markDefs: [], children })
    children = []
  }

  for (const t of tokens) {
    if (t.kind === 'br') {
      pushBlock()
      continue
    }
    if (t.kind === 'open') {
      if (t.tag === 'em' && t.soi) {
        marks.push('soi')
      } else {
        marks.push(t.tag)
      }
      continue
    }
    if (t.kind === 'close') {
      // Pop the matching decorator (soi was pushed for an <em class="soi">).
      const want = t.tag === 'em' ? ['em', 'soi'] : [t.tag]
      for (let i = marks.length - 1; i >= 0; i--) {
        if (want.includes(marks[i])) {
          marks.splice(i, 1)
          break
        }
      }
      continue
    }
    // text
    const text = decodeEntities(t.text)
    if (!text) continue
    children.push({ _type: 'span', _key: key(), text, marks: [...marks] })
  }

  pushBlock()

  // Guarantee non-empty children on every block.
  for (const b of blocks) {
    if (b.children.length === 0) {
      b.children.push({ _type: 'span', _key: key(), text: '', marks: [] })
    }
  }
  return blocks
}

/**
 * AnimatedTitle → array of `titleLine` objects.
 * `emphasis` marks which 0-based line(s) get accent:true:
 *   "all" → every line; "line:N" → only line N; undefined → none.
 * Each line's text becomes inline Portable Text (so editors can bold/italicise).
 */
export function animatedTitleToLines(
  title: { lines: string[]; emphasis?: string },
): Array<{ _type: 'titleLine'; _key: string; text: PtBlock[]; accent: boolean }> {
  const lines = title?.lines ?? []
  const emphasis = title?.emphasis
  return lines.map((line, i) => {
    const accent = emphasis === 'all' || emphasis === `line:${i}`
    return { _type: 'titleLine', _key: key(), text: htmlToPortableText(line), accent }
  })
}
